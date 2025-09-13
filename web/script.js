var queryModeDiv, lampContainer, lampNameDiv, slopeContainer, slopeNameDiv, hk80Container, hk80X, hk80Y, travelModeDiv, navigateCBox, drivingCBox, searchForm, submitBtn

window.addEventListener('load', function () {
    getIdWhenReady();
    const ua = navigator.userAgent;
    const isIPhone = !!ua.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端

    if (isIPhone) {
        const div = document.createElement('div');
        div.style.marginTop = '2rem';
        div.innerHTML = `
            <button type="submit" class="Applebtn" onclick="document.getElementById('submitButton').value = 'Apple'">Apple地圖開啟</button>
        `;

        const form = document.getElementById('searchForm');
        form.appendChild(div);
    }
});

function getIdWhenReady() {
    queryModeDiv = document.getElementById('queryMode');
    queryModeDiv.addEventListener('change', queryModeEvent);
    lampContainer = document.getElementById('lampContainer');
    lampNameDiv = document.getElementById('lampName');
    slopeContainer = document.getElementById('slopeContainer');
    slopeNameDiv = document.getElementById('slopeName');
    hk80Container = document.getElementById('hk80Container');
    hk80X = document.getElementById('hk80X');
    hk80Y = document.getElementById('hk80Y');
    travelModeDiv = document.getElementById('travelMode');
    navigateCBox = document.getElementById('navigateCheckbox');
    drivingCBox = document.getElementById('drivingModeCheckbox');
    searchForm = document.getElementById('searchForm');
    searchForm.addEventListener('submit', searchEvent);
    submitBtn = document.getElementById('submitButton');
}

queryModeEvent = () => {
    lampContainer.style.display = (queryModeDiv.value == "lamp") ? "block" : "none";
    slopeContainer.style.display = (queryModeDiv.value == "slope") ? "block" : "none";
    hk80Container.style.display = (queryModeDiv.value == "hk80") ? "flex" : "none";
}

searchEvent = (event) => {
    switch (queryModeDiv.value) {
        case "lamp":
            searchLamp(event);
            break;
        case "slope":
            searchSlope(event);
            break;
        case "hk80":
            searchHK80(event);
            break;
        default:
            alert('請選擇查詢模式!');
    }
}

function searchLamp(event) {
    event.preventDefault();
    lampNameDiv.value = lampNameDiv.value.toUpperCase();
    /* console.log('Lamp Name: ' + lampNameDiv.value);
    console.log('Travel Mode: ' + travelModeDiv.value);
    console.log('You choosed: ' + submitBtn.value); */
    var url = `https://api.csdi.gov.hk/apim/dataquery/api/?id=hyd_rcd_1629267205229_84645&layer=lamppost&limit=10&offset=0`;
    if (lampNameDiv.value !== '') {
        url += `&Lamp_Post_Number=${lampNameDiv.value}`;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Handle the response data here
            //console.log(data);
            if (data.numberMatched != 0) {
                // Use latitude and longitude to construct the Google Maps link
                var latitude = data.features[0].properties.Latitude;
                var longitude = data.features[0].properties.Longitude;
                createLink(latitude, longitude);
                //btnType == 'Google' ? window.open(Googleurl,'_blank') : (btnType == 'Apple' ? window.location.href = Appleurl : window.open(Googleurl,'_blank'));
                //window.open((isAndroid ? Googleurl : (isIPhone ? Appleurl : Googleurl)), '_blank');
            } else alert('沒有該路燈位置及資訊!')
        }).catch(error => {
            // Handle any errors that occurred during the fetch request
            console.error(error);
        });
};

function searchSlope(event) {
    event.preventDefault();
    
    if (slopeNameDiv.value === '') {
        alert('請輸入斜坡編號!');
        return;
    }
    
    const sn = slopeNameDiv.value.toUpperCase();
    // 嘗試多個代理服務
    const proxyUrls = [
        `https://www.slope.landsd.gov.hk/smris/getSlopeTechInfo?sn=${encodeURIComponent(sn)}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent('https://www.slope.landsd.gov.hk/smris/getSlopeTechInfo?sn=' + sn)}`,
    ];
    
    tryFetchWithProxy(proxyUrls, 0, sn);
};

function tryFetchWithProxy(urls, index, sn) {
    if (index >= urls.length) {
        //alert('無法連接到斜坡資料庫，請稍後再試!');
        return;
    }
    
    const url = urls[index];
    
    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            // 處理 allorigins 的回應格式
            const slopeData = data.contents ? JSON.parse(data.contents) : data;
            const { NORTHING, EASTING } = slopeData[0];
            if (!NORTHING || !EASTING) {
                throw new Error('無效的座標資料');
            }
            //console.log(`邊坡 ${sn} 的座標：EASTING=${EASTING}, NORTHING=${NORTHING}`);
            
            // Convert HK80 coordinates to latitude and longitude
            var coordinate = new Conversion().gridToLatLng({ x: EASTING, y: NORTHING });
            createLink(coordinate.lat, coordinate.lng);
        })
        .catch(err => {
            console.error(`代理 ${index + 1} 失敗:`, err);
            // 嘗試下一個代理
            tryFetchWithProxy(urls, index + 1, sn);
        });
}

function searchHK80(event) {
    event.preventDefault();
    if(hk80X.value == '' || hk80Y.value == '') {
        alert('請輸入東經及北緯座標!');
        return;
    }
    var coordinate = new Conversion().gridToLatLng({ x: hk80X.value, y: hk80Y.value });
    //console.log(coordinate);
    createLink(coordinate.lat, coordinate.lng);
}

function createLink(latitude, longitude) {
    //console.log(`${latitude} , ${longitude}`);
    var encodedAddress = encodeURIComponent(`${latitude},${longitude}`);

    var Googleurl = "https://maps.google.com/maps/";
    var Appleurl = "https://maps.apple.com/maps/"; //q, daddr, dirflg, t
    Googleurl += navigateCBox.checked ? `dir/?api=1&destination=${encodedAddress}&travelmode=${travelModeDiv.value}` : `search/?api=1&query=${encodedAddress}`;
    Appleurl += navigateCBox.checked ? `?daddr=${encodedAddress}&dirflg=${(travelModeDiv.value == "transit") ? "r" : travelModeDiv.value[0]}` : `?q=${encodedAddress}`;
    if (drivingCBox.checked && navigateCBox.checked) Googleurl += "&dir_action=navigate";

    /* console.log('Googleurl: ' + Googleurl);
    console.log('Appleurl: ' + Appleurl);
    console.log('Opened link: ' + (submitBtn.value == 'Google' ? Googleurl : (submitBtn.value == 'Apple' ? Appleurl : Googleurl))); */
    // Open the Google Maps link in a new tab
    if (document.querySelector(".Applebtn")) {
        window.location.href = submitBtn.value == 'Google' ? Googleurl : submitBtn.value == 'Apple' ? Appleurl : Googleurl;
    } else {
        window.open(Googleurl, '_blank')
    }
}

//html onclick function
function handleDrivingMode(checked) {
    drivingCBox.disabled = checked
    let label = document.querySelector('label[for="drivingModeCheckbox"]');
    label.classList.toggle("disabled")
}

document.querySelector("#themeBtn").addEventListener("click", function () {
    document.querySelector(".sun-icon").classList.toggle("animate-sun");
    document.querySelector(".moon-icon").classList.toggle("animate-moon");

    document.querySelector(".github-icon").classList.toggle("animate-github-icon");

    if (document.querySelector(".Applebtn")) document.querySelector(".Applebtn").classList.toggle("Appltbtn-dark");
    document.querySelector("body").classList.toggle("dark-mode");
})

function startTime() {
    const now = new Date();
    const timeElement = document.getElementById("datetime");
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const timeString = `${hours}:${minutes}:${seconds}`;
    const dateString = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`
    timeElement.innerHTML = `${dateString}<br><br>${timeString}`;
}
setInterval(startTime, 1000);