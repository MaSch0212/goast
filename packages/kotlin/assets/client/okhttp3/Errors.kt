@file:Suppress("unused")

package @PACKAGE_NAME@

import java.lang.RuntimeException

open class ClientException(message: kotlin.String? = null, val statusCode: Int = -1, val response: Response? = null) :
    RuntimeException(message) {

    companion object {
        private const val serialVersionUID: Long = 123L
    }
}

open class ServerException(message: kotlin.String? = null, val statusCode: Int = -1, val response: Response? = null) :
    RuntimeException(message) {

    companion object {
        private const val serialVersionUID: Long = 456L
    }
}
