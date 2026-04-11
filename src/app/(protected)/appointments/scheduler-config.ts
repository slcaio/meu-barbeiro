import type { BryntumSchedulerProps } from '@bryntum/scheduler-react'

const CALENDAR_START_HOUR = 6
const CALENDAR_END_HOUR = 23

/**
 * Static Bryntum Scheduler configuration.
 * Defined outside of React components to avoid re-renders (Bryntum best practice).
 */
export const schedulerConfig: Partial<BryntumSchedulerProps> = {
  // Time range
  startDate: undefined, // Set dynamically
  endDate: undefined, // Set dynamically
  viewPreset: 'hourAndDay',

  // Layout
  rowHeight: 90,
  barMargin: 6,
  resourceMargin: 2,

  // Columns — resource side
  columns: [
    {
      text: 'Barbeiro',
      field: 'name',
      width: 140,
    },
  ],

  // Features
  eventDragFeature: {
    constrainDragToTimeline: false,
  },
  eventResizeFeature: false,
  eventEditFeature: false,
  eventMenuFeature: false,
  cellMenuFeature: false,
  scheduleMenuFeature: false,
  headerMenuFeature: false,
  cellEditFeature: false,
  eventDragCreateFeature: false,
  stripeFeature: true,
  columnLinesFeature: true,
  stickyEventsFeature: true,
  eventTooltipFeature: false, // We handle tooltip ourselves via JSX eventRenderer click

  // Time axis
  timeAxis: {
    continuous: false,
  },

  // Misc
  zoomOnTimeAxisDoubleClick: false,
  zoomOnMouseWheel: false,
  autoHeight: false,
}

export { CALENDAR_START_HOUR, CALENDAR_END_HOUR }
