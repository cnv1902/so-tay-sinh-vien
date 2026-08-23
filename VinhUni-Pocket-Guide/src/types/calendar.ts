export interface CalendarEvent {
  id: number;
  title: string;
  category: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  is_annual: boolean;
  formatted_start_time: string;
  description?: string | null;
}
