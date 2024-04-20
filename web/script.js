document.getElementById('searchForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var lampName = document.getElementById('lampName').value;
    var lampName = lampName.toUpperCase();
    var travelMode = document.getElementById('travelMode').value;
    let isNavigate = document.getElementById('navigateCheckbox').checked;
    let isDrivingMode = document.getElementById('drivingModeCheckbox').checked;
    console.log('Lamp Name: ' + lampName);
    console.log('Travel Mode: ' + travelMode);
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

                // detect if it's an Android device
                const ua = navigator.userAgent.toLowerCase()
                const isAndroid = ua.includes('android')
                const isIPhone = (navigator.userAgent.match(/iPhone/i)) ||(navigator.userAgent.match(/iPod/i))
                var Googleurl = "https://maps.google.com/maps/";
                var Appleurl = "https://maps.apple.com/maps/"; //q, daddr, dirflg, t
                Googleurl += isNavigate ? `dir/?api=1&destination=${encodedAddress}&travelmode=${travelMode}` : `search/?api=1&query=${encodedAddress}`;
                Appleurl += isNavigate ? `?daddr=${encodedAddress}&dirflg=${(travelMode == "transit") ? "r" : travelMode[0]}` : `?q=${encodedAddress}`;
                if(isDrivingMode && isNavigate) Googleurl += "&dir_action=navigate";

                console.log('Googleurl: ' + Googleurl);
                console.log('Appleurl: ' + Appleurl);
                console.log('Opened link: ' + (isAndroid ? Googleurl : (isIPhone ? Appleurl : Googleurl)));
                // Open the Google Maps link in a new tab
                window.open((isAndroid ? Googleurl : (isIPhone ? Appleurl : Googleurl)), '_blank');
                //window.open(url);
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
    label.style.color = checked ? 'gray' : 'black';
}