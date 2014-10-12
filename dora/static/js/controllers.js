var testingdata = [];
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
		$scope.selectedQRSList = [];
		$scope.selectionFlag = false;
		$scope.selectionFunction = '';
		$scope.newQRS = {};
		$scope.displayedQRS = {};

		$scope.setDisplayedQRS = function(index) {
			$scope.displayedQRS = $scope.QRSHistory[index];
			updateChartOneDS();
			drawChart();
		};

		$scope.toggleQRSMarkers = function(index) {
			$scope.doubleClickedQRS = $scope.QRSHistory[index];
			MapServ.toggleVectorLayerVisibility($scope.doubleClickedQRS);
		}

		//--Start Chart Methods part1--//
		updateChartOneDS = function(){
			var yearCount = {};

			for (index in $scope.displayedQRS.assigned){
				var dateString = $scope.displayedQRS.assigned[index].created_date;
				var year = dateString.split(",")[1];
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

			testingdata = [];
			testingdata.push(["Year","Number"]);
			for(index in yearCount){
				testingdata.push([index,yearCount[index]]);
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



		//--End Chart Methods part1--//

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

// testingdata = [['Year', 'New'],
// 	['2009',  107],
// 	['2010',  117],
// 	['2011',  66],
// 	['2012',  103],
// 	['2013',  10],
// 	['2014',  7]
// 	];

function drawChart() {
  // Create the data table.
//   var data = new google.visualization.DataTable();
//   data.addColumn('string', 'Topping');
//   data.addColumn('number', 'Slices');
//   data.addRows([
//     ['Alive', 52],
//     ['Dead', 18],
//     ['Cured', 30],
//     ]);

//   // Set chart options
//   var options = {title:'Current Condition of Patients',
//   pieSliceText: 'label',
//   chartArea:{left:10,top:30,width:'100%',height:'70%'}
// };

//   // Instantiate and draw our chart, passing in some options.
//   var chart = new google.visualization.PieChart(document.getElementById('pie-chart'));
//   chart.draw(data, options);

var data2 = google.visualization.arrayToDataTable(testingdata);

var options2 = {
	title: 'Patient Number',
	curveType: 'function',
	chartArea:{left:30,top:30,width:'80%',height:'50%'},
	legend: { position: 'none'}
};

var chart2 = new google.visualization.LineChart(document.getElementById('line-chart'));

chart2.draw(data2, options2);
}
		//--End Chart Methods part2--//


//--Start TemporalSlider Controller--//
doraControllers.controller('TemporalSliderController', ['$scope', 'QRSServ', 'MapServ',
	function($scope, QRSServ, MapServ){

		$scope.sliderModifier = function(arg) {
			$("#slider").dateRangeSlider(arg);
		};

		//Initialize slider
		$scope.sliderModifier({
			defaultValues:{
				min: new Date()-30, //default is one month
				max: new Date()
			},
			bounds:{
			    min: new Date(2012, 0, 1), //This value should be changed to the latest date available
			    max: new Date()
			}
		});

		$scope.sliderModifier({range:{min: {days: 7}}});
		$scope.sliderModifier({symmetricPositionning: true});
		
	}
]);

//--End TemporalSlider Controller--//


