var doraControllers = angular.module('doraControllers', []);

doraControllers.controller('QueryFormController', ['$scope', 'QRSServ', '$http', 'MapServ',
	function($scope, QRSServ, $http, MapServ){

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

				$http.get(domain + port + path).success(function(QRS) {
					QRSServ.addToQRSHistory(QRS);
				})
			}

			$scope.queryString = '';
			$scope.queryFilters = [];
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
