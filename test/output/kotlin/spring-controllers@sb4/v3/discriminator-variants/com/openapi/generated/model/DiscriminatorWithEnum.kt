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
@JsonSubTypes(JsonSubTypes.Type(value = DiscriminatorWithEnumAlpha::class, name = "alpha"), JsonSubTypes.Type(value = DiscriminatorWithEnumBeta::class, name = "beta"))
interface DiscriminatorWithEnum {
    @get:JsonProperty("kind", required = true)
    val kind: DiscriminatorWithEnumKind

    @get:JsonProperty("alphaValue")
    val alphaValue: String?

    @get:JsonProperty("betaValue")
    val betaValue: String?
}
