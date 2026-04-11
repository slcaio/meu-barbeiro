/**
 * Wrapper for BryntumScheduler to support Next.js dynamic import (ssr: false).
 * Bryntum is client-only; this component must be loaded with dynamic(() => import(...), { ssr: false }).
 */
import { BryntumScheduler } from '@bryntum/scheduler-react'
import type { BryntumSchedulerProps } from '@bryntum/scheduler-react'
import { type RefObject } from 'react'
import type { Scheduler } from '@bryntum/scheduler'

interface SchedulerWrapperProps extends BryntumSchedulerProps {
  schedulerRef?: RefObject<BryntumScheduler | null>
}

export default function SchedulerWrapper({ schedulerRef, ...props }: SchedulerWrapperProps) {
  return <BryntumScheduler ref={schedulerRef} {...props} />
}

export type { SchedulerWrapperProps, Scheduler }
