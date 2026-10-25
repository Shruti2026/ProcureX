import { AnimatePresence, motion } from 'motion/react'
import { useReducedMotion } from 'motion/react'

/**
 * PageTransition — wraps route content with a fade animation on route change.
 * Uses opacity only (no position change) to prevent layout shift.
 * Respects prefers-reduced-motion: instant transition when reduced motion is preferred.
 *
 * Usage: wrap <Outlet /> in DashboardLayout with this component,
 * passing the current route location.pathname as the `locationKey` prop.
 */
export default function PageTransition({ children, locationKey }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={locationKey}
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        transition={{duration: shouldReduceMotion ? 0 : 0.2,
          ease: [0.23, 1, 0.32, 1],}}
        style={{height: '100%'}}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
