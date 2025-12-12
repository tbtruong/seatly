import {describe, it, expect, beforeEach} from "vitest";
import userEvent from "@testing-library/user-event";
import {fireEvent, screen, waitFor} from "@testing-library/react";
import {http, HttpResponse} from "msw";
import {renderWithProviders} from "@/test-utils/renderWithProviders";
import {DeskBookingModal} from "./DeskBookingModal";
import type {Desk} from "@/features/desks/api/desks";
import {server} from "@/test-utils/msw/server";

const desk: Desk & { id: number } = {
  id: 1,
  name: "Desk A",
  location: "1st Floor",
};

const authStub = {
  user: {
    id: 42,
    email: "tester@example.com",
    fullName: "Test Runner",
  },
  accessToken: "test-token",
};

describe("DeskBookingModal", () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  const mockAvailability = () => {
    server.use(
      http.get("*/desks/:deskId/availability", () =>
        HttpResponse.json(
          [
            {
              startAt: "2025-12-12T09:00:00",
              endAt: "2025-12-12T10:00:00",
              status: "AVAILABLE",
            },
          ],
          {status: 200},
        ),
      ),
    );
  };

  it("shows recurrence controls when repeat weekly is toggled", async () => {
    const user = userEvent.setup();
    mockAvailability();

    renderWithProviders(
      <DeskBookingModal desk={desk} isOpen onClose={() => {
      }} />,
      {initialAuth: authStub},
    );

    await screen.findByText(/showing availability 09:00 - 17:00/i);

    const repeatCheckbox = screen.getByLabelText(/repeat weekly/i);
    expect(screen.queryByLabelText(/number of weeks/i)).not.toBeInTheDocument();

    await user.click(repeatCheckbox);

    const weeksInput = screen.getByLabelText(/number of weeks/i);
    expect(weeksInput).toHaveValue("4");

    fireEvent.change(weeksInput, {target: {value: "2"}});
    expect(weeksInput).toHaveValue("2");
  });

  it("sends recurrence payload to the API when repeat weekly is enabled", async () => {
    const user = userEvent.setup();
    const recordedBodies: unknown[] = [];
    mockAvailability();

    server.use(
      http.post("*/desks/:deskId/bookings", async ({request, params}) => {
        const body = await request.json();
        recordedBodies.push(body);
        return HttpResponse.json(
          {
            bookings: [
              {
                id: 99,
                deskId: Number(params.deskId),
                userId: 1,
                startAt: body.startAt,
                endAt: body.endAt,
              },
            ],
          },
          {status: 201},
        );
      }),
    );

    renderWithProviders(
      <DeskBookingModal desk={desk} isOpen onClose={() => {
      }} />,
      {initialAuth: authStub},
    );

    await screen.findByText(/showing availability 09:00 - 17:00/i);

    await user.click(screen.getByLabelText(/repeat weekly/i));
    const weeksInput = screen.getByLabelText(/number of weeks/i);
    fireEvent.change(weeksInput, {target: {value: "3"}});

    const bookButton = await screen.findByRole("button", {name: /^book$/i});
    await user.click(bookButton);

    await waitFor(() => {
      expect(recordedBodies).toHaveLength(1);
    });

    expect(recordedBodies[0]).toMatchObject({
      startAt: expect.any(String),
      endAt: expect.any(String),
      recurrence: {
        type: "WEEKLY",
        occurrences: 2,
      },
    });
  });

  it("surfaces backend conflict errors", async () => {
    const user = userEvent.setup();
    mockAvailability();

    server.use(
      http.post("*/desks/:deskId/bookings", () =>
        HttpResponse.json(
          {
            message: "Conflict detected",
            conflictAt: "2025-12-19T09:00:00",
          },
          {status: 409},
        ),
      ),
    );

    renderWithProviders(
      <DeskBookingModal desk={desk} isOpen onClose={() => {
      }} />,
      {initialAuth: authStub},
    );

    await screen.findByText(/showing availability 09:00 - 17:00/i);

    const bookButton = await screen.findByRole("button", {name: /^book$/i});
    await user.click(bookButton);

    expect(await screen.findByText(/could not create booking/i)).toHaveTextContent(
      /conflict detected/i,
    );
  });
});
