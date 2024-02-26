var map;
var selectedMarker = null;
var markers = [];
var selectedAccessibility = null;
var userLocation = null;

async function initMap() {
    showSpinner();
    // Try to get the user's location using the browser's geolocation API
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                // Create a map centered at the user's location
                map = new google.maps.Map(document.getElementById('map'), {
                    center: userLocation,
                    zoom: 14
                });

                var marker = new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    icon: {
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 7,
                      fillOpacity: 1,
                      strokeWeight: 2,
                      fillColor: '#5384ED',
                      strokeColor: '#ffffff',
                    },
                  });
                document.getElementById('departure').value = 'Current location';
                hideSpinner();

            },
            function (error) {
                console.log('Error occurred while fetching user location:', error);
                // When geolocation is not available, set default to London
                map = new google.maps.Map(document.getElementById('map'), {
                    center: { lat: 51.509865, lng: -0.138092 },
                    zoom: 13
                });
                hideSpinner();
            }
        );
    } else {
        // When geolocation is not available, set default to London
        map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 51.509865, lng: -0.138092 },
            zoom: 13
        });
        hideSpinner();
    }

    autocompleteArrival = new google.maps.places.Autocomplete(document.getElementById('arrival'));
    autocompleteDeparture = new google.maps.places.Autocomplete(document.getElementById('departure'));
    // Add event listener for place changed
    autocompleteDeparture.addListener('place_changed', function() {
        var place = autocompleteDeparture.getPlace();

        if (place.geometry) {
            // Update userLocation with the selected departure location
            userLocation = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
            };

            // Center the map at the selected departure location
            map.setCenter(userLocation);
            var marker = new google.maps.Marker({
                position: userLocation,
                map: map,
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 7,
                  fillOpacity: 1,
                  strokeWeight: 2,
                  fillColor: '#5384ED',
                  strokeColor: '#ffffff',
                },
              });
        }
    });
}

// Select "Wheelchair" by default
window.onload = function() {
    selectAccessibility('wheelchair');
};

function selectAccessibility(accessibility) {
    // Deselect the previously selected button
    if (selectedAccessibility) {
        document.querySelector(`button.${selectedAccessibility}`).classList.remove('selected', 'expanded');
    }

    // Toggle the expanded class
    var button = document.querySelector(`button.${accessibility}`);
    selectedAccessibility = accessibility;
    button.classList.add('selected');
    button.classList.toggle('expanded');
}

function searchPlaces() {

    var arrival = document.getElementById('arrival').value;

    // Create a Places Service instance
    var placesService = new google.maps.places.PlacesService(map);

    // Use the Places API to search for places near the specified location (arrival)
    placesService.textSearch({
        query: arrival
    }, function (results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            // Clear existing markers on the map
            clearMarkers();
            map = new google.maps.Map(document.getElementById('map'));

            // Display markers for each place in the search results
            for (var i = 0; i < results.length; i++) {
                createMarker(results[i]);
            }

            // Center the map around the bounds of all search results
            if (results.length > 0) {
                if (results.length === 1) {
                    // If only one result, set a specific zoom level
                    map.setCenter(results[0].geometry.location);
                    map.setZoom(15); 
                    openInfoDiv(results[0]);
                    selectedMarker = markers[0];
                } else {
                    // If multiple results, fit the bounds to all results
                    var bounds = new google.maps.LatLngBounds();
                    for (var i = 0; i < results.length; i++) {
                        bounds.extend(results[i].geometry.location);
                    }
                    map.fitBounds(bounds);
                }
            }
        } else {
            console.error('Places API request failed with status:', status);
            alert('An error occurred while fetching places.');
        }
    });
}

// Function to clear existing markers from the map
function clearMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
    closeInfoDiv();
}

// Function to create a marker for a place and add it to the map
function createMarker(place) {
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        title: place.name
    });
    
    google.maps.event.addListener(marker, 'click', function () {
        openInfoDiv(place);
        selectedMarker = marker;
    });

    markers.push(marker);
}

// Function to open info div with custom information
function openInfoDiv(place) {

    var infoDiv = document.getElementById('info-display');
    var placeName = document.getElementById('place-name');
    var placeAddress = document.getElementById('place-address');
    var placeImage = document.getElementById('place-image');
    
    placeName.innerHTML = place.name;
    placeAddress.innerHTML = place.formatted_address;

    // Check if the place has a photo
    if (place.photos && place.photos.length > 0) {
        var photoUrl = place.photos[0].getUrl();
        placeImage.src = photoUrl;
        placeImage.style.display = 'block';
    } else {
        // If there's no photo, hide the image element
        placeImage.style.display = 'none';
    }

    var mapsLink = document.getElementById('place-link');
    mapsLink.href = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;

    var sectionHeight = document.querySelector('section').offsetHeight;
    var sectionTop = document.querySelector('section').offsetTop;

    infoDiv.style.display = 'block';
    infoDiv.style.top = sectionTop + sectionHeight + 20 + 'px';
}

// Function to close div
function closeDiv(id) {
    var Div = document.getElementById(id);
    Div.style.display = 'none';
}


// Function to close info div
function closeInfoDiv() {
    var infoDiv = document.getElementById('info-display');
    infoDiv.style.display = 'none';
    selectedMarker = null;
}

function planJourney() {

    if (userLocation === null) {
        alert('Your location is not available. Please enable location services or enter a departure location.');
        return;
    }
    else {
        showSpinner();
        // Get the coordinates
        var destinationLatLng = selectedMarker.getPosition();
        var arrival = destinationLatLng.lat() + ',' + destinationLatLng.lng();
        var departure = userLocation.lat + ',' + userLocation.lng;

        // Construct the URL with the entered locations
        var publiTransportUrl = `https://public-transport-planner.azurewebsites.net/api/journey?departure=${departure}&arrival=${arrival}`;
        

        // Make a fetch request to the API
        fetch(publiTransportUrl)
            .then(response => response.json())
            .then(data => {
                hideSpinner();
                renderJourney(data.legs);
            })
            .catch(error => {
                hideSpinner();
                console.error('Error:', error);
                alert('An error occurred while fetching data.');
            });

        // Hide the info div
        closeInfoDiv();
    }
    // Show itinerary options
}

function showSpinner() {
    // Show spinner element (assuming you have an element with id 'spinner')
    var spinner = document.getElementById('spinner-container');
    spinner.style.display = 'block';
}

function hideSpinner() {
    // Hide spinner element
    var spinner = document.getElementById('spinner-container');
    spinner.style.display = 'none';
}

function renderJourney(legs) {
    // Clear existing markers on the map
    map = new google.maps.Map(document.getElementById('map'));
    
    // Create an empty bounds object to contain all leg coordinates
    var bounds = new google.maps.LatLngBounds();

    legs.forEach(function(leg, index) {
        // Render walking or bus path
        var pathCoordinates = JSON.parse(leg.path);
        var path = pathCoordinates.map(coord => ({ lat: coord[0], lng: coord[1] }));
        
        // Extend the bounds with each leg's path
        for (var i = 0; i < path.length; i++) {
            bounds.extend(path[i]);
        }

        var routePath = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: leg.mode === 'walking' ? '#0000FF' : '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 3,
            clickable: true
        });

        // Create an info window for the leg
        var infoWindow = new google.maps.InfoWindow({
            content: leg.summary
        });

        // Add an event listener for the click event on the polyline
        google.maps.event.addListener(routePath, 'click', function (event) {
            // Display an info window near the clicked polyline
            infoWindow.setPosition(event.latLng);
            infoWindow.open(map);
        });

        routePath.setMap(map);

        // Conditionally add markers for departure and arrival points
        if (index === 0) {
            // First leg, consider it as departure
            // var marker = new google.maps.Marker({
            //     position: { lat: leg.departurePoint.lat, lng: leg.departurePoint.lon },
            //     map: map,
            //     title: leg.departurePoint.commonName
            // });
            var marker = new google.maps.Marker({
                position: userLocation,
                map: map,
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 7,
                  fillOpacity: 1,
                  strokeWeight: 2,
                  fillColor: '#5384ED',
                  strokeColor: '#ffffff',
                },
              });
        } else if (index === legs.length - 1) {
            // Last leg, consider it as arrival
            var marker = new google.maps.Marker({
                position: { lat: leg.arrivalPoint.lat, lng: leg.arrivalPoint.lon },
                map: map,
                title: leg.arrivalPoint.commonName
            });
        } else {
            // Use a different representation (e.g., point) for midpoints
            renderMidpointOnMap(map, leg);
        }
    });
    map.fitBounds(bounds);
}

function renderMidpointOnMap(map, leg) {
    var midpointMarker = new google.maps.Circle({
        strokeColor: '#FFFFFF',
        strokeOpacity: 1.0,
        strokeWeight: 2,
        fillColor: '#808080',
        fillOpacity: 0.8,
        map: map,
        center: { lat: leg.departurePoint.lat, lng: leg.departurePoint.lon },
        radius: 10 
    });
}

function saveSearch() {
    var departure = document.getElementById('departure').value;
    var arrival = document.getElementById('arrival').value;
    console.log('Departure:', departure);
    console.log('Arrival:', arrival);
    alert('Save search button clicked');

}   

function authenticate() {
    var modal = document.getElementById('auth');
    modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
}

