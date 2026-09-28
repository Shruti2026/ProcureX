import { TrendingUp, TrendingDown } from 'lucide-react'
import clsx from 'clsx'

/**
 * StatCard — metric display card used on dashboard pages.
 *
 * Props:
 *   title      {string}                  Metric label
 *   value      {string|number}           Metric value
 *   icon       {React.ComponentType}     lucide-react icon component
 *   iconColor  {string}                  Tailwind text-color class (e.g. 'text-blue-600')
 *   iconBg     {string}                  Tailwind bg class (e.g. 'bg-blue-50')
 *   trend      {{ direction: 'up'|'down', label: string }}  Optional trend indicator
 *   style      {React.CSSProperties}     Optional — used to inject animationDelay for stagger
 *
 * Stagger usage (in parent):
 *   const reducedMotion =
 *     typeof window !== 'undefined' &&
 *     window.matchMedia('(prefers-reduced-motion: reduce)').matches
 *
 *   <StatCard
 *     {...card}
 *     style={{ animationDelay: reducedMotion ? '0ms' : `${i * 75}ms` }}
 *   />
 */
export default function StatCard({ title, value, icon: Icon, iconColor, iconBg, trend, style }) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm animate-fade-slide-up"
      style={style}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div
              className={clsx(
                'mt-2 flex items-center gap-1 text-xs font-medium',
                trend.direction === 'up' ? 'text-green-500' : 'text-red-500'
              )}
            >
              {trend.direction === 'up' ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}
              <span>{trend.label}</span>
            </div>
          )}
        </div>
        <div className={clsx('flex shrink-0 items-center justify-center rounded-lg p-2.5', iconBg)}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </div>
  )
}
