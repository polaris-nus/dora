var raster = new ol.layer.Tile({
  source: new ol.source.OSM()
});

var map = new ol.Map({
  layers: [raster],
  target:'map',
  renderer:'canvas',
  view: new ol.View({
    projection: 'EPSG:900913',
    center:[0,0],
    zoom:5
  })
});

function generatePoints(coordinates){
  var wktParser = new ol.format.WKT();

  var features = [];
  for (index in coordinates){
    var feature = wktParser.readFeature(coordinates[index], {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:900913'});
    console.log(feature.getGeometry().getType());
    console.log(feature.getGeometry().getExtent());
    console.log(feature.getGeometry().getFirstCoordinate());
    console.log(feature.getGeometry().getLastCoordinate());
    features.push(feature);
  }

  var featureSource = new ol.source.Vector({
    features: features
  });

  var clusterSource = new ol.source.Cluster({
    distance: 50,
    source: featureSource
  });

  var styleCache = {};
  var clusters = new ol.layer.Vector({
    source: clusterSource,
    style: function(feature, resolution) {
      var size = feature.get('features').length;
      var style = styleCache[size];
      if (!style) {
        style = [new ol.style.Style({
          image: new ol.style.Circle({
            radius: 10,
            stroke: new ol.style.Stroke({
              color: '#fff'
            }),
            fill: new ol.style.Fill({
              color: '#3399CC'
            })
          }),
          text: new ol.style.Text({
            text: size.toString(),
            fill: new ol.style.Fill({
              color: '#fff'
            })
          })
        })];
        styleCache[size] = style;
      }
      return style;
    }
  });

  map.addLayer(clusters);
}

