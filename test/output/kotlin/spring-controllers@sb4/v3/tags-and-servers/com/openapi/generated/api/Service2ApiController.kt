package com.openapi.generated.api

import jakarta.annotation.Generated
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
@Controller
@RequestMapping("\${openapi.service2.base-path:https://api.example.com/v1}")
class Service2ApiController(
    @Autowired(required = false)
    delegate: Service2ApiDelegate?,

    @Autowired(required = false)
    private val exceptionHandler: ApiExceptionHandler?
) : Service2Api {
    private val delegate = delegate ?: object : Service2ApiDelegate {}

    override fun getDelegate(): Service2ApiDelegate = delegate

    override fun getExceptionHandler(): ApiExceptionHandler? = exceptionHandler
}
