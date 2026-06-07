export default function SectionCard({ title, subtitle, right, children, className = '' }) {
  return (
    <section className={`app-card group ${className}`}>
      {(title || subtitle || right) && (
        <header className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            {title ? (
              <div className="flex items-center gap-2">
                <span className="hidden h-2 w-2 rounded-full bg-primary sm:inline-block" />
                <h2 className="font-headline text-lg font-extrabold text-slate-950 sm:text-xl">{title}</h2>
              </div>
            ) : null}
            {subtitle ? <p className="mt-1.5 max-w-3xl text-sm font-medium leading-6 text-slate-600">{subtitle}</p> : null}
          </div>
          {right ? <div className="flex-shrink-0">{right}</div> : null}
        </header>
      )}
      {children}
    </section>
  )
}
