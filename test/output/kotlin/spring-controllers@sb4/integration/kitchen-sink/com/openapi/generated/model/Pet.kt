package com.openapi.generated.model

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid
import java.time.LocalDate
import java.time.OffsetDateTime

data class Pet(
    @Schema(required = true)
    @param:JsonProperty("id", required = true)
    @get:JsonProperty("id", required = true)
    val id: String,

    @Schema(required = true)
    @param:JsonProperty("name", required = true)
    @get:JsonProperty("name", required = true)
    val name: String,

    @Schema
    @param:JsonProperty("nickname")
    @get:JsonProperty("nickname")
    val nickname: String? = null,

    @Schema
    @param:JsonProperty("age")
    @get:JsonProperty("age")
    val age: Int? = null,

    @field:Valid
    @Schema
    @param:JsonProperty("status")
    @get:JsonProperty("status")
    val status: PetStatus? = null,

    @Schema
    @param:JsonProperty("birthDate")
    @get:JsonProperty("birthDate")
    val birthDate: LocalDate? = null,

    @Schema
    @param:JsonProperty("createdAt")
    @get:JsonProperty("createdAt")
    val createdAt: OffsetDateTime? = null,

    @Schema
    @param:JsonProperty("photo")
    @get:JsonProperty("photo")
    val photo: String? = null,

    @field:Valid
    @Schema
    @param:JsonProperty("owner")
    @get:JsonProperty("owner")
    val owner: Owner? = null,

    @field:Valid
    @Schema
    @param:JsonProperty("friend")
    @get:JsonProperty("friend")
    val friend: Pet? = null,

    @Schema
    @param:JsonProperty("toys")
    @get:JsonProperty("toys")
    val toys: List<Toy>? = null
)
