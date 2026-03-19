import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute";
import { useAuthStore } from "@/store/auth";

jest.mock("@/lib/cognito", () => ({
  getCurrentSession: jest.fn(),
  getCurrentUserAttributes: jest.fn(),
  getIdToken: jest.fn(),
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
}));

beforeEach(() => {
  useAuthStore.setState({ user: null, loading: false, initialized: false });
});

function renderWithRoutes(initialEntry: string = "/dashboard") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("shows loading spinner when not initialized", () => {
    useAuthStore.setState({ initialized: false });

    renderWithRoutes();

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("renders children when user is authenticated", () => {
    useAuthStore.setState({
      initialized: true,
      user: { email: "test@example.com", name: "Test", sub: "123" },
    });

    renderWithRoutes();

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("redirects to login when user is not authenticated", () => {
    useAuthStore.setState({ initialized: true, user: null });

    renderWithRoutes();

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });
});
