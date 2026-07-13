import { AppShell } from "@/components/shell";
import { SectionHeading } from "@/components/section-heading";
import { getOwnerLibrary } from "@/lib/books";

export default async function RecommendationPage() {
  const data = await getOwnerLibrary();

  if (!data) {
    return null;
  }

  return (
    <AppShell currentPath="/oneriler">
      <SectionHeading
        eyebrow="Rastgele öneri"
        title="Bugün hangi kitabı okumalıyım?"
        description="Başlanmamış kitaplar arasından rastgele, öncelik skoruyla desteklenmiş bir öneri üretiriz. Her sayfayı yenilediğinde farklı bir kitap önerilebilir."
      />

      {data.recommendation ? (
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[2rem] border border-white/60 bg-[#17324d] p-8 text-[#f7f2ea] shadow-[0_24px_80px_rgba(23,50,77,0.28)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d2b596]">Rastgele öneri</p>
            <h2 className="mt-4 font-serif text-4xl">{data.recommendation.title}</h2>
            <p className="mt-3 text-lg text-[#d6dde5]">{data.recommendation.author}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {data.recommendation.categories.map((category) => (
                <span key={category} className="rounded-full bg-white/10 px-3 py-1 text-sm text-[#f7f2ea]">
                  {category}
                </span>
              ))}
            </div>
            <p className="mt-8 max-w-xl text-sm leading-7 text-[#d6dde5]">
              Öneri skoru {data.recommendation.recommendedScore}/100. Sayfayı her yenilediğinde farklı bir kitap önerilebilir — skor yüksek olanlar daha çok öncüllendirilir.
            </p>
          </article>

          <aside className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_18px_60px_rgba(39,63,90,0.1)]">
            <h3 className="font-serif text-2xl text-[#17324d]">Nasıl çalışır?</h3>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[#5d7388]">
              <li>Başlanmamış kitaplar aday havuzuna alınır.</li>
              <li>Öneri skoru yüksek kitaplar önce listelenir.</li>
              <li>Son seçim rastgele yapıldığı için her ziyarette farklı sonuç görülebilir.</li>
              <li>Sonraki adımda “yeniden öner” butonu ve tür filtresi eklenebilir.</li>
            </ul>
          </aside>
        </section>
      ) : (
        <p className="text-sm text-[#5d7388]">Rastgele öneri yapabilmek için kutüphanende en az bir başlanmamış kitap olmalı.</p>
      )}
    </AppShell>
  );
}
