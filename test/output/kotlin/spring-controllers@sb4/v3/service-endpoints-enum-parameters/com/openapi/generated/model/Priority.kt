package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class Priority(val value: String) {
    @JsonProperty("low")
    LOW("low"),

    @JsonProperty("medium")
    MEDIUM("medium"),

    @JsonProperty("high")
    HIGH("high");

    companion object {
        fun fromValue(value: String): Priority? =
            when(value) {
                "low" -> LOW
                "medium" -> MEDIUM
                "high" -> HIGH
                else -> null
            }
    }
}
