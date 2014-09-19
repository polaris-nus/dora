var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  target:'map',
  renderer:'canvas',
  view: new ol.View({
    projection: 'EPSG:900913',
    center:[0,0],
    zoom:5
  })
});