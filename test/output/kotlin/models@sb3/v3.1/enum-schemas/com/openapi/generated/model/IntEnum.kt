package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class IntEnum(val value: String) {
    @JsonProperty("1")
    _1("1"),

    @JsonProperty("2")
    _2("2"),

    @JsonProperty("3")
    _3("3");

    companion object {
        fun fromValue(value: String): IntEnum? =
            when(value) {
                "1" -> _1
                "2" -> _2
                "3" -> _3
                else -> null
            }
    }
}
