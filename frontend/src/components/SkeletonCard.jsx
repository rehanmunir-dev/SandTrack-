import React from 'react'

export default function SkeletonCard({ variant = 'kpi-card', count = 1 }) {
  const items = Array.from({ length: count })

  const renderSkeleton = () => {
    switch (variant) {
      case 'table-row':
        return (
          <div className="flex items-center justify-between py-3 border-b border-outline-variant/10 animate-pulse">
            <div className="h-4 bg-outline-variant/20 rounded w-1/4" />
            <div className="h-4 bg-outline-variant/20 rounded w-1/6" />
            <div className="h-4 bg-outline-variant/20 rounded w-1/6" />
            <div className="h-4 bg-outline-variant/20 rounded w-1/12" />
          </div>
        )
      case 'driver-card':
        return (
          <div className="app-card flex items-center gap-4 animate-pulse">
            <div className="w-12 h-12 bg-outline-variant/20 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-outline-variant/20 rounded w-2/3" />
              <div className="h-3 bg-outline-variant/20 rounded w-1/2" />
            </div>
            <div className="w-16 h-6 bg-outline-variant/20 rounded-full" />
          </div>
        )
      case 'kpi-card':
      default:
        return (
          <div className="app-kpi-card space-y-4 animate-pulse">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-outline-variant/20 rounded w-1/2" />
                <div className="h-6 bg-outline-variant/20 rounded w-2/3" />
              </div>
              <div className="w-10 h-10 bg-outline-variant/20 rounded-xl" />
            </div>
            <div className="h-3 bg-outline-variant/20 rounded w-1/3" />
          </div>
        )
    }
  }

  return (
    <>
      {items.map((_, idx) => (
        <React.Fragment key={idx}>{renderSkeleton()}</React.Fragment>
      ))}
    </>
  )
}
