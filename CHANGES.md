## Recurring Bookings – Summary of Changes

### Design Mindset 
- Added immutable created_at/updated_at fields plus a (desk_id, start_at) unique constraint so we can both analyze peak usage later, including metrics on which rooms/time blocks are most popular (fueling future tiered or surge pricing) and defend against double-booking races today.
- Wrapped recurrence in a RecurrenceType enum/command structure and capped it at four weeks, making it easy to add new cadences or pricing tiers without another breaking API change.
- Introduced dropdown to keep user input sanitized and keep recurrence strictly within the supported bounds.
- Updated the API client and modal to surface structured conflict errors, so users immediately know which week failed when the backend rejects part of a series.
- Enforced transactional atomicity for the entire recurring series—checking all slots for conflicts before persisting any—to ensure users never end up with a confusing 'partial' booking state (e.g., successfully booked for weeks 1 & 3, but missing week 2).


## Booking API (Breaking Change)

`POST /desks/{deskId}/bookings` now returns a **list** of created bookings so that an entire recurring series is created atomically. All consumers must expect the response shape below:

```json
{
  "bookings": [
    {
      "id": 123,
      "deskId": 5,
      "userId": 42,
      "startAt": "2025-01-06T09:00:00",
      "endAt": "2025-01-06T17:00:00"
    }
  ]
}
```

### Request payload

```json
{
  "startAt": "2025-01-06T09:00:00",
  "endAt": "2025-01-06T17:00:00",
  "recurrence": {
    "type": "WEEKLY",
    "occurrences": 2
  }
}
```

- `recurrence` is optional. Omit it (or keep `occurrences: 0`) for a single booking.
- Only `type: "WEEKLY"` is supported today. `occurrences` is the number of **additional** weeks (0–3) so the total span is capped at four weeks.
- Conflicts return HTTP `409` with `{ "message": "...", "conflictAt": "..." }`.


### Backend highlights
- **Audit + uniqueness for metrics & safety:** Added Flyway migrations so the `booking` table now stores `created_at`/`updated_at` timestamps and enforces a `(desk_id, start_at)` unique constraint. These timestamps give us durable audit data for future logging/metrics, while the constraint backs up the in-app overlap check to prevent race-condition double bookings. *(We still have a TODO to evolve this into a full “prevent overlapping intervals” constraint when we support more complex recurrences.)*
- **Future-proof recurrence contract:** `RecurrenceType`, `RecurrenceRequest`, and `RecurrenceCommand` were introduced even though only `WEEKLY` is supported today. That keeps the transport layer ready for monthly/other patterns without another breaking change, and we cap occurrences to four total weeks per the product requirement.
- **Graceful error handling:** `DeskController.createBooking` now returns a `BookingListResponse`, logs structured `booking_success`/`booking_conflict` events, and maps conflicts/validation errors into clear 409 or 400 bodies with `message` plus optional `conflictAt`. `DeskManager.createBooking` became transactional, builds all weekly slots up front, checks every slot for conflicts, and only persists when all are clear—so the entire series succeeds or fails atomically.

### Frontend highlights
- **Complete recurring UI:** `DeskBookingModal` exposes the “Repeat weekly” toggle with a dropdown (replacing the buggy number input) to select 1–4 weeks. If the control is unchecked or left at “1”, the modal naturally falls back to a single booking, so existing users aren’t forced into recurrence flows.
- **Network + UX updates:** The desk bookings API client now sends the recurrence payload and parses structured 409 responses so the modal shows “Could not create booking … conflict at YYYY-MM-DD” when the backend rejects a slot. This aligns the UI with the backend’s atomic-series behavior.
- **Tests added (and why):**
  1. `DeskBookingModal.test.tsx` now uses MSW to drive the real fetch stack, ensuring recurrence payloads and conflict errors round-trip correctly. This also gives us confidence if we extend recurrence types later.
  2. `LoginPage.test.tsx` and `SignupPage.test.tsx` gained failure-path tests that simulate backend 401/409 responses, proving the pages surface server errors to the user instead of silently navigating away.

### Notes for future work
- The repository still issues one overlap query per slot. There’s a TODO near `BookingRepository.existsOverlappingBooking` to consolidate this via a broader range query/exclusion constraint once we revisit “prevent overlapping intervals.”
- Audit timestamps currently never change after insert (bookings are immutable today), which is acceptable. If we ever introduce editing, we’ll reuse `updated_at` instantly without another migration.

Overall, both backend and frontend now support weekly recurring bookings end-to-end, enforce the same conflict rules as single bookings, and emit enough telemetry/log context for future observability work.
