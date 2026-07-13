import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const payloadSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  targetBooks: z.number().int().min(1).max(1000),
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: "owner@digishelf.local" } });

  if (!user) {
    return NextResponse.json({ error: "Varsayılan kullanıcı bulunamadı." }, { status: 404 });
  }

  const goal = await prisma.yearGoal.upsert({
    where: {
      userId_year: {
        userId: user.id,
        year: parsed.data.year,
      },
    },
    update: {
      targetBooks: parsed.data.targetBooks,
    },
    create: {
      userId: user.id,
      year: parsed.data.year,
      targetBooks: parsed.data.targetBooks,
    },
  });

  return NextResponse.json({ goal });
}