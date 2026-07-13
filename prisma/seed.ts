import { PrismaClient, BookStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const currentYear = new Date().getFullYear();

  await prisma.yearGoal.deleteMany();
  await prisma.readingSession.deleteMany();
  await prisma.libraryBook.deleteMany();
  await prisma.book.deleteMany();

  const user = await prisma.user.upsert({
    where: { email: "owner@digishelf.local" },
    update: {
      displayName: "DigiShelf Owner",
    },
    create: {
      email: "owner@digishelf.local",
      displayName: "DigiShelf Owner",
    },
  });

  await prisma.yearGoal.createMany({
    data: [
      { userId: user.id, year: currentYear - 1, targetBooks: 30 },
      { userId: user.id, year: currentYear, targetBooks: 36 },
    ],
  });

  const books = [
    {
      title: "Sapiens",
      author: "Yuval Noah Harari",
      categories: ["Tarih", "Antropoloji"],
      pageCount: 443,
      publishedYear: 2011,
      status: BookStatus.READ,
      currentPage: 443,
      finishedAt: new Date("2026-02-18"),
      recommendedScore: 68,
      sessions: [120, 90, 140, 93],
      source: "seed",
    },
    {
      title: "Dune",
      author: "Frank Herbert",
      categories: ["Bilim Kurgu"],
      pageCount: 688,
      publishedYear: 1965,
      status: BookStatus.READING,
      currentPage: 246,
      startedAt: new Date("2026-06-21"),
      recommendedScore: 94,
      sessions: [34, 56, 82, 74],
      source: "seed",
    },
    {
      title: "Atomic Habits",
      author: "James Clear",
      categories: ["Kişisel Gelişim"],
      pageCount: 320,
      publishedYear: 2018,
      status: BookStatus.UNREAD,
      currentPage: 0,
      recommendedScore: 83,
      source: "seed",
    },
    {
      title: "Körlük",
      author: "Jose Saramago",
      categories: ["Roman", "Edebiyat"],
      pageCount: 352,
      publishedYear: 1995,
      status: BookStatus.PAUSED,
      currentPage: 117,
      startedAt: new Date("2026-04-09"),
      recommendedScore: 71,
      sessions: [45, 39, 33],
      source: "seed",
    },
    {
      title: "Project Hail Mary",
      author: "Andy Weir",
      categories: ["Bilim Kurgu"],
      pageCount: 496,
      publishedYear: 2021,
      status: BookStatus.WISHLIST,
      currentPage: 0,
      recommendedScore: 97,
      source: "seed",
    },
    {
      title: "İnsan Neyle Yaşar?",
      author: "Lev Tolstoy",
      categories: ["Klasik", "Öykü"],
      pageCount: 96,
      publishedYear: 1885,
      status: BookStatus.READ,
      currentPage: 96,
      finishedAt: new Date("2026-01-12"),
      recommendedScore: 62,
      sessions: [42, 54],
      source: "seed",
    },
  ];

  for (const item of books) {
    const book = await prisma.book.create({
      data: {
        title: item.title,
        author: item.author,
        categories: JSON.stringify(item.categories),
        pageCount: item.pageCount,
        publishedYear: item.publishedYear,
        source: item.source,
      },
    });

    const libraryBook = await prisma.libraryBook.create({
      data: {
        userId: user.id,
        bookId: book.id,
        status: item.status,
        currentPage: item.currentPage,
        startedAt: item.startedAt,
        finishedAt: item.finishedAt,
        recommendedScore: item.recommendedScore,
        owned: item.status !== BookStatus.WISHLIST,
      },
    });

    if (item.sessions) {
      for (const pagesRead of item.sessions) {
        await prisma.readingSession.create({
          data: {
            userId: user.id,
            libraryBookId: libraryBook.id,
            pagesRead,
          },
        });
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
