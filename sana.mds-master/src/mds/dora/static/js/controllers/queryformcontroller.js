doraControllers.controller('QueryFormController', ['$scope', 'QRSService', 'MapService',
	function($scope, QRSService, MapService){
		
		$scope.mapServMode = 'unselected';
		$scope.locationSearchOn = false;
		$scope.key = '';
		$scope.input = '';		
		$scope.filters = [];
		
		//Vars for error Modal
		$scope.modalTitle = 'Error!'
		$scope.errorMessage = 'Your query was not understood, Please Try Again!'


		//sets the filter from the QueryResultController
		var setfilters = function(newFilters){
			
			for (var i = 0; i < $scope.filters.length; i++) {
				$scope.data.push($scope.filters[i].key);
			}
			
			$scope.filters = newFilters.slice();
			
			for (var i = 0; i < $scope.filters.length; i++) {
				var key = $scope.filters[i].key;
				$scope.data.splice($scope.data.indexOf(key),1);
			}

		}

		QRSService.setRequeryCallback(setfilters);

		function changeMode(newValue) {

			if (newValue == 'polygon') {
				MapService.activateDrawPolygon();
			}
			else if (newValue == 'circle') {
				MapService.activateDrawCircle();
			}

			else if (newValue == 'country') {
				MapService.activateSelectCountry();
			}
		};

		//autocomplete filter types
		$scope.data = [
			"Patient's family name",
			"Patient's given name",
			'Gender',
			'Procedure',
			'Age range',
			//"Observer's first name",
			//"Observer's last name",
			"Observer's username",
			'Drainage at surgery site',
			'Surgical site drainage odor',
			'Color of surgical site drainage',
			'Surgical site drainage viscosity',
			"Location at patient's house",
			'Fever post surgical procedure',
			'Surgical site pain',
			'Redness at surgical site',
			'Swelling at surgical site',
			'Firmness at surgical site',
			'Spontaneous opening at surgical site',
			'Infection suspected at surgical site',
			'Diagnosis'
			//'Operation date',
			//'Discharge date',
			//'Follow up date'
			];
			
		
		$scope.selectFilter = function(key){
			$scope.key = key;
			$scope.input = '';
		};
		
		$scope.submitFilter = function(){
			if ($scope.key && $scope.input) {
				
				$scope.filters.push({key:$scope.key, value:$scope.input});
				$scope.data.splice($scope.data.indexOf($scope.key),1);
				
				$scope.key = '';
				$scope.input = '';
			}
		};

		$scope.toggleButton = function(){
			//mapServMode reset so that ngChange may be triggered
			if ($scope.locationSearchOn) {
				$scope.mapServMode = 'unselected';
				$scope.doneDrawing();
			}
			
			//polygon drawing mode by default
			else {
				MapService.activatePolygonFilters();
				$scope.mapServMode = 'drawing';
			}

			$scope.locationSearchOn = !$scope.locationSearchOn;
		};
		
		$scope.clearShapes = function() {
			MapService.clearPolygonFilters();
		};
		
		$scope.$watch('mapServMode', changeMode);
		
		$scope.buttonName = function(){
			if ($scope.locationSearchOn) return "Hide location search";
			else return "Location search";
		};
		
		$scope.doneDrawing = function(filter){
			MapService.deactivatePolygonFilters();
		};
		
		$scope.editFilter = function(index, filter){
			$scope.key = filter.key;
			$scope.input = filter.value;
			$scope.removeFilter(index, filter);
		};
		
		$scope.removeFilter = function(index, filter){

			$scope.filters.splice(index, 1);
			$scope.data.push(filter.key);
		};
		
		$scope.changeMode = changeMode;

		$scope.submitQuery = function(){
			
			if ($scope.locationSearchOn){
				$scope.toggleButton();
			}

			QRSService.initializeLoading();
			
			var filters = $scope.filters;
			
			//return the keys back into autocomplete array
			for (var i = 0; i < filters.length; i++) {
				$scope.data.push(filters[i].key);
			}
			
			$scope.filters = [];
			$scope.key = "";
			$scope.input = "";
			
			var location = MapService.getPolygonFilters();

			var displayModal = function(title, msg) {
				$scope.modalTitle = title;
				$scope.errorMessage = msg;
				$('#myModal').modal('show');
			}
			
			QRSService.setQueryCallback(function(status){
				if (status === 'unauthorized') {
					//Some unauthorized!
					displayModal(
						"Error: Unauthorized!",
						"You are unauthorized to make this query. Please login and try again."
					);
				} else if (status === 'error') {
					//Some Error!
					displayModal(
						"Error: Query Not Understood!",
						"The query input was not understood. Please check for errors and try again!"
					);
				} else if (status === 'empty') {
					//Empty Set!
					displayModal(
						"Error: Query Result is Empty!",
						"The combination of filters provided returned an empty result set. Please generalize your query and try again!"
					);
				} else {
					//for testing saving and loading queries only!!!
					//qrs = QRSService.getQRSHistory();
					//console.log(qrs);
					//$scope.$parent.saveQuery(qrs[qrs.length-1]);
				}
			});
			
			QRSService.generateQRS(filters, location);
			
			MapService.clearPolygonFilters();
			
		};
	}
]);