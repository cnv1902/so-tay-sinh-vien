import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PersonalEmergencyContact {
  name: string;
  phone: string;
  relationship?: string;
}

interface PersonalEmergencyState {
  contact: PersonalEmergencyContact | null;
  setContact: (contact: PersonalEmergencyContact) => void;
  clearContact: () => void;
}

export const usePersonalEmergencyStore = create<PersonalEmergencyState>()(
  persist(
    (set) => ({
      contact: null,
      setContact: (contact) => set({ contact }),
      clearContact: () => set({ contact: null }),
    }),
    {
      name: '@vinhuni_personal_sos_contact',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
