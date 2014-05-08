function initialize() {
  var mapOptions = {
    center: new google.maps.LatLng(44.5, -0.36), //France-ish
    zoom: 2
  };
  var map = new google.maps.Map(document.getElementById("map-canvas"),
                                mapOptions);
  
  map.data.setStyle({
    fillColor: 'red',
    strokeWeight: 1
  });
  map.data.loadGeoJson('vineyards.json');
  
  map.data.addListener('mouseover', function(event) {
        console.log(event.feature.getProperty('clc_00')); //Should always be 221 - Vineyard
  });

}
google.maps.event.addDomListener(window, 'load', initialize);