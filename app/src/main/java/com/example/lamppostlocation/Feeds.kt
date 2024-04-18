package com.example.lamppostlocation

import androidx.compose.runtime.Composable
import kotlinx.serialization.Serializable

@Serializable
data class ResponseResult(
    val statusCode: Int,
    val ResponseBody: String
)

@Serializable
data class LampSearchResult(
    val timeStamp: String = "",
    val features: List<Feature> = emptyList(),
    val numberReturned: Int = 0,
    val type: String = "FeatureCollection",
    val numberMatched: Int = 0
)

@Serializable
data class Feature(
    val geometry: Geometry,
    val type: String,
    val properties: Properties
)

@Serializable
data class Geometry(
    val coordinates: List<Double>,
    val type: String
)

@Serializable
data class Properties(
    val OBJECTID: Int,
    val Lamp_Post_Number: String,
    val Latitude: Double,
    val District: String,
    val Longitude: Double,
    val Location: String
)
