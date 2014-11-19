doraServices.service('MapService', [
	function(){
		OpenLayers.ImgPath = '/static/ol2/img/';
		
		//Initialising Map 
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
	    new OpenLayers.Layer.OSM("OSM (without buffer)", null, {wrapDateLine: true}),
	    ]
	  });
		var center = [0,0];
		var zoom = 3;
		map.setCenter(center, zoom);

		// WKT Parser for serializing and deserailzing vector features
		var wktParser = new OpenLayers.Format.WKT({
			externalProjection: 'EPSG:4326',  //from WSG84
			internalProjection: 'EPSG:900913' //to Spherical Mercator Projection
		});

		// StyleMaps for Vector Features
		var encounterFeatureStyle = new OpenLayers.StyleMap({
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

		var locationFilterStyle = new OpenLayers.StyleMap({
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

		var countryFilterStyle = new OpenLayers.StyleMap({
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

		var polygonFilterStyle = new OpenLayers.StyleMap({
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
							// calculating radius of circle feature
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
		var countryFilterLayer = new OpenLayers.Layer.Vector("KML", {
			strategies: [new OpenLayers.Strategy.Fixed()],
			styleMap: countryFilterStyle,
			protocol: new OpenLayers.Protocol.HTTP({
				url: "/static/kml/countriesM.kml",
				format: new OpenLayers.Format.KML({
					extractStyles: false, 
					extractAttributes: true,
					maxDepth: 2
				})
			})
		})
		map.addLayer(countryFilterLayer);

		var polygonFilterLayer = new OpenLayers.Layer.Vector("Polygon Layer", {
			styleMap: polygonFilterStyle
		});
		map.addLayer(polygonFilterLayer);
		
		// Adding Map Controls
		var drawPolygonControls = new OpenLayers.Control.DrawFeature(polygonFilterLayer, OpenLayers.Handler.Polygon);
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
		var drawCircleControls = new OpenLayers.Control.DrawFeature(
			polygonFilterLayer,
			OpenLayers.Handler.RegularPolygon,
			{handlerOptions: polyOptions}
		);
		map.addControl(drawCircleControls);
		drawCircleControls.events.register('featureadded', drawCircleControls, function(f){
			var addedFeature =  f.feature.clone();
			addedFeature.attributes.circle = true;
			polygonFilterLayer.removeFeatures([f.feature], {silent:true});
			polygonFilterLayer.addFeatures([addedFeature], {silent:true});
		});

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

		var selectCountryFilterControls = new OpenLayers.Control.SelectFeature(countryFilterLayer, {
			multiple: true,
			toggle: true,
		});
		var hoverCountryControls = new OpenLayers.Control.SelectFeature(countryFilterLayer, {
			hover: true,
			highlightOnly: true,
			renderIntent: "temporary"
		});
		map.addControl(hoverCountryControls);
		map.addControl(selectCountryFilterControls);

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
			  // Check for location filters and create location polygon layer
			  if (QRS.location) {
			  	var polygonFeatures = parseWKTArray(QRS.location, QRS.color.featureColor);
			  	var locationLayer = new OpenLayers.Layer.Vector('locationLayer', {
			  		styleMap: locationFilterStyle,
			  		renderers: ['Canvas', 'VML'],
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
			  	styleMap: encounterFeatureStyle,
			  	strategies: [clusterStrategy]
			  });
			  clusterStrategyReferences[clusterLayer.id] = clusterStrategy;

			  // Add clusterLayerId property to link QRS with respective cluster layer
			  QRS.clusterLayerId = clusterLayer.id;
			  returnedLayers.clusterLayer = clusterLayer;
			  clusterLayer.addFeatures(features);
			  map.addLayer(clusterLayer);

			  // Add extent property for zooming and panning view port to fit encounter features
			  if(returnedLayers.locationLayer) {
					QRS.extent = returnedLayers.locationLayer.getDataExtent();
			  } else if (returnedLayers.clusterLayer.features.length > 0){
			  	QRS.extent = returnedLayers.clusterLayer.getDataExtent();
			  }
			  this.zoomToFitVectorFeatures(QRS);

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

			  return returnedLayers; // for testability

			},
			removeVectorLayer: function(QRS) {
				if (QRS.clusterLayerId) {
					// Manual cleanup on selectClusterControls.layers
					var selectControlsLayers = selectClusterControls.layers || [selectClusterControls.layer];
					selectControlsLayers = selectControlsLayers.filter(
						function(element) {
							return element.id !== QRS.clusterLayerId
						}
					)
					selectClusterControls.setLayer(selectControlsLayers);

					//Manual cleanup on visibleLayers and clusterLayerFeatures
					visibleLayers = visibleLayers.filter(
						function(element) {
							return element !== QRS.clusterLayerId
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
			setClusterStrategyStatus: function(QRS, activate) {
				if(QRS.clusterLayerId) {
					selectClusterControls.unselectAll();

					var clusterStrategy = clusterStrategyReferences[QRS.clusterLayerId];
					activate ? clusterStrategy.activate() : clusterStrategy.deactivate();
					
					// Redrawing encounter features after activation/deactivation
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
			setVectorLayerVisibility: function(QRS, visibility) {
				if (QRS.clusterLayerId) {
					var clusterLayer = map.getLayer(QRS.clusterLayerId);
					clusterLayer.setVisibility(visibility);

					if (clusterLayer.getVisibility()) {
						if (visibleLayers.indexOf(QRS.clusterLayerId) === -1) {
							visibleLayers.push(QRS.clusterLayerId);
						}
					} else if (visibleLayers.indexOf(QRS.clusterLayerId) !== -1) {
						visibleLayers.splice(visibleLayers.indexOf(QRS.clusterLayerId),1);
					}

				}
				if (QRS.locationLayerId) {
					var locationLayer = map.getLayer(QRS.locationLayerId);
					locationLayer.setVisibility(visibility);
				}

				this.setSliderMinBound();
				this.temporalSliderFeaturesToggle();
			},
			zoomToFitVectorFeatures: function(QRS) {
				if(QRS.extent) {
					map.zoomToExtent(QRS.extent);
				}
			},
			activatePolygonFilters: function() {
				polygonFilterLayer.setVisibility(true);
				countryFilterLayer.setVisibility(true);
				return polygonFilterLayer.getVisibility() && countryFilterLayer.getVisibility();
			},
			deactivatePolygonFilters: function() {
				drawPolygonControls.deactivate();
				drawCircleControls.deactivate();
				hoverCountryControls.deactivate();
				selectCountryFilterControls.deactivate();
				polygonFilterLayer.setVisibility(false);
				countryFilterLayer.setVisibility(false);

				return polygonFilterLayer.getVisibility() || countryFilterLayer.getVisibility();
			},
			clearPolygonFilters: function() {
				polygonFilterLayer.removeAllFeatures();
				selectCountryFilterControls.unselectAll();

				return polygonFilterLayer.features.length + countryFilterLayer.selectedFeatures.length;	
			},
			addPolygonFilters: function(WKTArray) {
				var polygonFeatures = parseWKTArray(WKTArray);
				polygonFilterLayer.addFeatures(polygonFeatures);
				return polygonFilterLayer.features.length;
			},
			getPolygonFilters: function() {
				var preprocessedFeatures = [];

				for (var i = 0; i < polygonFilterLayer.features.length; i++) {
					var drawnFeature = polygonFilterLayer.features[i].clone()
					preprocessedFeatures.push(wktParser.write(drawnFeature));
				}
				for (var i = 0; i < countryFilterLayer.selectedFeatures.length; i++) {
					var selectedFeature = countryFilterLayer.selectedFeatures[i].clone();
					preprocessedFeatures.push(wktParser.write(selectedFeature));
				}

				// Processing to align all features' projection
				var filterFeatures = [];
				for (var i = 0; i < preprocessedFeatures.length; i++) {
					var polygonFilter = wktParser.read(preprocessedFeatures[i]);
					if (polygonFilter instanceof Array) {
						for(j in polygonFilter) {
							polygonFilter[j].geometry.transform("EPSG:4326", "EPSG:900913");
							filterFeatures.push(wktParser.write(polygonFilter[j]));
						}
					} else {
						filterFeatures.push(wktParser.write(polygonFilter));
					}
				}

				return filterFeatures;
			},
			activateDrawPolygon: function() {
				drawCircleControls.deactivate();
				hoverCountryControls.deactivate();
				selectCountryFilterControls.deactivate();

				drawPolygonControls.activate();
			},
			activateDrawCircle: function() {
				drawPolygonControls.deactivate();
				hoverCountryControls.deactivate();
				selectCountryFilterControls.deactivate();

				drawCircleControls.activate();
			},
			activateSelectCountry: function(){
				drawPolygonControls.deactivate();
				drawCircleControls.deactivate();

				hoverCountryControls.activate();
				selectCountryFilterControls.activate();
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
			getVisibleLayers: function() {
				//for testing only
				return visibleLayers;
			},
			getClusterLayerFeatures: function() {
				//for testing only
				return clusterLayerFeatures;
			}
		}
	}
]);
