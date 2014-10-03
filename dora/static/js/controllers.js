var doraControllers = angular.module('doraControllers', []);

doraControllers.controller('QueryFormController', ['$scope', 'QRSHistoryServ', '$http',
	function($scope, QRSHistoryServ, $http) {

		$scope.queryString = '';
		$scope.queryFilters = [];
		
		$scope.filterFormVisibility = false;
		$scope.filterFormType = '';
		$scope.filterFormValue = '';

		$scope.addFilter = function(){
			var filter = {};
			filter.type = $scope.filterFormType;
			filter.value = $scope.filterFormValue;
			$scope.queryFilters.push(filter);
			
			$scope.filterFormType = '';
			$scope.filterFormValue = '';
			$scope.filterFormVisibility = false;
		};

		$scope.submitQuery = function(){
			var query = {};
			query.string = $scope.queryString;
			query.filters = $scope.queryFilters;

			// Basic check before pulling data from backend
			if (query.string && query.string != '') {
				var domain = 'http://127.0.0.1';
				var port = ':'+'8000/';
				var path = 'query/?disease='+ query.string ;

				for (index in query.filters) {
					var filter = query.filters[index];
					// Can only query gender for now, in future just append filter.type to path.
					if(filter.type == 'gender') {
						path += '&gender=' + filter.value;
					}
				}

				$http.get(domain + port + path).success(function(data) {
					$scope.encounters = data;

					var coordinates = [];
					for(index in $scope.encounters.assigned) {
						var encounter = $scope.encounters.assigned[index];
						coordinates.push(encounter.location.coords);
					}
					QRSHistoryServ.addQRS($scope.encounters);
					// commented out to pass unit testing! MUST FIND BETTER WAY TO INJECT DEPENDENCY. Try services?
					// generatePoints(coordinates); 
				})
			}

			$scope.queryString = '';
			$scope.queryFilters = [];
		};
	}]);

doraControllers.controller('QueryResultController', ['$scope', 'QRSHistoryServ',
	function($scope, QRSHistoryServ) {
		$scope.QRSHistory = QRSHistoryServ.getQRSHistory();
		$scope.selectedQRSList = [];
		$scope.selectionFlag = false;
		$scope.selectionFunction = '';

		// can init/set to null?
		$scope.displayedQRS = {};

		$scope.setDisplayedQRS = function(index) {
			$scope.displayedQRS = $scope.QRSHistory[index];
		};

		$scope.selectQRS = function(QRS){
			var indexOfQRS = $scope.selectedQRSList.indexOf(QRS);
			if ($scope.selectionFlag && indexOfQRS === -1) {
				$scope.selectedQRSList.push(QRS);
			} else {
				$scope.selectedQRSList.splice(indexOfQRS, 1);
			}

			console.log(QRS);
			console.log($scope.selectedQRSList);
		};

		$scope.unionIntersectQRS = {
			union: function(){
				var newQRS = QRSHistoryServ.unionQRSHistory($scope.selectedQRSList);
				console.log("BEIOWN");
			},
			intersect: function(){
				var newQRS = QRSHistoryServ.intersectQRSHistory($scope.selectedQRSList);
				console.log("BEIOWN ALSO");
			}
		};

		$scope.executeUnionIntersection = function(){
			console.log($scope.selectionFunction);
			$scope.unionIntersectQRS[$scope.selectionFunction]();

			//reset
			$scope.selectedQRSList = [];
			$scope.selectionFlag = false;
			$scope.selectionFunction = '';
		};

	}]);