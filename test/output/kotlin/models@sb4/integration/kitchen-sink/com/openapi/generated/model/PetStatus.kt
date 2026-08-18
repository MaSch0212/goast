package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class PetStatus(val value: String) {
    @JsonProperty("available")
    AVAILABLE("available"),

    @JsonProperty("pending")
    PENDING("pending"),

    @JsonProperty("sold")
    SOLD("sold");

    companion object {
        fun fromValue(value: String): PetStatus? =
            when(value) {
                "available" -> AVAILABLE
                "pending" -> PENDING
                "sold" -> SOLD
                else -> null
            }
    }
}
