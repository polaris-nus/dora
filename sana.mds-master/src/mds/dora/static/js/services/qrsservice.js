doraServices.service('QRSService', [ 'MapService', 'PaletteService', '$http',
	function(MapService, PaletteService, $http){
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
					MapService.removeVectorLayer(removedQRS);
					PaletteService.releaseColor(removedQRS.color);
				}

				for(index in QRSHistory) {
					QRSHistory[index].isVisible = false;
					MapService.setVectorLayerVisibility(QRSHistory[index], false);
				}

				QRS.color = PaletteService.useNextColor();
				QRS.isVisible = true;
				QRSHistory.push(QRS);
				MapService.addVectorLayer(QRS);

				onAddCallback(QRSHistory.length-1); // display last added QRS

			},
			removeFromQRSHistory: function(QRS){
				var index = QRSHistory.indexOf(QRS);
				
				if (index > -1) {
					QRSHistory.splice(index, 1);
					MapService.removeVectorLayer(QRS);
					PaletteService.releaseColor(QRS.color);
				}
			},
			getQRSHistory: function(){
				return QRSHistory;
			},
			
			//filters is given as an array of objects
			generateQRS: function(filters, location, alias) {
				
				var data = {};
				var start = new Date();
				
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

				var QRSService = this;
				
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
					if (QRS.status !== 'error' && QRS.assigned.length == 0 && QRS.unassigned.length == 0) {
						QRS.status = 'empty'
					} else if (QRS.status == "ok") {
						QRS.filters = filters;
						if (alias) {
							QRS.alias = alias;
						}
						if (location && location.length > 0) {
							QRS.location = location;
						}
						QRSService.addToQRSHistory(QRS);
					}
					
					queryCallback(QRS.status);
					
					QRSService.endLoading();
	
				}).error(function(data){
					document.open();
					document.write(data);
					document.close();
				});
				
			}
		};
	}
]);