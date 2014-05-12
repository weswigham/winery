var pids = [];

function createPhotoMarker(place, map, service) {
  
  var photos = place.photos;

  var ico = photos ? photos[0].getUrl({'maxWidth': 35, 'maxHeight': 35}) : null;
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location,
    title: place.name,
    icon: ico
  });
  
  var request = {
    reference: place.reference
  }
  
  google.maps.event.addListener(marker, 'click', function() {
    service.getDetails(request, function(data, status) {
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        marker.setMap(null);
        createPhotoMarker(data, map, service)
        console.log(data);
      }
    })
  });
}

function pidInPids(str) {
  for (var i=0; i<pids.length; i++) {
    var obj = pids[i];
    if (obj==str) {
      return true;
    }
  }
  
  return false;
}

function initialize() {
  var mapOptions = {
    center: new google.maps.LatLng(44.5, -0.36), //France-ish
    zoom: 12
  };
  var map = new google.maps.Map(document.getElementById("map-canvas"),
                                mapOptions);

  var service = new google.maps.places.PlacesService(map);
  
  function searchArea() {
    var request = {
      bounds: map.getBounds(),
      keyword: 'vineyard'
    };

    service.radarSearch(request, function(results, status, pagination) {
      if (!results)
        return;
      
      for (var i=0;i<results.length;i++){
        var ref = results[i].geometry.location;
        var posStr = 'A:'+ref.A +' k:'+ ref.k;
        if (!pidInPids(posStr)) {
          //console.log(ref);
          pids.push(posStr);
          createPhotoMarker(results[i], map, service);
        }
      }
    });
  }
  
  google.maps.event.addListener(map, 'bounds_changed', searchArea);
}
google.maps.event.addDomListener(window, 'load', initialize);