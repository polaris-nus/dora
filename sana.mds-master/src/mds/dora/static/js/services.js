var doraServices = angular.module('doraServices', []);

doraServices.service('QRSServ', [ 'MapServ', 'PaletteServ', '$http',
	function(MapServ, PaletteServ, $http){
		var historyLimit = 10;
		var QRSHistory = [];
		var QRSLoadingStatus = {isLoading: false};
		var onAddCallback = null;
		return {
			setOnAddCallback: function(callback) {
				onAddCallback = callback;
			},
			getLoadingStatus: function(){
				return QRSLoadingStatus;
			},
			initializeLoading: function(){
				QRSLoadingStatus.isLoading = true;
			},
			retrieveQRS: function(data){
				$http({
					method: 'POST',
					url: '/dora/query/',
					headers: {'Content-Type': 'application/x-www-form-urlencoded'},
					transformRequest: function(obj) {
						var str = [];
						for(var p in obj)
							str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
						return str.join("&");
					},
					data: data
				}).success(function(QRS) {
					QRS.locationFeature = location;
					this.addToQRSHistory(QRS);
					MapServ.clearPolygonLayer();
					QRSLoadingStatus.isLoading = false;
		
					// How to update these values! By reference?
					// location = "";
					// $scope.query = '';

				}).error(function(data){
					QRSLoadingStatus.isLoading = false;
					document.open();
					document.write(data);
					document.close();
				});

			},
			addToQRSHistory: function (QRS){
				QRSLoadingStatus.isLoading = false;

				//Limiting size of QRSHistory
				while (QRSHistory.length > (historyLimit-1)){
					var removedQRS = QRSHistory.shift();
					MapServ.removeVectorLayer(removedQRS);
					PaletteServ.releaseColor(removedQRS.color);
				}

				for(index in QRSHistory) {
					QRSHistory[index].isVisible = false;
					MapServ.setVectorLayerVisibility(QRSHistory[index], false);
				}

				QRS.color = PaletteServ.useNextColor();
				QRS.isVisible = true;
				QRSHistory.push(QRS);
				MapServ.addVectorLayer(QRS);

				onAddCallback(QRSHistory.length-1); // display last added QRS

				// RETURN BOOLEAN FOR ADD SUCCESS IF EMPTY DONT ADD!
			},
			removeFromQRSHistory: function(QRS){
				var index = QRSHistory.indexOf(QRS);

				if (index > -1) {
					QRSHistory.splice(index, 1);
					MapServ.removeVectorLayer(QRS);
					PaletteServ.releaseColor(QRS.color);
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
	      new OpenLayers.Layer.OSM("OSM (without buffer)", null, {wrapDateLine: true}),
	    ]
		});
		var center = [0,0];
		var zoom = 3;
		map.setCenter(center, zoom);

		var wktParser = new OpenLayers.Format.WKT({
			externalProjection: 'EPSG:4326',  //from WSG84
			internalProjection: 'EPSG:900913' //to Spherical Mercator Projection
		});

		var clusterMarkerStyle = new OpenLayers.StyleMap({
			default: new OpenLayers.Style({
				pointRadius: "${radius}",
			  fillColor: "${color}",
			  fillOpacity: 1,
			  strokeColor: "#fff",
			  strokeWidth: 2,
			  strokeOpacity: 1,
			  graphicZIndex: 2,
			  // Label styling
			  label : "${count}",
			                
			  fontColor: "#fff",
			  fontSize: "10px",
			  fontFamily: "Arial, sans serif",
			  labelAlign: "cm",
			}, {
				context: {
					count: function(feature) {
						return feature.cluster ? feature.cluster.length : '1';
					},
					radius: function(feature) {
						var pix = 8;
            if(feature.cluster) {
              pix = Math.min(feature.attributes.count, 7) + pix;
            }
            return pix;
					},
					color: function(feature) {
						if(feature.cluster) {
              return feature.cluster[0].attributes.featureColor;
            } else {
            	return feature.attributes.featureColor;
            }
            return 'black'; // should never be used!
					}
				}
			}),
			select: {
        fillColor: "#8aeeef",
        strokeColor: "#32a8a9"
      }
		});

		var polygonFilterStyle = new OpenLayers.StyleMap({
			default: new OpenLayers.Style({
			  fillColor: "${filterFillColor}",
			  fillOpacity: 0.4,
			  strokeColor: "${filterStrokeColor}",
			  strokeWidth: 2,
			  strokeOpacity: 1,
			  strokeDashstyle: "solid",
			  graphicZIndex: 1,
			})
		});

		var polygonFilterStyle = new OpenLayers.Style({
			fillColor: "#808080",
		  fillOpacity: 0.4,
		  strokeColor: "#808080",
		  strokeWidth: 2,
		  strokeOpacity: 1,
		  graphicZIndex: 1
		})

		var countryPolygonStyle = new OpenLayers.StyleMap({
			default: {
			  fillOpacity: 0,
			  strokeOpacity: 0,
			},
			select: polygonFilterStyle
		});

		var drawPolygonStyle = new OpenLayers.StyleMap({
			default: polygonFilterStyle
		});
		
		// Adding Utility Layers
		var countriesLayer = new OpenLayers.Layer.Vector("KML", {
      strategies: [new OpenLayers.Strategy.Fixed()],
      styleMap: countryPolygonStyle,
      protocol: new OpenLayers.Protocol.HTTP({
        url: "/static/kml/countriesM.kml",
        format: new OpenLayers.Format.KML({
          extractStyles: false, 
          extractAttributes: true,
          maxDepth: 2
        })
      })
    })
    map.addLayer(countriesLayer);
    // countriesLayer.setVisibility(true);

		var polygonLayer = new OpenLayers.Layer.Vector("Polygon Layer", {
			styleMap: drawPolygonStyle
		});
		map.addLayer(polygonLayer);
		
		// Adding Map Controls
		var drawPolygonControls = new OpenLayers.Control.DrawFeature(polygonLayer, OpenLayers.Handler.Polygon);
		map.addControl(drawPolygonControls);

		var polyOptions = {sides: 40};
		var drawRegularPolygonControls = new OpenLayers.Control.DrawFeature(polygonLayer, OpenLayers.Handler.RegularPolygon, {handlerOptions: polyOptions});
		map.addControl(drawRegularPolygonControls);
		
		var modifyPolygonControls = new OpenLayers.Control.ModifyFeature(polygonLayer);
		modifyPolygonControls.mode = OpenLayers.Control.ModifyFeature.ROTATE;
		modifyPolygonControls.mode |= OpenLayers.Control.ModifyFeature.RESIZE;
		modifyPolygonControls.mode |= OpenLayers.Control.ModifyFeature.DRAG;
		map.addControl(modifyPolygonControls);

		var selectClusterControls = new OpenLayers.Control.SelectFeature(new OpenLayers.Layer.Vector("stub"), {
			multiple: true,
			toggle: true,
			onSelect: function(feature) {
				selectedFeature = feature;
        popup = new OpenLayers.Popup.FramedCloud("clusterpopup", 
                     feature.geometry.getBounds().getCenterLonLat(),
                     null,
                     "<div style='font-size:.8em'>Feature: " + feature.id +"<br>Area: " + feature.geometry.getArea()+"</div>",
                     null, true, function(){
                     	selectClusterControls.unselect(selectedFeature);
                     });
        feature.popup = popup;
        map.addPopup(popup);
			},
			onUnselect: function(feature) {
				map.removePopup(feature.popup);
        feature.popup.destroy();
        feature.popup = null;
			}
		});
		map.addControl(selectClusterControls);
		selectClusterControls.activate();

		var selectCountryControls = new OpenLayers.Control.SelectFeature(countriesLayer, {
			multiple: true,
			toggle: true,
		});
		map.addControl(selectCountryControls);
		// selectCountryControls.activate();
		
		var visibleLayers = [];
		var slider = {};
		var clusterLayerFeatures = {};
		var clusterStrategyReferences = {};

		return {
			addVectorLayer: function(QRS) {
				var returnedLayers = {};

			  // Check and create location polygon layer
			  if (QRS.locationFeature) {
			  	var locationFeature = wktParser.read(QRS.locationFeature);
			  	if (locationFeature instanceof Array) {
			  		for(index in locationFeature) {
			  			locationFeature[index].attributes.filterFillColor = QRS.color.featureColor;
			  			locationFeature[index].attributes.filterStrokeColor = QRS.color.featureColor;
			  		}
			  	} else {
		  			locationFeature[index].attributes.filterFillColor = QRS.color.featureColor;
		  			locationFeature[index].attributes.filterStrokeColor = QRS.color.featureColor;
			  	}
			  	var locationLayer = new OpenLayers.Layer.Vector('locationLayer', {
			  		styleMap: polygonFilterStyle
			  	});
			  	QRS.locationLayerId = locationLayer.id;
			  	map.addLayer(locationLayer);
			  	returnedLayers.locationLayer = locationLayer;
			  	locationLayer.addFeatures(locationFeature);
			  }

				// Extract coordinates for encounters
				var coordinates = [];
				for(index in QRS.assigned) {
					var encounter = QRS.assigned[index];
					coordinates.push({coords: encounter.location.coords, created: encounter.created_date.split(' ')[0]});
				}
				// Create point markers given coordinates
				var features = [];
			  for (index in coordinates){
			    var vectorFeature = wktParser.read(coordinates[index].coords);
			    vectorFeature.attributes = {featureColor: QRS.color.featureColor, date: coordinates[index].created};
			    features.push(vectorFeature);
			  }

				features.sort(function (a,b) {
					dateA = Date.parse(a.attributes.date);
					dateB = Date.parse(b.attributes.date);
					if (dateA < dateB)
						return -1;
					if (dateA > dateB)
						return 1;
					return 0;
				});

				var clusterStrategy = new OpenLayers.Strategy.Cluster();
				clusterStrategy.distance = 30;
			  var clusterLayer = new OpenLayers.Layer.Vector('clusterLayer',{
					styleMap: clusterMarkerStyle,
					strategies: [clusterStrategy]
			  });
			  clusterStrategyReferences[clusterLayer.id] = clusterStrategy;

			  // Create clusterLayerId property to link QRS with respective cluster layer
			  QRS.clusterLayerId = clusterLayer.id;
			  map.addLayer(clusterLayer);
			  returnedLayers.clusterLayer = clusterLayer;
			  clusterLayer.addFeatures(features);

			  visibleLayers.push(clusterLayer.id);
			  clusterLayerFeatures[clusterLayer.id] = {};
			  clusterLayerFeatures[clusterLayer.id]['features'] = features;
			  clusterLayerFeatures[clusterLayer.id]['leftStack'] = [];
			  clusterLayerFeatures[clusterLayer.id]['rightStack'] = [];

			  this.temporalSliderFeaturesToggle();

			  // Adding layer to selectControls
			  var selectControlsLayers = selectClusterControls.layers || [selectClusterControls.layer];
			  selectControlsLayers.push(clusterLayer);
			  selectClusterControls.setLayer(selectControlsLayers);

			  return returnedLayers; // for testability

			},
			setClusterStrategyStatus: function(QRS, activate) {
				if(QRS.clusterLayerId) {
					var clusterStrategy = clusterStrategyReferences[QRS.clusterLayerId];
					activate ? clusterStrategy.activate() : clusterStrategy.deactivate();
					var clusterLayer = map.getLayer(QRS.clusterLayerId);
					clusterLayer.removeAllFeatures();
			  	clusterLayer.addFeatures(clusterLayerFeatures[QRS.clusterLayerId].features);
				}
			},
			setVectorLayerVisibility: function(QRS, visibility) {
				if (QRS.clusterLayerId) {
					var clusterLayer = map.getLayer(QRS.clusterLayerId);
					clusterLayer.setVisibility(visibility);
					if (clusterLayer.getVisibility()) {
						visibleLayers.push(QRS.clusterLayerId);
					} else if (visibleLayers.indexOf(QRS.clusterLayerId) != -1) {
						visibleLayers.splice(visibleLayers.indexOf(QRS.clusterLayerId),1);
					}
				}
				if (QRS.locationLayerId) {
					var locationLayer = map.getLayer(QRS.locationLayerId);
					locationLayer.setVisibility(visibility);
				}
			},
			removeVectorLayer: function(QRS) {
				if (QRS.clusterLayerId) {
					// Manual cleanup on selectClusterControls.layers
					var selectControlsLayers = selectClusterControls.layers || [selectClusterControls.layer];
					selectControlsLayers = selectControlsLayers.filter(
						function(element) {
							return element.id.localeCompare(QRS.clusterLayerId) !== 0
						}
					)
					selectClusterControls.setLayer(selectControlsLayers);

					//Manual cleanup on visibleLayers and clusterLayerFeatures
					visibleLayers = visibleLayers.filter(
						function(element) {
							return element.localeCompare(QRS.clusterLayerId) !== 0
						}
					)
					delete clusterLayerFeatures[QRS.clusterLayerId];

					var clusterLayer = map.getLayer(QRS.clusterLayerId);
					clusterLayer.destroy();

				}
				if (QRS.locationLayerId) {
					var locationLayer = map.getLayer(QRS.locationLayerId);
					locationLayer.destroy();
				}
			},
			activatePolygonFilters: function() {
				polygonLayer.setVisibility(true);
				countriesLayer.setVisibility(true);
			},
			deactivatePolygonFilters: function() {
				drawPolygonControls.deactivate();
				drawRegularPolygonControls.deactivate();
				modifyPolygonControls.deactivate();
				polygonLayer.setVisibility(false);
				countriesLayer.setVisibility(false);
			},
			clearPolygonLayer: function() {		
				polygonLayer.removeAllFeatures();
			},
			activateDrawPolygon: function() {
				drawRegularPolygonControls.deactivate();
				modifyPolygonControls.deactivate();
				selectCountryControls.deactivate();

				drawPolygonControls.activate();

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
			activateDrawCircle: function() {
				drawPolygonControls.deactivate();
				modifyPolygonControls.deactivate();
				selectCountryControls.deactivate();

				drawRegularPolygonControls.activate();
			},
			activateModifyPolygon: function() {
				drawPolygonControls.deactivate();
				drawRegularPolygonControls.deactivate();
				selectCountryControls.deactivate();

				modifyPolygonControls.activate();
			},
			activateSelectCountry: function(){
				drawPolygonControls.deactivate();
				modifyPolygonControls.deactivate();
				drawRegularPolygonControls.deactivate();

				selectCountryControls.activate();
			},
			getPolygonFilters: function() {
				polygonFilters = [];
				Array.prototype.push.apply(polygonFilters, polygonLayer.features);
				Array.prototype.push.apply(polygonFilters, countriesLayer.selectedFeatures);
				return wktParser.write(polygonFilters);
			},
			plotCentriod: function(QRS) {
				if (QRS.clusterLayerId) {
					var clusterLayer = map.getLayer(QRS.clusterLayerId);
					if(clusterLayer.getVisibility()) {
						var clusterGeometries = [];
						for(index in clusterLayer.features) {
							clusterGeometries.push(clusterLayer.features[index].geometry);
						}
						var geometryCollection = new OpenLayers.Geometry.Collection(clusterGeometries);
						var centroid = geometryCollection.getCentroid();
						// THEN DO WHAT?! put in new layer || put in clusterLayer (learn to customize cluster strategy)
					}
				}
			},
			setSliderMinMax: function(min, max) {
				slider.min = min;
				slider.max = max;
			},
			temporalSliderFeaturesToggle: function() {
				var minDate = Date.parse(slider.min);
				var maxDate = Date.parse(slider.max);

				function redrawFeatures(clusterLayer, features) {
					clusterLayer.removeAllFeatures();
			  	clusterLayer.addFeatures(features);
				}

				function peek(array) {
					if (array.length === 0) {return null}
					else {
						return array[array.length-1];
					}
				}

				function removeFeaturesLessThanMinDate(features,leftStack) {
					if (features.length != 0) {
						firstDate = Date.parse(features[0].attributes.date);
						while (features.length > 0 && firstDate < minDate) {
							leftStack.push(features.shift());
							if (features.length != 0) { firstDate = Date.parse(features[0].attributes.date); }
						}
					}
				}

				function addBackFromLeftStackMoreThanMinDate(features,LeftStack) {
					if (leftStack.length != 0) {
						leftStackTopDate = Date.parse(peek(leftStack).attributes.date);
						while (leftStack.length != 0 && leftStackTopDate >= minDate) {
							features.unshift(leftStack.pop());
							if (leftStack.length != 0) { leftStackTopDate = Date.parse(peek(leftStack).attributes.date); }
						}
					}
				}

				function removeFeaturesMoreThanMaxDate(features,rightStack) {
					if (features.length != 0) {
						lastDate = Date.parse(peek(features).attributes.date);
						while (features.length > 0 && lastDate > maxDate) {
							rightStack.push(features.pop());
							if (features.length != 0) { lastDate = Date.parse(peek(features).attributes.date); }
						}
					}
				}

				function addBackFromrightStackLessThanMaxDate(features,LeftStack) {
					if (rightStack.length != 0) {
						rightStackTopDate = Date.parse(peek(rightStack).attributes.date);
						while (rightStack.length != 0 && rightStackTopDate <= maxDate) {
							features.push(rightStack.pop());
							if (rightStack.length != 0) { rightStackTopDate = Date.parse(peek(rightStack).attributes.date); }
						}
					}
				}

				function toggleMarkerVisibility(clusterLayerId) {
					//DONE! -- Step 1: Take in temporal slider min max date.
					clusterLayer = map.getLayer(clusterLayerId);
					features = clusterLayerFeatures[clusterLayerId].features;
					leftStack = clusterLayerFeatures[clusterLayerId].leftStack;
					rightStack = clusterLayerFeatures[clusterLayerId].rightStack;

					removeFeaturesLessThanMinDate(features,leftStack);
					removeFeaturesMoreThanMaxDate(features,rightStack);
					addBackFromLeftStackMoreThanMinDate(features,leftStack);
					addBackFromrightStackLessThanMaxDate(features,rightStack);

					/*console.log(features);
					console.log(leftStack);
					console.log(rightStack);*/

					redrawFeatures(clusterLayer, features);
				}

				for (var i=0; i<visibleLayers.length;i++) {
					toggleMarkerVisibility(visibleLayers[i]);
				}

			}
		}
	}
]);

doraServices.service('PaletteServ', [
	function(){
		var palette = [
			{cssIndex: 0, color:'#D46A6A', inUse: false},
			{cssIndex: 1, color:'#FFBB45', inUse: false},
			{cssIndex: 2, color:'#FFDD49', inUse: false},
			{cssIndex: 3, color:'#B0E353', inUse: false},
			{cssIndex: 4, color:'#41B368', inUse: false},
			{cssIndex: 5, color:'#3D7C9B', inUse: false},
			{cssIndex: 6, color:'#4C55A9', inUse: false},
			{cssIndex: 7, color:'#6E46A6', inUse: false},
			{cssIndex: 8, color:'#B94395', inUse: false},
			{cssIndex: 9, color:'#E15273', inUse: false}
		]

		return {
			useNextColor: function() {
				for(index in palette) {
					if(!palette[index].inUse) {
						palette[index].inUse = true;
						var color = {
							featureColor: palette[index].color,
							buttonStyleIndex: palette[index].cssIndex
						};
						return color;
					}
				}
				return null; // all colors in use
			},
			releaseColor: function(color) {
				for(index in palette) {
					if(palette[index].color.localeCompare(color.markerColor) == 0) {
						palette[index].inUse = false;
						break;
					}
				}
			}
		}
	}
]);