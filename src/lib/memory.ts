import { prisma } from "@/lib/prisma";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { generateEmbeddings } from "./embeddings";
export async function shouldSummarise(
  conversationId: string,
): Promise<boolean> {
  const messageCount = await prisma.message.count({
    where: { conversationId },
  });
  return messageCount >= 20;
}

export async function summariseConversation(
  conversationId: string,
  userId: string,
): Promise<void> {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  if (messages.length === 0) return;

  const conversationText = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];
  const timeframe = `${firstMessage.createdAt.toDateString()} — ${lastMessage.createdAt.toDateString()}`;

  // Generate summary
  const { text: summary } = await generateText({
    model: google("gemini-2.5-flash"),
    prompt: `You are analysing a conversation to create a long term memory.
    
    Conversation:
    ${conversationText}
    
    Create a concise summary that captures:
    - Main topics discussed
    - Key decisions or conclusions reached
    - Important things revealed about the user
    - Patterns in how the user thinks and communicates
    
    Keep it under 200 words. Write in third person about the user.`,
  });

  // Extract topics
  const { text: topicsText } = await generateText({
    model: google("gemini-2.5-flash"),
    prompt: `Extract the main topics from this conversation summary as a comma separated list. Maximum 5 topics. No explanations.
    
    Summary: ${summary}`,
  });

  // Store memory
  const memory = await prisma.memory.create({
    data: {
      userId,
      summary,
      timeframe,
      topics: topicsText,
    },
  });

  const embedding = await generateEmbeddings(summary);

  await prisma.$executeRaw`
  UPDATE "Memory"
  SET embedding = ${JSON.stringify(embedding)}::vector
  WHERE id = ${memory.id}
`;

  console.log("Memory created for conversation:", conversationId);
}
