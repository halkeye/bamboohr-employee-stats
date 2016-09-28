/* eslint no-var: 0 */
/* eslint-env: browser */
/* global fetch, L */
fetch('location.json')
  .then(function(response) { return response.json(); })
  .then(function(location) {
    // initialize the map
    var map = L.map('map').setView([0,0], 2);
    var saucers = document.getElementById('saucers');

    // load a tile layer
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Tiles by <a href="https://mapc.org">MAPC</a>, Data by <a href="https://mass.gov/mgis">MassGIS</a>',
      accessToken: 'pk.eyJ1IjoiaGFsa2V5ZSIsImEiOiJjaXRtamdscXYwMW9lMnhwYzBoM2Z3M2FkIn0.x71hu_4PU9_nDRYiiJ2YGg',
      id: 'mapbox.streets',
      maxZoom: 18,
      minZoom: 1
    }).addTo(map);

    var circles = location.filter(function(location) { return !!location[0]; }).map(function(location) {
      var div = document.createElement('li');
      div.appendChild(document.createTextNode(location[0] + ': ' + location[1]));
      saucers.appendChild(div);
      return L.circle([location[2], location[3]], location[1]*7000, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5
      }).addTo(map).bindPopup(location[0] + '\nSaucers: ' + location[1]);
    });

    var myZoom = {
      start:  map.getZoom(),
      end: map.getZoom()
    };

    map.on('zoomstart', function(e) {
      myZoom.start = map.getZoom();
    });

    map.on('zoomend', function(e) {
      myZoom.end = map.getZoom();
      circles.forEach(function(circle) {
        var diff = myZoom.start - myZoom.end;
        if (diff > 0) {
          circle.setRadius(circle.getRadius() * 2);
        } else if (diff < 0) {
          circle.setRadius(circle.getRadius() / 2);
        }
      });
    });
  });


