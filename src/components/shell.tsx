import Link from "next/link";
import { BookOpen, BookMarked, ChartColumnIncreasing, House, LibraryBig, PlusCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Ana Sayfa", icon: House },
  { href: "/kutuphane", label: "Kütüphane", icon: LibraryBig },
  { href: "/istek-listesi", label: "İstek Listesi", icon: BookMarked },
  { href: "/ekle", label: "Kitap Ekle", icon: PlusCircle },
  { href: "/istatistikler", label: "İstatistikler", icon: ChartColumnIncreasing },
  { href: "/oneriler", label: "Kitap Öner", icon: Sparkles },
];

export function AppShell({
  currentPath,
  children,
}: Readonly<{
  currentPath: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-5 rounded-[2rem] border border-white/50 bg-white/75 p-6 shadow-[0_20px_80px_rgba(29,53,87,0.12)] backdrop-blur md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#17324d] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#f6efe5]">
            <BookOpen className="h-4 w-4" /> DigiShelf
          </div>
          <div>
            <h1 className="font-serif text-3xl text-[#17324d] sm:text-4xl">Kişisel dijital kütüphane merkeziniz</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#4f6478] sm:text-base">
              Tek kullanıcıyla başlayıp çok kullanıcılı mimariye büyüyebilecek şekilde tasarlanmış kitap takip uygulaması.
            </p>
          </div>
        </div>
        <nav className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-[#17324d] text-[#f6efe5] shadow-lg"
                    : "bg-[#f7f1e8] text-[#17324d] hover:bg-[#eadfce]",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1 pb-6">{children}</main>
    </div>
  );
}
