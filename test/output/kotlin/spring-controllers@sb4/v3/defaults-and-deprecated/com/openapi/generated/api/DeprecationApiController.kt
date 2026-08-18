package com.openapi.generated.api

import jakarta.annotation.Generated
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
@Controller
@RequestMapping("\${openapi.deprecation.base-path:/}")
class DeprecationApiController(
    @Autowired(required = false)
    delegate: DeprecationApiDelegate?,

    @Autowired(required = false)
    private val exceptionHandler: ApiExceptionHandler?
) : DeprecationApi {
    private val delegate = delegate ?: object : DeprecationApiDelegate {}

    override fun getDelegate(): DeprecationApiDelegate = delegate

    override fun getExceptionHandler(): ApiExceptionHandler? = exceptionHandler
}
