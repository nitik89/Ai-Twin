import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const userId = process.env.HARDCODED_USER_ID!;

    if (!userId) {
      return NextResponse.json(
        { error: "HARDCODED_USER_ID not set" },
        { status: 500 },
      );
    }

    // First ensure user exists — create if not
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });

    // Then find or create conversation
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
