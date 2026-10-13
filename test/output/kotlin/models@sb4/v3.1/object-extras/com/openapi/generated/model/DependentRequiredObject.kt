package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

data class DependentRequiredObject(
    @Schema
    @param:JsonProperty("creditCard")
    @get:JsonProperty("creditCard")
    val creditCard: String? = null,

    @Schema
    @param:JsonProperty("billingAddress")
    @get:JsonProperty("billingAddress")
    val billingAddress: String? = null
)
