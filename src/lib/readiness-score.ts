import { prisma } from "@/lib/prisma";
export async function calculateReadinessScore(
  userId: string,
): Promise<{ score: number }> {
  return { score: 1 };
}
