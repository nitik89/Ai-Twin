import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

async function calculateReadinessScore(friendId: string): Promise<number> {
  const [messageCount, profile, memoryCount, user] = await Promise.all([
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
    prisma.user.findUnique({
      where: { id: friendId },
      select: { username: true, bio: true },
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
  const onboarding = user?.bio ? 20 : user?.username ? 10 : 0;

  return 80;
}

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: userId }, { receiverId: userId }],
        status: "ACCEPTED",
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            twinScore: true,
            twinPrivacy: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            twinScore: true,
            twinPrivacy: true,
          },
        },
      },
    });

    const friends = await Promise.all(
      friendships.map(async (f) => {
        const friend = f.requesterId === userId ? f.receiver : f.requester;
        const readinessScore = await calculateReadinessScore(friend.id);
        return {
          friendshipId: f.id,
          ...friend,
          readinessScore,
        };
      }),
    );

    return NextResponse.json({ friends });
  } catch (error) {
    console.error("Friends list error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
