import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.dailyDilemma.findFirst({
      where: {
        userId,
        createdAt: { gte: today }, // greater than or equal to midnight today
      },
    });
    if (existing) return NextResponse.json(existing);
    const profile = await prisma.behaviourProfile.findUnique({
      where: { userId },
    });

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
      : "No profile data yet — generate a general dilemma.";
    const prompt = `Generate a thought-provoking situational dilemma for someone.
Based on what we know about this person:
${profileContext}

Create ONE dilemma with exactly 4 options that reveals their values, 
decision making style, and personality.

Return as JSON only:
{
  "question": "the dilemma question",
  "optionA": "first option",
  "optionB": "second option", 
  "optionC": "third option",
  "optionD": "fourth option"
}

Make it specific, interesting, and workplace or life relevant.
No generic questions. Base it on what gaps exist in the profile.`;

    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: z.object({
        question: z.string(),
        optionA: z.string(),
        optionB: z.string(),
        optionC: z.string(),
        optionD: z.string(),
      }),
      prompt: prompt,
    });

    const dilemma = await prisma.dailyDilemma.create({
      data: {
        userId,
        question: object.question,
        optionA: object.optionA,
        optionB: object.optionB,
        optionC: object.optionC,
        optionD: object.optionD,
      },
    });
    return NextResponse.json(dilemma);
  } catch (error) {
    console.error("Dilemma API error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
