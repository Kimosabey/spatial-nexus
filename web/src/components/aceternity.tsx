import * as React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

import { cn } from '@/lib/utils'

/* === Topology Atlas — signature visuals === */

/** Blueprint grid with cobalt rule lines. */
export function GridBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}
    >
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,58,138,0.05) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(30,58,138,0.05) 1px, transparent 1px)," +
            "linear-gradient(rgba(30,58,138,0.10) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(30,58,138,0.10) 1px, transparent 1px)",
          backgroundSize: '16px 16px, 16px 16px, 80px 80px, 80px 80px',
        }}
      />
      {/* Compass rose watermark */}
      <svg
        className="compass-rotate absolute -bottom-24 -left-24 size-[28rem] opacity-[0.07]"
        viewBox="0 0 200 200"
      >
        <circle cx="100" cy="100" r="92" stroke="#1e3a8a" strokeWidth="0.6" fill="none" />
        <circle cx="100" cy="100" r="70" stroke="#1e3a8a" strokeWidth="0.4" fill="none" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line
            key={a}
            x1="100" y1="100"
            x2={100 + 92 * Math.cos((a * Math.PI) / 180)}
            y2={100 + 92 * Math.sin((a * Math.PI) / 180)}
            stroke="#1e3a8a"
            strokeWidth={a % 90 === 0 ? 1.4 : 0.5}
          />
        ))}
        <text x="100" y="18" textAnchor="middle" fontSize="11" fill="#1e3a8a"
              fontFamily="DM Serif Display, serif">N</text>
      </svg>
    </div>
  )
}

/** Blueprint card with sage rule edge. */
export function MovingBorder({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl blueprint-card', className)}>
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: 'linear-gradient(to bottom, var(--color-cobalt), var(--color-sage))' }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

/** Atlas hero with isometric node-edge motif. */
export function SpotlightHero({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <section className={cn('relative overflow-hidden rounded-3xl blueprint-card', className)}>
      <svg
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 size-72 opacity-30"
        viewBox="0 0 200 200"
      >
        <defs>
          <pattern id="dots" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#1e3a8a" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#dots)" />
        {/* Isometric node graph */}
        <g stroke="#1e3a8a" strokeWidth="1.2" fill="none">
          <motion.line
            x1="40" y1="60" x2="120" y2="40"
            initial={false}
            animate={reduce ? undefined : { strokeOpacity: [0.2, 0.95, 0.2] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          />
          <line x1="120" y1="40" x2="160" y2="120" />
          <line x1="40" y1="60" x2="80" y2="140" />
          <line x1="80" y1="140" x2="160" y2="120" />
        </g>
        <g fill="#65a30d">
          <circle cx="40" cy="60" r="5" />
          <circle cx="120" cy="40" r="6" />
          <circle cx="160" cy="120" r="5" />
          <circle cx="80" cy="140" r="5" />
        </g>
      </svg>
      <div className="relative">{children}</div>
    </section>
  )
}
