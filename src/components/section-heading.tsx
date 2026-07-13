export function SectionHeading({
  eyebrow,
  title,
  description,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
}>) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7b8fa2]">{eyebrow}</p>
      <h2 className="mt-2 font-serif text-3xl text-[#17324d]">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-[#5f7387]">{description}</p>
    </div>
  );
}
