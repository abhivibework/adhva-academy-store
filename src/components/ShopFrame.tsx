export function ShopContainer({
  children,
  narrow = false,
}: {
  children: React.ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className={`mx-auto px-6 py-16 ${narrow ? "max-w-xl" : "max-w-6xl"}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-12 max-w-2xl">
      {eyebrow ? (
        <p className="text-xs tracking-[0.22em] text-gold-dark uppercase">{eyebrow}</p>
      ) : null}
      <h1
        className={`font-serif tracking-tight text-foreground ${eyebrow ? "mt-3 text-4xl" : "text-4xl md:text-5xl"}`}
      >
        {title}
      </h1>
      {description ? (
        <p className="mt-4 text-muted leading-relaxed">{description}</p>
      ) : null}
      <div className="mt-8 h-px w-16 bg-gold" />
    </header>
  );
}
