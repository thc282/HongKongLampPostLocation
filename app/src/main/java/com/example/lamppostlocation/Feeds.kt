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
    val timeStamp: String = "YYYY-MM-DDThh:mm:ssZ",
    val features: List<Feature> = listOf(Feature()),
    val numberReturned: Int = 0,
    val type: String = "FeatureCollection",
    val numberMatched: Int = 0
)

@Serializable
data class Feature(
    val geometry: Geometry = Geometry(),
    val type: String = "Feature",
    val properties: Properties = Properties()
)

@Serializable
data class Geometry(
    val coordinates: List<Double> = listOf(0.0, 0.0),
    val type: String = "Point"
)

@Serializable
data class Properties(
    val OBJECTID: Int = 0,
    val Lamp_Post_Number: String = "AAXXXX",
    val Latitude: Double = 0.0,
    val District: String = "No District",
    val Longitude: Double = 0.0,
    val Location: String = "No Location"
)
