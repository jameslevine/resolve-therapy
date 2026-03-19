import { create } from "zustand";
import {
  signIn as cognitoSignIn,
  signUp as cognitoSignUp,
  signOut as cognitoSignOut,
  confirmSignUp as cognitoConfirmSignUp,
  resendConfirmationCode as cognitoResendCode,
  forgotPassword as cognitoForgotPassword,
  confirmForgotPassword as cognitoConfirmForgotPassword,
  changePassword as cognitoChangePassword,
  updateUserAttributes as cognitoUpdateUserAttributes,
  deleteUser as cognitoDeleteUser,
  getCurrentSession,
  getCurrentUserAttributes,
  getIdToken,
} from "@/lib/cognito";

interface User {
  email: string;
  name: string;
  sub: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  signOut: () => void;
  getToken: () => Promise<string | null>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      const session = await getCurrentSession();
      if (session) {
        const attrs = await getCurrentUserAttributes();
        set({
          user: {
            email: attrs.email || "",
            name: attrs.name || "",
            sub: attrs.sub || "",
          },
          initialized: true,
        });
      } else {
        set({ user: null, initialized: true });
      }
    } catch {
      set({ user: null, initialized: true });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      await cognitoSignIn(email, password);
      const attrs = await getCurrentUserAttributes();
      set({
        user: {
          email: attrs.email || "",
          name: attrs.name || "",
          sub: attrs.sub || "",
        },
        loading: false,
      });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  signUp: async (email, password, name) => {
    set({ loading: true });
    try {
      await cognitoSignUp(email, password, name);
      set({ loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  confirmSignUp: async (email, code) => {
    set({ loading: true });
    try {
      await cognitoConfirmSignUp(email, code);
      set({ loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  resendCode: async (email) => {
    await cognitoResendCode(email);
  },

  forgotPassword: async (email) => {
    set({ loading: true });
    try {
      await cognitoForgotPassword(email);
      set({ loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  confirmForgotPassword: async (email, code, newPassword) => {
    set({ loading: true });
    try {
      await cognitoConfirmForgotPassword(email, code, newPassword);
      set({ loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  signOut: () => {
    cognitoSignOut();
    set({ user: null });
  },

  getToken: () => getIdToken(),

  changePassword: async (oldPassword, newPassword) => {
    set({ loading: true });
    try {
      await cognitoChangePassword(oldPassword, newPassword);
      set({ loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  updateName: async (name) => {
    set({ loading: true });
    try {
      await cognitoUpdateUserAttributes({ name });
      const attrs = await getCurrentUserAttributes();
      set((state) => ({
        user: state.user ? { ...state.user, name: attrs.name || name } : null,
        loading: false,
      }));
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  deleteAccount: async () => {
    set({ loading: true });
    try {
      await cognitoDeleteUser();
      set({ user: null, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },
}));
