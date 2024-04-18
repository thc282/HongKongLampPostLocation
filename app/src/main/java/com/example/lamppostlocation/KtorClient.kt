package com.example.lamppostlocation

import android.util.Log
import io.ktor.client.HttpClient
import io.ktor.client.plugins.HttpRequestRetry
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.plugins.logging.Logging
import io.ktor.client.request.accept
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json

object KtorClient {
    val httpClient = HttpClient {
        install(ContentNegotiation) {
            json() // enable the client to perform JSON serialization
        }
        install(HttpRequestRetry){
            retryOnServerErrors(maxRetries = 3)
            exponentialDelay()
        }
        install(Logging)
        defaultRequest {
            contentType(ContentType.Application.Json)
            accept(ContentType.Application.Json)
        }
        expectSuccess = false
    }

    suspend fun fetchDataFromApi(action: String = "get", endpoint: String = "", params: Map<String, String> = emptyMap()): ResponseResult {
        var response: HttpResponse
        val url = "https://api.csdi.gov.hk/apim/dataquery/api/$endpoint"
        response = httpClient.get(url)

        when(action) {
            "get" -> response = httpClient.get(url) {
                url {
                    parameters.append("id", "hyd_rcd_1629267205229_84645")
                    parameters.append("layer", "lamppost")
                    params.forEach { (key, value) ->
                        if (value.isNotEmpty() && key != "responseKey") {
                            parameters.append(key, value)
                        }
                    }
                }
            }

            "post" -> response = httpClient.post(url) {
                setBody(params["body"]?:"")
            }
            "delete" -> response = httpClient.delete(url) {}
        }
        Log.d("KtorClient", "response: $response")
        val responseBody = response.bodyAsText()
        Log.d("KtorClient", "${params["responseKey"]?:"response"}: $responseBody")
        return ResponseResult(response.status.value, responseBody)
    }
    /*====================================================================================
    * Get Request
    *==================================================================================== */
    /*suspend fun getEventFeedsWithParameter(page: String = "", perPage: String = "", highlight: String = "",
                                           recent: String = "", search: String = "", location: String = ""): ResponseResult {
        val response: HttpResponse = httpClient.get("https://comp4107-spring2024.azurewebsites.net/api/events/") {
            url {
                if (page.isNotEmpty()) parameters.append("page", page)
                if (perPage.isNotEmpty()) parameters.append("perPage", perPage)
                if (highlight.isNotEmpty()) parameters.append("highlight", highlight)
                if (recent.isNotEmpty()) parameters.append("recent", recent)
                if (search.isNotEmpty()) parameters.append("search", search)
                if (location.isNotEmpty()) parameters.append("location", location)
            }
        }
        val responseBody = response.bodyAsText() // Read the response body as a string
        Log.d("KtorClient", "EventParmResponse: $responseBody") // Log the response body
        //val eventFeedResults = Json.decodeFromString<EventResponse>(responseBody) // Deserialize the response body
        return ResponseResult(response.status.value, responseBody)
    }

    suspend fun getEventDetailById(eventId: String): ResponseResult {
        val response: HttpResponse = httpClient.get("https://comp4107-spring2024.azurewebsites.net/api/events/$eventId")
        val responseBody = response.bodyAsText()
        Log.d("KtorClient", "EventByIdResponse: $responseBody")
        return ResponseResult(response.status.value, responseBody)
    }

    suspend fun getUserRegistedEventFeedsWithParameter(id:String = "any", page: String = "", perPage: String = ""): ResponseResult {
        Log.d("KtorClient", "Access Token: $token")
        val response: HttpResponse = httpClient.get("https://comp4107-spring2024.azurewebsites.net/api/volunteers/$id/events") {
            url {
                if (page.isNotEmpty()) parameters.append("page", page)
                if (perPage.isNotEmpty()) parameters.append("perPage", perPage)
            }
        }
        val responseBody = response.bodyAsText() // Read the response body as a string
        Log.d("KtorClient", "UserEventParmResponse: $responseBody") // Log the response body
        //val eventFeedResults = Json.decodeFromString<EventResponse>(responseBody) // Deserialize the response body
        return ResponseResult(response.status.value, responseBody)
    }

    suspend fun getUserInfo(id: String = "any"): ResponseResult {
        val response: HttpResponse = httpClient.get("https://comp4107-spring2024.azurewebsites.net/api/volunteers/$id")
        val responseBody = response.bodyAsText()
        Log.d("KtorClient", "UserInfoResponse: $responseBody")
        return ResponseResult(response.status.value, responseBody)
    }
    /*====================================================================================
    * Post Request
    *==================================================================================== */
    suspend fun postRegisterFeed(user: RegisterDetail): ResponseResult {
        //val usertest = RegisterDetail("any", "any","any","any","any","any",true)
        val response: HttpResponse = httpClient.post("https://comp4107-spring2024.azurewebsites.net/api/volunteers/") {
            setBody(user)
        }
        val responseBody = response.bodyAsText()
        Log.d("KtorClient", "RegisterResponse: $responseBody")
        return ResponseResult(response.status.value, responseBody)
    }

    suspend fun postLoginFeed(loginUser: LoginDetail): ResponseResult {
        Log.d("KtorClient", "LoginDetail: $loginUser")
        val response =
            httpClient.post("https://comp4107-spring2024.azurewebsites.net/api/login") {
                setBody(loginUser)
            }
        val responseBody = response.bodyAsText()
        Log.d("KtorClient", "LoginResponse: $responseBody")

        return ResponseResult(response.status.value, responseBody)
    }

    suspend fun postJoinEventFeed(eventId: String): ResponseResult {
        val response: HttpResponse = httpClient.post("https://comp4107-spring2024.azurewebsites.net/api/events/$eventId/volunteers")
        val responseBody = response.bodyAsText()
        Log.d("KtorClient", "JoinEventResponse: $responseBody")
        return ResponseResult(response.status.value, responseBody)
    }

    /*====================================================================================
    * Delete Request
    *==================================================================================== */
    suspend fun postUnRegisterEventFeed(eventId: String): ResponseResult {
        val response: HttpResponse = httpClient.delete("https://comp4107-spring2024.azurewebsites.net/api/events/$eventId/volunteers")
        val responseBody = response.bodyAsText()
        Log.d("KtorClient", "UnRegisterEventResponse: $responseBody")
        return ResponseResult(response.status.value, responseBody)
    }*/
}
