
import { format, differenceInDays, parseISO, startOfDay } from 'date-fns';

export interface DateHelpers {
  getTodayString: () => string;
  isDueToday: (dueDate: string) => boolean;
  isOverdue: (dueDate: string) => boolean;
  getDaysUntil: (targetDate: string) => number;
  formatDateInTimezone: (date: string | Date, formatString?: string) => string;
}

export function createDateHelpers(timezone: string | null): DateHelpers {
  const getDateInTimezone = (date?: Date): Date => {
    const targetDate = date || new Date();
    if (!timezone) return targetDate;

    try {
      // Create a date string in the user's timezone
      const timezonedString = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(targetDate);
      
      return parseISO(timezonedString);
    } catch (error) {
      console.warn('Invalid timezone, falling back to local time:', error);
      return targetDate;
    }
  };

  const getTodayString = (): string => {
    const today = getDateInTimezone();
    return format(today, 'yyyy-MM-dd');
  };

  const isDueToday = (dueDate: string): boolean => {
    const today = getTodayString();
    return dueDate === today;
  };

  const isOverdue = (dueDate: string): boolean => {
    const today = getTodayString();
    return dueDate < today;
  };

  const getDaysUntil = (targetDate: string): number => {
    const today = startOfDay(getDateInTimezone());
    const target = startOfDay(parseISO(targetDate));
    return differenceInDays(target, today);
  };

  const formatDateInTimezone = (date: string | Date, formatString = 'MMM dd, yyyy'): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatString);
  };

  return {
    getTodayString,
    isDueToday,
    isOverdue,
    getDaysUntil,
    formatDateInTimezone,
  };
}

// Hook version for easy use in components
export function useDateHelpers(timezone: string | null) {
  return createDateHelpers(timezone);
}
