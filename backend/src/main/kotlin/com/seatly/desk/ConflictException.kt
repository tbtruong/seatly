package com.seatly.desk

import java.time.LocalDateTime

class ConflictException(
  val conflictAt: LocalDateTime? = null,
  message: String = "Conflict detected",
  cause: Throwable? = null,
) : RuntimeException(message, cause)
