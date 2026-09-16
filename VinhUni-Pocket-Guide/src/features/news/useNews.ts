import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../services/api';
import type { News } from '../../types/news';

export function useNews() {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || 'vi').substring(0, 2);

  const {
    data: newsList,
    isLoading,
    error,
    refetch,
    isRefetching
  } = useQuery<News[]>({
    queryKey: ['news', currentLang],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/news?lang=${currentLang}`);
      if (!response.ok) {
        throw new Error('Không thể tải tin tức');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    newsList,
    isLoading,
    error,
    refetch,
    isRefetching
  };
}

export function useNewsDetail(id: string) {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || 'vi').substring(0, 2);

  const {
    data: newsDetail,
    isLoading,
    error,
  } = useQuery<News>({
    queryKey: ['news', id, currentLang],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/news/${id}?lang=${currentLang}`);
      if (!response.ok) {
        throw new Error('Không thể tải bài viết');
      }
      return response.json();
    },
    enabled: !!id,
  });

  return {
    newsDetail,
    isLoading,
    error,
  };
}
