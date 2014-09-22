var doraControllers = angular.module('doraControllers', []);

doraControllers.controller('QueryFormController', ['$scope', 'QRSHistoryServ', '$http',
	function($scope, QRSHistoryServ, $http) {

		$scope.queryString = '';
		$scope.queryFilters = [];
		
		$scope.filterFormVisibility = false;
		$scope.filterFormType = '';
		$scope.filterFormValue = '';

		$scope.response = 'testing data';

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
			//GET request here!
			var query = {};
			query.string = $scope.queryString;
			query.filters = $scope.queryFilters;

			// Simple check before pulling data from backend
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
					$scope.response = data;
				})

				QRSHistoryServ.addQRS(query);
				generatePoints();

			}

			

			$scope.queryString = '';
			$scope.queryFilters = [];
		};
	}]);

doraControllers.controller('QueryResultController', ['$scope', 'QRSHistoryServ',
	function($scope, QRSHistoryServ) {
		$scope.QRSHistory = QRSHistoryServ.getQRSHistory();
	
		// can init/set to null?
		$scope.displayedQRS = {};

		$scope.setDisplayedQRS = function(index) {
			$scope.displayedQRS = $scope.QRSHistory[index];
		};

	}]);