package com.openapi.generated.api.client.infrastructure

import com.fasterxml.jackson.annotation.JsonInclude
import tools.jackson.databind.DeserializationFeature
import tools.jackson.databind.ObjectMapper
import tools.jackson.databind.SerializationFeature
import tools.jackson.module.kotlin.jacksonMapperBuilder

object Serializer {
    val jacksonObjectMapper: ObjectMapper = run {
        jacksonMapperBuilder()
            .findAndAddModules()
            .changeDefaultPropertyInclusion { it.withValueInclusion(JsonInclude.Include.NON_ABSENT).withContentInclusion(JsonInclude.Include.NON_ABSENT) }
            .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .build()
    }
}
