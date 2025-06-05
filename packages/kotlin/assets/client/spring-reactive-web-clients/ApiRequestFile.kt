package @PACKAGE_NAME@

import org.springframework.core.io.buffer.DataBuffer
import org.springframework.http.MediaType
import org.springframework.http.client.MultipartBodyBuilder
import org.springframework.http.codec.multipart.FilePart
import java.io.File

interface ApiRequestFile {
    companion object {
        fun from(file: File): ApiRequestFile =
            object : ApiRequestFile {
                override fun addToBuilder(builder: MultipartBodyBuilder) {
                    builder
                        .part("file", file)
                        .filename(file.name)
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                }
            }

        fun from(filePart: FilePart): ApiRequestFile =
            object : ApiRequestFile {
                override fun addToBuilder(builder: MultipartBodyBuilder) {
                    builder
                        .asyncPart("file", filePart.content(), DataBuffer::class.java)
                        .filename(filePart.filename())
                        .contentType(filePart.headers().contentType ?: MediaType.APPLICATION_OCTET_STREAM)
                }
            }
    }

    fun addToBuilder(builder: MultipartBodyBuilder)
}
