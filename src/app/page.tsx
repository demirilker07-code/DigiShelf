import Link from "next/link";
import { AppShell } from "@/components/shell";
import { SectionHeading } from "@/components/section-heading";
import { StatCard } from "@/components/stat-card";
import { YearGoalForm } from "@/components/year-goal-form";
import { getHomepageMetrics } from "@/lib/books";
import { formatNumber, formatPercent } from "@/lib/utils";

export default async function Home() {
  const data = await getHomepageMetrics();

  if (!data) {
    return null;
  }

  return (
    <AppShell currentPath="/">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/60 bg-[#17324d] p-8 text-[#f7f2ea] shadow-[0_24px_80px_rgba(23,50,77,0.28)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d2b596]">DigiShelf ana panel</p>
          <h2 className="mt-4 font-serif text-5xl leading-tight">Kütüphaneni sadece listeleme, ritmini de izle.</h2>
          <p className="mt-5 max-w-2xl text-sm leading-8 text-[#d6dde5] sm:text-base">
            Tek kullanıcılı bir başlangıçla gidiyoruz. Veri modeli kullanıcı, kütüphane girdisi ve yıllık hedef mantığını ayırdığı için ileride kimlik doğrulama ekleyip çok kullanıcılı yapıya geçebiliriz.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/ekle" className="rounded-full bg-[#f7f2ea] px-5 py-3 text-sm font-semibold text-[#17324d] transition hover:bg-white">
              Kitap ekle
            </Link>
            <Link href="/oneriler" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-[#f7f2ea] transition hover:bg-white/10">
              Kitap öner
            </Link>
            <Link href="/istek-listesi" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-[#f7f2ea] transition hover:bg-white/10">
              İstek listesi
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-[0_18px_60px_rgba(39,63,90,0.1)]">
          <SectionHeading
            eyebrow="Yıllık hedef"
            title={`${data.currentGoal.year} okuma hedefi`}
            description="Her yıl farklı hedef tanımlayabilirsin. Bu veri ayrı tabloda tutulur; geçmiş yıllar ve gelecek planlar birlikte izlenebilir."
          />
          <div className="mb-5 rounded-[1.5rem] bg-[#f4ede2] p-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-[#5f7387]">Tamamlanan</p>
                <p className="mt-2 font-serif text-4xl text-[#17324d]">{data.currentGoal.completedBooks}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#5f7387]">Hedef</p>
                <p className="mt-2 text-xl font-semibold text-[#17324d]">{data.currentGoal.targetBooks} kitap</p>
                <p className="mt-1 text-sm text-[#5f7387]">
                  {formatPercent(data.currentGoal.completedBooks / Math.max(data.currentGoal.targetBooks, 1))}
                </p>
              </div>
            </div>
          </div>
          <YearGoalForm year={data.currentGoal.year} targetBooks={data.currentGoal.targetBooks} />
        </div>
      </section>

      <section className="mt-8">
        <SectionHeading
          eyebrow="Kütüphane özeti"
          title="Anlık durum panosu"
          description="Kütüphane büyüklüğü, okuma durumu ve istek listesi dahil ana metrikleri tek bakışta gör." 
        />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {data.metrics.map((metric) => (
            <StatCard key={metric.label} label={metric.label} value={formatNumber(metric.value)} />
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-[0_18px_60px_rgba(39,63,90,0.1)]">
          <SectionHeading
          eyebrow="Dönemsel akış"
          title="Hafta, ay, yıl temposu"
          description="Bitirilen kitaplar zaman ekseninde izlenir; haftanın, ayın ve yılın nabzını tek bakışta görebilirsin."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {data.periodicStats.map((period) => (
              <StatCard
                key={period.key}
                label={period.label}
                value={`${formatNumber(period.pagesRead)} sayfa`}
                detail={`${formatNumber(period.booksFinished)} kitap tamamlandı`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/60 bg-white/85 p-6 shadow-[0_18px_60px_rgba(39,63,90,0.1)]">
          <SectionHeading
          eyebrow="Tür dengesi"
          title="En baskın kategoriler"
          description="Kütüphanedeki kitap sayısına göre kategori payları."
          />
          <div className="space-y-4">
            {data.categoryBreakdown.slice(0, 5).map((category) => (
              <div key={category.name}>
                <div className="mb-2 flex items-center justify-between text-sm text-[#5c7389]">
                  <span>{category.name}</span>
                  <span>{formatPercent(category.share)}</span>
                </div>
                <div className="h-3 rounded-full bg-[#e6edf3]">
                  <div className="h-3 rounded-full bg-[#b97a56]" style={{ width: `${Math.round(category.share * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tüm zamanlar istatistiği */}
      <section className="mt-8">
        <SectionHeading
          eyebrow="Tüm zamanlar"
          title="Toplam okuma özeti"
          description="Kütüphanende okundu olarak işaretlenen tüm kitapların toplamı. Sayfa sayısı girilmemiş kitaplar dahil değildir."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-[2rem] border border-white/60 bg-[#17324d] p-6 text-[#f7f2ea] shadow-[0_18px_60px_rgba(23,50,77,0.2)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d2b596]">Toplam okunan kitap</p>
            <p className="mt-4 font-serif text-5xl">{formatNumber(data.totals.readBooks)}</p>
            <p className="mt-3 text-sm text-[#d6dde5]">{data.totals.readBooks} kitabı başından sonuna kadar okudun.</p>
          </div>
          <div className="rounded-[2rem] border border-white/60 bg-[#17324d] p-6 text-[#f7f2ea] shadow-[0_18px_60px_rgba(23,50,77,0.2)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d2b596]">Toplam okunan sayfa</p>
            <p className="mt-4 font-serif text-5xl">{formatNumber(data.totals.allTimePagesRead)}</p>
            <p className="mt-3 text-sm text-[#d6dde5]">Tamamladığın kitapların toplam sayfa sayısı.</p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
