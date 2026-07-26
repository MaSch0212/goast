package com.openapi.generated.api

import jakarta.annotation.Generated
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
@Controller
@RequestMapping("\${openapi.naming.base-path:/}")
class NamingApiController(
    @Autowired(required = false)
    delegate: NamingApiDelegate?,

    @Autowired(required = false)
    private val exceptionHandler: ApiExceptionHandler?
) : NamingApi {
    private val delegate = delegate ?: object : NamingApiDelegate {}

    override fun getDelegate(): NamingApiDelegate = delegate

    override fun getExceptionHandler(): ApiExceptionHandler? = exceptionHandler
}
