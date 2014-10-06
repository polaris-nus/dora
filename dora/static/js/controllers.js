var doraControllers = angular.module('doraControllers', []);

doraControllers.controller('QueryFormController', ['$scope', 'QRSServ', '$http', 'MapServ',
	function($scope, QRSServ, $http, MapServ){

		$scope.disease = "";
		$scope.filters = [];

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
		
		$scope.filterTypeChanged = function(filter){
			filter.value = "";
			
			if (filter.type === "location") {
				MapServ.activatePolygonLayer();
			}
		}
		
		$scope.filterVisibilityChanged = function(filter) {
			filter.visibility = true;
			
			if (filter.type === "location") {
				MapServ.activatePolygonLayer();
			}
		};
		
		$scope.doneDrawing = function(filter){
			MapServ.decactivatePolygonLayer();
			filter.value = MapServ.getPolygons();
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
				var url = window.location.host + "/query";
				
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
			MapServ.toggleClusterLayerVisibility($scope.doubleClickedQRS);
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
			console.log($scope.selectionFunction);
			$scope.unionIntersectQRS[$scope.selectionFunction]();
			$scope.resetUnionIntersectVariables();
		};
		//--End Union intersection Methods--// 
	}
]);
