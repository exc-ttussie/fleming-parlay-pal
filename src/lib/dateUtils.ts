import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { addWeeks, nextSunday, setHours, setMinutes, setSeconds, setMilliseconds, isAfter, isBefore } from 'date-fns';

const EASTERN_TIME_ZONE = 'America/New_York';

/**
 * Get the next Sunday at 12:00 PM Eastern Time
 * @param fromDate The date to calculate from (defaults to current date)
 * @returns Date object representing the next Sunday at 12:00 PM ET
 */
export const getNextSundayLockTime = (fromDate: Date = new Date()): Date => {
  // Convert input date to Eastern Time for accurate calculation
  const easternDate = toZonedTime(fromDate, EASTERN_TIME_ZONE);
  
  // Get next Sunday from the Eastern time date
  let nextSundayDate = nextSunday(easternDate);
  
  // If it's already Sunday and before 12 PM ET, use today
  if (easternDate.getDay() === 0 && easternDate.getHours() < 12) {
    nextSundayDate = easternDate;
  }
  
  // Set the time to 12:00:00.000 PM
  const lockTime = setMilliseconds(
    setSeconds(
      setMinutes(
        setHours(nextSundayDate, 12), 
        0
      ), 
      0
    ), 
    0
  );
  
  // Convert back to UTC for storage
  return fromZonedTime(lockTime, EASTERN_TIME_ZONE);
};

/**
 * Format lock time for display with timezone information
 * @param lockTime The lock time date
 * @returns Formatted string with Eastern Time indication
 */
export const formatLockTime = (lockTime: Date): string => {
  const easternTime = toZonedTime(lockTime, EASTERN_TIME_ZONE);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: EASTERN_TIME_ZONE,
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  
  return formatter.format(easternTime);
};

/**
 * Check if the current time is before the lock time (in Eastern Time)
 * @param lockTime The lock time to check against
 * @returns boolean indicating if submissions are still allowed
 */
export const isBeforeLockTime = (lockTime: Date): boolean => {
  const now = new Date();
  return isBefore(now, lockTime);
};