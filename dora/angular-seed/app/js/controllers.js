var doraControllers = angular.module('doraControllers', []);

doraControllers.controller('QueryFormController', ['$scope', 'QRSHistoryServ',
	function($scope, QRSHistoryServ) {

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
			//GET request here!
			var query = {};
			query.string = $scope.queryString;
			query.filters = $scope.queryFilters;

			QRSHistoryServ.addQRS(query);

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