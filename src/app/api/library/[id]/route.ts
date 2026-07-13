import { BookStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// PATCH: durum / sayfa / not güncelle
const patchSchema = z.object({
  status: z.nativeEnum(BookStatus),
  currentPage: z.number().int().min(0),
  notes: z.string().trim().max(1000).optional().default(""),
});

// PUT: kitap + kütüphane kaydını tam güncelle
const putSchema = z.object({
  title: z.string().trim().min(1),
  author: z.string().trim().min(1),
  categories: z.array(z.string()).default([]),
  pageCount: z.number().int().positive().nullable().optional(),
  publishedYear: z.number().int().nullable().optional(),
  isbn: z.string().trim().nullable().optional(),
  coverUrl: z.string().trim().url().nullable().optional().or(z.literal("")),
});

async function findEntry(id: string) {
  return prisma.libraryBook.findUnique({
    where: { id },
    include: { book: true },
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const entry = await findEntry(id);
  if (!entry) return NextResponse.json({ error: "Girdi bulunamadı." }, { status: 404 });

  const pageLimit = entry.book.pageCount ?? parsed.data.currentPage;
  // READ durumunda sayfa ilerlemesini kitabın toplam sayfa sayısıyla eşitle
  const currentPage = parsed.data.status === BookStatus.READ && entry.book.pageCount
    ? entry.book.pageCount
    : Math.min(parsed.data.currentPage, pageLimit);
  const now = new Date();

  const updated = await prisma.libraryBook.update({
    where: { id: entry.id },
    data: {
      status: parsed.data.status,
      currentPage,
      notes: parsed.data.notes || null,
      startedAt:
        parsed.data.status === BookStatus.READING ||
        parsed.data.status === BookStatus.PAUSED ||
        parsed.data.status === BookStatus.ABANDONED ||
        parsed.data.status === BookStatus.READ
          ? entry.startedAt ?? now
          : null,
      finishedAt: parsed.data.status === BookStatus.READ ? entry.finishedAt ?? now : null,
      owned: parsed.data.status !== BookStatus.WISHLIST,
    },
  });

  return NextResponse.json({ updated });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = putSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const entry = await findEntry(id);
  if (!entry) return NextResponse.json({ error: "Girdi bulunamadı." }, { status: 404 });

  const coverUrl = parsed.data.coverUrl || null;

  // ISBN unique kısıtlaması: başka bir kitapta aynı ISBN varsa temizle
  if (parsed.data.isbn && parsed.data.isbn !== entry.book.isbn) {
    await prisma.book.updateMany({
      where: { isbn: parsed.data.isbn, id: { not: entry.bookId } },
      data: { isbn: null },
    });
  }

  const updatedBook = await prisma.book.update({
    where: { id: entry.bookId },
    data: {
      title: parsed.data.title,
      author: parsed.data.author,
      categories: JSON.stringify(parsed.data.categories),
      pageCount: parsed.data.pageCount ?? null,
      publishedYear: parsed.data.publishedYear ?? null,
      isbn: parsed.data.isbn || null,
      coverUrl,
    },
  });

  return NextResponse.json({ book: updatedBook });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const entry = await findEntry(id);
  if (!entry) return NextResponse.json({ error: "Girdi bulunamadı." }, { status: 404 });

  // Önce kütüphane kaydını sil
  await prisma.libraryBook.delete({ where: { id: entry.id } });

  // Eğer kitabın başka kütüphane kaydı yoksa kitabı da sil
  const remainingEntries = await prisma.libraryBook.count({ where: { bookId: entry.bookId } });
  if (remainingEntries === 0) {
    await prisma.book.delete({ where: { id: entry.bookId } });
  }

  return NextResponse.json({ deleted: true });
}
