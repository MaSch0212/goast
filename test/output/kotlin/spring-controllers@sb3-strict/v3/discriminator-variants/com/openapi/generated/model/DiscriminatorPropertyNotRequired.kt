package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.EXISTING_PROPERTY,
    property = "kind",
    visible = true
)
@JsonSubTypes(JsonSubTypes.Type(value = DiscriminatorPropertyNotRequiredB::class, name = "DiscriminatorPropertyNotRequiredB"), JsonSubTypes.Type(value = DiscriminatorPropertyNotRequiredA::class, name = "DiscriminatorPropertyNotRequiredA"))
interface DiscriminatorPropertyNotRequired {
    @get:JsonProperty("kind")
    val kind: String?

    @get:JsonProperty("aValue")
    val aValue: String?

    @get:JsonProperty("bValue")
    val bValue: String?
}
