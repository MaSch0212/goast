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
@JsonSubTypes(JsonSubTypes.Type(value = ImplicitCat::class, name = "ImplicitCat"), JsonSubTypes.Type(value = ImplicitDog::class, name = "ImplicitDog"))
interface ImplicitBase {
    @get:JsonProperty("petType", required = true)
    val petType: String
}
