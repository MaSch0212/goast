package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class Permission(val value: String) {
    @JsonProperty("read")
    READ("read"),

    @JsonProperty("write")
    WRITE("write"),

    @JsonProperty("delete")
    DELETE("delete");

    companion object {
        fun fromValue(value: String): Permission? =
            when(value) {
                "read" -> READ
                "write" -> WRITE
                "delete" -> DELETE
                else -> null
            }
    }
}
