import OpeningHours from 'opening_hours';

/** OSM schedules use local wall time. Missing/invalid/conditional hours stay unknown. */
export function getOpenNow(hours: string | undefined, now: Date = new Date()): boolean | undefined {
  if (!hours?.trim()) return undefined;
  try {
    // Without verified holiday/location context, the parser rejects rules it cannot resolve.
    const schedule = new OpeningHours(hours);
    return schedule.getUnknown(now) ? undefined : schedule.getState(now);
  } catch {
    return undefined;
  }
}
