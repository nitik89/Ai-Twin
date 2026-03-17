import { summariseConversation } from "@/lib/memory";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    const { conversationId, userId } = await req.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 },
      );
    }

    await summariseConversation(conversationId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Summarise API error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
