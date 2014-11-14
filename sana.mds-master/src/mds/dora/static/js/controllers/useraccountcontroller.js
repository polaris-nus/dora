doraControllers.controller('UserAccountController', ['$scope', 'QRSService', '$http',
	function($scope, QRSService, $http){

		$scope.savedQueries = [];

		var isExist = function(query) {
			list = $scope.savedQueries;
			for (var i = 0; i < list.length; i++) {
				if (list[i].uuid == query.uuid) {
					return true;
				}
			}
			return false;
		}
		
		$scope.savePanelVisibility = false;
		
		$scope.toggleSavePanel = function(){
			$scope.savePanelVisibility = !$scope.savePanelVisibility;
		};
		
		$scope.executeQuery = function(queryObj) {
			var location, alias;
			
			QRSService.initializeLoading();
			var filters = JSON.parse(queryObj.query);
			if (queryObj.location) {
				location = JSON.parse(queryObj.location);
			}
			
			if (queryObj.alias) {
				alias = queryObj.alias;
			}
		
			QRSService.generateQRS(filters, location, alias);
		};

		//load data
		$scope.loadQueries = function() {
			$http({
				method: 'POST',
				url: '/dora/loadqueries/',
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
			}).success(function(response) {

				var queries = response.queries;
				for (var i = 0; i < queries.length; i++) {
					var query = queries[i];
					if (!isExist(query)) {
						$scope.savedQueries.push(query);
					}
				}

			}).error(function(data){
				document.open();
				document.write(data);
				document.close();
			});
		}

		//save
		$scope.saveQuery = function(QRS) {

			var data = {};
			
			//remember to add a name!
			data.alias = QRS.alias || 'test';
			data.query = JSON.stringify(QRS.filters);
			
			if (QRS.location) {
				data.location = JSON.stringify(QRS.location);
			}
			
			$http({
				method: 'POST',
				url: '/dora/savequery/',
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				transformRequest: function(obj) {
					var str = [];
					for(var p in obj)
						str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
					return str.join("&");
				},
				data: data
			}).success(function(response) {

				$scope.loadQueries();
			}).error(function(data){
				document.open();
				document.write(data);
				document.close();
			});	
		}

		//delete
		$scope.deleteQuery = function(query, index) {

			var uuid = query.uuid;
			$scope.savedQueries.splice(index, 1);
			
			$http({
				method: 'POST',
				url: '/dora/deletequery/',
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				data: uuid
			}).success(function(response) {

			}).error(function(data){
				document.open();
				document.write(data);
				document.close();
			});	
		}

		$scope.loadQueries();

	}
]);