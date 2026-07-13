import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  q: z.string().trim().min(2),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ q: searchParams.get("q") ?? "" });

  if (!parsed.success) {
    return NextResponse.json({ error: "Arama terimi en az 2 karakter olmalı." }, { status: 400 });
  }

  const response = await fetch(
    `https://openlibrary.org/search.json?title=${encodeURIComponent(parsed.data.q)}&limit=8`,
    {
      headers: {
        "User-Agent": "DigiShelf/0.1",
      },
      next: { revalidate: 3600 },
    },
  );

  if (!response.ok) {
    return NextResponse.json({ error: "Kitap arama servisine ulaşılamadı." }, { status: 502 });
  }

  const payload = (await response.json()) as {
    docs?: Array<{
      key?: string;
      title?: string;
      author_name?: string[];
      first_publish_year?: number;
      number_of_pages_median?: number;
      subject?: string[];
      isbn?: string[];
    }>;
  };

  const books = (payload.docs ?? []).map((book) => ({
    sourceKey: book.key ?? null,
    title: book.title ?? "Bilinmeyen Başlık",
    author: book.author_name?.[0] ?? "Bilinmeyen Yazar",
    publishedYear: book.first_publish_year ?? null,
    pageCount: book.number_of_pages_median ?? null,
    categories: book.subject?.slice(0, 3) ?? [],
    isbn: book.isbn?.[0] ?? null,
  }));

  return NextResponse.json({ books });
}
