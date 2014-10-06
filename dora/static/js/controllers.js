var doraControllers = angular.module('doraControllers', []);

doraControllers.controller('QueryFormController', ['$scope', 'QRSServ', '$http', 'MapServ',
	function($scope, QRSServ, $http, MapServ){

		$scope.disease = "";
		$scope.filters = [];
		var location = "";

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
		};
		
		$scope.filterText = function(filter){
			if (filter.type === "gender") return "Gender: " + filter.value;
			else if (filter.type === "age_range") return "Age Range: " + filter.value;
			else if (filter.type === "location") return "Location";
			else return "Unknown Filter Type: ";
		};
		
		$scope.filterTypeChanged = function(filter){
			filter.value = "";
			
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
			MapServ.decactivatePolygonLayer();
			filter.value = MapServ.getPolygons();
			filter.visibility = false;
			location = filter.value;
			
			console.log(filter.value);
		};
		
		$scope.cancelDrawing = function(filters, $index) {
			MapServ.decactivatePolygonLayer();
			MapServ.clearPolygonLayer();
			filters.splice($index, 1)
		};

		$scope.submitQuery = function(){
			console.log($scope.disease);
			// Basic check before pulling data from backend
			if ($scope.disease && $scope.disease != '') {
				
				params = {};
				params.disease = $scope.disease;
				
				for (filterIndex in $scope.filters){
					params[$scope.filters[filterIndex].type] = $scope.filters[filterIndex].value;
				}
				
				console.log("here");
				
				$http({
					url: "/query",
					method: "GET",
					params: params
				}).success(function(QRS) {
					QRS.locationFeature = location;
					QRSServ.addToQRSHistory(QRS);
				});
			}
			
			$scope.disease = "";
			$scope.filters = [];

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

		$scope.setDisplayedQRS = function(index) {
			$scope.displayedQRS = $scope.QRSHistory[index];
		};

		$scope.toggleQRSMarkers = function(index) {
			$scope.doubleClickedQRS = $scope.QRSHistory[index];
			MapServ.toggleVectorLayerVisibility($scope.doubleClickedQRS);
		}

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

			console.log(QRS);
			console.log($scope.selectedQRSList);
		};

		$scope.unionIntersectQRS = {
			union: function(){
				$scope.newQRS = QRSServ.unionQRSHistory($scope.selectedQRSList);
				console.log("union called");
			},
			intersect: function(){
				$scope.newQRS = QRSServ.intersectQRSHistory($scope.selectedQRSList);
				console.log("intersect called");
			}
		};

		$scope.executeUnionIntersection = function(){
			if ($scope.selectedQRSList.length === 0) {return 0;}
			console.log($scope.selectionFunction);
			$scope.unionIntersectQRS[$scope.selectionFunction]();
			$scope.resetUnionIntersectVariables();
		};
		//--End Union intersection Methods--// 
	}
]);
