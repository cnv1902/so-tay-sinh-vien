export interface HandbookDocument {
  id: number;
  filename: string;
  year?: number | null;
  doc_type?: string | null;
  status: string;
  full_content?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HandbookCategory {
  id: string;
  label: string;
  icon: string;
}

export const HANDBOOK_CATEGORIES: HandbookCategory[] = [
  { id: 'all', label: 'Tất cả', icon: 'apps-outline' },
  { id: 'de_an', label: 'Đề án tuyển sinh', icon: 'document-text-outline' },
  { id: 'quy_che', label: 'Quy chế', icon: 'shield-checkmark-outline' },
  { id: 'diem_chuan', label: 'Điểm chuẩn', icon: 'stats-chart-outline' },
  { id: 'huong_dan', label: 'Hướng dẫn', icon: 'compass-outline' },
  { id: 'hoc_phi', label: 'Học phí', icon: 'cash-outline' },
  { id: 'doi_song', label: 'Đời sống SV', icon: 'people-outline' },
  { id: 'co_so_vat_chat', label: 'Cơ sở vật chất', icon: 'business-outline' },
  { id: 'thanh_tich', label: 'Thành tích', icon: 'trophy-outline' },
  { id: 'gioi_thieu', label: 'Giới thiệu', icon: 'information-circle-outline' },
  { id: 'lich_su', label: 'Lịch sử', icon: 'time-outline' },
  { id: 'khac', label: 'Khác', icon: 'folder-outline' },
];
