# Prompt for ChatGPT Codex / AI Developer

**Role:** You are a Senior Kotlin & React Developer working on a booking system.
**Task:** Implement "Recurring Bookings" for the Seatly application.
**Tech Stack:** 
- Backend: Kotlin, Micronaut Data (JPA/Hibernate), Postgres
- Frontend: React, TypeScript, TanStack Query

## Context
We need to allow users to book a desk for multiple weeks at once (e.g., "Every Monday for 4 weeks").
Crucially, we must ensure **Data Integrity** (no double bookings) and **Atomicity** (all weeks booked or none).

## 1. Backend Implementation (Kotlin)

### A. Database Constraints (CRITICAL)
In `backend/src/main/kotlin/com/seatly/desk/BookingRepository.kt`:
1.  Update the `Booking` entity to include a **Unique Constraint** on `desk_id` + `start_at`.
    ```kotlin
    @Table(
        name = "booking",
        uniqueConstraints = [UniqueConstraint(columnNames = ["desk_id", "start_at"])]
    )
    ```
2.  Add a `RecurrenceType` enum (NONE, WEEKLY) to the Entity if needed, or just handle logic in the manager.

### B. Controller Changes
In `backend/src/main/kotlin/com/seatly/desk/DeskController.kt`:
1.  Update `CreateBookingRequest` to accept:
    - `recurrence: String?` (VIDEO, WEEKLY - default NONE)
    - `occurrences: Int?` (Default 1, Max 12)
2.  Update the `createBooking` endpoint:
    - It must now return a `List<BookingResponse>` (wrap the result in strict JSON if needed, or just a list).
    - **Catch `ConflictException`** and return HTTP 409 (Conflict).
    - The 409 response body must be structured: `{ "message": "...", "conflictAt": "2024-01-01T10:00:00" }`.

### C. Domain Logic & Transactionality
In `backend/src/main/kotlin/com/seatly/desk/DeskManager.kt`:
1.  Update `createBooking` to handle the loop for `occurrences`.
2.  **Logic**:
    - Calculate the specific `startAt`/`endAt` for each week (plus 7 days * i).
    - Validate ALL start/end times are on the same calendar day (no spanning midnight).
    - Check for overlaps for ALL calculated slots *before* saving.
    - If any specific slot overlaps, throw `ConflictException` immediately with the specific date.
    - If all clear, save **ALL** bookings in a single batch.
3.  **Transaction**: Annotate the method (or class) with `@Transactional`. If the DB constraint hits (race condition), the transaction must roll back everything.

### D. New Exceptions
Create `ConflictException.kt` that extends `RuntimeException` and holds the `conflictAt: LocalDateTime`.

---

## 2. Frontend Implementation (React/TypeScript)

### A. API Client
In `frontend/src/features/desks/api/deskBookings.ts`:
1.  Update `CreateBookingInput` to include `recurrence` and `occurrences`.
2.  Update the error handling in `createBooking` to parse the 409 response.
    - If `conflictAt` is present, format it nicely for the error message.

### B. UI Changes (Modal)
In `DeskBookingModal.tsx` (or equivalent):
1.  Add a "Repeat Weekly?" toggle.
2.  If toggled, show a number input for "Weeks" (min 1, max 12, default 4).
3.  Pass these values to the mutation.
4.  Handle the error: If the mutation fails with "Conflict on [Date]", display that specifically to the user so they know which week failed.

## Summary of Goals
- **No partial bookings:** If week 3 clashes, weeks 1, 2, and 4 must NOT be saved.
- **Race-Condition Proof:** The DB constraint is the final guard.
- **User Feedback:** Tell them exactly which date caused the failure.

Please implement these changes now, modifying the existing files provided in context.
