import { streamText, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: `You are an AI twin — an intelligent assistant 
      that learns from every conversation. Pay close attention 
      to how the user communicates. Be conversational, warm, and concise.`,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("🔥 Chat API Crash:", error);

    return new Response(
      JSON.stringify({ error: "Something went wrong in the API Route" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
