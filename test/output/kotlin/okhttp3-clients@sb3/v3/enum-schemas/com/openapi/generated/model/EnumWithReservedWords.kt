package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty

enum class EnumWithReservedWords(val value: String) {
    @JsonProperty("class")
    CLASS("class"),

    @JsonProperty("object")
    OBJECT("object"),

    @JsonProperty("null")
    NULL("null"),

    @JsonProperty("true")
    TRUE("true"),

    @JsonProperty("return")
    RETURN("return");

    companion object {
        fun fromValue(value: String): EnumWithReservedWords? =
            when(value) {
                "class" -> CLASS
                "object" -> OBJECT
                "null" -> NULL
                "true" -> TRUE
                "return" -> RETURN
                else -> null
            }
    }
}
