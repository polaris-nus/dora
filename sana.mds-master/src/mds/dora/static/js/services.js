var doraServices = angular.module('doraServices', []);

doraServices.service('QRSServ', [ 'MapServ', 'PaletteServ', '$http',
	function(MapServ, PaletteServ, $http){
		var historyLimit = 10;
		var QRSHistory = [];
		var QRSLoadingCounter = {count: 0};
		var onAddCallback = function(){};
		var requeryCallBack = function(){};
		var queryCallback = function(){};
		return {
			setOnAddCallback: function(callback) {
				onAddCallback = callback;
			},
			setRequeryCallback: function(callback){
				requeryCallBack = callback;
			},
			setQueryCallback: function(callback) {
				queryCallback = callback;
			},
			requery:function(displayedQRS){
				//console.log("inside QRSServ " + JSON.stringify(displayedQRS.filters));
				requeryCallBack(displayedQRS.filters);
			},
			getLoadingStatus: function(){
				return QRSLoadingCounter;
			},
			initializeLoading: function(){
				QRSLoadingCounter.count++;
			},
			endLoading: function(){
				QRSLoadingCounter.count--;
			},
			addToQRSHistory: function (QRS){
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
			
			//filters is given as an array of objects
			generateQRS: function(filters, location, alias) {
				
				var data = {};
				
				function escapeRegExp(string) {
					return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
				}
				
				function replaceAll(string, find, replace) {
					return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
				}
				
				for (var i = 0; i < filters.length; i++){
					var filter = filters[i];
					var key = filter.key
						.trim()
						.replace(new RegExp(escapeRegExp(" "), 'g'), "_")
						.replace(new RegExp(escapeRegExp("'"), 'g'), "")
						.toLowerCase();
					data[key] = filter.value.trim();
				}
				
				if (location && location.length > 0) {
					data.location = JSON.stringify(location);
				}
				
				console.log(data);
				var QRSServ = this;
				
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
					
					console.log(QRS);
					
					if (QRS.assigned.length == 0 && QRS.unassigned.length == 0) {
						QRS.status = 'empty'
					} else if (QRS.status == "ok") {
						console.log("success!");
						console.log(location);
						QRS.filters = filters;
						if (alias) {
							QRS.alias = alias;
						}
						if (location && location.length > 0) {
							QRS.location = location;
						}
						QRSServ.addToQRSHistory(QRS);
					}
					
					queryCallback(QRS.status);
					
					QRSServ.endLoading();
	
				}).error(function(data){
					document.open();
					document.write(data);
					document.close();
				});
				
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

		// StyleMaps for layers
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
				strokeColor: "#32a8a9",
				graphicZIndex: 2,
			}
		});

		var QRSPolygonFilterStyle = new OpenLayers.StyleMap({
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

		var countryPolygonStyle = new OpenLayers.StyleMap({
			default: {
				fillOpacity: 0,
				strokeOpacity: 0,
			},
			temporary: {
				fillColor: "#808080",
				fillOpacity: 0.6,
			},
			select: {
				fillColor: "#808080",
				fillOpacity: 0.4,
				strokeColor: "#808080",
				strokeWidth: 1,
				strokeOpacity: 1,
			}
		});

		var drawPolygonStyle = new OpenLayers.StyleMap({
			default: new OpenLayers.Style({
				fillColor: "#808080",
				fillOpacity: 0.4,
				strokeColor: "#808080",
				strokeWidth: 1,
				strokeOpacity: 1,
				label: "${dimension}"
			}, {
				context: {
					dimension: function(feature){
						if(feature.attributes.circle) {
							var geometry = feature.geometry;
							var center = geometry.getCentroid();
							var point = geometry.getVertices()[0];
							var pointClone = point.clone().transform("EPSG:900913", "EPSG:4326");
							var centerClone = center.clone().transform("EPSG:900913", "EPSG:4326");
							var distance = OpenLayers.Util.distVincenty(
								new OpenLayers.LonLat(pointClone.x, pointClone.y),
								new OpenLayers.LonLat(centerClone.x, centerClone.y)
								);
							return Math.round(distance * 100) / 100 + "km";
						} else {
							return "";
						}
					}
				}
			})
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

		var polygonLayer = new OpenLayers.Layer.Vector("Polygon Layer", {
			styleMap: drawPolygonStyle
		});
		map.addLayer(polygonLayer);
		
		// Adding Map Controls
		var drawPolygonControls = new OpenLayers.Control.DrawFeature(polygonLayer, OpenLayers.Handler.Polygon);
		map.addControl(drawPolygonControls);
		// undo/redo event handlers for draw polygons
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

		var polyOptions = {sides: 40};
		var drawRegularPolygonControls = new OpenLayers.Control.DrawFeature(polygonLayer, OpenLayers.Handler.RegularPolygon, {handlerOptions: polyOptions});
		map.addControl(drawRegularPolygonControls);
		drawRegularPolygonControls.events.register('featureadded', drawRegularPolygonControls, function(f){
			var addedFeature =  f.feature.clone();
			addedFeature.attributes.circle = true;
			polygonLayer.removeFeatures([f.feature], {silent:true});
			polygonLayer.addFeatures([addedFeature], {silent:true});
		});

		// var modifyPolygonControls = new OpenLayers.Control.ModifyFeature(polygonLayer);
		// modifyPolygonControls.mode = OpenLayers.Control.ModifyFeature.ROTATE;
		// modifyPolygonControls.mode |= OpenLayers.Control.ModifyFeature.RESIZE;
		// modifyPolygonControls.mode |= OpenLayers.Control.ModifyFeature.DRAG;
		// map.addControl(modifyPolygonControls);

		var selectClusterControls = new OpenLayers.Control.SelectFeature(new OpenLayers.Layer.Vector("stub"), {
			toggle: true,
			onSelect: function(feature) {
				var popoverHtml = "";
				var renderEncounter = function(encounter) {
					var givenName = encounter.subject.given_name.charAt(0).toUpperCase() + encounter.subject.given_name.slice(1);
					var familyInitial = "." + encounter.subject.family_name.charAt(0).toUpperCase();
					var gender = encounter.subject.gender;
					var age = new Date().getFullYear() - new Date(encounter.subject.dob).getFullYear();
					
					var createdDateObj = new Date(encounter.created_date);
					var createdDate = createdDateObj.getDate() + "-" + (createdDateObj.getMonth()+1) + "-" + createdDateObj.getFullYear();
					
					var template = '<div class="popover-content">' +
					'<div class="popover-patient">'+ givenName + familyInitial + " " + age + " " + gender +'</div>'+
					'<div class="popover-procedure">'+ encounter.procedure +'</div>'+
					'<div class="popover-observer">'+ 'by ' + encounter.observer + ' on ' + createdDate +'</div>'+
					'</div>';
					return template;
				}

				if(feature.cluster) {
					popoverHtml = '<div class="popover-list">';
					for(index in feature.cluster) {
						popoverHtml += renderEncounter(feature.cluster[index].attributes.encounter);
					}
					popoverHtml += "</div>";

				} else {
					popoverHtml = renderEncounter(feature.attributes.encounter);
				}

				var popup = new OpenLayers.Popup.FramedCloud("clusterpopup", 
					feature.geometry.getBounds().getCenterLonLat(),
					null,
					popoverHtml,
					null,
					true,
					function(){
						selectClusterControls.unselect(feature);
					}
					);

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
		var hoverCountryControls = new OpenLayers.Control.SelectFeature(countriesLayer, {
			hover: true,
			highlightOnly: true,
			renderIntent: "temporary"
		});
		map.addControl(hoverCountryControls);
		map.addControl(selectCountryControls);

		// Zoom and Pan Event Listeners
		map.zoomToProxy = map.zoomTo;
		map.zoomTo =  function (zoom,xy){
			selectClusterControls.unselectAll();
			map.zoomToProxy(zoom,xy); 
		};
		
		var visibleLayers = [];
		var slider = {};
		slider.firstInit = true;
		var clusterLayerFeatures = {};
		var clusterStrategyReferences = {};

		var parseWKTArray =  function(WKTArray, featureColor) {
			var polygonFeatures = [];

			var addToPolygonFeatures = function(polygonFeature) {
				if (featureColor) {
					polygonFeature.attributes.filterFillColor = featureColor;
					polygonFeature.attributes.filterStrokeColor = featureColor;
				}
				polygonFeatures.push(polygonFeature);
			}

			for(i in WKTArray) {
				var polygonFilter = wktParser.read(WKTArray[i]);
				if (polygonFilter instanceof Array) {
					for(j in polygonFilter) {
						addToPolygonFeatures(polygonFilter[j]);
					}
				} else {
					addToPolygonFeatures(polygonFilter);
				}
			}

			return polygonFeatures;
		}

		return {
			addVectorLayer: function(QRS) {
				var returnedLayers = {};
			  // Check and create location polygon layer
			  if (QRS.location) {
			  	var polygonFeatures = parseWKTArray(QRS.location, QRS.color.featureColor);
			  	var locationLayer = new OpenLayers.Layer.Vector('locationLayer', {
			  		styleMap: QRSPolygonFilterStyle
			  	});
			  	QRS.locationLayerId = locationLayer.id;
			  	map.addLayer(locationLayer);
			  	returnedLayers.locationLayer = locationLayer;
			  	locationLayer.addFeatures(polygonFeatures);
			  }

			  // Extract coordinates for encounters
			  var features = [];
			  for(index in QRS.assigned) {
			  	var encounter = QRS.assigned[index];
			  	var vectorFeature = wktParser.read(encounter.location.coords);    

			  	vectorFeature.attributes = {
			  		featureColor: QRS.color.featureColor,
			  		date: encounter.created_date.split(' ')[0],
			  		encounter: encounter,
			  	};
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

			  this.setSliderMinBound();
			  this.temporalSliderFeaturesToggle();

			  // Adding layer to selectControls
			  var selectControlsLayers = selectClusterControls.layers || [selectClusterControls.layer];
			  selectControlsLayers.push(clusterLayer);
			  selectClusterControls.setLayer(selectControlsLayers);

			  // QRS specific zoom and pan center
			  map.zoomToExtent(clusterLayer.getDataExtent());

			  return returnedLayers; // for testability

			},
			setClusterStrategyStatus: function(QRS, activate) {
				if(QRS.clusterLayerId) {
					selectClusterControls.unselectAll();
					var clusterStrategy = clusterStrategyReferences[QRS.clusterLayerId];
					activate ? clusterStrategy.activate() : clusterStrategy.deactivate();
					var clusterLayer = map.getLayer(QRS.clusterLayerId);
					clusterLayer.removeAllFeatures();
					clusterLayer.addFeatures(clusterLayerFeatures[QRS.clusterLayerId].features);
				}
			},
			getClusterStrategyStatus: function(QRS) {
				if(QRS.clusterLayerId) {
					var clusterStrategy = clusterStrategyReferences[QRS.clusterLayerId];
					return clusterStrategy.active;
				}
				return null;
			},
			zoomToFitVectorFeatures: function(QRS) {
				if(QRS.clusterLayerId) {
					var clusterLayer = map.getLayer(QRS.clusterLayerId);
					map.zoomToExtent(clusterLayer.getDataExtent());
				}
			},
			setVectorLayerVisibility: function(QRS, visibility) {
				if (QRS.clusterLayerId) {
					var clusterLayer = map.getLayer(QRS.clusterLayerId);
					clusterLayer.setVisibility(visibility);
					if (clusterLayer.getVisibility()) {
						if (visibleLayers.indexOf(QRS.clusterLayerId) == -1) {
							visibleLayers.push(QRS.clusterLayerId);
						}
					} else if (visibleLayers.indexOf(QRS.clusterLayerId) != -1) {
						visibleLayers.splice(visibleLayers.indexOf(QRS.clusterLayerId),1);
					}
				}
				if (QRS.locationLayerId) {
					var locationLayer = map.getLayer(QRS.locationLayerId);
					locationLayer.setVisibility(visibility);
				}
				this.setSliderMinBound();
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
				return map; // for testability
			},
			activatePolygonFilters: function() {
				polygonLayer.setVisibility(true);
				countriesLayer.setVisibility(true);
				return polygonLayer.getVisibility() && countriesLayer.getVisibility();
			},
			deactivatePolygonFilters: function() {
				drawPolygonControls.deactivate();
				drawRegularPolygonControls.deactivate();
				// modifyPolygonControls.deactivate();
				hoverCountryControls.deactivate();
				selectCountryControls.deactivate();
				polygonLayer.setVisibility(false);
				countriesLayer.setVisibility(false);

				return polygonLayer.getVisibility() || countriesLayer.getVisibility();
			},
			clearPolygonFilters: function() {
				polygonLayer.removeAllFeatures();
				selectCountryControls.unselectAll();

				return polygonLayer.features.length + countriesLayer.selectedFeatures.length;	
			},
			addPolygonFilters: function(WKTArray) {
				var polygonFeatures = parseWKTArray(WKTArray);
				polygonLayer.addFeatures(polygonFeatures);
				return polygonLayer.features.length;
			},
			activateDrawPolygon: function() {
				drawRegularPolygonControls.deactivate();
				// modifyPolygonControls.deactivate();
				hoverCountryControls.deactivate();
				selectCountryControls.deactivate();

				drawPolygonControls.activate();
			},
			activateDrawCircle: function() {
				drawPolygonControls.deactivate();
				// modifyPolygonControls.deactivate();
				hoverCountryControls.deactivate();
				selectCountryControls.deactivate();

				drawRegularPolygonControls.activate();
			},
			// activateModifyPolygon: function() {
			// 	// BUG: cannot selectCountry after modification.
			// 	drawPolygonControls.deactivate();
			// 	drawRegularPolygonControls.deactivate();
			// 	hoverCountryControls.deactivate();
			// 	selectCountryControls.deactivate();

			// 	modifyPolygonControls.activate();
			// },
			activateSelectCountry: function(){
				drawPolygonControls.deactivate();
				// modifyPolygonControls.deactivate();
				drawRegularPolygonControls.deactivate();

				hoverCountryControls.activate();
				selectCountryControls.activate();
			},
			getPolygonFilters: function() {
				var filterFeatures = [];

				for (var i = 0; i < polygonLayer.features.length; i++) {
					var drawnFeature = polygonLayer.features[i].clone()
					filterFeatures.push(wktParser.write(drawnFeature));
				}
				for (var i = 0; i < countriesLayer.selectedFeatures.length; i++) {
					var selectedFeature = countriesLayer.selectedFeatures[i].clone();
					filterFeatures.push(wktParser.write(selectedFeature));
				}

				return filterFeatures;
			},
			setSliderMinMax: function(min, max) {
				slider.min = min;
				slider.max = max;
			},
			setSliderMinBound: function() {
				//Always set slider bounds to the earliest date of all feature layers
				//Which one has the latest date
				var minDate = new Date()
				for (var i=0; i<visibleLayers.length;i++) {
					var clusterLayerId = visibleLayers[i];
					var features = clusterLayerFeatures[clusterLayerId].features;
					var leftStack = clusterLayerFeatures[clusterLayerId].leftStack;
					if (leftStack.length > 0) {
						if (Date.parse(leftStack[0].attributes.date) < Date.parse(minDate)) {
							minDate = leftStack[0].attributes.date;
						}
					} else if (features.length > 0) {
						if (Date.parse(features[0].attributes.date) < Date.parse(minDate)) {
							minDate = features[0].attributes.date;
						}
					}
				}

				var modifySliderMinBound = function() {
					var lowerBound = $("#slider").dateRangeSlider("option", "bounds").min;
					$("#slider").dateRangeSlider({
						bounds:{
						    min: new Date(minDate), //This value should be changed to the latest date available
						    max: new Date()
						}
					});
				}
				modifySliderMinBound();

				minDate = new Date(minDate);
				return minDate.toDateString();
			},
			temporalSliderFeaturesToggle: function() {
				selectClusterControls.unselectAll();

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

					function addBackFromLeftStackMoreThanMinDate(features,leftStack) {
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

					function addBackFromrightStackLessThanMaxDate(features,rightStack) {
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
						var clusterLayer = map.getLayer(clusterLayerId);
						var leftStack = clusterLayerFeatures[clusterLayerId].leftStack;
						var features = clusterLayerFeatures[clusterLayerId].features;
						var rightStack = clusterLayerFeatures[clusterLayerId].rightStack;

						removeFeaturesLessThanMinDate(features,leftStack);
						removeFeaturesMoreThanMaxDate(features,rightStack);
						addBackFromLeftStackMoreThanMinDate(features,leftStack);
						addBackFromrightStackLessThanMaxDate(features,rightStack);

						redrawFeatures(clusterLayer, features);
					}

				for (var i=0; i<visibleLayers.length;i++) {
					toggleMarkerVisibility(visibleLayers[i]);
				}
			},
			triggerPopover: function(QRS, uuid) {
				selectClusterControls.unselectAll();
				if (QRS.clusterLayerId) {
					var clusterLayer = map.getLayer(QRS.clusterLayerId);
					searchloop:
					for (i in clusterLayer.features) {
						var feature = clusterLayer.features[i];
						if(feature.cluster) {
							for(j in feature.cluster) {
								if(feature.cluster[j].attributes.encounter.uuid === uuid) {
									selectClusterControls.select(feature);
									break searchloop;
								}
							}
						} else {
							if (feature.attributes.encounter.uuid === uuid) {
								selectClusterControls.select(feature);
								break searchloop;
							}
						}
					}
				}
			},
			verifyOrderInVisibleLayers: function() {

				function checkLayerOrder(clusterLayerId) {
					//DONE! -- Step 1: Take in temporal slider min max date.
					var clusterLayer = map.getLayer(clusterLayerId);
					var features = clusterLayerFeatures[clusterLayerId].features;
					var leftStack = clusterLayerFeatures[clusterLayerId].leftStack;
					var rightStack = clusterLayerFeatures[clusterLayerId].rightStack;

					console.log(features.length);
					console.log(leftStack.length);
					console.log(rightStack.length);

					function checkOrder(array) {
						if (array.length > 1) {
							for (var i = 1; i < array.length; i++) {
								currDate = Date.parse(array[i].attributes.date);
								prevDate = Date.parse(array[i-1].attributes.date);
								if (currDate > prevDate) {
									return 1;
								}
							}
						}
					}

					function checkArrayConsecutivity(array1, array2) {
						if (array1.length > 0 && array2.length > 0) {
							date1 = Date.parse(array1[array1.length-1].attributes.date);
							date2 = Date.parse(array2[0].attributes.date);
							if (date1 > date2) {
								return 1;
							}
						}
					}

					checkOrder(leftStack);
					checkOrder(features);
					checkOrder(rightStack);
					checkArrayConsecutivity(leftStack, features);
					checkArrayConsecutivity(features, rightStack);

					return 0;
				}

				console.log(visibleLayers);
				for (var i=0; i<visibleLayers.length;i++) {
					console.log("index"+i);
					if (checkLayerOrder(visibleLayers[i])) {
						return 1;
					}
				}

				return 0;
			},
		}
	}
	]);

doraServices.service('PaletteServ', [
	function(){
		var palette = [
		{cssIndex: 0, color:'#B71B1B', inUse: false},
		{cssIndex: 1, color:'#FF7B11', inUse: false},
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
					if(palette[index].color.localeCompare(color.featureColor) == 0) {
						palette[index].inUse = false;
						break;
					}
				}
			}
		}
	}
	]);
