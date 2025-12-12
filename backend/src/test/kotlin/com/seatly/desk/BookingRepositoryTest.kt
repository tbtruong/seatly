package com.seatly.desk

import com.seatly.user.User
import com.seatly.user.UserRepository
import io.micronaut.test.extensions.junit5.annotation.MicronautTest
import jakarta.inject.Inject
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceException
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.LocalDateTime

@MicronautTest
class BookingRepositoryTest {

  @Inject
  lateinit var bookingRepository: BookingRepository

  @Inject
  lateinit var deskRepository: DeskRepository

  @Inject
  lateinit var userRepository: UserRepository

  @Inject
  lateinit var entityManager: EntityManager

  private lateinit var user: User
  private lateinit var desk: Desk

  @BeforeEach
  fun setup() {
    bookingRepository.deleteAll()
    deskRepository.deleteAll()
    userRepository.deleteAll()

    user =
      userRepository.save(
        User(
          email = "booking-test@example.com",
          passwordHash = "password",
          fullName = "Booking Test User",
        ),
      )

    desk =
      deskRepository.save(
        Desk(
          name = "Desk A",
          location = "Test Floor",
        ),
      )
  }

  @Test
  fun `should populate audit fields when booking is created`() {
    val start = LocalDateTime.now().plusDays(1).withHour(9).withMinute(0).withSecond(0).withNano(0)
    val end = start.plusHours(1)

    val saved =
      bookingRepository.save(
        Booking(
          deskId = desk.id!!,
          userId = user.id!!,
          startAt = start,
          endAt = end,
        ),
      )

    assertNotNull(saved.createdAt, "createdAt should be set")
    assertNotNull(saved.updatedAt, "updatedAt should be set")
  }

  @Test
  fun `should enforce unique start time per desk`() {
    val start = LocalDateTime.now().plusDays(2).withHour(10).withMinute(0).withSecond(0).withNano(0)
    val end = start.plusHours(1)

    bookingRepository.save(
      Booking(
        deskId = desk.id!!,
        userId = user.id!!,
        startAt = start,
        endAt = end,
      ),
    )

    assertThrows(PersistenceException::class.java) {
      bookingRepository.save(
        Booking(
          deskId = desk.id!!,
          userId = user.id!!,
          startAt = start,
          endAt = end.plusMinutes(30),
        ),
      )
      entityManager.flush()
    }
  }
}
