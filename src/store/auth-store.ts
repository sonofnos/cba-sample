import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthTokenPayload, AuthUser } from "@/lib/types";

export const AUTH_TOKEN_STORAGE_KEY = "panafrika-auth-token";

type AuthFlow = "login" | "register";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  pendingUser: AuthUser | null;
  pendingFlow: AuthFlow | null;
  beginAuth: (user: AuthUser, flow: AuthFlow) => void;
  completeAuth: () => void;
  logout: () => void;
  clearPending: () => void;
}

function persistToken(user: AuthUser | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    return;
  }

  const token: AuthTokenPayload = {
    role: user.role,
    userId: user.userId,
    name: user.name,
    market: user.market,
    currency: user.currency,
  };

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, JSON.stringify(token));
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      pendingUser: null,
      pendingFlow: null,
      beginAuth: (user, flow) =>
        set({
          pendingUser: user,
          pendingFlow: flow,
        }),
      completeAuth: () => {
        const pendingUser = get().pendingUser;
        if (!pendingUser) {
          return;
        }

        persistToken(pendingUser);
        set({
          user: pendingUser,
          isAuthenticated: true,
          pendingUser: null,
          pendingFlow: null,
        });
      },
      logout: () => {
        persistToken(null);
        set({
          user: null,
          isAuthenticated: false,
          pendingUser: null,
          pendingFlow: null,
        });
      },
      clearPending: () =>
        set({
          pendingUser: null,
          pendingFlow: null,
        }),
    }),
    {
      name: "panafrika-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.user && state.isAuthenticated) {
          persistToken(state.user);
        }
      },
    },
  ),
);
