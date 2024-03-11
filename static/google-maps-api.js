var map;
var selectedMarker = null;
var selectedPlace = null;
var markers = [];
var selectedAccessibility = null;
var userLocation = null;
var currentJourney = null;
var user = null;

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
                document.getElementById('departure').value = userLocation.lat + ', ' + userLocation.lng;
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
    
    // Show custom-options only when 'custom' is selected
    if (selectedAccessibility === 'custom') {
        document.getElementById('custom-options').style.display = 'block';
    }
    else {
        document.getElementById('custom-options').style.display = 'none';
    }
}

function selectCustomAccessibility(buttonId) {
    var button = document.getElementById(buttonId);

    // Toggle the 'selected' class on the button
    button.classList.toggle('custom-selected');
}

function searchPlaces() {
    
    showSpinner();

    currentJourney = null;
    var arrival = document.getElementById('arrival').value;

    // Create a Places Service instance
    var location = (userLocation) ? userLocation.lat + ',' + userLocation.lng : '51.509865,-0.138092';
    var searchPlacesUrl = PLACES_API_URL + `/api/lookup_places?input=${encodeURI(arrival)}&location=${location}`;
    // var searchPlacesUrl = `http://accessable-maps-places.centralus.azurecontainer.io/api/lookup_places?input=${encodeURI(arrival)}&location=${location}`;
    console.log('Search Places URL:', searchPlacesUrl);

    // Make a fetch request to the API
    fetch(searchPlacesUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(results => {
        // Clear existing markers on the map
        clearMarkers();
        map = new google.maps.Map(document.getElementById('map'));
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
            selectedPlace = results[0];
          } else {
            // If multiple results, fit the bounds to all results
            var bounds = new google.maps.LatLngBounds();
            for (var i = 0; i < results.length; i++) {
              bounds.extend(results[i].geometry.location);
            }
            map.fitBounds(bounds);
          }
        }
        hideSpinner();
    })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while fetching data. Please try with another search');
        hideSpinner();
    });

    closeDiv('itinerary-container');
}

// Function to clear existing markers from the map
function clearMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
    closeDiv('info-display');
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
        selectedPlace = place;
    });

    markers.push(marker);
}

// Function to open info div with custom information
function openInfoDiv(place) {

    var infoDiv = document.getElementById('info-display');
    var placeName = document.getElementById('place-name');
    var placeAddress = document.getElementById('place-address');
    var placeImage = document.getElementById('place-image');
    var placePhone = document.getElementById('place-phone');
    var placeRating = document.getElementById('place-rating');
    var placeWebsite = document.getElementById('place-website');
    var placeHours = document.getElementById('place-hours');
    
    placeName.innerHTML = place.details.name;
    placeAddress.innerHTML = place.details.formatted_address;
    placePhone.innerHTML = place.details.formatted_phone_number;
    placeRating.innerHTML = place.rating + ' out of 5';
    placeWebsite.href = place.details.website
    placeWebsite.textContent = place.details.website;

    // Check if the place has photos    
    if (place.photo_url !== null) {
        placeImage.src = place.photo_url;
        placeImage.style.display = 'block';
    } else {
        // If there's no photo, hide the image element
        placeImage.style.display = 'none';
    }

    var sectionHeight = document.getElementById('arrival-container').offsetHeight;
    var sectionTop = document.getElementById('arrival-container').offsetTop;
    infoDiv.style.display = 'block';
    infoDiv.style.top = sectionTop + sectionHeight + 10 + 'px';
}

// Function to close div
function closeDiv(id) {
    var Div = document.getElementById(id);
    Div.style.display = 'none';

    if (id === 'auth') {
        var email = document.getElementById('email');
        var password = document.getElementById('password');
        email.value = '';
        password.value = '';
    }
    else if (id === 'reviews') {
        document.getElementById('review-text').value = '';
        resetStarColors();
    }
}

function planJourney() {

    if (userLocation === null) {
        alert('Your location is not available. Please enable location services or enter a departure location.');
        return;
    }
    else {
        showSpinner();

        if (selectedAccessibility === 'custom') {
            // Get the current selection of the custom accessibility parameters
            var customAccessParams = document.querySelectorAll('.access-param.custom-selected');
            var values = Array.from(customAccessParams).map(button => button.getAttribute('data-value'));
            var joinedValues = values.join(',');
        }
        else if (selectedAccessibility === 'wheelchair') {
            var joinedValues = 'noSolidStairs,noEscalators,stepFreeToVehicle,stepFreeToPlatform';
        }
        else if (selectedAccessibility === 'cane') {
            var joinedValues = 'noSolidStairs';
        }

        // Get the coordinates
        var destinationLatLng = selectedMarker.getPosition();
        var arrival = destinationLatLng.lat() + ',' + destinationLatLng.lng();
        var departure = userLocation.lat + ',' + userLocation.lng;

        // Construct the URL with the entered locations
        var publiTransportUrl = `https://public-transport-planner.azurewebsites.net/api/journey?departure=${departure}&arrival=${arrival}&accessibility=${joinedValues}`;
        
        // Make a fetch request to the API
        fetch(publiTransportUrl)
            .then(response => response.json())
            .then(data => {
                currentJourney = data;
                renderJourney(data.legs);
                showItinerary(data.legs, data.duration);
                hideSpinner();
            })
            .catch(error => {
                hideSpinner();
                console.error('Error:', error);
                alert('An error occurred while fetching data. Please try with another location.');
            });

        // Hide the info div
        closeDiv('info-display');
    }
}

function showItinerary(legs, duration) {
    var itineraryContainer = document.getElementById('itinerary-container');

    // Clear previous itinerary if any
    itineraryContainer.innerHTML = '';

    // Create a button to go back to info
    var backButton = document.createElement('button');
    backButton.classList.add('back-button');
    backButton.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
    backButton.onclick = backToInfo;
    itineraryContainer.appendChild(backButton);

    // Create a heading for the itinerary
    var heading = document.createElement('div');
    heading.id = 'itinerary-heading';
    heading.textContent = 'Directions (ETA: ' + duration + ' minutes)';
    itineraryContainer.appendChild(heading);

    var sectionHeight = document.getElementById('arrival-container').offsetHeight;
    var sectionTop = document.getElementById('arrival-container').offsetTop;
    itineraryContainer.style.display = 'flex';
    itineraryContainer.style.flexDirection = 'column';
    itineraryContainer.style.top = sectionTop + sectionHeight + 10 + 'px';

    // Iterate through each leg and create details
    legs.forEach(function(leg, index)  {
        var legContainer = document.createElement('div');
        legContainer.style.display = 'flex';
        legContainer.style.alignItems = 'center';
        legContainer.classList.add('leg');

        // icon container
        var iconContainer = document.createElement('div');
        iconContainer.style.width = '30px';
        iconContainer.style.height = '30px';
        iconContainer.style.borderRadius = '50%';
        iconContainer.style.display = 'flex';
        iconContainer.style.alignItems = 'center';
        iconContainer.style.justifyContent = 'center';
        iconContainer.style.marginRight = '10px';

        // icon
        var icon = document.createElement('i');
        if (leg.mode === 'walking') {
            icon.classList.add('fa-solid', 'fa-person-walking');
        } 
        else if (leg.mode === 'bus') {
            icon.classList.add('fa-solid', 'fa-bus');
        }
        else {
            icon.classList.add('fa-solid', 'fa-train-subway');
        }
        iconContainer.appendChild(icon);
        legContainer.appendChild(iconContainer);

        var summary = document.createElement('span');
        summary.textContent = leg.summary;
        legContainer.appendChild(summary);

        itineraryContainer.appendChild(legContainer);

        if (index !== legs.length - 1) {
            var dots = document.createElement('div');
            dots.classList.add('dots');
            dots.style.display = 'block';
            var dotsIcon = document.createElement('i');
            dotsIcon.classList.add('fa-solid', 'fa-ellipsis-vertical');
            dots.appendChild(dotsIcon);
            itineraryContainer.appendChild(dots);
        }
        
    });
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
        
        if (index === legs.length - 1) {
            // Last leg, consider it as arrival
            var marker = new google.maps.Marker({
                position: { lat: leg.arrivalPoint.lat, lng: leg.arrivalPoint.lon },
                map: map,
                title: leg.arrivalPoint.commonName
            });
        } else {
            // Use a different representation (e.g., point) for midpoints
            var midpointMarker = renderMidpointOnMap(map, leg);

            // Add event listener for zoom changes to adjust midpoint marker radius
            google.maps.event.addListener(map, 'zoom_changed', function() {
                var newRadius = 20 * Math.pow(2, 15 - map.getZoom()); // Adjust the scaling factor as needed
                midpointMarker.setRadius(newRadius);
            });
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
        center: { lat: leg.arrivalPoint.lat, lng: leg.arrivalPoint.lon },
        radius: 20 
    });

    return midpointMarker;
}

function saveSearch() {
    var departure = document.getElementById('departure').value;
    var arrival = document.getElementById('arrival').value;
    console.log('Departure:', departure);
    console.log('Arrival:', arrival);
    alert('Save search button clicked');

}   

function authenticate() {
    // if user is logged in, show user info
    if (user) {
        var modal = document.getElementById('user-info');
        if (modal.style.display === 'block') {
            modal.style.display = 'none';
        }
        else {
            userProfile()
        }
    }
    else { // if user is not logged in, show login form
        var modal = document.getElementById('auth');
        modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
    }
}

function backToInfo() {
    openInfoDiv(selectedPlace);
    closeDiv('itinerary-container');
}

async function viewReviews() {
    var reviewsDiv = document.getElementById('review-list');
    reviewsDiv.innerHTML = '';

    // Get the reviews for the selected place
    showSpinner();
    var placeId = selectedPlace.place_id;
    var reviewsUrl = PLACES_API_URL + `/api/reviews/place_id?place_id=${placeId}`;
    // var reviewsUrl = `http://accessable-maps-places.centralus.azurecontainer.io/api/reviews/place_id?place_id=${placeId}`;
    fetch(reviewsUrl) 
        .then(response => response.json())
        .then(data => { 
            renderReviews(data);
            console.log('Reviews:', data);
            hideSpinner();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while fetching reviews. Please try again later.');
            hideSpinner();
        });

    var reviewsDiv = document.getElementById('reviews');
    reviewsDiv.style.display = 'block';
}

function renderReviews(reviews) {
    var reviewsDiv = document.getElementById('review-list');
    reviewsDiv.innerHTML = '';

    if (reviews.length > 0) {
        reviews.forEach(function (review) {
            var reviewDiv = document.createElement('div');
            reviewDiv.classList.add('review');
            
            // Stars
            var starsDiv = document.createElement('div');
            starsDiv.classList.add('stars');
            for (var i = 1; i <= 5; i++) {
                var star = document.createElement('i');
                star.classList.add('fa', 'fa-star');
                if (i <= review.rating) {
                    star.classList.add('checked');
                }
                starsDiv.appendChild(star);
            }
            reviewDiv.appendChild(starsDiv);

            // Comment
            var reviewText = document.createElement('div');
            reviewText.classList.add('comment');
            reviewText.textContent = '"' + review.review + '"';
            reviewDiv.appendChild(reviewText);

            // User Email
            var userEmail = document.createElement('div');
            userEmail.classList.add('user-email');
            userEmail.textContent = review.user_email;
            reviewDiv.appendChild(userEmail);

            reviewsDiv.appendChild(reviewDiv);
    });
    } else {    
        var noReviews = document.createElement('div');
        noReviews.classList.add('no-reviews');
        noReviews.textContent = 'No reviews available for this place';
        reviewsDiv.appendChild(noReviews);
    }
}

function changeColor(clickedIndex) {
    const stars = document.querySelectorAll('.star-rating .fa-star');

    for (let i = 0; i < stars.length; i++) {
        if (i < clickedIndex) {
        stars[i].classList.add('checked');
        } else {
        stars[i].classList.remove('checked');  // Reset color for stars after the clicked one
        }
    }
}

async function sendPostRequest(rating, review, place_id, email, place_name) {
    console.log('Sending POST request:' + rating + review + place_id + email, place_name);

    // API endpoint URL
    // var apiUrl = 'http://accessable-maps-places.centralus.azurecontainer.io/api/reviews';
    var apiUrl = PLACES_API_URL + `/api/reviews`;

    // Data to be sent in the request body
    var postData = {
        rating: rating,
        review: review,
        user_email: email,
        place_id: place_id,
        place_name: place_name
    };

    // Additional options for the fetch request
    var requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Add any other headers if needed
        },
        body: JSON.stringify(postData)
    };

    try {
        // Send the POST request
        const response = await fetch(apiUrl, requestOptions);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        // Handle the response data as needed
        console.log('Post request successful:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function submitReview(event) {
    event.preventDefault(); // Prevents the default form submission behavior

    if (!user) {
        alert('You need to be logged in to submit a review');
    }
    else {
        // Get the values from the form
        var reviewText = document.getElementById('review-text').value;
        var rating = document.querySelectorAll('.star-rating .fa-star.checked').length;

        if (rating === 0) {
            alert('Please enter a star rating (required) and a review text.');
            return;
        }

        showSpinner();
        // Post call to submit review
        await sendPostRequest(rating, reviewText, selectedPlace.place_id, user, selectedPlace.details.name);

        // Reload reviews and clear fields
        await viewReviews();
        document.getElementById('review-text').value = '';
        resetStarColors();
        hideSpinner();
    }
}

function resetStarColors() {
    const stars = document.querySelectorAll('.star-rating .fa-star');

    for (let i = 0; i < stars.length; i++) {
        stars[i].classList.remove('checked');
    }
}

function login(event) {
    event.preventDefault();
    console.log('Login button clicked'); 
    // TODO set user to logged in user
        user = document.getElementById('email').value;
        closeDiv('auth');
        // login successful, show user info
        userProfile();
    }

function register() {
    console.log('Register button clicked');
    // TODO if registration is successful, set user to logged in users
    user = document.getElementById('email').value;
    closeDiv('auth');
    // registration successful, show user info
    userProfile();
}

function userProfile() {
    var userInfo = document.getElementById('user-info');
    userInfo.style.display = 'block';

    document.getElementById('user-email-display').textContent = 'Welcome, ' + user;

    showUserReviews();
}

function showUserReviews() {
    var userReview = document.getElementById('userReviews');
    userReview.classList.add('selected');

    var userReview = document.getElementById('userSaved');
    userReview.classList.remove('selected');

    // Get the reviews for the selected place
    showSpinner();
    // var reviewsUrl = `http://accessable-maps-places.centralus.azurecontainer.io/api/reviews/user?user_email=${user}`;
    var reviewsUrl = PLACES_API_URL + `/api/reviews/user?user_email=${user}`;
    fetch(reviewsUrl) 
        .then(response => response.json())
        .then(data => { 
            renderUserReviews(data);
            hideSpinner();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while fetching reviews. Please try again later.');
            hideSpinner();
        });
}

function renderUserReviews(reviews) {
    var reviewsDiv = document.getElementById('user-view');
    reviewsDiv.innerHTML = '';

    if (reviews.length > 0) {
        reviews.forEach(function (review) {
            var reviewDiv = document.createElement('div');
            reviewDiv.classList.add('review');

            // Place name
            var placeName = document.createElement('div');
            placeName.classList.add('place-name');
            placeName.textContent = review.place_name;
            placeName.style.fontWeight = 'bold';
            placeName.style.marginBottom = '5px';
            reviewDiv.appendChild(placeName);
            
            // Stars
            var starsDiv = document.createElement('div');
            starsDiv.classList.add('stars');
            for (var i = 1; i <= 5; i++) {
                var star = document.createElement('i');
                star.classList.add('fa', 'fa-star');
                if (i <= review.rating) {
                    star.classList.add('checked');
                }
                starsDiv.appendChild(star);
            }
            reviewDiv.appendChild(starsDiv);

            // Comment
            var reviewText = document.createElement('div');
            reviewText.classList.add('comment');
            reviewText.textContent = '"' + review.review + '"';
            reviewDiv.appendChild(reviewText);

            reviewsDiv.appendChild(reviewDiv);
    });
    } else {    
        var noReviews = document.createElement('div');
        noReviews.classList.add('no-reviews');
        noReviews.textContent = "You haven't submitted any reviews yet.";
        reviewsDiv.appendChild(noReviews);
    }
}

function logout() {
    user = null;
    var userInfo = document.getElementById('user-info');
    userInfo.style.display = 'none';

    var auth = document.getElementById('auth');
    auth.style.display = 'block';
}

function showUserSaved() {
    // TODO fetch user saved searches
    var userSaved = document.getElementById('userSaved');
    userSaved.classList.add('selected');

    var userReview = document.getElementById('userReviews');
    userReview.classList.remove('selected');

    var reviewsDiv = document.getElementById('user-view');
    reviewsDiv.innerHTML = '';
    reviewsDiv.textContent = 'No saved searches yet (coming soon)'; 

    console.log('Show user saved searches');
}