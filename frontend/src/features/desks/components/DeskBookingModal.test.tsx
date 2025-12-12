import {describe, it, expect, beforeEach, vi} from "vitest";
import userEvent from "@testing-library/user-event";
import {screen, within, fireEvent} from "@testing-library/react";
import {renderWithProviders} from "@/test-utils/renderWithProviders";
import {DeskBookingModal} from "./DeskBookingModal";
import type {Desk} from "@/features/desks/api/desks";

const mutateAsyncSpy = vi.fn();

vi.mock("@/features/desks/api/deskBookings", () => {
  return {
    useDeskAvailabilityQuery: () => ({
      data: [
        {
          startAt: "2025-12-12T09:00:00",
          endAt: "2025-12-12T10:00:00",
          status: "AVAILABLE",
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
    }),
    useCreateBookingMutation: () => ({
      mutateAsync: mutateAsyncSpy,
      isPending: false,
    }),
  };
});

const desk: Desk & { id: number } = {
  id: 1,
  name: "Desk A",
  location: "1st Floor",
};

describe("DeskBookingModal", () => {
  beforeEach(() => {
    mutateAsyncSpy.mockReset();
  });

  it("shows recurrence controls when repeat weekly is toggled", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <DeskBookingModal desk={desk} isOpen onClose={() => {
      }} />,
    );

    await screen.findByText(/showing availability 09:00 - 17:00/i);

    const repeatCheckbox = screen.getByLabelText(/repeat weekly/i);
    expect(screen.queryByLabelText(/number of weeks/i)).not.toBeInTheDocument();

    await user.click(repeatCheckbox);

    const weeksInput = screen.getByLabelText(/number of weeks/i);
    expect(weeksInput).toHaveValue(4);

    fireEvent.change(weeksInput, {target: {value: "2"}});
    expect(weeksInput).toHaveValue(2);
  });

  it("submits recurrence payload when repeat weekly is enabled", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <DeskBookingModal desk={desk} isOpen onClose={() => {
      }} />,
    );

    await screen.findByText(/showing availability 09:00 - 17:00/i);

    await user.click(screen.getByLabelText(/repeat weekly/i));

    const weeksInput = screen.getByLabelText(/number of weeks/i);
    fireEvent.change(weeksInput, {target: {value: "3"}});

    const bookButton = await screen.findByRole("button", {name: /^book$/i});
    await user.click(bookButton);

    expect(mutateAsyncSpy).toHaveBeenCalledWith({
      deskId: desk.id,
      startAt: "2025-12-12T09:00:00",
      endAt: "2025-12-12T10:00:00",
      recurrence: {
        type: "WEEKLY",
        occurrences: 2,
      },
    });
  });

  it("shows backend error messages returned from the mutation", async () => {
    const error = new Error("Conflict detected (conflict at 2025-12-19T09:00:00)");
    mutateAsyncSpy.mockRejectedValueOnce(error);

    const user = userEvent.setup();

    renderWithProviders(
      <DeskBookingModal desk={desk} isOpen onClose={() => {
      }} />,
    );

    await screen.findByText(/showing availability 09:00 - 17:00/i);

    const bookButton = await screen.findByRole("button", {name: /^book$/i});
    await user.click(bookButton);

    expect(await screen.findByText(/Could not create booking/i)).toHaveTextContent(
      /Conflict detected/,
    );
  });
});
