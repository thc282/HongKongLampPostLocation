package com.example.lamppostlocation

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import androidx.navigation.compose.rememberNavController
import com.example.lamppostlocation.ui.theme.LampPostLocationTheme
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.async
import kotlinx.coroutines.launch
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchingScreen(navController: NavHostController, snackbarHostState: SnackbarHostState){
    var LampName by remember { mutableStateOf("") }
    var navigate by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current
    val focusManager = LocalFocusManager.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        //horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "路燈查詢",
            fontSize = 30.sp,
            modifier = Modifier
                .padding(bottom = 20.dp)
                .align(Alignment.CenterHorizontally)
        )
        OutlinedTextField(
            value = LampName,
            onValueChange = {LampName = it},
            label = { Text("路燈編號") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )
        Text(
            text = "交通方式",
            fontSize = 20.sp,
            modifier = Modifier.padding(top = 20.dp)
        )
        var expanded by remember { mutableStateOf(false) }
        var selectedIndex by remember { mutableStateOf(0) }
        val travel = listOf("開車", "走路", "騎車", "搭乘大眾運輸")
        val travelEng = listOf("driving", "walking", "bicycling", "transit")
        val travelMap = travel.zip(travelEng).toMap()
        var selectedText by remember { mutableStateOf(travel[selectedIndex]) }
        ExposedDropdownMenuBox(
            expanded = expanded,
            onExpandedChange = { expanded = !expanded},
            modifier = Modifier.padding(top = 8.dp)
        ){
            OutlinedTextField(
                value = selectedText,
                onValueChange = {
                    selectedText = it
                },
                readOnly = true,
                modifier = Modifier
                    .menuAnchor()
                    .fillMaxWidth()
                    .padding(top = 4.dp),
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded)},
            )
            DropdownMenu(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                expanded = expanded,
                onDismissRequest = { expanded = false }
            ){
                travel.forEachIndexed { index, item ->
                    DropdownMenuItem(
                        text = { Text(travel[index]) },
                        onClick = {
                            selectedIndex = index
                            selectedText = travel[selectedIndex]
                            expanded = false
                        }
                    )
                }
            }
        }
        Spacer(modifier = Modifier.padding(50.dp))
        Button(
            onClick = {
                focusManager.clearFocus()
                //Should be fetch API here
                getLampInfo( coroutineScope, LampName, snackbarHostState,
                    onReturnResult = { LampPostResponse ->
                        if (LampPostResponse.numberMatched != 0) {
                            Log.d("SearchScreen", "LampPostResponse: $LampPostResponse")
                            val feature = LampPostResponse.features[0]
                            val geometry = feature.geometry
                            val properties = feature.properties
                            Log.d("SearchScreen", "feature: $feature")
                            Log.d("SearchScreen", "geometry: ${geometry}")
                            Log.d("SearchScreen", "properties: $properties")
                            //Should throw the data into LocationDetailScreen
                            //need to JSON

                            navController.navigate("LocationDetail/${properties.Latitude}/${properties.Longitude}")
                        } else {
                            coroutineScope.launch{
                                snackbarHostState.showSnackbar("沒有該路燈位置及資訊")

                            }
                        }
                    }
                )
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(60.dp)
        ) {
            Text(
                text = "查看路燈資訊",
                fontSize = 20.sp,
            )
        }
        Spacer(modifier = Modifier.padding(10.dp))
        Button(
            onClick = {
                focusManager.clearFocus()
                //Should be fetch API here
                getLampInfo( coroutineScope, LampName, snackbarHostState,
                    onReturnResult = { LampPostResponse ->
                        if (LampPostResponse.numberMatched != 0) {
                            Log.d("SearchScreen", "LampPostResponse: $LampPostResponse")
                            val feature = LampPostResponse.features[0]
                            val geometry = feature.geometry
                            val properties = feature.properties
                            Log.d("SearchScreen", "feature: $feature")
                            Log.d("SearchScreen", "geometry: ${geometry}")
                            Log.d("SearchScreen", "properties: $properties")
                            openUrl(context, "${properties.Latitude},${properties.Longitude}", travelMap[selectedText]!!, navigate)
                        } else {
                            coroutineScope.launch{
                                snackbarHostState.showSnackbar("沒有該路燈位置及資訊")
                            }
                        }
                    }
                )

            },
            modifier = Modifier
                .fillMaxWidth()
                .height(60.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xff5dbea3))
        ) {
            Text(
                text = "前往地圖位置",
                fontSize = 20.sp,
            )
        }
        Row(
            modifier = Modifier
                .padding(top = 15.dp)
                .fillMaxWidth(),
        ){
            Row (
                modifier = Modifier.clickable(indication = null, interactionSource = remember { MutableInteractionSource() }) {
                    navigate = !navigate
                },
                verticalAlignment = Alignment.CenterVertically
            ){
                Checkbox(
                    checked = navigate,
                    onCheckedChange = {
                        navigate = it
                    }
                )
                Text(
                    text = "開啟駕駛模式",
                )
            }
        }
    }
}

fun getLampInfo(
    coroutineScope: CoroutineScope,
    LampName: String,
    snackbarHostState: SnackbarHostState,
    onReturnResult: (LampSearchResult) -> Unit
){
    var LampName = LampName
    coroutineScope.launch {
        LampName = LampName.uppercase()
        val LampPostResult = async {
             KtorClient.fetchDataFromApi("get", "", mapOf("responseKey" to "LampLocResponse", "Lamp_Post_Number" to LampName))
        }.await()
        val statusCode = LampPostResult.statusCode
        val response = LampPostResult.ResponseBody

        Log.d("SearchScreen", "StatusCodeResponse: $statusCode")

        when (statusCode) {
            200 -> {
                val LampPostResponse = Json.decodeFromString<LampSearchResult>(response)
                onReturnResult(LampPostResponse)
                Log.d("SearchScreen:getLampInfo()", "LampPostResponse: $LampPostResponse")
            }
            else -> {
                launch {
                    snackbarHostState.showSnackbar("未知錯誤")
                }
            }
        }
    }
}

fun openUrl(context: Context, query: String, travel: String = "driving", navigate: Boolean) {
    val encodedString = URLEncoder.encode(query, StandardCharsets.UTF_8.toString())
    Log.d("SearchScreen", "EncodedString: $encodedString")
    var url = "https://www.google.com/maps/dir/?api=1&destination=$encodedString&travelmode=$travel"
    if(navigate) url += "&dir_action=navigate"
    Log.d("SearchScreen", "URL: $url")
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
    context.startActivity(intent)
}

@Preview(showBackground = true)
@Composable
fun SearchingPreview() {
    LampPostLocationTheme {
        SearchingScreen(rememberNavController(), SnackbarHostState())
    }
}