var TILE_SIZE = 256;

//Mercator --BEGIN--
function bound(value, opt_min, opt_max) {
    if (opt_min !== null) value = Math.max(value, opt_min);
    if (opt_max !== null) value = Math.min(value, opt_max);
    return value;
}

function degreesToRadians(deg) {
    return deg * (Math.PI / 180);
}

function radiansToDegrees(rad) {
    return rad / (Math.PI / 180);
}

function MercatorProjection() {
    this.pixelOrigin_ = new google.maps.Point(TILE_SIZE / 2,
    TILE_SIZE / 2);
    this.pixelsPerLonDegree_ = TILE_SIZE / 360;
    this.pixelsPerLonRadian_ = TILE_SIZE / (2 * Math.PI);
}

MercatorProjection.prototype.fromLatLngToPoint = function (latLng,
opt_point) {
    var me = this;
    var point = opt_point || new google.maps.Point(0, 0);
    var origin = me.pixelOrigin_;

    point.x = origin.x + latLng.lng() * me.pixelsPerLonDegree_;

    // NOTE(appleton): Truncating to 0.9999 effectively limits latitude to
    // 89.189.  This is about a third of a tile past the edge of the world
    // tile.
    var siny = bound(Math.sin(degreesToRadians(latLng.lat())), - 0.9999,
    0.9999);
    point.y = origin.y + 0.5 * Math.log((1 + siny) / (1 - siny)) * -me.pixelsPerLonRadian_;
    return point;
};

MercatorProjection.prototype.fromPointToLatLng = function (point) {
    var me = this;
    var origin = me.pixelOrigin_;
    var lng = (point.x - origin.x) / me.pixelsPerLonDegree_;
    var latRadians = (point.y - origin.y) / -me.pixelsPerLonRadian_;
    var lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2);
    return new google.maps.LatLng(lat, lng);
};

//Mercator --END--


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
        if (ico) {
          if (place.website) {
            window.location = place.website;
          }
        } else {
          marker.setMap(null);
          createPhotoMarker(data, map, service);
        }
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

function getNewRadius(map, rad) {
  var numTiles = 1 << map.getZoom();
  var center = map.getCenter();
  var moved = google.maps.geometry.spherical.computeOffset(center, 10000, 90); /*1000 meters to the right*/
  var projection = new MercatorProjection();
  var initCoord = projection.fromLatLngToPoint(center);
  var endCoord = projection.fromLatLngToPoint(moved);
  var initPoint = new google.maps.Point(
    initCoord.x * numTiles,
    initCoord.y * numTiles);
   var endPoint = new google.maps.Point(
    endCoord.x * numTiles,
    endCoord.y * numTiles);
  var pixelsPerMeter = (Math.abs(initPoint.x-endPoint.x))/10000.0;
  var totalPixelSize = Math.floor(rad*pixelsPerMeter);
  return totalPixelSize;
}

var places = new google.maps.MVCArray([]);

function initialize() {
  var mapOptions = {
    center: new google.maps.LatLng(44.5, -0.36), //France-ish
    //mapTypeId: google.maps.MapTypeId.SATELLITE,
    zoom: 10
  };
  var map = new google.maps.Map(document.getElementById("map-canvas"),
                                mapOptions);

  var service = new google.maps.places.PlacesService(map);
  var heat_radius = 8250;
  
  var heatmap = new google.maps.visualization.HeatmapLayer({
    data: places,
    radius: getNewRadius(map, heat_radius)
  });
  heatmap.setMap(map);
  
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
          places.push(ref);
          createPhotoMarker(results[i], map, service);
        }
      }
    });
  }
  
  google.maps.event.addListener(map, 'bounds_changed', searchArea);
  
  google.maps.event.addListener(map, 'zoom_changed', function () {
          heatmap.setOptions({radius:getNewRadius(map, heat_radius)});
  });
}
google.maps.event.addDomListener(window, 'load', initialize);