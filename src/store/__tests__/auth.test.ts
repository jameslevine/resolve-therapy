import { useAuthStore } from "../auth";

jest.mock("@/lib/cognito", () => ({
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  confirmSignUp: jest.fn(),
  resendConfirmationCode: jest.fn(),
  forgotPassword: jest.fn(),
  confirmForgotPassword: jest.fn(),
  changePassword: jest.fn(),
  updateUserAttributes: jest.fn(),
  deleteUser: jest.fn(),
  getCurrentSession: jest.fn(),
  getCurrentUserAttributes: jest.fn(),
  getIdToken: jest.fn(),
}));

const cognito = jest.requireMock("@/lib/cognito");

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: null, loading: false, initialized: false });
});

describe("auth store", () => {
  describe("initialize", () => {
    it("sets user when session exists", async () => {
      cognito.getCurrentSession.mockResolvedValue({});
      cognito.getCurrentUserAttributes.mockResolvedValue({
        email: "test@example.com",
        name: "Test User",
        sub: "user-123",
      });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.initialized).toBe(true);
      expect(state.user).toEqual({
        email: "test@example.com",
        name: "Test User",
        sub: "user-123",
      });
    });

    it("sets user to null when no session", async () => {
      cognito.getCurrentSession.mockResolvedValue(null);

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.initialized).toBe(true);
      expect(state.user).toBeNull();
    });

    it("handles errors gracefully", async () => {
      cognito.getCurrentSession.mockRejectedValue(new Error("Network error"));

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.initialized).toBe(true);
      expect(state.user).toBeNull();
    });
  });

  describe("signIn", () => {
    it("sets user on successful sign in", async () => {
      cognito.signIn.mockResolvedValue({});
      cognito.getCurrentUserAttributes.mockResolvedValue({
        email: "test@example.com",
        name: "Test",
        sub: "user-123",
      });

      await useAuthStore.getState().signIn("test@example.com", "password123");

      const state = useAuthStore.getState();
      expect(state.user).toBeTruthy();
      expect(state.loading).toBe(false);
    });

    it("throws and resets loading on failure", async () => {
      cognito.signIn.mockRejectedValue(new Error("Invalid credentials"));

      await expect(useAuthStore.getState().signIn("test@example.com", "wrong")).rejects.toThrow(
        "Invalid credentials",
      );

      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  describe("signUp", () => {
    it("completes without setting user", async () => {
      cognito.signUp.mockResolvedValue({});

      await useAuthStore.getState().signUp("test@example.com", "password123", "Test User");

      expect(useAuthStore.getState().loading).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe("signOut", () => {
    it("clears user state", () => {
      useAuthStore.setState({
        user: { email: "test@example.com", name: "Test", sub: "123" },
      });

      useAuthStore.getState().signOut();

      expect(useAuthStore.getState().user).toBeNull();
      expect(cognito.signOut).toHaveBeenCalled();
    });
  });

  describe("deleteAccount", () => {
    it("clears user after deletion", async () => {
      useAuthStore.setState({
        user: { email: "test@example.com", name: "Test", sub: "123" },
      });
      cognito.deleteUser.mockResolvedValue({});

      await useAuthStore.getState().deleteAccount();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  describe("updateName", () => {
    it("updates user name", async () => {
      useAuthStore.setState({
        user: { email: "test@example.com", name: "Old Name", sub: "123" },
      });
      cognito.updateUserAttributes.mockResolvedValue({});
      cognito.getCurrentUserAttributes.mockResolvedValue({
        email: "test@example.com",
        name: "New Name",
        sub: "123",
      });

      await useAuthStore.getState().updateName("New Name");

      expect(useAuthStore.getState().user?.name).toBe("New Name");
    });
  });
});
