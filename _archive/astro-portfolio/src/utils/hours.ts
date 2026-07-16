import type { DayKey, OpeningHour } from '../types/site-config';

/** schema.org expects English day-of-week tokens regardless of site language */
const dayKeyToSchemaDays: Record<DayKey, string[]> = {
  mon: ['Monday'],
  tue: ['Tuesday'],
  wed: ['Wednesday'],
  thu: ['Thursday'],
  fri: ['Friday'],
  mon_tue: ['Monday', 'Tuesday'],
  mon_fri: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  tue_thu: ['Tuesday', 'Wednesday', 'Thursday'],
  tue_sun: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  wed_thu: ['Wednesday', 'Thursday'],
  fri_sat: ['Friday', 'Saturday'],
  sat: ['Saturday'],
  sun: ['Sunday'],
};

export function getSchemaDays(dayKey: DayKey): string[] {
  return dayKeyToSchemaDays[dayKey] ?? [];
}

export function formatOpeningHours(
  t: (key: string) => string,
  hour: OpeningHour
): { label: string; value: string } {
  return {
    label: t(`days.${hour.dayKey}`),
    value: hour.hours ?? t('days.closed'),
  };
}
