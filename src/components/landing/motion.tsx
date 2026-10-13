'use client';

import * as React from 'react';
import { MotionConfig, motion, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';

// Shared animation pieces for the landing page. Everything honours the
// visitor's reduced-motion setting through MotionRoot.

export const EASE = [0.22, 1, 0.36, 1] as const;

export const MotionRoot = ({ children }: { children: React.ReactNode }) => (
  <MotionConfig reducedMotion="user" transition={{ duration: 0.7, ease: EASE }}>{children}</MotionConfig>
);

/** Fades and rises into place the first time it scrolls into view. */
export function Reveal({ children, className, y = 32, delay = 0, as = 'div' }: {
  children: React.ReactNode; className?: string; y?: number; delay?: number; as?: 'div' | 'p' | 'h2' | 'section';
}) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </Comp>
  );
}

const staggerParent: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const staggerChild: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/** A grid whose children rise in one after another. */
export const Stagger = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div className={className} variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.article className={className} variants={staggerChild}>{children}</motion.article>
);

/** Word-by-word blur-in for headlines, played on load. */
export function BlurWords({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {/* Screen readers get the sentence once, not word fragments. */}
      <span className="sr-only">{text}</span>
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          aria-hidden
          className="inline-block whitespace-pre"
          initial={{ opacity: 0, filter: 'blur(8px)', y: '0.4em' }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: delay + i * 0.07 }}
        >
          {w}{i < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </span>
  );
}

/** Slowly spinning burst, the little "spark" beside each hero bubble. */
export const Sparkle = ({ className }: { className?: string }) => (
  <motion.svg
    viewBox="0 0 32 32"
    className={cn('size-8', className)}
    animate={{ rotate: 360 }}
    transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
    aria-hidden
  >
    {Array.from({ length: 12 }, (_, i) => (
      <rect key={i} x="15" y="2" width="2.4" height="9" rx="1.2" fill="currentColor" transform={`rotate(${i * 30} 16 16)`} opacity={0.55 + (i % 3) * 0.2} />
    ))}
  </motion.svg>
);
