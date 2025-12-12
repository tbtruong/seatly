package com.seatly.desk

import jakarta.inject.Singleton
import jakarta.transaction.Transactional
import java.time.LocalDateTime
import java.time.temporal.ChronoUnit

@Singleton
open class DeskManager(
  private val deskRepository: DeskRepository,
  private val bookingRepository: BookingRepository,
) {
  fun createDesk(command: CreateDeskCommand): DeskDto {
    val desk =
      Desk(
        name = command.name,
        location = command.location,
      )

    val savedDesk = deskRepository.save(desk)
    return DeskDto.from(savedDesk)
  }

  fun listDesks(): List<DeskDto> = deskRepository.findAll().map { DeskDto.from(it) }

  fun listDeskAvailability(
    deskId: Long,
    startAt: LocalDateTime,
    endAt: LocalDateTime,
  ): List<AvailabilityDto> {
    require(!endAt.isBefore(startAt)) {
      "endAt must not be before startAt"
    }

    val normalizedRequestedStart = startAt.truncatedTo(ChronoUnit.MINUTES)
    val normalizedRequestedEnd = endAt.truncatedTo(ChronoUnit.MINUTES)

    val windowStart = normalizedRequestedStart.roundDownToHalfHour()
    val windowEnd = normalizedRequestedEnd.roundUpToHalfHour()

    if (!windowStart.isBefore(windowEnd)) {
      return emptyList()
    }

    val bookings =
      bookingRepository.findOverlappingBookings(
        deskId = deskId,
        startAt = windowStart,
        endAt = windowEnd,
      )

    val slots = mutableListOf<AvailabilityDto>()
    var slotStart = windowStart
    val slotMinutes = 30L

    while (slotStart.isBefore(windowEnd)) {
      val slotEnd = slotStart.plusMinutes(slotMinutes)

      val isBooked =
        bookings.any { booking ->
          booking.startAt.isBefore(slotEnd) && booking.endAt.isAfter(slotStart)
        }

      val status =
        if (isBooked) AvailabilityStatus.BOOKED else AvailabilityStatus.AVAILABLE

      slots.add(
        AvailabilityDto(
          startAt = slotStart,
          endAt = slotEnd,
          status = status,
        ),
      )

      slotStart = slotEnd
    }

    return slots
  }

  @Transactional
  open fun createBooking(command: CreateBookingCommand): List<BookingDto> {
    require(command.startAt.isBefore(command.endAt)) {
      "startAt must be before endAt"
    }

    val normalizedStart = command.startAt.truncatedTo(ChronoUnit.MINUTES)
    val normalizedEnd = command.endAt.truncatedTo(ChronoUnit.MINUTES)

    require(normalizedStart.toLocalDate() == normalizedEnd.toLocalDate()) {
      "startAt and endAt must be on the same day"
    }

    val slots = buildSlots(normalizedStart, normalizedEnd, command.recurrence)

    slots.forEach { slot ->
      if (bookingRepository.existsOverlappingBooking(command.deskId, slot.startAt, slot.endAt)) {
        throw ConflictException(
          conflictAt = slot.startAt,
          message = "Desk is already booked for the given time range",
        )
      }
    }

    val savedBookings =
      slots.map { slot ->
        bookingRepository.save(
          Booking(
            deskId = command.deskId,
            userId = command.userId,
            startAt = slot.startAt,
            endAt = slot.endAt,
          ),
        )
      }

    return savedBookings.map { BookingDto.from(it) }
  }

  private fun buildSlots(
    startAt: LocalDateTime,
    endAt: LocalDateTime,
    recurrence: RecurrenceCommand?,
  ): List<BookingSlot> {
    val additionalWeeks =
      when (recurrence?.type ?: RecurrenceType.NONE) {
        RecurrenceType.NONE -> 0
        RecurrenceType.WEEKLY -> (recurrence?.occurrences ?: 0)
      }

    require(additionalWeeks in 0..3) {
      "Recurrence can extend up to 4 total weeks"
    }

    return (0..additionalWeeks).map { offset ->
      BookingSlot(
        startAt = startAt.plusWeeks(offset.toLong()),
        endAt = endAt.plusWeeks(offset.toLong()),
      )
    }
  }
}

private fun LocalDateTime.roundDownToHalfHour(): LocalDateTime {
  val minute = if (this.minute < 30) 0 else 30
  return this
    .withMinute(minute)
    .withSecond(0)
    .withNano(0)
}

private fun LocalDateTime.roundUpToHalfHour(): LocalDateTime {
  val needsIncrement = this.minute % 30 != 0 || this.second != 0 || this.nano != 0
  val base =
    if (needsIncrement) this.plusMinutes(30 - (this.minute % 30).toLong()) else this
  val minute = if (base.minute < 30) 0 else 30
  return base
    .withMinute(minute)
    .withSecond(0)
    .withNano(0)
}

data class CreateDeskCommand(
  val name: String,
  val location: String?,
)

data class DeskDto(
  val id: Long,
  val name: String,
  val location: String?,
) {
  companion object {
    fun from(desk: Desk): DeskDto =
      DeskDto(
        id = desk.id!!,
        name = desk.name,
        location = desk.location,
      )
  }
}

data class AvailabilityDto(
  val startAt: LocalDateTime,
  val endAt: LocalDateTime,
  val status: AvailabilityStatus,
)

data class CreateBookingCommand(
  val deskId: Long,
  val userId: Long,
  val startAt: LocalDateTime,
  val endAt: LocalDateTime,
  val recurrence: RecurrenceCommand? = null,
)

data class BookingDto(
  val id: Long,
  val deskId: Long,
  val userId: Long,
  val startAt: LocalDateTime,
  val endAt: LocalDateTime,
) {
  companion object {
    fun from(booking: Booking): BookingDto =
      BookingDto(
        id = booking.id!!,
        deskId = booking.deskId,
        userId = booking.userId,
        startAt = booking.startAt,
        endAt = booking.endAt,
      )
  }
}

data class RecurrenceCommand(
  val type: RecurrenceType,
  val occurrences: Int,
)

enum class RecurrenceType {
  NONE,
  WEEKLY,
}

private data class BookingSlot(
  val startAt: LocalDateTime,
  val endAt: LocalDateTime,
)
