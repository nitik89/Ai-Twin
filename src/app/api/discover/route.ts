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

    const existing = await prisma.dailyDiscovery.findFirst({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

    if (existing) {
      return NextResponse.json({
        id: existing.id,
        dilemma: JSON.parse(existing.dilemma),
        thisOrThat: JSON.parse(existing.thisOrThat),
        predictions: JSON.parse(existing.predictions),
        dilemmaAnswer: existing.dilemmaAnswer,
        thisOrThatAnswers: existing.thisOrThatAnswers
          ? JSON.parse(existing.thisOrThatAnswers)
          : null,
        predictionAnswers: existing.predictionAnswers
          ? JSON.parse(existing.predictionAnswers)
          : null,
        completedAt: existing.completedAt,
      });
    }

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
      : "No profile data yet — generate a general discovery data.";

    const prompt = `You are generating a daily discovery session for an AI twin platform.
Your job is to help the AI twin learn more about this person's character, values, and personality.

What we already know about this person:
${profileContext}

Generate today's discovery session with THREE sections.
Focus ONLY on what we DON'T know yet about this person.
Do NOT base questions on their current topics of interest or conversations.
Focus purely on CHARACTER, VALUES, PERSONALITY, and THINKING STYLE.

SECTION 1 — ONE situational dilemma:
- A real life scenario with genuine moral tension it should be related to this person's hobbies 
- 4 distinct options that each reveal something different about the person
- Should probe values we haven't captured yet — honesty, loyalty, ambition, courage, fairness
- Must feel real and relatable — not hypothetical or abstract

SECTION 2 — TEN this or that pairs:
- 6 pairs from core personality dimensions: work style, energy, social preference, 
  decision making, risk appetite, communication, creativity, motivation, learning style
- 4 pairs specifically targeting gaps in the profile — what we don't know yet
- Each option must be 2-5 words maximum
- Should feel like a personality test — fast, instinctive, fun

SECTION 3 — THREE twin predictions:
- Statements the twin believes are true about this person based on the profile
- Each should be specific and confirmable — not vague
- Target areas where the twin is uncertain — needs confirmation or correction
- Format: "I think you tend to..." or "I believe you prefer..."

Rules:
- Be specific and interesting — never generic
- Base everything on profile gaps and personality dimensions
- Make it feel personal but not intrusive
- Dilemma options should be meaningfully different from each other`;

    const discoverySchema = z.object({
      dilemma: z.object({
        question: z.string(),
        optionA: z.string(),
        optionB: z.string(),
        optionC: z.string(),
        optionD: z.string(),
      }),
      thisOrThat: z
        .array(
          z.object({
            optionA: z.string(),
            optionB: z.string(),
            category: z.string(),
          }),
        )
        .length(10),
      predictions: z
        .array(
          z.object({
            statement: z.string(),
          }),
        )
        .length(3),
    });

    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: discoverySchema,
      prompt: prompt,
    });

    const discovery = await prisma.dailyDiscovery.create({
      data: {
        userId,
        dilemma: JSON.stringify(object.dilemma),
        thisOrThat: JSON.stringify(object.thisOrThat),
        predictions: JSON.stringify(object.predictions),
      },
    });

    return NextResponse.json({
      id: discovery.id,
      dilemma: object.dilemma,
      thisOrThat: object.thisOrThat,
      predictions: object.predictions,
      dilemmaAnswer: null,
      thisOrThatAnswers: null,
      predictionAnswers: null,
      completedAt: null,
    });
  } catch (error) {
    console.error("Dilemma API error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { discoveryId, dilemmaAnswer, thisOrThatAnswers, predictionAnswers } =
      await req.json();

    if (!discoveryId) {
      return Response.json(
        { error: "discoveryId is required" },
        { status: 400 },
      );
    }

    // Fetch discovery for context
    const discovery = await prisma.dailyDiscovery.findUnique({
      where: { id: discoveryId },
    });

    if (!discovery) {
      return Response.json({ error: "Discovery not found" }, { status: 404 });
    }

    // Save answers
    await prisma.dailyDiscovery.update({
      where: { id: discoveryId },
      data: {
        dilemmaAnswer,
        thisOrThatAnswers: JSON.stringify(thisOrThatAnswers),
        predictionAnswers: JSON.stringify(predictionAnswers),
        completedAt: new Date(),
      },
    });

    // Parse stored data for context
    const dilemma = JSON.parse(discovery.dilemma);
    const thisOrThat = JSON.parse(discovery.thisOrThat);
    const predictions = JSON.parse(discovery.predictions);

    // Build combined behaviour message
    const behaviourMessage = `
Daily discovery answers:

DILEMMA:
Question: ${dilemma.question}
User chose: ${dilemmaAnswer}

THIS OR THAT:
${thisOrThat
  .map(
    (pair: { optionA: string; optionB: string; category: string }, i: number) =>
      `${pair.category}: chose ${thisOrThatAnswers?.[i] ?? "no answer"}`,
  )
  .join("\n")}

TWIN PREDICTIONS:
${predictions
  .map(
    (p: { statement: string }, i: number) =>
      `"${p.statement}" — User responded: ${predictionAnswers?.[i] ?? "no answer"}`,
  )
  .join("\n")}
    `.trim();

    // Extract behaviour in background
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/behaviour`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: behaviourMessage,
        userId,
      }),
    }).catch((err) => console.error("Behaviour extraction failed:", err));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Discovery POST error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
