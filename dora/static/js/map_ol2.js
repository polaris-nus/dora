OpenLayers.ImgPath = '/static/ol2/img/';

// Global variables
var map;

function init(){
	map = new OpenLayers.Map({
    div: "map",
    layers: [
      new OpenLayers.Layer.OSM("OSM (without buffer)"),
      // new OpenLayers.Layer.OSM("OSM (with buffer)", null, {buffer: 2})
    ],
    // controls: [
    //     new OpenLayers.Control.Navigation({
    //         dragPanOptions: {
    //             enableKinetic: true
    //         }
    //     }),
    //     new OpenLayers.Control.PanZoom(),
    //     new OpenLayers.Control.Attribution()
    // ],
    center: [0, 0],
    zoom: 3
});

// map.addControl(new OpenLayers.Control.LayerSwitcher());
}

function generatePoints(coordinates) {
	var wktParser = new OpenLayers.Format.WKT({
		externalProjection: 'EPSG:4326',  //from WSG84
		internalProjection: 'EPSG:900913' //to Spherical Mercator Projection
	});

	var features = [];
  for (index in coordinates){
    var vectorFeature = wktParser.read(coordinates[index])
    console.log(vectorFeature.geometry.getBounds());
    features.push(vectorFeature);
  }

  var clusterStrategy = new OpenLayers.Strategy.Cluster();
  var stylemap = new OpenLayers.StyleMap({
  	default: new OpenLayers.Style({
  		pointRadius: 10,
      fillColor: "#3399CC",
      fillOpacity: 1,
      strokeColor: "#fff",
      strokeWidth: 2,
      strokeOpacity: 1,
      graphicZIndex: 1,
      // Label styling
      label : "${count}",
                    
      fontColor: "#fff",
      fontSize: "12px",
      fontFamily: "Arial, sans serif",
      labelAlign: "cm",
  	}, {
  		context: {
  			count: function(feature) {
  				return feature.cluster ? feature.cluster.length : '1';
  			}
  		}
  	})
  });
  var vectorLayer = new OpenLayers.Layer.Vector(
  	'Vectorlayer',
  	{styleMap: stylemap, strategies: [clusterStrategy]}
  );
  vectorLayer.addFeatures(features);
  map.addLayer(vectorLayer);
  console.log('WHOOPEE');
}