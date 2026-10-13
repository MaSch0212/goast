package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class ObjectWithInlineEnumStatus(val value: String) {
    @JsonProperty("active")
    ACTIVE("active"),

    @JsonProperty("inactive")
    INACTIVE("inactive");

    companion object {
        fun fromValue(value: String): ObjectWithInlineEnumStatus? =
            when(value) {
                "active" -> ACTIVE
                "inactive" -> INACTIVE
                else -> null
            }
    }
}
