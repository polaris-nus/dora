var doraServices = angular.module('doraServices', []);

doraServices.service('QRSServ', [ 'MapServ', 'PaletteServ', '$http',
	function(MapServ, PaletteServ, $http){
		var historyLimit = 10;
		var QRSHistory = [];
		var QRSLoadingStatus = {isLoading: false};
		var onAddCallback = null;
		var requeryCallBack = null;
		return {
			setOnAddCallback: function(callback) {
				onAddCallback = callback;
			},
			setRequeryCallback: function(callback){
				requeryCallBack = callback;
			},
			requery:function(displayedQRS){
				requeryCallBack(displayedQRS.filters);
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

		var polygonFilterStyle = new OpenLayers.Style({
			fillColor: "#808080",
			fillOpacity: 0.4,
			strokeColor: "#808080",
			strokeWidth: 1,
			strokeOpacity: 1,
		})

		var countryPolygonStyle = new OpenLayers.StyleMap({
			default: {
				fillOpacity: 0,
				strokeOpacity: 0,
			},
			temporary: {
				fillColor: "#808080",
				fillOpacity: 0.6,
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

		var polygonLayer = new OpenLayers.Layer.Vector("Polygon Layer", {
			// styleMap: drawPolygonStyle
		});
		map.addLayer(polygonLayer);
		
		// Adding Map Controls
		var drawPolygonControls = new OpenLayers.Control.DrawFeature(polygonLayer, OpenLayers.Handler.Polygon);
		map.addControl(drawPolygonControls);

		var polyOptions = {sides: 40};
		var drawRegularPolygonControls = new OpenLayers.Control.DrawFeature(polygonLayer, OpenLayers.Handler.RegularPolygon, {handlerOptions: polyOptions});
		map.addControl(drawRegularPolygonControls);

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
					var createdDate = createdDateObj.getDate() + "-" + createdDateObj.getMonth() + "-" + createdDateObj.getFullYear();
					
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

		return {
			addVectorLayer: function(QRS) {
				var returnedLayers = {};

			  // Check and create location polygon layer
			  if (QRS.locationFeature) {
			  	// var locationFeature = wktParser.read(QRS.locationFeature);
			  	var locationFeature = QRS.locationFeature
			  	console.log(locationFeature);
			  	if (locationFeature instanceof Array) {
			  		for(index in locationFeature) {
			  			locationFeature[index].attributes.filterFillColor = QRS.color.featureColor;
			  			locationFeature[index].attributes.filterStrokeColor = QRS.color.featureColor;
			  		}
			  	} 
			  	var locationLayer = new OpenLayers.Layer.Vector('locationLayer', {
			  		styleMap: QRSPolygonFilterStyle
			  	});
			  	QRS.locationLayerId = locationLayer.id;
			  	map.addLayer(locationLayer);
			  	returnedLayers.locationLayer = locationLayer;
			  	locationLayer.addFeatures(locationFeature);
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
					var clusterStrategy = clusterStrategyReferences[QRS.clusterLayerId];
					activate ? clusterStrategy.activate() : clusterStrategy.deactivate();
					var clusterLayer = map.getLayer(QRS.clusterLayerId);
					clusterLayer.removeAllFeatures();
					clusterLayer.addFeatures(clusterLayerFeatures[QRS.clusterLayerId].features);
				}
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
						visibleLayers.push(QRS.clusterLayerId);
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
			clearPolygonFilters: function() {
				// BUG: unable to remove feature selected for modification :(
				polygonLayer.removeAllFeatures();
				selectCountryControls.unselectAll();
				
			},
			activateDrawPolygon: function() {
				drawRegularPolygonControls.deactivate();
				// modifyPolygonControls.deactivate();
				hoverCountryControls.deactivate();
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
					filterFeatures.push(polygonLayer.features[i].clone());
				}
				for (var i = 0; i < countriesLayer.selectedFeatures.length; i++) {
					filterFeatures.push(countriesLayer.selectedFeatures[i].clone());
				}

				var polygonFilters = {
					features: filterFeatures,
					wkt: wktParser.write(filterFeatures)
				}

				console.log(polygonFilters);

				return polygonFilters;
			},
			// plotCentroid: function(QRS) {
			// 	if (QRS.clusterLayerId) {
			// 		var clusterLayer = map.getLayer(QRS.clusterLayerId);
			// 		if(clusterLayer.getVisibility()) {
			// 			var clusterGeometries = [];
			// 			for(index in clusterLayer.features) {
			// 				clusterGeometries.push(clusterLayer.features[index].geometry);
			// 			}
			// 			var geometryCollection = new OpenLayers.Geometry.Collection(clusterGeometries);
			// 			var centroid = geometryCollection.getCentroid();
			// 			// THEN DO WHAT?! put in new layer || put in clusterLayer (learn to customize cluster strategy)
			// 		}
			// 	}
			// },
			setSliderMinMax: function(min, max) {
				slider.min = min;
				slider.max = max;
			},
			setSliderMinBound: function() {
				//Always set slider bounds to the earliest date of all feature layers
				//Which one has the latest date
				minDate = new Date()
				for (var i=0; i<visibleLayers.length;i++) {
					clusterLayerId = visibleLayers[i];
					features = clusterLayerFeatures[clusterLayerId].features;
					leftStack = clusterLayerFeatures[clusterLayerId].leftStack;
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
				var lowerBound = $("#slider").dateRangeSlider("option", "bounds").min;
				$("#slider").dateRangeSlider({
					bounds:{
					    min: new Date(minDate), //This value should be changed to the latest date available
					    max: new Date()
					  }
					});
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
