var dataChartOne = [];
var dataChartTwo = [];
var dataChartThree = [];
var doraControllers = angular.module('doraControllers', []);

doraControllers.controller('QueryFormController', ['$scope', 'QRSServ', '$http', 'MapServ',
	function($scope, QRSServ, $http, MapServ){

		$scope.disease = "";
		$scope.filters = [];
		var location = "";
		$scope.mapServMode = "drawing";
		
		$scope.available = {
			location: true,
			gender: true,
			age_range: true
		};

		$scope.addFilter = function() {
			//if array of filters is empty or last filter type is not set
			if ($scope.filters.length==0 || $scope.filters[$scope.filters.length-1].type != '') {
				$scope.filters.push({
					type: "",
					value: "",
					visibility: true
				});
			}
		};
		
		$scope.collapseIfFilterTypeIsNotEmpty = function(filter){
			filter.visibility = filter.type==='';
			
			if (filter.type === "location") {
				$scope.doneDrawing(filter);
			}
		};
		
		$scope.destroyElement = function(filters, $index) {
			$scope.available[filters[$index].type] = true;

			if (filters[$index].type === 'location') {
				MapServ.deactivatePolygonLayer();
				MapServ.clearPolygonLayer();
			}
			filters.splice($index, 1);
		};
		
		$scope.filterText = function(filter){
			if (filter.type === "gender") return "Gender: " + filter.value;
			else if (filter.type === "age_range") return "Age Range: " + filter.value;
			else if (filter.type === "location") return "Location";
			else return "Unknown Filter Type: ";
		};
		
		$scope.filterTypeChanged = function(filter){
			filter.value = "";
			
			$scope.available[filter.type] = false;
			
			console.log($scope.available);
			
			filter.selected = true;
			
			if (filter.type === "location") {
				MapServ.activatePolygonLayer();
			}
		};
		
		$scope.filterVisibilityChanged = function(filter) {
			filter.visibility = true;
			
			if (filter.type === "location") {
				MapServ.activatePolygonLayer();
			}
		};
		
		$scope.doneDrawing = function(filter){
			MapServ.deactivatePolygonLayer();
			filter.value = MapServ.getPolygons();
			filter.visibility = false;
			location = filter.value;
		};
		
		$scope.changeMode = function(newValue) {
			console.log(newValue);
			if (newValue == 'drawing') {
				MapServ.deactivatePolygonModify();
			}
			else if (newValue == 'modifying') {
				MapServ.activatePolygonModify();
			}
		};

		$scope.submitQuery = function(){
			// Basic check before pulling data from backend
			if ($scope.disease && $scope.disease != '') {
				QRSServ.initializeLoading();

				params = {};
				params.disease = $scope.disease;
				
				for (filterIndex in $scope.filters){
					params[$scope.filters[filterIndex].type] = $scope.filters[filterIndex].value;
				}
				
				$http({
					url: "/query",
					method: "GET",
					params: params
				}).success(function(QRS) {
					QRS.locationFeature = location;
					QRSServ.addToQRSHistory(QRS);
					MapServ.clearPolygonLayer();

					location = "";
				});
				
				$scope.disease = "";
				$scope.filters = [];

				$scope.available = {
					location: true,
					gender: true,
					age_range: true
				};
			}
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
		// $scope.selectedQRSIndex = -1;

		$scope.setDisplayedQRS = function(index) {
			$scope.displayedQRS = $scope.QRSHistory[index];
			updateChartOneDS();
			updateChartTwoDS();
			// updateChartThreeDS();
			drawChart();
		};

		$scope.toggleQRSVisibility = function(index) {
			$scope.doubleClickedQRS = $scope.QRSHistory[index];
			var toggledVisibility = !$scope.doubleClickedQRS.isVisible;
			$scope.doubleClickedQRS.isVisible = toggledVisibility
			MapServ.setVectorLayerVisibility($scope.doubleClickedQRS, toggledVisibility);
		}

		$scope.visibility = function(index){
			if ($scope.QRSHistory[index].isVisible) {
				return "";
			} else {
				return "btn-invisible";
			}
		}

		//--Start Chart Methods part1--//
		updateChartOneDS = function(){
			var yearCount = {};

			for (index in $scope.displayedQRS.assigned){
				var dateString = $scope.displayedQRS.assigned[index].created_date;
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
			var femaleCount=0;
			var maleCount=0;

			for (index in $scope.displayedQRS.assigned){
				var sexString = $scope.displayedQRS.assigned[index].patient.gender;

				if (sexString == "F"){
					femaleCount+=1;
				}else if(sexString =="M"){
					maleCount+=1;
				}else{
					console.log("invalide sex");
				}
			}
			console.log(femaleCount + ", "+maleCount);

			dataChartTwo = [];
			dataChartTwo.push(["Sex","percent"]);
			dataChartTwo.push(["Male",maleCount]);
			dataChartTwo.push(["Female",femaleCount]);
		}

		updateChartThreeDS = function(){
			// for (index in $scope.displayedQRS.assigned){
			// 	var dateString = $scope.displayedQRS.assigned[index].created_date;
			// 	//var year = dateString.split(",")[1];
			// }

			// dataChartOne = [];
			// dataChartOne.push(["Year","Number"]);
			// for(index in yearCount){
			// 	dataChartOne.push([index,yearCount[index]]);
			// }
		}


		//--End Chart Methods part1--//

		//--Start Export Methods--//

		$scope.exportQRS = function(){
			var data = [["name1", "city1", "some other info"], ["name2", "city2", "more info"]];
			var csvContent = "data:text/csv;charset=utf-8,";
			data.forEach(function(infoArray, index){
				dataString = infoArray.join(",");
				csvContent += index < infoArray.length ? dataString+ "\n" : dataString;
			}); 
			var encodedUri = encodeURI(csvContent);
			var link = document.createElement("a");
			link.setAttribute("href", encodedUri);
			link.setAttribute("download", "my_data.csv");
			link.click();
			// window.open(encodedUri);
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

// function drawChart() {

//         var data = google.visualization.arrayToDataTable([
//           ['Task', 'Hours per Day'],
//           ['Work',     11],
//           ['Eat',      2],
//           ['Commute',  2],
//           ['Watch TV', 2],
//           ['Sleep',    7]
//         ]);

//         var options = {
//           title: 'My Daily Activities'
//         };

//         var chart = new google.visualization.PieChart(document.getElementById('piechart'));

//         chart.draw(data, options);
//       }
function drawChart() {
	var dataOne = google.visualization.arrayToDataTable(dataChartOne);
	var optionsOne = {
		title: 'Patient Number',
		curveType: 'function',
		chartArea:{left:30,top:30,width:'80%',height:'50%'},
		legend: { position: 'none'}
	};
	var chartOne = new google.visualization.LineChart(document.getElementById('line-chart'));
	chartOne.draw(dataOne, optionsOne);

	var dataTwo = google.visualization.arrayToDataTable(dataChartTwo);
	var optionsTwo = {
		title: 'Gender Percent',
		chartArea:{left:20,top:20,width:'80%',height:'80%'}
	};
	var chartTwo = new google.visualization.PieChart(document.getElementById('piechart'));
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

		$("#slider").bind("valuesChanging", function(e, data){
			MapServ.setSliderMinMax(data.values.min, data.values.max);
			MapServ.temporalSliderFeaturesToggle();
		});
	}
	]);
