import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../services/api';
import type { CalendarEvent } from '../../types/calendar';

export function useCalendarData(month: number, year: number) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE_URL}/api/admin/calendar`, {
        params: { month, year }
      });
      // Sort events by start_time
      const sortedEvents = (res.data || []).sort((a: CalendarEvent, b: CalendarEvent) => {
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      });
      setEvents(sortedEvents);
    } catch (err: any) {
      console.error('Lỗi khi tải lịch sự kiện:', err);
      setError(err.message || 'Không thể tải lịch sự kiện');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}
