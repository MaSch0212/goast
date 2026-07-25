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
@JsonSubTypes(JsonSubTypes.Type(value = PartialMappingThird::class, name = "PartialMappingThird"), JsonSubTypes.Type(value = PartialMappingFirst::class, name = "first"), JsonSubTypes.Type(value = PartialMappingSecond::class, name = "second"))
interface PartialMapping {
    @get:JsonProperty("kind", required = true)
    val kind: String

    @get:JsonProperty("firstValue")
    val firstValue: String?

    @get:JsonProperty("secondValue")
    val secondValue: String?

    @get:JsonProperty("thirdValue")
    val thirdValue: String?
}
