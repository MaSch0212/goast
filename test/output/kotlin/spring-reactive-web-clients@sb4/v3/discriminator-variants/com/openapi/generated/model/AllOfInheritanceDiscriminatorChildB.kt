package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class AllOfInheritanceDiscriminatorChildB(
    @Schema
    @param:JsonProperty("childBValue")
    @get:JsonProperty("childBValue")
    val childBValue: String? = null,

    @Schema(required = true)
    @param:JsonProperty("kind", required = true)
    @get:JsonProperty("kind", required = true)
    override val kind: String = "AllOfInheritanceDiscriminatorChildB"
) : AllOfInheritanceDiscriminator
