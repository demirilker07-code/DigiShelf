import { BookStatus } from "@prisma/client";
import { endOfMonth, endOfWeek, endOfYear, format, isWithinInterval, startOfMonth, startOfWeek, startOfYear } from "date-fns";
import { tr } from "date-fns/locale";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { statusLabels, statusTone } from "@/lib/status";

const OWNER_EMAIL = "owner@digishelf.local";

export type BookCardData = {
  id: string;
  bookId: string;
  title: string;
  author: string;
  categories: string[];
  pageCount: number;
  currentPage: number;
  status: BookStatus;
  statusLabel: string;
  statusTone: string;
  progress: number;
  owned: boolean;
  recommendedScore: number;
  finishedAt: Date | null;
  notes: string | null;
  publishedYear: number | null;
  coverUrl: string | null;
  isbn: string | null;
};

export type SummaryMetric = {
  label: string;
  value: number;
};

async function ensureOwner() {
  const currentYear = new Date().getFullYear();
  const user = await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: {
      displayName: "DigiShelf Owner",
    },
    create: {
      email: OWNER_EMAIL,
      displayName: "DigiShelf Owner",
    },
  });

  await prisma.yearGoal.upsert({
    where: {
      userId_year: {
        userId: user.id,
        year: currentYear,
      },
    },
    update: {},
    create: {
      userId: user.id,
      year: currentYear,
      targetBooks: 24,
    },
  });

  return user;
}

function parseCategories(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getOwnerLibrary() {
  noStore();
  await ensureOwner();

  const user = await prisma.user.findUnique({
    where: { email: OWNER_EMAIL },
    include: {
      libraryBooks: {
        include: { book: true, readingSessions: true },
        orderBy: { addedAt: "desc" },
      },
      readingSessions: true,
      yearGoals: {
        orderBy: { year: "desc" },
      },
    },
  });

  if (!user) {
    return null;
  }

  const library = user.libraryBooks.map((entry) => {
    const pageCount = entry.book.pageCount ?? 0;
    const progress = pageCount > 0 ? Math.min(entry.currentPage / pageCount, 1) : 0;

    return {
      id: entry.id,
      bookId: entry.bookId,
      title: entry.book.title,
      author: entry.book.author,
      categories: parseCategories(entry.book.categories),
      pageCount,
      currentPage: entry.currentPage,
      status: entry.status,
      statusLabel: statusLabels[entry.status],
      statusTone: statusTone[entry.status],
      progress,
      owned: entry.owned,
      recommendedScore: entry.recommendedScore,
      finishedAt: entry.finishedAt,
      notes: entry.notes,
      publishedYear: entry.book.publishedYear,
      coverUrl: entry.book.coverUrl ?? null,
      isbn: entry.book.isbn ?? null,
    } satisfies BookCardData;
  });

  const currentYear = new Date().getFullYear();
  const currentGoal = user.yearGoals.find((goal) => goal.year === currentYear) ?? null;

  const totals = {
    totalBooks: library.length,
    ownedBooks: library.filter((book) => book.owned).length,
    readBooks: library.filter((book) => book.status === BookStatus.READ).length,
    unreadBooks: library.filter((book) => book.status === BookStatus.UNREAD).length,
    readingBooks: library.filter((book) => book.status === BookStatus.READING).length,
    wishlistBooks: library.filter((book) => book.status === BookStatus.WISHLIST).length,
    pausedBooks: library.filter((book) => book.status === BookStatus.PAUSED).length,
    totalPagesRead: user.readingSessions.reduce((total, session) => total + session.pagesRead, 0),
    totalPagesOwned: library.reduce((total, book) => total + book.pageCount, 0),
    allTimePagesRead: library
      .filter((book) => book.status === BookStatus.READ)
      .reduce((sum, book) => sum + book.pageCount, 0),
  };

  const categories = new Map<string, { count: number; pagesRead: number }>();
  for (const book of library) {
    for (const category of book.categories) {
      const current = categories.get(category) ?? { count: 0, pagesRead: 0 };
      current.count += 1;
      current.pagesRead += book.currentPage;
      categories.set(category, current);
    }
  }

  const categoryBreakdown = Array.from(categories.entries())
    .map(([name, values]) => ({
      name,
      count: values.count,
      pagesRead: values.pagesRead,
      share: totals.totalBooks === 0 ? 0 : values.count / totals.totalBooks,
    }))
    .sort((left, right) => right.count - left.count);

  const now = new Date();
  const periods = [
    {
      key: "week",
      label: "Bu Hafta",
      start: startOfWeek(now, { locale: tr }),
      end: endOfWeek(now, { locale: tr }),
    },
    {
      key: "month",
      label: "Bu Ay",
      start: startOfMonth(now),
      end: endOfMonth(now),
    },
    {
      key: "year",
      label: "Bu Yıl",
      start: startOfYear(now),
      end: endOfYear(now),
    },
  ];

  const periodicStats = periods.map((period) => {
    const completedBooks = user.libraryBooks.filter((entry) =>
      entry.finishedAt && isWithinInterval(entry.finishedAt, { start: period.start, end: period.end }),
    );

    return {
      key: period.key,
      label: period.label,
      // Oturum kaydı yoksa bitirilen kitapların sayfa sayısından hesapla
      pagesRead: completedBooks.reduce((total, entry) => total + (entry.book.pageCount ?? 0), 0),
      booksFinished: completedBooks.length,
    };
  });

  const annualReads = user.libraryBooks
    .filter((entry) => entry.finishedAt)
    .reduce<Map<string, number>>((accumulator, entry) => {
      const year = format(entry.finishedAt as Date, "yyyy");
      accumulator.set(year, (accumulator.get(year) ?? 0) + 1);
      return accumulator;
    }, new Map());

  const years = new Set<number>([
    ...Array.from(annualReads.keys()).map((year) => Number(year)),
    ...user.yearGoals.map((goal) => goal.year),
  ]);

  const annualProgress = Array.from(years)
    .map((year) => {
      const goal = user.yearGoals.find((item) => item.year === year)?.targetBooks ?? 24;
      const booksRead = annualReads.get(String(year)) ?? 0;

      return {
        year: String(year),
        booksRead,
        goal,
        completionRate: goal === 0 ? 0 : booksRead / goal,
      };
    })
    .sort((left, right) => Number(right.year) - Number(left.year));

  const unreadCandidates = library
    .filter((book) => book.status === BookStatus.UNREAD)
    .sort((left, right) => right.recommendedScore - left.recommendedScore);

  const recommendation = unreadCandidates.length
    ? unreadCandidates[Math.floor(Math.random() * unreadCandidates.length)]
    : null;

  return {
    user: {
      name: user.displayName,
      email: user.email,
      currentYearGoal: currentGoal?.targetBooks ?? 24,
    },
    library,
    totals,
    categoryBreakdown,
    periodicStats,
    annualProgress,
    recommendation,
    currentGoal: {
      year: currentYear,
      targetBooks: currentGoal?.targetBooks ?? 24,
      completedBooks: annualReads.get(String(currentYear)) ?? 0,
    },
  };
}

export async function getHomepageMetrics() {
  const data = await getOwnerLibrary();
  if (!data) {
    return null;
  }

  const metrics: SummaryMetric[] = [
    { label: "Kütüphanedeki kitap", value: data.totals.totalBooks },
    { label: "Okunan", value: data.totals.readBooks },
    { label: "Başlanmayan", value: data.totals.unreadBooks },
    { label: "Devam eden", value: data.totals.readingBooks },
    { label: "İstek listesi", value: data.totals.wishlistBooks },
  ];

  return {
    ...data,
    metrics,
  };
}
