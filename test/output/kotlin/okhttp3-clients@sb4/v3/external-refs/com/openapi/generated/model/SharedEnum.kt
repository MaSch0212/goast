package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class SharedEnum(val value: String) {
    @JsonProperty("FIRST")
    FIRST("FIRST"),

    @JsonProperty("SECOND")
    SECOND("SECOND"),

    @JsonProperty("THIRD")
    THIRD("THIRD");

    companion object {
        fun fromValue(value: String): SharedEnum? =
            when(value) {
                "FIRST" -> FIRST
                "SECOND" -> SECOND
                "THIRD" -> THIRD
                else -> null
            }
    }
}
