package com.openapi.generated.api

import jakarta.annotation.Generated
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
@Controller
@RequestMapping("\${openapi.alpha.base-path:https://api.example.com/v1}")
class AlphaApiController(
    @Autowired(required = false)
    delegate: AlphaApiDelegate?,

    @Autowired(required = false)
    private val exceptionHandler: ApiExceptionHandler?
) : AlphaApi {
    private val delegate = delegate ?: object : AlphaApiDelegate {}

    override fun getDelegate(): AlphaApiDelegate = delegate

    override fun getExceptionHandler(): ApiExceptionHandler? = exceptionHandler
}
