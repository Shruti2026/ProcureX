import { useState, useCallback } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import clsx from 'clsx'

/**
 * StatCard — metric display card used on dashboard pages.
 *
 * Props:
 *   title      {string}                  Metric label
 *   value      {string|number}           Metric value
 *   icon       {React.ComponentType}     lucide-react icon component
 *   iconColor  {string}                  Tailwind text-color class (e.g. 'text-primary-600')
 *   iconBg     {string}                  Unused — icon bg is now a fixed violet gradient
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

const canHover =
  typeof window !== 'undefined'
    ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
    : false

export default function StatCard({ title, value, icon: Icon, iconColor, iconBg, trend, style }) {
  const [lifted, setLifted] = useState(false)

  const handleMouseEnter = useCallback(() => {
    if (canHover) setLifted(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (canHover) setLifted(false)
  }, [])

  return (
    <div
      className="bg-white rounded-2xl border border-primary-100 p-5 shadow-sm animate-fade-slide-up dark:bg-white/5 dark:border-white/10 dark:backdrop-blur-sm"
      style={{
        ...style,
        transform: lifted ? 'translateY(-2px)' : 'translateY(0px)',
        boxShadow: lifted
          ? '0 4px 16px 0 rgba(109,40,217,0.10), 0 1px 4px 0 rgba(109,40,217,0.06)'
          : undefined,
        transition:
          'transform 200ms cubic-bezier(0.23,1,0.32,1), box-shadow 200ms cubic-bezier(0.23,1,0.32,1)',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 tracking-[0.01em] dark:text-white/60">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <div
              className={clsx(
                'mt-2 flex items-center gap-1 text-xs font-medium',
                trend.direction === 'up'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-500 dark:text-red-400'
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
        <div
          className="flex shrink-0 items-center justify-center rounded-xl p-2.5 dark:!bg-white/10"
          style={{ background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)' }}
        >
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </div>
  )
}
