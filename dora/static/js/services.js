var doraServices = angular.module('doraServices', []);

doraServices.service('QRSServ', [
	function(){
		var historyLimit = 10;
		var QRSHistory = [];
		return {
			addToQRSHistory: function(QRS){
				//Limiting size of QRSHistory
				while (QRSHistory.length >= historyLimit){
					QRSHistory.shift();
				}
				QRSHistory.push(QRS);
			},
			removeFromQRSHistory: function(QRS){
				var index;
				if (QRS === parseInt(QRS)) {
					index = QRS;
				} else {
					index = QRSHistory.indexOf(QRS);
				}

				if (index > -1) {
					QRSHistory.splice(index, 1);
				}
			},
			getQRSHistory: function(){
				return QRSHistory;
			},
			getQRSCoordinates: function(QRS){
				var coordinates = [];
				for(index in QRS.assigned) {
					var encounter = QRS.assigned[index];
					coordinates.push(encounter.location.coords);
				}
				return coordinates;
			},
			unionQRSHistory: function(unionList){
				//Initialize data structures
				var unionQRS = {};
				unionQRS.assigned = [];
				unionQRS.unassigned = [];

				for (var i=0; i<unionList.length;i++) {
				if (unionList[i] >= QRSHistory.length) { return 0; } //if the given list is faulty, we don't do anything, and return a 0.
					var assignedList = QRSHistory[unionList[i]].assigned;
					var unassignedList = QRSHistory[unionList[i]].unassigned;
					for (var j=0; j<assignedList.length; j++) { //loop through array of objects with coordinates in the given Historical QRS
						unionQRS.assigned.push(assignedList[j]);
					}
					for (var j=0; j<unassignedList.length; j++) { //loop through array of objects with coordinates in the given Historical QRS
						unionQRS.unassigned.push(unassignedList[j]);
					}
				}
				QRSHistory.push(unionQRS);
				return unionQRS;
			},
			intersectQRSHistory: function(intersectList){
				//set up datastructures
				var intersectQRS = {};
				intersectQRS.assigned = [];
				intersectQRS.unassigned = [];
				var hashTable = {};
				hashTable.assigned = {};
				hashTable.unassigned = {};

				var populateHashTable = function(list, flag) {
					for (var j=0; j<list.length; j++) {
						if (hashTable[flag][list[j].patient.uuid] == null) {
							hashTable[flag][list[j].patient.uuid] = 1;
						} else {
							hashTable[flag][list[j].patient.uuid] += 1;
						}
					}
				};

				var populateIntersectQRS = function(list, flag) {
					for (var j=0; j<list.length; j++) {
						if (hashTable[flag][list[j].patient.uuid] == intersectList.length) {
							intersectQRS[flag].push(list[j]);
						}
					}
				};

				//Run through once to look at how many times each item is seen and store in hashtable
				for (var i=0; i<intersectList.length;i++) {
					if (intersectList[i] >= QRSHistory.length) { return 0; } //if the given list is faulty, we don't do anything, and return a 0.
					var assignedList = QRSHistory[intersectList[i]].assigned;
					var unassignedList = QRSHistory[intersectList[i]].unassigned;
					populateHashTable(assignedList, 'assigned');
					populateHashTable(unassignedList, 'unassigned');
				}

				//Add to list of objects iff uuid number_seen === intersectList.length
				for (var i=0; i<intersectList.length;i++) {
					var assignedList = QRSHistory[intersectList[i]].assigned;
					var unassignedList = QRSHistory[intersectList[i]].unassigned;
					populateIntersectQRS(assignedList, 'assigned');
					populateIntersectQRS(unassignedList, 'unassigned');	
				}

				QRSHistory.push(intersectQRS);

				return intersectQRS;
			}
		};
	}
]);

doraServices.service('MapServ', [
	function(){
		OpenLayers.ImgPath = '/static/ol2/img/';
		
		var map = new OpenLayers.Map({
	    div: "map",
	    controls: [
	        new OpenLayers.Control.Navigation({
	            dragPanOptions: {
	                enableKinetic: true
	            }
	        }),
	        new OpenLayers.Control.Attribution(),
	        new OpenLayers.Control.Zoom({
	        	zoomInId: "customZoomIn",
	          zoomOutId: "customZoomOut"
	        })
	    ],
	    layers: [
	    // new OpenLayers.Layer.OSM("OSM (with buffer)", null, {buffer: 2}),
	      new OpenLayers.Layer.OSM("OSM (without buffer)", null, {wrapDateLine: false})
	    ]
		});

		var center = [0,0];
		var zoom = 2;
		map.setCenter(center, zoom);
		
		var clusterStrategy = new OpenLayers.Strategy.Cluster();

		var clusterMarkerStyle = new OpenLayers.StyleMap({
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

		return {
			generatePoints: function(coordinates) {
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

			  var vectorLayer = new OpenLayers.Layer.Vector('Vectorlayer',{
					styleMap: clusterMarkerStyle,
					strategies: [clusterStrategy]
			  });

			  map.addLayer(vectorLayer);
			  vectorLayer.addFeatures(features);

			  return vectorLayer; // for testability
			}
		}
	}
]);