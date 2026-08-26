import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../services/api';
import type { HandbookDocument } from '../../types/document';

export function useHandbookDocuments(docType?: string) {
  const docTypeParam = docType && docType !== 'all' ? `&doc_type=${docType}` : '';

  const {
    data: documents,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery<HandbookDocument[]>({
    queryKey: ['handbook-documents', docType || 'all'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/admin/documents?status=success${docTypeParam}`);
      if (!res.ok) {
        throw new Error('Không thể tải danh sách tài liệu');
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,  // 5 phút — giữ cache khi chuyển tab
    gcTime: 10 * 60 * 1000,    // 10 phút — không xóa khỏi bộ nhớ
  });

  return {
    documents: documents || [],
    isLoading,
    error,
    refetch,
    isRefetching,
  };
}

export function useHandbookDetail(id: string | number) {
  const {
    data: document,
    isLoading,
    error,
  } = useQuery<HandbookDocument>({
    queryKey: ['handbook-detail', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/admin/documents/${id}`);
      if (!res.ok) {
        throw new Error('Không thể tải nội dung tài liệu');
      }
      return res.json();
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 phút — nội dung toàn văn ít thay đổi
    gcTime: 15 * 60 * 1000,
  });

  return {
    document,
    isLoading,
    error,
  };
}
