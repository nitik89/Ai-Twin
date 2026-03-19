import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: friendId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: friendId },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        twinPrivacy: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate readiness score
    const [messageCount, profile, memoryCount] = await Promise.all([
      prisma.message.count({
        where: {
          conversation: { userId: friendId },
          role: Role.USER,
        },
      }),
      prisma.behaviourProfile.findUnique({
        where: { userId: friendId },
      }),
      prisma.memory.count({
        where: { userId: friendId },
      }),
    ]);

    const fields = [
      profile?.tone,
      profile?.vocabulary,
      profile?.topicsOfInterest,
      profile?.communicationStyle,
      profile?.decisionPattern,
      profile?.personalityTraits,
      profile?.thinkingStyle,
      profile?.confidenceLevel,
    ];

    const filledFields = fields.filter(Boolean).length;
    const messages = Math.min(30, Math.floor(messageCount / 3));
    const profileScore = Math.floor((filledFields / 8) * 30);
    const memories = Math.min(20, memoryCount * 4);
    const onboarding = user ? 20 : 10;
    const readinessScore = messages + profileScore + memories + onboarding;

    return NextResponse.json({
      user: { ...user, readinessScore },
    });
  } catch (error) {
    console.error("User fetch error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
