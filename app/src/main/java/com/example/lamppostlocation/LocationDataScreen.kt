package com.example.lamppostlocation

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.rememberNavController
import com.example.lamppostlocation.ui.theme.LampPostLocationTheme


@Composable
fun LocationDataScreen(
    navController: NavHostController,
    LampPostResponse: LampSearchResult
) {
    // Handle back button press
    BackHandler {
        navController.navigate("查詢") {
            /*popUpTo(navController.graph.findStartDestination().id) {
                saveState = true
            }*/
            launchSingleTop = true
            restoreState = true
        }
    }

    if(LampPostResponse.numberMatched != 0) {
        val feature = LampPostResponse.features[0]
        val geometry = feature.geometry
        val properties = feature.properties

        val dateAndTime = LampPostResponse.timeStamp.split("T")
        val date = dateAndTime[0] // "YYYY-MM-DD"
        val time = dateAndTime[1].removeSuffix("Z") // "HH:MM:SS"

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp, vertical = 20.dp),
            verticalArrangement = Arrangement.Center
        ) {
            Row {
                Text(text = "數據獲取時截:", modifier = Modifier.weight(1f))
                Text(text = "$date\n$time", modifier = Modifier.weight(1f))
            }

            Spacer(modifier = Modifier.padding(20.dp))
            Row {
                Text(text = "地理座標:", modifier = Modifier.weight(1f))
                Text(
                    text = "[ ${geometry.coordinates[0]} , ${geometry.coordinates[1]} ]",
                    modifier = Modifier.weight(1f)
                )
            }
            Spacer(modifier = Modifier.padding(20.dp))
            Text(text = "位置參數")
            Column(
                modifier = Modifier.padding(10.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                Row {
                    Text(text = "OBJECTID: ", modifier = Modifier.weight(1f))
                    Text(text = "${properties.OBJECTID}", modifier = Modifier.weight(1f))
                }
                Row {
                    Text(text = "燈柱編號: ", modifier = Modifier.weight(1f))
                    Text(text = properties.Lamp_Post_Number, modifier = Modifier.weight(1f))
                }
                Row {
                    Text(text = "經度: ", modifier = Modifier.weight(1f))
                    Text(text = "${properties.Longitude}", modifier = Modifier.weight(1f))
                }
                Row {
                    Text(text = "緯度: ", modifier = Modifier.weight(1f))
                    Text(text = "${properties.Latitude}", modifier = Modifier.weight(1f))
                }
                Row {
                    Text(text = "地區: ", modifier = Modifier.weight(1f))
                    Text(text = properties.District, modifier = Modifier.weight(1f))
                }
                Row {
                    Text(text = "位置: ", modifier = Modifier.weight(1f))
                    Text(text = properties.Location, modifier = Modifier.weight(1f))
                }
            }
            //Spacer(modifier = Modifier.padding(70.dp))
        }
    } else {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "沒有任何資料\n\n請先進行搜索",
                style = LocalTextStyle.current.copy(fontSize = 25.sp),
                textAlign = TextAlign.Center
            )
        }
    }
}

@Preview
@Composable
fun LocationDataScreenPreview(){
    LampPostLocationTheme {
        val mockLampSearchResult = LampSearchResult(
            type = "FeatureCollection",
            features = listOf(
                Feature(
                    type = "Feature",
                    geometry = Geometry(
                        type = "Point",
                        coordinates = listOf(0.0, 0.0)
                    ),
                    properties = Properties(
                        OBJECTID= 0,
                        Lamp_Post_Number = "AABBBB",
                        Latitude= 0.0,
                        District= "No District",
                        Longitude= 0.0,
                        Location= "No Location"
                    )
                )
            ),
            timeStamp = "YYYY-MM-DDThh:mm:ssZ"
        )
        //LocationDataScreen(rememberNavController(), mockLampSearchResult)
        LocationDataScreen(rememberNavController(), LampSearchResult())
    }
}