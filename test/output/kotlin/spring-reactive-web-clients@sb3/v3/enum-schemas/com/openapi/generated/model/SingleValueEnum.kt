package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class SingleValueEnum(val value: String) {
    @JsonProperty("only")
    ONLY("only");

    companion object {
        fun fromValue(value: String): SingleValueEnum? =
            when(value) {
                "only" -> ONLY
                else -> null
            }
    }
}
