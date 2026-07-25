package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class NumEnum(val value: String) {
    @JsonProperty("1.1")
    ("1.1"),

    @JsonProperty("2.2")
    ("2.2"),

    @JsonProperty("3.3")
    ("3.3");

    companion object {
        fun fromValue(value: String): NumEnum? =
            when(value) {
                "1.1" ->
                "2.2" ->
                "3.3" ->
                else -> null
            }
    }
}
