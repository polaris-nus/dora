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
    zoom:2
  })
});

function generatePoints(){
  var count = 10;
  var features = new Array(count);
  var e = 4500000;
  for (var i = 0; i < count; ++i) {
    var coordinates = [2 * e * Math.random() - e, 2 * e * Math.random() - e];
    features[i] = new ol.Feature(new ol.geom.Point(coordinates));
  }

  var source = new ol.source.Vector({
    features: features
  });

  var clusterSource = new ol.source.Cluster({
    distance: 40,
    source: source
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

