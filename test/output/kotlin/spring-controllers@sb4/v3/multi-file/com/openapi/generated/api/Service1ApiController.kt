package com.openapi.generated.api

import jakarta.annotation.Generated
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
@Controller
@RequestMapping("\${openapi.service1.base-path:/}")
class Service1ApiController(
    @Autowired(required = false)
    delegate: Service1ApiDelegate?,

    @Autowired(required = false)
    private val exceptionHandler: ApiExceptionHandler?
) : Service1Api {
    private val delegate = delegate ?: object : Service1ApiDelegate {}

    override fun getDelegate(): Service1ApiDelegate = delegate

    override fun getExceptionHandler(): ApiExceptionHandler? = exceptionHandler
}
