import { create } from 'zustand';

interface HandbookStore {
  // Category được chọn khi điều hướng từ màn hình khác
  pendingCategory: string | null;
  setPendingCategory: (cat: string | null) => void;
}

export const useHandbookStore = create<HandbookStore>((set) => ({
  pendingCategory: null,
  setPendingCategory: (cat) => set({ pendingCategory: cat }),
}));
