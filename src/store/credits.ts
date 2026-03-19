import { create } from "zustand";
import { apiFetch } from "@/lib/api";

interface CreditsState {
  balance: number;
  loading: boolean;
  fetchBalance: (userId: string) => Promise<void>;
}

export const useCreditsStore = create<CreditsState>((set) => ({
  balance: 0,
  loading: false,

  fetchBalance: async (userId: string) => {
    set({ loading: true });
    try {
      const res = await apiFetch(`/checkout/balance?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        set({ balance: data.balance || 0, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },
}));
