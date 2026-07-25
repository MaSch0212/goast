package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class DiscriminatorWithEnumKind(val value: String) {
    @JsonProperty("alpha")
    ALPHA("alpha"),

    @JsonProperty("beta")
    BETA("beta");

    companion object {
        fun fromValue(value: String): DiscriminatorWithEnumKind? =
            when(value) {
                "alpha" -> ALPHA
                "beta" -> BETA
                else -> null
            }
    }
}
