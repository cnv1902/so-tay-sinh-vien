import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../services/api';
import type { News } from '../../types/news';

export function useNews() {
  const {
    data: newsList,
    isLoading,
    error,
    refetch,
    isRefetching
  } = useQuery<News[]>({
    queryKey: ['news'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/news`);
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
  const {
    data: newsDetail,
    isLoading,
    error,
  } = useQuery<News>({
    queryKey: ['news', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/news/${id}`);
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
