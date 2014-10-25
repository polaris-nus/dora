var dataChartOne = [];
var dataChartTwo = [];
var doraControllers = angular.module('doraControllers', []);

doraControllers.controller('QueryFormController', ['$scope', 'QRSServ', '$http', 'MapServ',
	function($scope, QRSServ, $http, MapServ){
		
		var location = '';
		$scope.mapServMode = 'unselected';
		$scope.locationSearchOn = false;
		
		function changeMode(newValue) {
			//console.log("changeMode triggered");
			// NING NING'R! NOTE CHANGES MADE HERE!
			//console.log(newValue);
			if (newValue == 'drawing') {
				MapServ.activatePolygonLayer();
			}
			else if (newValue == 'modifying') {
				MapServ.activatePolygonModify();
			}
			else if (newValue == 'regular') {
				MapServ.activateDrawRegularPolygon();
			}
		};
		
		$scope.filters = [];
		
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
			'Diagnosis',
			'Operation date',
			'Discharge date',
			'Follow up date'];

		$scope.input = "";
		
		$scope.submitFilter = function(){
			$scope.filters.push($scope.input);
			$scope.input = '';
		};

		$scope.toggleButton = function(){
			//mapServMode reset so that ngChange may be triggered
			if ($scope.locationSearchOn) {
				$scope.mapServMode = 'unselected';
				$scope.doneDrawing();	
			}
			
			//polygon drawing mode by default
			else {
				$scope.mapServMode = 'drawing';
			}
			//console.log($scope.mapServMode);
			$scope.locationSearchOn = !$scope.locationSearchOn;
		};
		
		$scope.clearShapes = function() {
			console.log("clearShapes called");
			MapServ.clearPolygonLayer();
			location = "";
		};
		
		$scope.$watch('mapServMode', changeMode);
		
		$scope.buttonName = function(){
			//console.log("location now is " + location);
			if ($scope.locationSearchOn) return "Apply search location";
			else if (location && location != "GEOMETRYCOLLECTION()") return "Edit search location";
			else return "Add search location";
		};
		
		$scope.doneDrawing = function(filter){
			MapServ.deactivatePolygonLayer();
			location = MapServ.getPolygons();
		};
		
		$scope.changeMode = changeMode;

		$scope.submitQuery = function(){

			console.log("inside submitQuery()");

			QRSServ.initializeLoading();

			var data = {};
			
			var tokens = $scope.query.split(';');
			
			function escapeRegExp(string) {
				return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
			}
			
			function replaceAll(string, find, replace) {
				return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
			}
			
			for (var i = 0; i < tokens.length; i++){
				var token = tokens[i];
				var colonPos = token.indexOf(':');
				var key = token.substring(0,colonPos)
				.trim()
				.replace(new RegExp(escapeRegExp(" "), 'g'), "_")
				.replace(new RegExp(escapeRegExp("'"), 'g'), "")
				.toLowerCase();
				data[key] = token.substring(colonPos + 1).trim();
			}
			
			data.location = location;
			
			console.log(data);
			
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
				QRSServ.addToQRSHistory(QRS);
				MapServ.clearPolygonLayer();

				location = "";
				
				$scope.query = '';
			}).error(function(data){
				document.open();
				document.write(data);
				document.close();
			});

		};
	}
	]);

doraControllers.controller('QueryResultController', ['$scope', 'QRSServ', 'MapServ',
	function($scope, QRSServ, MapServ){
		$scope.QRSHistory = QRSServ.getQRSHistory();
		$scope.loadingStatus = QRSServ.getLoadingStatus();
		$scope.selectedQRSList = [];
		$scope.selectionFlag = false;
		$scope.selectionFunction = '';
		$scope.newQRS = {};
		$scope.displayedQRS = {};
		$scope.panelVisible = true;
		$scope.encounterVisible = false;
		$scope.encounters = [];
		$scope.chartOneVisible = true;
		$scope.chartTwoVisible = true;

		$scope.setDisplayedQRS = function(index) {
			$scope.displayedQRS = $scope.QRSHistory[index];
			updateEncounters();
			updateChartOneDS();
			updateChartTwoDS();
			drawChart();
		};

		$scope.toggleQRSVisibility = function(index) {
			$scope.doubleClickedQRS = $scope.QRSHistory[index];
			var toggledVisibility = !$scope.doubleClickedQRS.isVisible;
			$scope.doubleClickedQRS.isVisible = toggledVisibility
			MapServ.setVectorLayerVisibility($scope.doubleClickedQRS, toggledVisibility);
		}

		$scope.setQRSClustering = function(status) {
			console.log("clicked");
			MapServ.setClusterStrategyStatus($scope.displayedQRS, status);
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
				}		
				$scope.encounters.push(encounter);
			}
		}







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

		//--Start Union intersection Methods--//
		$scope.resetUnionIntersectVariables = function(){
			$scope.selectedQRSList = [];
			$scope.selectionFlag = false;
			$scope.selectionFunction = '';
		}

		$scope.selectQRS = function(QRS){
			var indexOfQRS = $scope.selectedQRSList.indexOf(QRS);
			if ($scope.selectionFlag) {
				if (indexOfQRS === -1) {
					$scope.selectedQRSList.push(QRS);
				} else {
					$scope.selectedQRSList.splice(indexOfQRS, 1);
				}
			}
		};

		$scope.unionIntersectQRS = {
			union: function(){
				$scope.newQRS = QRSServ.unionQRSHistory($scope.selectedQRSList);
			},
			intersect: function(){
				$scope.newQRS = QRSServ.intersectQRSHistory($scope.selectedQRSList);
			}
		};

		$scope.executeUnionIntersection = function(){
			if ($scope.selectedQRSList.length === 0) {return 0;}
			$scope.unionIntersectQRS[$scope.selectionFunction]();
			$scope.resetUnionIntersectVariables();
		};
		//--End Union intersection Methods--// 
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
		chartArea:{width:'85%'},
		// chartArea:{left:30,top:30,width:'80%',height:'50%'},
		legend: { position: 'none'}
	};
	var chartOne = new google.visualization.LineChart(document.getElementById('line-chart'));
	chartOne.draw(dataOne, optionsOne);

	var dataTwo = google.visualization.arrayToDataTable(dataChartTwo);
	var optionsTwo = {
		// title: 'Patient Distribution',
		chartArea:{width:'85%'},
		legend: { position: 'none'},
		hAxis: {title: 'Age Group', titleTextStyle: {color: 'black'}}
	};

	var chartTwo = new google.visualization.ColumnChart(document.getElementById('chart_div'));
	chartTwo.draw(dataTwo, optionsTwo);
}

//--End Chart Methods part2--//

//--Start TemporalSlider Controller--//
doraControllers.controller('TemporalSliderController', ['$scope', 'QRSServ', 'MapServ',
	function($scope, QRSServ, MapServ){
		$scope.sliderVisible = true;

		$scope.sliderModifier = function(arg) {
			return $("#slider").dateRangeSlider(arg);
		};

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


		var scroll_speed = 0.5; //in seconds
		var scroller;

		$scope.startAutoscroll = function() {
			$('#slider').dateRangeSlider('scrollRight', 1);
			var bounds = $("#slider").dateRangeSlider("option", "bounds");
			var values = $scope.sliderModifier("values");
			if (Date.parse(values.max) >= Date.parse(values.min)) {
				$scope.stopAutoscroll();
			}
		}

		$scope.stopAutoscroll = function() {
			clearInterval(scroller);
		}

		$("#slider").bind("valuesChanging", function(e, data){
			MapServ.setSliderMinMax(data.values.min, data.values.max);
			MapServ.temporalSliderFeaturesToggle();
			//scroller = setInterval(function(){$scope.startAutoscroll()}, scroll_speed*1000);
		});

	}
	]);
