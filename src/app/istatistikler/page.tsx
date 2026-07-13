import { AppShell } from "@/components/shell";
import { SectionHeading } from "@/components/section-heading";
import { StatCard } from "@/components/stat-card";
import { getOwnerLibrary } from "@/lib/books";
import { formatNumber, formatPercent } from "@/lib/utils";

export default async function StatsPage() {
  const data = await getOwnerLibrary();

  if (!data) {
    return null;
  }

  return (
    <AppShell currentPath="/istatistikler">
      <SectionHeading
        eyebrow="Okuma özeti"
        title="Hafta, ay ve yıl görünümünde istatistikler"
        description="Okuma ritminizi, tür dağılımınızı ve yıllık hedef ilerlemenizi tek merkezden takip edin."
      />

      <section className="grid gap-5 lg:grid-cols-3">
        {data.periodicStats.map((period) => (
          <StatCard
            key={period.key}
            label={period.label}
            value={`${formatNumber(period.pagesRead)} sayfa`}
            detail={`${formatNumber(period.booksFinished)} kitap tamamlandı`}
          />
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_18px_60px_rgba(39,63,90,0.1)]">
          <h3 className="font-serif text-2xl text-[#17324d]">Tür dağılımı</h3>
          <div className="mt-5 space-y-4">
            {data.categoryBreakdown.map((category) => (
              <div key={category.name}>
                <div className="mb-2 flex items-center justify-between text-sm text-[#5c7389]">
                  <span>{category.name}</span>
                  <span>
                    {formatPercent(category.share)} · {formatNumber(category.pagesRead)} sayfa
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[#e6edf3]">
                  <div className="h-3 rounded-full bg-[#b97a56]" style={{ width: `${Math.round(category.share * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_18px_60px_rgba(39,63,90,0.1)]">
          <h3 className="font-serif text-2xl text-[#17324d]">Yıllık hedef</h3>
          <div className="mt-5 space-y-4">
            {data.annualProgress.map((year) => (
              <div key={year.year} className="rounded-[1.5rem] bg-[#f4ede2] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#17324d]">{year.year}</span>
                  <span className="text-sm text-[#5e7489]">{formatPercent(year.completionRate)}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#5e7489]">
                  {formatNumber(year.booksRead)} / {formatNumber(year.goal)} kitap tamamlandı.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
