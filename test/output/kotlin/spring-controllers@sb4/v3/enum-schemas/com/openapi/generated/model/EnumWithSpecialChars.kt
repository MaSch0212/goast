package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class EnumWithSpecialChars(val value: String) {
    @JsonProperty("has space")
    HAS_SPACE("has space"),

    @JsonProperty("has-hyphen")
    HAS_HYPHEN("has-hyphen"),

    @JsonProperty("has.dot")
    HAS_DOT("has.dot"),

    @JsonProperty("has/slash")
    HAS_SLASH("has/slash"),

    @JsonProperty("has+plus")
    HAS_PLUS("has+plus");

    companion object {
        fun fromValue(value: String): EnumWithSpecialChars? =
            when(value) {
                "has space" -> HAS_SPACE
                "has-hyphen" -> HAS_HYPHEN
                "has.dot" -> HAS_DOT
                "has/slash" -> HAS_SLASH
                "has+plus" -> HAS_PLUS
                else -> null
            }
    }
}
