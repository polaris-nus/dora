var doraServices = angular.module('doraServices', []);

doraServices.service('QRSServ', [ 'MapServ',
	function(MapServ){
		var historyLimit = 10;
		var QRSHistory = [];
		return {
			addToQRSHistory: function (QRS){
				//Limiting size of QRSHistory
				while (QRSHistory.length >= historyLimit){
					MapServ.removeVectorLayer(QRSHistory.shift());
				}

				QRSHistory.push(QRS);
				MapServ.addVectorLayer(QRS);
				// RETURN BOOLEAN FOR ADD SUCCESS
			},
			removeFromQRSHistory: function(QRS){
				var index = QRSHistory.indexOf(QRS);

				if (index > -1) {
					QRSHistory.splice(index, 1)[0];
					MapServ.removeVectorLayer(QRS);
				}
			},
			getQRSHistory: function(){
				return QRSHistory;
			},
			unionQRSHistory: function(unionList){
				//Initialize data structures
				var unionQRS = {};
				unionQRS.assigned = [];
				unionQRS.unassigned = [];
				encounterHash = {};

				for (var i=0; i<unionList.length;i++) {
				if (unionList[i] >= QRSHistory.length) { return 0; } //if the given list is faulty, we don't do anything, and return a 0.
					var assignedList = QRSHistory[unionList[i]].assigned;
					var unassignedList = QRSHistory[unionList[i]].unassigned;
					for (var j=0; j<assignedList.length; j++) { //loop through array of objects with coordinates in the given Historical QRS
						var encounterUuid = assignedList[j].uuid;
						if (encounterHash[encounterUuid] != 1) {
							unionQRS.assigned.push(assignedList[j]);
							encounterHash[encounterUuid] = 1;
						}
					}
					for (var j=0; j<unassignedList.length; j++) { //loop through array of objects with coordinates in the given Historical QRS
						unionQRS.unassigned.push(unassignedList[j]);
					}
				}
				this.addToQRSHistory(unionQRS);
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
				encounterHash = {};

				//flag is either assigned or unassigned
				var populateHashTable = function(list, flag) {
					change = {}; //checks whether the current UUID has already been modified this round.
					for (var j=0; j<list.length; j++) {
						patientUuid = list[j].patient.uuid;
						if (hashTable[flag][patientUuid] == null) {
							hashTable[flag][patientUuid] = 1;
							change[patientUuid] = 1;
						} else {
							if (change[patientUuid] != 1) { //if this patientUuid has not been modified already
								hashTable[flag][list[j].patient.uuid] += 1;
								change[patientUuid] = 1; //make this patientUuid dirty
							}
						}
					}
				};

				//flag is either assigned or unassigned
				var populateIntersectQRS = function(list, flag) {
					for (var j=0; j<list.length; j++) {
						if (hashTable[flag][list[j].patient.uuid] == intersectList.length && encounterHash[list[j].uuid] != 1) {
							intersectQRS[flag].push(list[j]);
							encounterHash[list[j].uuid] = 1;
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

				this.addToQRSHistory(intersectQRS);
				console.log(JSON.stringify(intersectQRS));

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

		var wktParser = new OpenLayers.Format.WKT({
			externalProjection: 'EPSG:4326',  //from WSG84
			internalProjection: 'EPSG:900913' //to Spherical Mercator Projection
		});

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

		var polygonLayer = new OpenLayers.Layer.Vector("Polygon Layer");
		map.addLayer(polygonLayer);
		var drawPolygonControls = new OpenLayers.Control.DrawFeature(polygonLayer, OpenLayers.Handler.Polygon);
		map.addControl(drawPolygonControls);
		var modifyPolygonControls = new OpenLayers.Control.ModifyFeature(polygonLayer);
		map.addControl(modifyPolygonControls);

		modifyPolygonControls.mode = OpenLayers.Control.ModifyFeature.ROTATE;
		modifyPolygonControls.mode |= OpenLayers.Control.ModifyFeature.RESIZE;
		modifyPolygonControls.mode |= OpenLayers.Control.ModifyFeature.DRAG;

		return {
			addVectorLayer: function(QRS) {
				// Extract coordinates for encounters
				var coordinates = [];
				for(index in QRS.assigned) {
					var encounter = QRS.assigned[index];
					coordinates.push(encounter.location.coords);
				}
				// Create point markers given coordinates
				var features = [];
			  for (index in coordinates){
			    var vectorFeature = wktParser.read(coordinates[index]);
			    features.push(vectorFeature);
			  }

				var clusterStrategy = new OpenLayers.Strategy.Cluster();
			  var clusterLayer = new OpenLayers.Layer.Vector('clusterLayer',{
					styleMap: clusterMarkerStyle,
					strategies: [clusterStrategy]
			  });

			  var returnedLayers = {};

			  // Create clusterLayerId property to link QRS with respective cluster layer
			  QRS.clusterLayerId = clusterLayer.id;
			  map.addLayer(clusterLayer);
			  returnedLayers.clusterLayer = clusterLayer;
			  clusterLayer.addFeatures(features);
			  
			  // Check and create location polygon layer
			  if (QRS.locationFeature) {
			  	var locationFeature = wktParser.read(QRS.locationFeature);
			  	var locationLayer = new OpenLayers.Layer.Vector('locationLayer');
			  	QRS.locationLayerId = locationLayer.id;
			  	map.addLayer(locationLayer);
			  	returnedLayers.locationLayer = locationLayer;
			  	locationLayer.addFeatures(locationFeature);
			  }

			  return returnedLayers; // for testability

			},
			toggleVectorLayerVisibility: function(QRS) {
				if (QRS.clusterLayerId) {
					var clusterLayer = map.getLayer(QRS.clusterLayerId);
					clusterLayer.setVisibility(!clusterLayer.getVisibility());
				}
				if (QRS.locationLayerId) {
					var locationLayer = map.getLayer(QRS.locationLayerId);
					locationLayer.setVisibility(!locationLayer.getVisibility());
				}
			},
			removeVectorLayer: function(QRS) {
				if (QRS.clusterLayerId) {
					var clusterLayer = map.getLayer(QRS.clusterLayerId);
					clusterLayer.destroy();
				}
				if (QRS.locationLayerId) {
					var locationLayer = map.getLayer(QRS.locationLayerId);
					locationLayer.destroy();
				}
			},
			activatePolygonLayer: function() {
				drawPolygonControls.activate();
				polygonLayer.setVisibility(true);

				// undo/redo event handlers
				OpenLayers.Event.observe(document, "keydown", function(evt) {
					var handled = false;
					switch (evt.keyCode) {
				    case 90: // z
			        if (evt.metaKey || evt.ctrlKey) {
			            drawPolygonControls.undo();
			            handled = true;
			        }
				        break;
				    case 89: // y
			        if (evt.metaKey || evt.ctrlKey) {
			            drawPolygonControls.redo();
			            handled = true;
			        }
			        break;
				    case 27: // esc
			        drawPolygonControls.cancel();
			        handled = true;
			        break;
					}
					if (handled) {
					    OpenLayers.Event.stop(evt);
					}
				});
			},
			deactivatePolygonLayer: function() {
				drawPolygonControls.deactivate();
				polygonLayer.setVisibility(false);
				modifyPolygonControls.deactivate();
			},
			clearPolygonLayer: function() {		
				polygonLayer.removeAllFeatures();
			},
			activatePolygonModify: function() {
				drawPolygonControls.deactivate();
				modifyPolygonControls.activate();
			},
			deactivatePolygonModify: function() {
				this.activatePolygonLayer();
				modifyPolygonControls.deactivate();
			},
			getPolygons: function() { 
				return wktParser.write(polygonLayer.features);
			}
		}
	}
]);