package com.openapi.generated.api

import jakarta.annotation.Generated
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
@Controller
@RequestMapping("\${openapi.widgets.base-path:/}")
class WidgetsApiController(
    @Autowired(required = false)
    delegate: WidgetsApiDelegate?,

    @Autowired(required = false)
    private val exceptionHandler: ApiExceptionHandler?
) : WidgetsApi {
    private val delegate = delegate ?: object : WidgetsApiDelegate {}

    override fun getDelegate(): WidgetsApiDelegate = delegate

    override fun getExceptionHandler(): ApiExceptionHandler? = exceptionHandler
}
