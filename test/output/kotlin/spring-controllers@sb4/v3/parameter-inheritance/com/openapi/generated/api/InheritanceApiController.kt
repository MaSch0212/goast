package com.openapi.generated.api

import jakarta.annotation.Generated
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
@Controller
@RequestMapping("\${openapi.inheritance.base-path:/}")
class InheritanceApiController(
    @Autowired(required = false)
    delegate: InheritanceApiDelegate?,

    @Autowired(required = false)
    private val exceptionHandler: ApiExceptionHandler?
) : InheritanceApi {
    private val delegate = delegate ?: object : InheritanceApiDelegate {}

    override fun getDelegate(): InheritanceApiDelegate = delegate

    override fun getExceptionHandler(): ApiExceptionHandler? = exceptionHandler
}
