package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.EXISTING_PROPERTY,
    property = "petType",
    visible = true
)
@JsonSubTypes(JsonSubTypes.Type(value = Dog::class, name = "dog"), JsonSubTypes.Type(value = Cat::class, name = "cat"))
interface Pet {
    @get:JsonProperty("name", required = true)
    val name: String

    @get:JsonProperty("petType", required = true)
    val petType: String
}
