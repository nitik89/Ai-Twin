import { streamText, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { generateEmbeddings, storeEmbedding } from "@/lib/embeddings";
import { searchSimilarMessages } from "@/lib/semantic-search";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages;
    const rawConversationId =
      messages[messages.length - 1]?.metadata?.conversationId;
    const conversationId =
      typeof rawConversationId === "string"
        ? rawConversationId
        : rawConversationId?.id;

    const userId = process.env.HARDCODED_USER_ID!;

    // Fetch behaviour profile
    const profile = await prisma.behaviourProfile.findUnique({
      where: { userId },
    });

    const profileLines = [
      profile?.tone && `- Tone: ${profile.tone}`,
      profile?.vocabulary && `- Vocabulary: ${profile.vocabulary}`,
      profile?.topicsOfInterest &&
        `- Topics they care about: ${profile.topicsOfInterest}`,
      profile?.communicationStyle &&
        `- Communication style: ${profile.communicationStyle}`,
      profile?.decisionPattern &&
        `- Decision patterns: ${profile.decisionPattern}`,
      profile?.personalityTraits &&
        `- Personality traits: ${profile.personalityTraits}`,
      profile?.thinkingStyle && `- Thinking style: ${profile.thinkingStyle}`,
      profile?.confidenceLevel &&
        `- Confidence level: ${profile.confidenceLevel}`,
    ]
      .filter(Boolean)
      .join("\n");

    const profileContext = profileLines
      ? `\n\nHere is what you know about this user so far:\n${profileLines}\n\nUse this to make your responses feel more personal and tailored to them.`
      : "";

    // Get latest user message text
    const latestMessage = messages[messages.length - 1];
    const latestUserText =
      latestMessage.parts
        ?.filter((p: { type: string }) => p.type === "text")
        ?.map((p: { type: string; text?: string }) => p.text)
        ?.join("") ??
      latestMessage.content ??
      "";

    // Search similar messages — RAG
    const similarMessages = await searchSimilarMessages(
      latestUserText,
      userId,
      5,
    );

    const ragContext =
      similarMessages.length > 0
        ? `\n\nRelevant context from past conversations:\n${similarMessages
            .map((m) =>
              m.source === "memory"
                ? `- [Long term memory] ${m.content}`
                : `- ${m.content}`,
            )
            .join("\n")}`
        : "";

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: `You are an AI twin — an intelligent assistant 
      that learns from every conversation. Pay close attention 
      to how the user communicates. Be conversational, warm, and concise.${profileContext}${ragContext}`,
      messages: await convertToModelMessages(messages),
      onFinish: async ({ text }) => {
        if (!conversationId) {
          console.log("No conversationId — skipping save");
          return;
        }

        const lastUserMessage = messages[messages.length - 1];
        const userText =
          lastUserMessage.parts
            ?.filter((p: { type: string }) => p.type === "text")
            ?.map((p: { type: string; text?: string }) => p.text)
            ?.join("") ??
          lastUserMessage.content ??
          "";

        // Save messages separately to get IDs back
        const [userMessage, assistantMessage] = await prisma.$transaction([
          prisma.message.create({
            data: {
              role: Role.USER,
              content: userText,
              conversationId,
            },
          }),
          prisma.message.create({
            data: {
              role: Role.ASSISTANT,
              content: text,
              conversationId,
            },
          }),
        ]);

        console.log("Messages saved for conversation:", conversationId);

        // Generate and store embeddings in background
        Promise.all([
          generateEmbeddings(userText).then((embedding: number[]) =>
            storeEmbedding(userMessage.id, embedding),
          ),
          generateEmbeddings(text).then((embedding: number[]) =>
            storeEmbedding(assistantMessage.id, embedding),
          ),
        ]).catch((err) => console.error("Embedding storage failed:", err));

        // Count user messages in this conversation
        const messageCount = await prisma.message.count({
          where: {
            conversationId,
            role: Role.USER,
          },
        });

        const isLongMessage = userText.split(" ").length > 100;
        const isEvery10 = messageCount % 10 === 0;

        // Only extract behaviour every 10 messages or if message is long
        if (isLongMessage || isEvery10) {
          fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/behaviour`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: userText,
              userId: process.env.HARDCODED_USER_ID,
            }),
          }).catch((err) => console.error("Behaviour extraction failed:", err));
        }

        // Trigger summarisation every 20 messages
        if (messageCount >= 20 && messageCount % 20 === 0) {
          fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/summarise`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId,
              userId,
            }),
          }).catch((err) => console.error("Summarisation failed:", err));
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API Crash:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong in the API Route" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
