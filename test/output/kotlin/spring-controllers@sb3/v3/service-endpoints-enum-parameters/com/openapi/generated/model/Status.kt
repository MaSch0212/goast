package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class Status(val value: String) {
    @JsonProperty("open")
    OPEN("open"),

    @JsonProperty("in-progress")
    IN_PROGRESS("in-progress"),

    @JsonProperty("closed")
    CLOSED("closed");

    companion object {
        fun fromValue(value: String): Status? =
            when(value) {
                "open" -> OPEN
                "in-progress" -> IN_PROGRESS
                "closed" -> CLOSED
                else -> null
            }
    }
}
