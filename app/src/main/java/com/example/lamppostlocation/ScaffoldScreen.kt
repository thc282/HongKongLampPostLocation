package com.example.lamppostlocation

import android.util.Log
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.sp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.get
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScaffoldScreen() {
    var selectedItem by remember { mutableIntStateOf(0) }
    val navBarItems = listOf("查詢", "位置資料")
    var currPage by remember { mutableStateOf("") }
    val navController = rememberNavController()
    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }
    var lampPostData = LampSearchResult()

    navController.addOnDestinationChangedListener { _, destination, _ ->
        val currentDestination = destination.route
        //Log.d("ScaffoldScreen", "listener: $currentDestination")
        val index = getIndexOfCurrentDestination(currentDestination, navBarItems)
        //Log.d("ScaffoldScreen", "AfterGettingPageIndex: $index")
        if (index != -1) {
            selectedItem = index
        }
        //changing the text of the top app bar
        currPage = navBarItems[selectedItem]
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = currPage,
                        style = LocalTextStyle.current.copy(fontSize = 30.sp)
                    )
                },
            )
        },
        bottomBar = {
            NavigationBar {
                navBarItems.forEachIndexed { index, item ->
                    NavigationBarItem(
                        icon = { },
                        label = {
                            Text(
                                text = item,
                                style = LocalTextStyle.current.copy(fontSize = 20.sp)
                            )
                        },
                        selected = selectedItem == index,
                        onClick = {
                            selectedItem = index
                            navController.navigate(navBarItems[selectedItem]) {
                                /*popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }*/
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        content = { innerPadding ->
            Column(modifier = Modifier.padding(innerPadding)) {
                NavHost(
                    navController = navController,
                    startDestination = navBarItems.first(),
                ) {
                    composable("查詢") {
                        //Log.d("ScaffoldScreen", "SearchingScreenComposed")
                        SearchingScreen(navController, snackbarHostState)
                    }
                    composable("位置資料"){LocationDataScreen(navController, lampPostData)}
                    composable("位置資料/{LampPostLocJson}") {navBackStackEntry ->
                        val LampPostLocJson = navBackStackEntry.arguments?.getString("LampPostLocJson")
                        /*val travel = navBackStackEntry.arguments?.getString("travel")
                        val navigate = navBackStackEntry.arguments?.getBoolean("navigate")*/
                        val LampPostResponse = remember(LampPostLocJson) { Json.decodeFromString<LampSearchResult>(LampPostLocJson!!) }
                        LaunchedEffect(LampPostLocJson) {
                            Log.d("ScaffoldScreen", "LampPostLocObject: $LampPostResponse")
                        }
                        lampPostData = LampPostResponse
                        LocationDataScreen(navController, LampPostResponse)
                    }
                }
            }
        }
    )
}


fun getIndexOfCurrentDestination(currentDestination: String?, items: List<String>): Int {
    return items.indexOfFirst { it.contains("${currentDestination?.split("/")?.get(0)}") }
}

@Preview(showBackground = true)
@Composable
fun ScaffoldScreenPreview() {
    ScaffoldScreen()
}