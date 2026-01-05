import { create } from "zustand";
import type { AvailableTrigger, AvailableAction, ZapBuilderAction } from "./types";

interface ZapBuilderStore {
  // State
  selectedTrigger: AvailableTrigger | null;
  triggerMetadata: Record<string, unknown>;
  actions: ZapBuilderAction[];

  // Actions
  setTrigger: (trigger: AvailableTrigger | null) => void;
  setTriggerMetadata: (metadata: Record<string, unknown>) => void;
  addAction: (action: AvailableAction) => void;
  removeAction: (actionId: string) => void;
  updateActionMetadata: (actionId: string, metadata: Record<string, unknown>) => void;
  reorderActions: (fromIndex: number, toIndex: number) => void;
  reset: () => void;
}

const initialState = {
  selectedTrigger: null,
  triggerMetadata: {},
  actions: [],
};

export const useZapBuilderStore = create<ZapBuilderStore>((set) => ({
  ...initialState,

  setTrigger: (trigger) => set({ selectedTrigger: trigger }),

  setTriggerMetadata: (metadata) => set({ triggerMetadata: metadata }),

  addAction: (action) =>
    set((state) => ({
      actions: [
        ...state.actions,
        {
          id: crypto.randomUUID(),
          availableAction: action,
          actionMetadata: {},
        },
      ],
    })),

  removeAction: (actionId) =>
    set((state) => ({
      actions: state.actions.filter((a) => a.id !== actionId),
    })),

  updateActionMetadata: (actionId, metadata) =>
    set((state) => ({
      actions: state.actions.map((a) =>
        a.id === actionId ? { ...a, actionMetadata: metadata } : a
      ),
    })),

  reorderActions: (fromIndex, toIndex) =>
    set((state) => {
      const newActions = [...state.actions];
      const [removed] = newActions.splice(fromIndex, 1);
      newActions.splice(toIndex, 0, removed);
      return { actions: newActions };
    }),

  reset: () => set(initialState),
}));

// Auth store
interface AuthStore {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  isAuthenticated: typeof window !== "undefined" ? !!localStorage.getItem("token") : false,

  setToken: (token) => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
    set({ token, isAuthenticated: !!token });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, isAuthenticated: false });
  },
}));
