import { generateEmbeddings } from "./embeddings";
import { prisma } from "@/lib/prisma";

type SimilarMessage = {
  id: string;
  content: string;
  role: string;
  createdAt: Date;
  source: "message" | "memory";
};

export async function searchSimilarMessages(
  query: string,
  userId: string,
  limit: number = 5,
): Promise<SimilarMessage[]> {
  const queryEmbedding = await generateEmbeddings(query);
  const queryVector = JSON.stringify(queryEmbedding);

  // Search recent messages
  const messages = await prisma.$queryRaw<SimilarMessage[]>`
    SELECT 
      m.id,
      m.content,
      m.role,
      m."createdAt",
      'message' as source
    FROM "Message" m
    JOIN "Conversation" c ON m."conversationId" = c.id
    WHERE c."userId" = ${userId}
    AND m.embedding IS NOT NULL
    ORDER BY m.embedding <=> ${queryVector}::vector
    LIMIT ${limit}
  `;

  // Search long term memories
  const memories = await prisma.$queryRaw<SimilarMessage[]>`
  SELECT
    id,
    summary as content,
    'MEMORY' as role,
    "createdAt",
    'memory' as source
  FROM "Memory"
  WHERE "userId" = ${userId}
  AND embedding IS NOT NULL
  ORDER BY embedding <=> ${queryVector}::vector
  LIMIT ${Math.floor(limit / 2)}
`;

  return [...messages, ...memories];
}
