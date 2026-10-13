package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class MyThing(
    @Schema
    @param:JsonProperty("fromMyThingCamel")
    @get:JsonProperty("fromMyThingCamel")
    val fromMyThingCamel: String? = null
)
