package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.EXISTING_PROPERTY,
    property = "groupKind",
    visible = true
)
@JsonSubTypes(JsonSubTypes.Type(value = NestedDiscriminatorGroupB::class, name = "NestedDiscriminatorGroupB"), JsonSubTypes.Type(value = NestedDiscriminatorGroupA::class, name = "NestedDiscriminatorGroupA"))
interface NestedDiscriminatorGroup {
    @get:JsonProperty("groupKind", required = true)
    val groupKind: String

    @get:JsonProperty("kind", required = true)
    val kind: String
}
