import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, profile, memories] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      }),
      prisma.behaviourProfile.findUnique({
        where: { userId },
      }),
      prisma.memory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { summary: true, topics: true },
      }),
    ]);

    const profileContext = profile
      ? `
- Tone: ${profile.tone ?? "unknown"}
- Vocabulary: ${profile.vocabulary ?? "unknown"}
- Topics of interest: ${profile.topicsOfInterest ?? "unknown"}
- Communication style: ${profile.communicationStyle ?? "unknown"}
- Decision patterns: ${profile.decisionPattern ?? "unknown"}
- Personality traits: ${profile.personalityTraits ?? "unknown"}
- Thinking style: ${profile.thinkingStyle ?? "unknown"}
- Confidence level: ${profile.confidenceLevel ?? "unknown"}
`
      : "Limited profile data available.";

    const memoriesContext =
      memories.length > 0
        ? `Things you have discussed and thought about recently:\n${memories
            .map((m) => `- ${m.summary}`)
            .join("\n")}`
        : "No memories yet — you haven't had many conversations.";

    const prompt = `You are writing a deeply personal monthly reflection letter 
    from someone's AI twin to them.
    
    What you know about this person:
    ${profileContext}
    
    Key things they have discussed and thought about this month:
    ${memoriesContext}
    
    Write a heartfelt, personal letter that:
    - Reflects back patterns you have noticed about them
    - Points out things they might not see about themselves
    - References specific things they have talked about
    - Is warm, honest, and insightful — not generic
    - Ends with one honest observation about what they seem to truly want
    
    Format:
    Start with "Dear ${user?.name},"
    End with "— Your Twin"
    Keep it under 300 words.
    Write in first person as the twin.
    Make it feel like it was written by someone who truly knows them.`;
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: prompt,
    });

    return NextResponse.json({ letter: text });
  } catch (error) {
    console.error("Summarise API error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
