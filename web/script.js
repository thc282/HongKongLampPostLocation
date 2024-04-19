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
            console.log(`${data.features[0].properties.Latitude} , ${data.features[0].properties.Longitude}`);
            // Use latitude and longitude to construct the Google Maps link
            var latitude = data.features[0].properties.Latitude;
            var longitude = data.features[0].properties.Longitude;

            var encodedString = encodeURIComponent(`${latitude},${longitude}`);
            var url = "https://maps.google.com/maps/";
            url += isNavigate ? `dir/?api=1&destination=${encodedString}&travelmode=${travelMode}` : `search/?api=1&query=${encodedString}`;
            if(isDrivingMode && isNavigate) url += "&dir_action=navigate"

            console.log('EncodedString: ' + encodedString);
            console.log('URL: ' + url);

            // Open the Google Maps link in a new tab
            window.open(url, '_blank');
            //window.open(url);
        })
        .catch(error => {
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