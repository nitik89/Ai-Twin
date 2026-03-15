import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { prisma } from "@/lib/prisma";
import { BehaviourProfile } from "@prisma/client";
import { z } from "zod";

const behaviourSchema = z.object({
  tone: z
    .string()
    .describe(
      "The emotional tone and energy — e.g. enthusiastic and driven, calm and analytical, direct and no-nonsense",
    ),
  vocabulary: z
    .string()
    .describe(
      "Vocabulary sophistication and style — e.g. technical and precise, conversational with analogies, simple and clear",
    ),
  topics: z
    .string()
    .describe(
      "Specific topics, domains and themes mentioned or implied — be specific not generic",
    ),
  communicationStyle: z
    .string()
    .describe(
      "How they structure and deliver thoughts — e.g. thinks out loud, leads with conclusions, builds context before the point",
    ),
  decisionPattern: z
    .string()
    .describe(
      "How they approach problems and decisions — e.g. starts with fundamentals, weighs tradeoffs explicitly, prefers action over analysis",
    ),
  personalityTraits: z
    .string()
    .describe(
      "Key personality traits visible through their writing — e.g. curious, ambitious, pragmatic, creative",
    ),
  thinkingStyle: z
    .string()
    .describe(
      "Big picture vs detail oriented, systematic vs intuitive, abstract vs concrete",
    ),
  confidenceLevel: z
    .string()
    .describe(
      "How confident and assertive they are in how they express themselves",
    ),
});

const buildPrompt = (
  message: string,
  existing: BehaviourProfile | null,
): string => {
  const existingContext = existing
    ? `
Here is what we already know about this person from previous messages:
- Tone: ${existing.tone ?? "unknown"}
- Vocabulary: ${existing.vocabulary ?? "unknown"}
- Topics of interest: ${existing.topicsOfInterest ?? "unknown"}
- Communication style: ${existing.communicationStyle ?? "unknown"}
- Decision patterns: ${existing.decisionPattern ?? "unknown"}
- Personality traits: ${existing.personalityTraits ?? "unknown"}
- Thinking style: ${existing.thinkingStyle ?? "unknown"}
- Confidence level: ${existing.confidenceLevel ?? "unknown"}

Use this as context. Refine and deepen these signals based on the new message.
If the new message contradicts something — update it.
If it confirms something — reinforce it.
If it adds something new — include it.`
    : "This is the first message from this person. Build an initial profile.";

  return `You are an expert behavioural analyst and psychologist 
specialising in digital communication patterns.

${existingContext}

Now analyse this new message:
"${message}"

Extract deep behavioural signals about the person who wrote it.
Be specific and insightful. Avoid generic observations.
Base everything strictly on evidence — do not invent traits.`;
};

export async function POST(req: Request) {
  try {
    const { userId, message } = await req.json();

    if (!message || !userId) {
      return Response.json(
        { error: "message and userId are required" },
        { status: 400 },
      );
    }

    // Get existing profile
    const existing = await prisma.behaviourProfile.findUnique({
      where: { userId },
    });

    // Generate behaviour signals
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: behaviourSchema,
      prompt: buildPrompt(message, existing),
    });

    // Accumulate raw signals
    const rawSignals = existing?.rawSignals
      ? [...JSON.parse(existing.rawSignals), object]
      : [object];

    // Upsert profile
    await prisma.behaviourProfile.upsert({
      where: { userId },
      update: {
        tone: object.tone,
        vocabulary: object.vocabulary,
        topicsOfInterest: object.topics,
        communicationStyle: object.communicationStyle,
        decisionPattern: object.decisionPattern,
        personalityTraits: object.personalityTraits,
        thinkingStyle: object.thinkingStyle,
        confidenceLevel: object.confidenceLevel,
        rawSignals: JSON.stringify(rawSignals),
      },
      create: {
        userId,
        tone: object.tone,
        vocabulary: object.vocabulary,
        topicsOfInterest: object.topics,
        communicationStyle: object.communicationStyle,
        decisionPattern: object.decisionPattern,
        personalityTraits: object.personalityTraits,
        thinkingStyle: object.thinkingStyle,
        confidenceLevel: object.confidenceLevel,
        rawSignals: JSON.stringify(rawSignals),
      },
    });

    return Response.json({
      success: true,
      profile: object,
    });
  } catch (error) {
    console.error("Behaviour extraction error:", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
