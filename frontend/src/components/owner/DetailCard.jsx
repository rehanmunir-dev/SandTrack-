export default function DetailCard({ title, children, right }) {
  return (
    <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="font-headline text-base font-bold text-on-surface">{title}</h4>
        {right || null}
      </div>
      {children}
    </section>
  )
}
