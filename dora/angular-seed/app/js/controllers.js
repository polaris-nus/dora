var doraControllers = angular.module('doraControllers', []);

doraControllers.controller('QueryFormController', ['$scope',
	function($scope) {

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
			$scope.queryString = '';
			$scope.queryFilters = [];
		};
	}]);

doraControllers.controller('QueryResultController', ['$scope',
	function($scope) {
		$scope.QRSHistory = [
		{
			abbreviation: 'TB'
		},
		{
			abbreviation: 'EB'
		},
		{
			abbreviation: 'MA'
		},
		{
			abbreviation: 'SA'
		},
		{
			abbreviation: 'BF'
		}
		];
		// can init/set to null?
		$scope.displayedQRS = 0;

		$scope.setDisplayedQRS = function(index) {
			$scope.displayedQRS = index;
		};

	}]);