ALTER TABLE booking
    ADD CONSTRAINT booking_desk_start_unique
        UNIQUE (desk_id, start_at);
