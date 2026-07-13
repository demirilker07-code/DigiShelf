import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  isbn: z
    .string()
    .trim()
    .min(10)
    .max(13)
    .regex(/^[\d-X]+$/, "Geçersiz ISBN formatı."),
});

type OpenLibraryBookData = {
  title?: string;
  authors?: Array<{ name: string }>;
  number_of_pages?: number;
  publish_date?: string;
  subjects?: Array<{ name: string }>;
  cover?: { small?: string; medium?: string; large?: string };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ isbn: searchParams.get("isbn") ?? "" });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçerli bir ISBN girin (10 veya 13 karakter, sadece rakam)." },
      { status: 400 },
    );
  }

  const cleanIsbn = parsed.data.isbn.replace(/-/g, "");
  const bibKey = `ISBN:${cleanIsbn}`;

  const response = await fetch(
    `https://openlibrary.org/api/books?bibkeys=${bibKey}&format=json&jscmd=data`,
    {
      headers: { "User-Agent": "DigiShelf/0.1" },
      next: { revalidate: 86400 },
    },
  );

  if (!response.ok) {
    return NextResponse.json({ error: "ISBN servisi yanıt vermedi." }, { status: 502 });
  }

  const payload = (await response.json()) as Record<string, OpenLibraryBookData>;
  const data = payload[bibKey];

  if (!data) {
    return NextResponse.json({ error: "Bu ISBN ile eşleşen kitap bulunamadı." }, { status: 404 });
  }

  const rawYear = data.publish_date ?? "";
  const yearMatch = rawYear.match(/\d{4}/);
  const publishedYear = yearMatch ? parseInt(yearMatch[0], 10) : null;

  return NextResponse.json({
    book: {
      sourceKey: bibKey,
      title: data.title ?? "Bilinmeyen Başlık",
      author: data.authors?.[0]?.name ?? "Bilinmeyen Yazar",
      publishedYear,
      pageCount: data.number_of_pages ?? null,
      categories: (data.subjects ?? []).slice(0, 4).map((s) => s.name),
      isbn: cleanIsbn,
      coverUrl: data.cover?.large ?? data.cover?.medium ?? data.cover?.small ?? null,
    },
  });
}
