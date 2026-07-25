package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

/**
 * The measured skill for hunting
 */
enum class Schema9(val value: String) {
    @JsonProperty("clueless")
    CLUELESS("clueless"),

    @JsonProperty("lazy")
    LAZY("lazy"),

    @JsonProperty("adventurous")
    ADVENTUROUS("adventurous"),

    @JsonProperty("aggressive")
    AGGRESSIVE("aggressive");

    companion object {
        fun fromValue(value: String): Schema9? =
            when(value) {
                "clueless" -> CLUELESS
                "lazy" -> LAZY
                "adventurous" -> ADVENTUROUS
                "aggressive" -> AGGRESSIVE
                else -> null
            }
    }
}
