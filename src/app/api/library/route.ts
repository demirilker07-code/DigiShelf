import { BookStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const payloadSchema = z.object({
  title: z.string().trim().min(1),
  author: z.string().trim().min(1),
  categories: z.array(z.string()).default([]),
  pageCount: z.number().int().positive().nullable().optional(),
  publishedYear: z.number().int().nullable().optional(),
  isbn: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  source: z.string().default("openlibrary"),
  sourceKey: z.string().nullable().optional(),
  status: z.nativeEnum(BookStatus).default(BookStatus.UNREAD),
  owned: z.boolean().default(true),
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: "owner@digishelf.local" },
  });

  if (!user) {
    return NextResponse.json({ error: "Varsayılan kullanıcı bulunamadı." }, { status: 404 });
  }

  const book = await prisma.book.create({
    data: {
      title: parsed.data.title,
      author: parsed.data.author,
      categories: JSON.stringify(parsed.data.categories),
      pageCount: parsed.data.pageCount ?? null,
      publishedYear: parsed.data.publishedYear ?? null,
      isbn: parsed.data.isbn ?? null,
      coverUrl: parsed.data.coverUrl ?? null,
      source: parsed.data.source,
      sourceKey: parsed.data.sourceKey ?? null,
    },
  });

  const libraryEntry = await prisma.libraryBook.create({
    data: {
      userId: user.id,
      bookId: book.id,
      status: parsed.data.status,
      owned: parsed.data.owned,
      currentPage: parsed.data.status === BookStatus.READ ? parsed.data.pageCount ?? 0 : 0,
      startedAt:
        parsed.data.status === BookStatus.READING || parsed.data.status === BookStatus.PAUSED
          ? new Date()
          : null,
      finishedAt: parsed.data.status === BookStatus.READ ? new Date() : null,
    },
    include: {
      book: true,
    },
  });

  return NextResponse.json({ libraryEntry }, { status: 201 });
}
