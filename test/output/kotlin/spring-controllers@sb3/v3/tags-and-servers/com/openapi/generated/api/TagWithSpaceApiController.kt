package com.openapi.generated.api

import jakarta.annotation.Generated
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
@Controller
@RequestMapping("\${openapi.tagWithSpace.base-path:https://api.example.com/v1}")
class TagWithSpaceApiController(
    @Autowired(required = false)
    delegate: TagWithSpaceApiDelegate?,

    @Autowired(required = false)
    private val exceptionHandler: ApiExceptionHandler?
) : TagWithSpaceApi {
    private val delegate = delegate ?: object : TagWithSpaceApiDelegate {}

    override fun getDelegate(): TagWithSpaceApiDelegate = delegate

    override fun getExceptionHandler(): ApiExceptionHandler? = exceptionHandler
}
