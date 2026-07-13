type StatCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function StatCard({ label, value, detail }: Readonly<StatCardProps>) {
  return (
    <article className="rounded-[1.75rem] border border-white/60 bg-white/80 p-5 shadow-[0_18px_60px_rgba(39,63,90,0.1)] backdrop-blur">
      <p className="text-sm font-medium text-[#5f6f80]">{label}</p>
      <p className="mt-3 font-serif text-3xl text-[#17324d]">{value}</p>
      {detail ? <p className="mt-3 text-sm leading-6 text-[#6a7f92]">{detail}</p> : null}
    </article>
  );
}
