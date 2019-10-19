// Store our API endpoint inside earthquakeURL
var earthquakeURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

// Store our API endpoint inside tectonicURL
var tectonicURL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json"

d3.json(earthquakeURL, function(earthquakeData)
  {
  d3.json(tectonicURL, function(tectonicData) 
    {
    var magnitude = earthquakeData.features.map(
      function(i) {return i.properties.mag}); 
    
    var color = d3.scaleLinear()
                  .domain([d3.min(magnitude),(d3.min(magnitude)+d3.max(magnitude))/2,d3.max(magnitude)])
                  .range(['green', 'yellow', 'red']);
    createFeatures(earthquakeData.features, tectonicData.features, color);
    })
});

function createFeatures(earthquakeData, tectonicData, color) 
{
  function onEachFeature(feature, layer) 
  {
    // information for each of the earthquake data points 
    layer.bindPopup(`<p>Coordinates: ${feature.geometry.coordinates[1]}, ${feature.geometry.coordinates[0]}<br>Place: ${feature.properties.place}<br>Magnitude: ${feature.properties.mag}</p>`);
  }

  var earthquakes=L.geoJSON(earthquakeData, 
  {
    pointToLayer: function(feature, latlng) 
    {
      return L.circleMarker(latlng, 
      {
        radius: feature.properties.mag *5,
        fillColor: color(feature.properties.mag),
        color: color(feature.properties.mag),
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
      }); 
    },

    onEachFeature: onEachFeature
  });
  var tectonicPlates = L.geoJSON(tectonicData, 
    {
    color: 'red',
    fill: false 
    }); 
  createMap(earthquakes, tectonicPlates, color);
}


function createMap(earthquakes, plateLayer, color) {
  // Adding a tile layer 
  var satellitemap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.satellite",
    accessToken: API_KEY
  }); 

  // Another tile layer
  var lightmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.outdoors", 
    accessToken: API_KEY
  }); 

  // Map Views
  var baseMaps = {
    "Satellite": satellitemap,
    "Map View": lightmap,
  };

  // Add-ons to the Maps (Earthquakes and Tectonic Plates)
  var overlayMaps = {
    "Earthquakes": earthquakes,
    "Tectonics Plates": plateLayer
  };

  var map = L.map("map", {
    maxBounds: [[-90,-180], [90,180]],
    center: [39.5383, -110.4322], 
    zoom: 5,
    layers: [satellitemap, earthquakes],
  });

  // add to method adds objects to our map
  L.control.layers(baseMaps, overlayMaps, 
  {
    collapsed: false
  }).addTo(map);

  var legend = L.control({position: 'bottomleft'});

  legend.onAdd = function(map) 
  {
    var div = L.DomUtil.create('div', 'info legend'),
      categories = [0, 1, 2, 3, 4, 5];

    for (var i = 0; i < categories.length; i++) 
    {
      div.innerHTML +=
      '<i style="background:' + color(categories[i] + 1) + '"></i> ' +
      categories[i] + (categories[i + 1] ? '&ndash;' + categories[i + 1] + '<br>' : '+');
    }   
  return div;
  };
  
  legend.addTo(map);

  map.on('overlayremove', function (eventLayer) 
  {
    if (eventLayer.name === 'Earthquakes & Tectonic Plates Map') 
    {
      this.removeControl(legend);
    }
  });

  map.on('overlayadd', function (eventLayer) 
  {

    if (eventLayer.name === 'Earthquakes & Tectonic Plates Map') 
    {
      legend.addTo(this)
    }
  });
};

