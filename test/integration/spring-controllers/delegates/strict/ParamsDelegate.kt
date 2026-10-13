package goast.server

import com.openapi.generated.api.ParamsApi.AllLocationsResponseEntity
import com.openapi.generated.api.ParamsApi.GetEncodedResponseEntity
import com.openapi.generated.api.ParamsApi.PathStyleSimpleResponseEntity
import com.openapi.generated.api.ParamsApi.StyleMatrixResponseEntity
import com.openapi.generated.api.ParamsApiDelegate
import org.springframework.stereotype.Component

/** `ParamsApiDelegate` for the two `-strict` units. Assertions as in the lenient delegate. */
@Component
class ParamsDelegate : ParamsApiDelegate {
    override suspend fun allLocations(
        pathParam: String,
        queryParam: String?,
        xHeaderParam: String?,
    ): AllLocationsResponseEntity<*> {
        expectParam("allLocations.pathParam", "loc1", pathParam)
        expectParam("allLocations.queryParam", "q1", queryParam)
        expectParam("allLocations.xHeaderParam", "h1", xHeaderParam)
        return AllLocationsResponseEntity.ok()
    }

    override suspend fun styleMatrix(
        formExploded: List<String>?,
        formUnexploded: List<String>?,
        spaceDelimited: List<String>?,
    ): StyleMatrixResponseEntity<*> {
        styleMatrixCase(formExploded, formUnexploded, spaceDelimited)
        return StyleMatrixResponseEntity.ok()
    }

    override suspend fun pathStyleSimple(values: List<String>): PathStyleSimpleResponseEntity<*> {
        expectParam("pathStyleSimple.values", listOf("a", "b"), values)
        return PathStyleSimpleResponseEntity.ok()
    }

    override suspend fun getEncoded(value: String, raw: String?): GetEncodedResponseEntity<*> {
        expectParam("getEncoded.value", "abc def/x", value)
        expectParam("getEncoded.raw", "a&b=c", raw)
        return GetEncodedResponseEntity.ok()
    }
}
