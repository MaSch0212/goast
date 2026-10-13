package com.openapi.generated.api

import com.openapi.generated.api.NamingApi.DeleteItemsIdResponseEntity
import com.openapi.generated.api.NamingApi.GetABCDEResponseEntity
import com.openapi.generated.api.NamingApi.GetItemsIdResponseEntity
import com.openapi.generated.api.NamingApi.GetItemsIdSubItemsSubIdResponseEntity
import com.openapi.generated.api.NamingApi.GetItemsResponseEntity
import com.openapi.generated.api.NamingApi.GetResponseEntity
import com.openapi.generated.api.NamingApi.GetWithSummaryResponseEntity
import com.openapi.generated.api.NamingApi.HeadItemsResponseEntity
import com.openapi.generated.api.NamingApi.OptionsItemsResponseEntity
import com.openapi.generated.api.NamingApi.PatchItemsIdResponseEntity
import com.openapi.generated.api.NamingApi.PostItemsResponseEntity
import com.openapi.generated.api.NamingApi.PutItemsIdResponseEntity
import jakarta.annotation.Generated
import org.springframework.web.context.request.NativeWebRequest
import java.util.Optional

@Generated(value = ["com.goast.kotlin.spring-service-generator"])
interface NamingApiDelegate {
    fun getRequest(): Optional<NativeWebRequest> = Optional.empty()

    suspend fun getItems(): GetItemsResponseEntity<*> {
        return GetItemsResponseEntity.notImplemented()
    }

    suspend fun postItems(): PostItemsResponseEntity<*> {
        return PostItemsResponseEntity.notImplemented()
    }

    suspend fun optionsItems(): OptionsItemsResponseEntity<*> {
        return OptionsItemsResponseEntity.notImplemented()
    }

    suspend fun headItems(): HeadItemsResponseEntity<*> {
        return HeadItemsResponseEntity.notImplemented()
    }

    suspend fun getItemsId(id: String): GetItemsIdResponseEntity<*> {
        return GetItemsIdResponseEntity.notImplemented()
    }

    suspend fun putItemsId(id: String): PutItemsIdResponseEntity<*> {
        return PutItemsIdResponseEntity.notImplemented()
    }

    suspend fun deleteItemsId(id: String): DeleteItemsIdResponseEntity<*> {
        return DeleteItemsIdResponseEntity.notImplemented()
    }

    suspend fun patchItemsId(id: String): PatchItemsIdResponseEntity<*> {
        return PatchItemsIdResponseEntity.notImplemented()
    }

    suspend fun getItemsIdSubItemsSubId(id: String, subId: String): GetItemsIdSubItemsSubIdResponseEntity<*> {
        return GetItemsIdSubItemsSubIdResponseEntity.notImplemented()
    }

    suspend fun get(): GetResponseEntity<*> {
        return GetResponseEntity.notImplemented()
    }

    suspend fun getABCDE(): GetABCDEResponseEntity<*> {
        return GetABCDEResponseEntity.notImplemented()
    }

    suspend fun getWithSummary(): GetWithSummaryResponseEntity<*> {
        return GetWithSummaryResponseEntity.notImplemented()
    }
}
