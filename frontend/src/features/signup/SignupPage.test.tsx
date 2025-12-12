import {waitFor} from "@testing-library/react";
import {screen} from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import {renderWithProviders} from "@/test-utils/renderWithProviders";
import SignupPage from "./SignupPage";
import {describe, expect, it, vi, beforeEach} from "vitest";
import {http, HttpResponse} from "msw";
import {server} from "@/test-utils/msw/server";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("SignupPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    server.resetHandlers();
  });

  it("submits signup form and redirects to /login on success", async () => {
    const user = userEvent.setup();

    renderWithProviders(<SignupPage/>, {
      initialEntries: ["/signup"],
    });

    const emailInput = screen.getByLabelText(/email/i);
    const nameInput = screen.getByLabelText(/full name/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", {
      name: /sign up/i,
    });

    await user.type(emailInput, "test@example.com");
    await user.type(nameInput, "Test User");
    await user.type(passwordInput, "Password123!");

    await user.click(submitButton);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("shows an error when the backend rejects the signup", async () => {
    const user = userEvent.setup();

    server.use(
      http.post("*/users", () =>
        HttpResponse.json({message: "Email already in use."}, {status: 409}),
      ),
    );

    renderWithProviders(<SignupPage/>, {
      initialEntries: ["/signup"],
    });

    await user.type(screen.getByLabelText(/email/i), "taken@example.com");
    await user.type(screen.getByLabelText(/full name/i), "Duplicate User");
    await user.type(screen.getByLabelText(/password/i), "Password123!");

    await user.click(screen.getByRole("button", {name: /sign up/i}));

    expect(
      await screen.findByText(/email already in use/i),
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
