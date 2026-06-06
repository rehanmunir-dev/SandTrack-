export default function DetailCard({ title, children, right }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <h4 className="font-headline text-base font-extrabold text-slate-950">{title}</h4>
        {right || null}
      </div>
      {children}
    </section>
  )
}
