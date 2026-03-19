import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { userId, type: "SELF" },
      orderBy: { createdAt: "desc" },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          title: "My first conversation",
        },
      });
    }

    // Get total message count
    const totalMessages = await prisma.message.count({
      where: { conversationId: conversation.id },
    });

    // Fetch paginated messages — newest first
    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Reverse so oldest is first
    messages.reverse();

    return NextResponse.json({
      id: conversation.id,
      title: conversation.title,
      userId: conversation.userId,
      messages,
      hasMore: skip + messages.length < totalMessages,
    });
  } catch (error) {
    console.error("Conversation API error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
