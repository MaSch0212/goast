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
@JsonSubTypes(JsonSubTypes.Type(value = AllOfInheritanceDiscriminatorChildA::class, name = "AllOfInheritanceDiscriminatorChildA"), JsonSubTypes.Type(value = AllOfInheritanceDiscriminatorChildB::class, name = "AllOfInheritanceDiscriminatorChildB"))
interface AllOfInheritanceDiscriminator {
    @get:JsonProperty("kind", required = true)
    val kind: String
}
