export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative w-full">
      <span className="material-symbols-outlined pointer-events-none absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-sm sm:text-base text-on-surface-variant">
        search
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-2 sm:py-3 pl-9 sm:pl-11 pr-3 sm:pr-4 text-sm sm:text-base text-on-surface placeholder:text-outline/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
        placeholder={placeholder}
      />
    </div>
  )
}
