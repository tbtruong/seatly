import {describe, expect, it, vi, beforeEach} from "vitest";
import {screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {renderWithProviders} from "@/test-utils/renderWithProviders";
import LoginPage from "./LoginPage.tsx";
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

describe("LoginPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    server.resetHandlers();
  });

  it("allows filling in the form, submitting, and redirects to the dashboard", async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginPage/>, {
      initialEntries: ["/login"],
    });

    await user.type(
      screen.getByLabelText(/email/i),
      "test@example.com",
    );
    await user.type(
      screen.getByLabelText(/password/i),
      "Password123!",
    );

    await user.click(
      screen.getByRole("button", {name: /log in/i}),
    );

    await screen.findByText(/login successful/i);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
        replace: true,
      });
    });
  });

  it("surfaces an error when the credentials are invalid", async () => {
    const user = userEvent.setup();

    server.use(
      http.post("*/users/login", () =>
        HttpResponse.json(
          {message: "Invalid email or password."},
          {status: 401},
        ),
      ),
    );

    renderWithProviders(<LoginPage/>, {
      initialEntries: ["/login"],
    });

    await user.type(screen.getByLabelText(/email/i), "wrong@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpass!");
    await user.click(screen.getByRole("button", {name: /log in/i}));

    expect(
      await screen.findByText(/invalid email or password/i),
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
