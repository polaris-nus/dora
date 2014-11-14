var dataChartOne = [];
var dataChartTwo = [];
doraControllers.controller('QueryResultController', ['$scope', 'QRSService', 'MapService','$location', '$anchorScroll',
	function($scope, QRSService, MapService,$anchorScroll, $location){
		$scope.QRSHistory = QRSService.getQRSHistory();
		$scope.loadingStatus = QRSService.getLoadingStatus();

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
		var counter = 1;

		$scope.removeQRS = function() {
			QRSService.removeFromQRSHistory($scope.QRSHistory[$scope.displayedQRSIndex]);
		}

		$scope.requery = function(){
			QRSService.requery($scope.displayedQRS);
			var location = $scope.displayedQRS.location
			if (location && location.length > 0) {
				MapService.clearPolygonFilters();
				MapService.addPolygonFilters(location);
			}
		}

		$scope.setDisplayedQRS = function(index) {
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
		
		function addNewQRS(index) {
			var QRSHistory = $scope.QRSHistory;
			var alias = QRSHistory[QRSHistory.length-1].alias;
			if (alias == undefined) {
				QRSHistory[QRSHistory.length-1].alias = "QRS " + counter++;
			}
			$scope.setDisplayedQRS(index);
		}
		
		QRSService.setOnAddCallback(addNewQRS);

		$scope.showPopoverOnMap = function(encounterUuid) {
			MapService.triggerPopover($scope.displayedQRS, encounterUuid);
		}

		$scope.toggleQRSVisibility = function(index) {
			$scope.doubleClickedQRS = $scope.QRSHistory[index];
			var toggledVisibility = !$scope.doubleClickedQRS.isVisible;
			$scope.doubleClickedQRS.isVisible = toggledVisibility
			MapService.setVectorLayerVisibility($scope.doubleClickedQRS, toggledVisibility);
		}

		$scope.getQRSVisibility = function(index) {
			$scope.currentQRS = $scope.QRSHistory[index];
			return $scope.currentQRS.isVisible;
		}

		$scope.toggleQRSClustering = function() {
			var status = MapService.getClusterStrategyStatus($scope.displayedQRS);
			MapService.setClusterStrategyStatus($scope.displayedQRS, !status);
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