window.addEventListener('load', function() {
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

document.getElementById('searchForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var lampName = document.getElementById('lampName').value;
    lampName = lampName.toUpperCase();
    var travelMode = document.getElementById('travelMode').value;
    let isNavigate = document.getElementById('navigateCheckbox').checked;
    let isDrivingMode = document.getElementById('drivingModeCheckbox').checked;
    let btnType = document.getElementById('submitButton').value;

    console.log('Lamp Name: ' + lampName);
    console.log('Travel Mode: ' + travelMode);
    console.log('You choosed: ' + btnType);
    var url = `https://api.csdi.gov.hk/apim/dataquery/api/?id=hyd_rcd_1629267205229_84645&layer=lamppost&limit=10&offset=0`;
    if (lampName !== '') {
        url += `&Lamp_Post_Number=${lampName}`;
    }

    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Handle the response data here
            console.log(data);
            if(data.numberMatched != 0){
                // Use latitude and longitude to construct the Google Maps link
                var latitude = data.features[0].properties.Latitude;
                var longitude = data.features[0].properties.Longitude;
                console.log(`${latitude} , ${longitude}`);
                var encodedAddress = encodeURIComponent(`${latitude},${longitude}`);

                var Googleurl = "https://maps.google.com/maps/";
                var Appleurl = "https://maps.apple.com/maps/"; //q, daddr, dirflg, t
                Googleurl += isNavigate ? `dir/?api=1&destination=${encodedAddress}&travelmode=${travelMode}` : `search/?api=1&query=${encodedAddress}`;
                Appleurl += isNavigate ? `?daddr=${encodedAddress}&dirflg=${(travelMode == "transit") ? "r" : travelMode[0]}` : `?q=${encodedAddress}`;
                if(isDrivingMode && isNavigate) Googleurl += "&dir_action=navigate";

                console.log('Googleurl: ' + Googleurl);
                console.log('Appleurl: ' + Appleurl);
                console.log('Opened link: ' + (btnType == 'Google' ? Googleurl : (btnType == 'Apple' ? Appleurl : Googleurl)));
                // Open the Google Maps link in a new tab
                if(document.querySelector(".Applebtn")){
                    window.location.href = btnType == 'Google' ? Googleurl : btnType == 'Apple' ? Appleurl : Googleurl;
                }else{
                    window.open(Googleurl,'_blank')
                }
                //btnType == 'Google' ? window.open(Googleurl,'_blank') : (btnType == 'Apple' ? window.location.href = Appleurl : window.open(Googleurl,'_blank'));
                //window.open((isAndroid ? Googleurl : (isIPhone ? Appleurl : Googleurl)), '_blank');
             }else alert('沒有該路燈位置及資訊!')
        }).catch(error => {
            // Handle any errors that occurred during the fetch request
            console.error(error);
        });
});

function handleDrivingMode(checked){
    let driving = document.getElementById('drivingModeCheckbox')
    driving.disabled = checked
    let label = document.querySelector('label[for="drivingModeCheckbox"]');
    label.classList.toggle("disabled")
}

document.querySelector("#themeBtn").addEventListener("click", function() {
    var body = document.querySelector("body")
    var githubIcon = document.querySelector("#github-icon")
    document.querySelector(".sun-icon").classList.toggle("animate-sun");
    document.querySelector(".moon-icon").classList.toggle("animate-moon");

    document.querySelector(".github-icon").classList.toggle("animate-github-icon");

    if(document.querySelector(".Applebtn")) document.querySelector(".Applebtn").classList.toggle("Appltbtn-dark");
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