/* eslint no-var: 0 */
/* eslint-env: browser */
/* global fetch, L */
fetch('location.json', { credentials: 'same-origin' })
  .then(function (response) { return response.json(); })
  .then(function (location) {
    // initialize the map
    var map = L.map('map').setView([0, 0], 2);
    var saucers = document.getElementById('saucers');

    // load a tile layer
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Tiles by <a href="https://mapc.org">MAPC</a>, Data by <a href="https://mass.gov/mgis">MassGIS</a>',
      accessToken: 'pk.eyJ1IjoiaGFsa2V5ZSIsImEiOiJjaXRtamdscXYwMW9lMnhwYzBoM2Z3M2FkIn0.x71hu_4PU9_nDRYiiJ2YGg',
      id: 'mapbox.streets',
      maxZoom: 10,
      minZoom: 1
    }).addTo(map);

    var markers = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: false,
      singleMarkerMode: true
    });
    location
      .filter(function (location) { return !!location[0]; })
      .forEach(function (location) {
        var title = location[0] + ': ' + location[1];
        for (const i of Array(parseInt(location[1], 10)).keys()) {
          var marker = L.marker(L.latLng(location[2], location[3]), { title: title, instance: i });
          marker.bindPopup(title);
          markers.addLayer(marker);
        }

        var div = document.createElement('li');
        div.appendChild(document.createTextNode(title));
        saucers.appendChild(div);
      });

    map.addLayer(markers);
  });
