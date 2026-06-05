export default function SectionCard({ title, subtitle, right, children, className = '' }) {
  return (
    <section className={`app-card ${className}`}>
      {(title || subtitle || right) && (
        <header className="mb-4 sm:mb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            {title ? <h2 className="font-headline text-lg sm:text-xl md:text-2xl font-bold text-on-background">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-xs sm:text-sm font-medium text-on-surface-variant">{subtitle}</p> : null}
          </div>
          {right ? <div className="flex-shrink-0">{right}</div> : null}
        </header>
      )}
      {children}
    </section>
  )
}
