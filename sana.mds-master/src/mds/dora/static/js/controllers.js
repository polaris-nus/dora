var dataChartOne = [];
var dataChartTwo = [];
var doraControllers = angular.module('doraControllers', []);

doraControllers.controller('QueryFormController', ['$scope', 'QRSServ', 'MapServ',
	function($scope, QRSServ, MapServ){
		
		$scope.mapServMode = 'unselected';
		$scope.locationSearchOn = false;
		$scope.key = '';
		$scope.input = '';		
		$scope.filters = [];
		
		//Vars for error Modal
		$scope.modalTitle = 'Error!'
		$scope.errorMessage = 'Your query was not understood, Please Try Again!'


		//sets the filter from the QueryResultController
		var setfilters = function(newFilters){
			//console.log("running requery in formctrl" + JSON.stringify(newFilters));
			
			
			$scope.filters = newFilters.slice();
			
			// console.log($scope.filters);
		}

		QRSServ.setRequeryCallback(setfilters);

		function changeMode(newValue) {
			//console.log("changeMode triggered");
			if (newValue == 'polygon') {
				MapServ.activateDrawPolygon();
			}
			else if (newValue == 'circle') {
				MapServ.activateDrawCircle();
			}
			// else if (newValue == 'modify') {
			// 	MapServ.activateModifyPolygon();
			// }
			else if (newValue == 'country') {
				MapServ.activateSelectCountry();
			}
		};

		//autocomplete filter types
		$scope.data = [
			"Patient's family name",
			"Patient's given name",
			'Gender',
			'Procedure',
			'Age range',
			//"Observer's first name",
			//"Observer's last name",
			"Observer's username",
			'Drainage at surgery site',
			'Surgical site drainage odor',
			'Color of surgical site drainage',
			'Surgical site drainage viscosity',
			"Location at patient's house",
			'Fever post surgical procedure',
			'Surgical site pain',
			'Redness at surgical site',
			'Swelling at surgical site',
			'Firmness at surgical site',
			'Spontaneous opening at surgical site',
			'Infection suspected at surgical site',
			'Diagnosis'
			//'Operation date',
			//'Discharge date',
			//'Follow up date'
			];
			
		// console.log($scope.data);
		
		$scope.selectFilter = function(key){
			$scope.key = key;
			$scope.input = '';
		};
		
		$scope.submitFilter = function(){
			// console.log("length of data array: " + $scope.data.length);
			// console.log($scope.data);
			if ($scope.key && $scope.input) {
				
				$scope.filters.push({key:$scope.key, value:$scope.input});
				$scope.data.splice($scope.data.indexOf($scope.key),1);
				
				$scope.key = '';
				$scope.input = '';
			}
		};

		$scope.toggleButton = function(){
			//mapServMode reset so that ngChange may be triggered
			if ($scope.locationSearchOn) {
				$scope.mapServMode = 'unselected';
				$scope.doneDrawing();
			}
			
			//polygon drawing mode by default
			else {
				MapServ.activatePolygonFilters();
				$scope.mapServMode = 'drawing';
			}
			//console.log($scope.mapServMode);
			$scope.locationSearchOn = !$scope.locationSearchOn;
		};
		
		$scope.clearShapes = function() {
			MapServ.clearPolygonFilters();
		};
		
		$scope.$watch('mapServMode', changeMode);
		
		$scope.buttonName = function(){
			//console.log("location now is " + location);
			if ($scope.locationSearchOn) return "Hide location search";
			else return "Location search";
		};
		
		$scope.doneDrawing = function(filter){
			MapServ.deactivatePolygonFilters();
		};
		
		$scope.editFilter = function(index, filter){
			$scope.key = filter.key;
			$scope.input = filter.value;
			$scope.removeFilter(index, filter);
		};
		
		$scope.removeFilter = function(index, filter){
			// console.log(filter);
			$scope.filters.splice(index, 1);
			$scope.data.push(filter.key);
		};
		
		$scope.changeMode = changeMode;

		$scope.submitQuery = function(){

			console.log("inside submitQuery()");
			
			if ($scope.locationSearchOn){
				$scope.toggleButton();
			}

			QRSServ.initializeLoading();
			
			var filters = $scope.filters;
			
			//return the keys back into autocomplete array
			for (var i = 0; i < $scope.filters.length; i++) {
				$scope.data.push($scope.filters[i].key);
			}
			
			$scope.filters = [];
			$scope.key = "";
			$scope.input = "";
			
			var location = MapServ.getPolygonFilters();

			var displayModal = function(title, msg) {
				$scope.modalTitle = title;
				$scope.errorMessage = msg;
				$('#myModal').modal('show');
			}
			
			console.log(filters);
			
			QRSServ.setQueryCallback(function(status){
				if (status === 'unauthorized') {
					//Some unauthorized!
					displayModal(
						"Error: Unauthorized!",
						"You are unauthorized to make this query. Please login and try again."
					);
				} else if (status === 'error') {
					//Some Error!
					displayModal(
						"Error: Query Not Understood!",
						"The query input was not understood. Please check for errors and try again!"
					);
				} else if (status === 'empty') {
					//Empty Set!
					displayModal(
						"Error: Query Result is Empty!",
						"The combination of filters provided returned an empty result set. Please generalize your query and try again!"
					);
				} else {
					//for testing saving and loading queries only!!!
					//qrs = QRSServ.getQRSHistory();
					//console.log(qrs);
					//$scope.$parent.saveQuery(qrs[qrs.length-1]);
				}
			});
			
			QRSServ.generateQRS(filters, location);
			
			MapServ.clearPolygonFilters();
			
		};
	}
	]);

doraControllers.controller('QueryResultController', ['$scope', 'QRSServ', 'MapServ','$location', '$anchorScroll',
	function($scope, QRSServ, MapServ,$anchorScroll, $location){
		$scope.QRSHistory = QRSServ.getQRSHistory();
		$scope.loadingStatus = QRSServ.getLoadingStatus();

		$scope.displayedQRS = {};
		$scope.displayedQRSIndex = 0;
		$scope.encounterVisible = true;
		$scope.encounters = [];
		// $scope.assignedCount = 0;
		$scope.chartOneVisible = true;
		$scope.chartTwoVisible = true;
		$scope.filtersVisible = true;
		$scope.filters = [];
		$scope.clustering = true;
		$scope.qrsPanelVisibility=true;
		$scope.historyPanelVisibility = true;
		$scope.editingMode = false;
		$scope.name = [];

		$scope.removeQRS = function() {
			console.log($scope.displayedQRSIndex);
			QRSServ.removeFromQRSHistory($scope.QRSHistory[$scope.displayedQRSIndex]);
		}

		$scope.requery = function(){
			//console.log("inside QRS result ctrl " + JSON.stringify($scope.displayedQRS));
			QRSServ.requery($scope.displayedQRS);
			var location = $scope.displayedQRS.location
			if (location && location.length > 0) {
				MapServ.clearPolygonFilters();
				MapServ.addPolygonFilters(location);
			}
		}

		$scope.setDisplayedQRS = function(index) {
			if(index>=$scope.name.length){
				$scope.name.push("QRS "+(index+1));
			}
			console.log($scope.name[index]);

			$scope.displayedQRS = $scope.QRSHistory[index];
			$scope.displayedQRSIndex = index;
			$scope.qrsPanelVisibility = true;
			updateEncounters();
			updateFilters();
			updateChartOneDS();
			updateChartTwoDS();
			drawChart();
			//scrollToBottom();
			
		};
		QRSServ.setOnAddCallback($scope.setDisplayedQRS);

		$scope.showPopoverOnMap = function(encounterUuid) {
			MapServ.triggerPopover($scope.displayedQRS, encounterUuid);
		}

		$scope.toggleQRSVisibility = function(index) {
			$scope.doubleClickedQRS = $scope.QRSHistory[index];
			var toggledVisibility = !$scope.doubleClickedQRS.isVisible;
			$scope.doubleClickedQRS.isVisible = toggledVisibility
			MapServ.setVectorLayerVisibility($scope.doubleClickedQRS, toggledVisibility);
		}

		$scope.getQRSVisibility = function(index) {
			$scope.currentQRS = $scope.QRSHistory[index];
			return $scope.currentQRS.isVisible;
		}

		$scope.toggleQRSClustering = function() {
			var status = MapServ.getClusterStrategyStatus($scope.displayedQRS);
			MapServ.setClusterStrategyStatus($scope.displayedQRS, !status);
		}

		$scope.visibility = function(index){
			if ($scope.QRSHistory[index].isVisible) {
				return "";
			} else {
				return "btn-invisible";
			}
		}

		function cap(string){
			return string.charAt(0).toUpperCase() + string.slice(1);
		}

		function low(string){
			return string.toLowerCase();
		}

		function updateFilters(){
			$scope.filters = $scope.displayedQRS.filters;
		}

		function updateEncounters(){
			$scope.encounters = [];
			for (index in $scope.displayedQRS.assigned){
				var encounter = {
					patient: cap($scope.displayedQRS.assigned[index].subject.given_name) +" "+ cap($scope.displayedQRS.assigned[index].subject.family_name),
					procedure: low($scope.displayedQRS.assigned[index].procedure),
					observer:  cap($scope.displayedQRS.assigned[index].observer),
					date: $scope.displayedQRS.assigned[index].created_date.split(" ")[0],
					gender: $scope.displayedQRS.assigned[index].subject.gender,
					dob: $scope.displayedQRS.assigned[index].subject.dob,
					age: 2014-$scope.displayedQRS.assigned[index].subject.dob.split("-")[0],
					uuid: $scope.displayedQRS.assigned[index].uuid,
				}		
				$scope.encounters.push(encounter);
			}

			// $scope.assignedCount = $scope.encounters.length;
			for(index in $scope.displayedQRS.unassigned){
				var encounter = {
					patient: cap($scope.displayedQRS.assigned[index].subject.given_name) +" "+ cap($scope.displayedQRS.assigned[index].subject.family_name)+" (no location data)",
					procedure: low($scope.displayedQRS.assigned[index].procedure),
					observer:  cap($scope.displayedQRS.assigned[index].observer),
					date: $scope.displayedQRS.assigned[index].created_date.split(" ")[0],
					gender: $scope.displayedQRS.assigned[index].subject.gender,
					dob: $scope.displayedQRS.assigned[index].subject.dob,
					age: 2014-$scope.displayedQRS.assigned[index].subject.dob.split("-")[0],
					uuid: $scope.displayedQRS.unassigned[index].uuid,
				}		
				$scope.encounters.push(encounter);
			}
		}

		//function scrollToBottom(){
		//	$location.hash('qrs' + $scope.displayedQRSIndex);
		//	$anchorScroll();
		//}

		//--Start Chart Methods part1--//
		updateChartOneDS = function(){
			var yearCount = {};

			for (index in $scope.encounters){
				var dateString = $scope.encounters[index].date;
				//var year = dateString.split(",")[1];
				var year = dateString.split("-")[0];
				if(yearCount[year]){
					yearCount[year]+=1;
				}else{
					yearCount[year]=1;
				}	
			}

			yearCount = sortOnKeys(yearCount);

			count = 0;
			last = 0;
			for(index in yearCount){
				if(count>0){
					yearCount[index] += last;
				}
				last = yearCount[index];
				count+=1;
			}

			dataChartOne = [];
			dataChartOne.push(["Year","Number"]);
			for(index in yearCount){
				dataChartOne.push([index,yearCount[index]]);
			}
		}

		function sortOnKeys(dict) {
			var sorted = [];
			for(var key in dict) {
				sorted[sorted.length] = key;
			}
			sorted.sort();

			var tempDict = {};
			for(var i = 0; i < sorted.length; i++) {
				tempDict[sorted[i]] = dict[sorted[i]];
			}
			return tempDict;
		}

		updateChartTwoDS = function(){
			var femaleCount=[];
			var maleCount=[];
			var length = 9;

			for (var i=0;i<length;i++){
				femaleCount.push(0);
				maleCount.push(0);
			}

			for (index in $scope.encounters){
				var sexString = $scope.encounters[index].gender;
				var ageGroup = Math.floor($scope.encounters[index].age/10);

				if (ageGroup>7){
					ageGroup = 8;
				}

				if (sexString == "F"){
					femaleCount[ageGroup]+=1;
				}else if(sexString =="M"){
					maleCount[ageGroup]+=1;
				}else{
					console.log("invalide sex");
				}
			}

			dataChartTwo = [];
			dataChartTwo.push(['Age Group', 'Male', 'Female']);

			for (var i=0;i<length-1;i++){
				dataChartTwo.push([i*10+"-"+(i*10+9),maleCount[i],femaleCount[i]]);
			}

			dataChartTwo.push([">80",maleCount[length-1],femaleCount[length-1]]);
		}
		//--End Chart Methods part1--//

		//--Start Export Methods--//
		$scope.exportQRS = function(){
			var exportData = [['patient_name','gender','age','procedure','observer']];

			for (index in $scope.encounters){
				var encounter=$scope.encounters[index];
				exportData.push([encounter.patient,encounter.gender,encounter.age,encounter.procedure,encounter.observer]);
			}

			var csvRows = [];

			for(var i=0, l=exportData.length; i<l; ++i){
				csvRows.push(exportData[i].join(','));
			}

			var csvString = csvRows.join("\r\n");
			var a         = document.createElement('a');
			a.href     = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csvString);
			a.target      = '_blank';
			a.download    = 'qrs.csv';
			document.body.appendChild(a);
			a.click();
		}

		//--End Export Methods--//
	}
	]);

//--Start Chart Methods part2--//
google.load('visualization', '1.0', {'packages':['corechart']});
google.setOnLoadCallback(drawChart);

function drawChart() {
	var dataOne = google.visualization.arrayToDataTable(dataChartOne);
	var optionsOne = {
		// title: 'Patient Number',
		curveType: 'function',
		chartArea:{width:'75%'},
		// chartArea:{left:30,top:30,width:'80%',height:'50%'},
		legend: { position: 'none'}
	};
	var chartOne = new google.visualization.LineChart(document.getElementById('line-chart'));
	chartOne.draw(dataOne, optionsOne);

	var dataTwo = google.visualization.arrayToDataTable(dataChartTwo);
	var optionsTwo = {
		// title: 'Patient Distribution',
		chartArea:{width:'75%'},
		legend: { position: 'none'},
		hAxis: {title: 'Age Group', titleTextStyle: {color: 'black'}}
	};

	var chartTwo = new google.visualization.ColumnChart(document.getElementById('chart_div'));
	chartTwo.draw(dataTwo, optionsTwo);
}

//--End Chart Methods part2--//


//--Start TemporalSlider Controller--//
doraControllers.controller('TemporalSliderController', ['$scope', 'MapServ',
	function($scope, MapServ){

		$scope.sliderVisible = true;
		$scope.isPlaying = false;
		$scope.speed = "1x";
		$scope.granularity = "Weekly";
		$scope.scroll_speed = 1000; //in milliseconds
		$scope.scroll_granularity = 7; //every 0.5 is one day
		var scroller = null;

		$scope.sliderModifier = function(arg) {
			return $("#slider").dateRangeSlider(arg);
		};

		$scope.autoscroll = function() {
			var values = $("#slider").dateRangeSlider("values");
			var bounds = $("#slider").dateRangeSlider("option", "bounds");
			if (Date.parse(values.max) >= Date.parse(bounds.max)) {
				$scope.stopAutoscroll();
				$scope.isPlaying = false;
				$scope.$apply(); //Find a way to observe this value.
			} else {
				var endDate = new Date(values.max);
				endDate.setDate(endDate.getDate() + $scope.scroll_granularity*1);

				var startDate = null;
				if (Date.parse(endDate) >= Date.parse(bounds.max)) {
					var range = (new Date(values.max)) - (new Date(values.min));
					range = Math.ceil(range / (1000 * 3600 * 24))-1;
					console.log(range);
					startDate = new Date(bounds.max);
					startDate.setDate(startDate.getDate() - range);
				} else {
					startDate = new Date(values.min);
					startDate.setDate(startDate.getDate() + $scope.scroll_granularity*1);
				}

				$("#slider").dateRangeSlider("values", new Date(startDate), new Date(endDate));
			}
		}

		$scope.stopAutoscroll = function() {
			clearInterval(scroller);
			scroller = null;
		}

		$scope.toggleScrolling = function() {
			if (scroller == null) {
				scroller = setInterval(function(){$scope.autoscroll()}, $scope.scroll_speed);
			} else {
				$scope.stopAutoscroll();
			}
		}

		$scope.setScrollSpeed = function(scroll_speed) {
			$scope.scroll_speed = scroll_speed;
			$scope.toggleScrolling();
			$scope.toggleScrolling();
		}

		$scope.setScrollGranularity = function(scroll_granularity) {
			$scope.scroll_granularity = scroll_granularity;
			$scope.toggleScrolling();
			$scope.toggleScrolling();
		}

		function init() {
			//Initialize slider
			var defaultMax = new Date();
			var defaultMin = new Date();
			var defaultRange = 30;
			defaultMin.setDate(defaultMax.getDate() - defaultRange);
			
			$scope.sliderModifier({
				defaultValues:{
					min: defaultMin, //default is one month
					max: defaultMax
				},
				bounds:{
				    min: new Date(2012, 0, 1), //This value should be changed to the latest date available
				    max: new Date()
				  }
				});
			var values = $scope.sliderModifier("values");
			MapServ.setSliderMinMax(values.min, values.max);

			$scope.sliderModifier({range:{min: {days: 7}}});
			$scope.sliderModifier({symmetricPositionning: true});

			$("#slider").bind("valuesChanging", function(e, data){
				MapServ.setSliderMinMax(data.values.min, data.values.max);
				MapServ.temporalSliderFeaturesToggle();
			});

			$("#slider").bind("valuesChanged", function(e, data){
				MapServ.setSliderMinMax(data.values.min, data.values.max);
				MapServ.temporalSliderFeaturesToggle();
			});
		}

		init();
	}
]);

doraControllers.controller('UserAccountController', ['$scope', 'QRSServ', '$http',
	function($scope, QRSServ, $http){

		$scope.savedQueries = [];

		var isExist = function(query) {
			list = $scope.savedQueries;
			for (var i = 0; i < list.length; i++) {
				if (list[i].uuid == query.uuid) {
					return true;
				}
			}
			return false;
		}
		
		$scope.savePanelVisibility = false;
		
		$scope.toggleSavePanel = function(){
			$scope.savePanelVisibility = !$scope.savePanelVisibility;
		};
		
		$scope.executeQuery = function(queryObj) {
			// console.log('inside executeQuery');
			var location, alias;
			
			QRSServ.initializeLoading();
			console.log(queryObj);
			console.log(queryObj.query);
			var filters = JSON.parse(queryObj.query);
			if (queryObj.location) {
				location = JSON.parse(queryObj.location);
			}
			
			if (queryObj.alias) {
				alias = queryObj.alias;
			}
		
			QRSServ.generateQRS(filters, location, alias);
		};

		//load data
		$scope.loadQueries = function() {
			// console.log("inside loadQuery");
			$http({
				method: 'POST',
				url: '/dora/loadqueries/',
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
			}).success(function(response) {

				var queries = response.queries;
				for (var i = 0; i < queries.length; i++) {
					// console.log(queries[i]);
					var query = queries[i];
					if (!isExist(query)) {
						$scope.savedQueries.push(query);
					}
				}

				// console.log($scope.savedQueries);

			}).error(function(data){
				document.open();
				document.write(data);
				document.close();
			});
		}

		//save
		$scope.saveQuery = function(QRS) {
		
			console.log("inside savequery");
			console.log(QRS);

			var data = {};
			
			//remember to add a name!
			data.alias = QRS.alias || 'test';
			data.query = JSON.stringify(QRS.filters);
			
			if (QRS.location) {
				data.location = JSON.stringify(QRS.location);
			}
			
			$http({
				method: 'POST',
				url: '/dora/savequery/',
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				transformRequest: function(obj) {
					var str = [];
					for(var p in obj)
						str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
					return str.join("&");
				},
				data: data
			}).success(function(response) {
				// console.log('reloading queries');
				// console.log('response: '  + JSON.stringify(response));
				$scope.loadQueries();
			}).error(function(data){
				document.open();
				document.write(data);
				document.close();
			});	
		}

		//delete
		$scope.deleteQuery = function(query, index) {
			// console.log("deleting " + query.uuid);
			var uuid = query.uuid;
			$scope.savedQueries.splice(index, 1);
			
			$http({
				method: 'POST',
				url: '/dora/deletequery/',
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				data: uuid
			}).success(function(response) {
				// console.log(response);
			}).error(function(data){
				document.open();
				document.write(data);
				document.close();
			});	
		}

		$scope.loadQueries();

	}
]);
