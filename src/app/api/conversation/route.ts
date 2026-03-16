import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          title: "My first conversation",
        },
        include: {
          messages: true,
        },
      });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Conversation API error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
