import { create } from 'zustand';

export type Destination = {
  name: string;
  latitude: number;
  longitude: number;
};

interface NavigationState {
  destination: Destination | null;
  setDestination: (dest: Destination | null) => void;
  clearDestination: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  destination: null,
  setDestination: (dest) => set({ destination: dest }),
  clearDestination: () => set({ destination: null }),
}));
