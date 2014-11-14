//--Start TemporalSlider Controller--//
doraControllers.controller('TemporalSliderController', ['$scope', 'MapService',
	function($scope, MapService){

		$scope.sliderVisible = true;
		$scope.isPlaying = false;
		$scope.speed = "1x";
		$scope.step = "Weekly";
		$scope.scroll_speed = 500; //in milliseconds
		$scope.scroll_step = 7; //every 0.5 is one day
		var scroller = null;

		$scope.autoscroll = function() {
			var values = $("#slider").dateRangeSlider("values");
			var bounds = $("#slider").dateRangeSlider("option", "bounds");
			if (Date.parse(values.max) >= Date.parse(bounds.max)) {
				$scope.stopAutoscroll();
				$scope.isPlaying = false;
				$scope.$apply(); //Find a way to observe this value.
			} else {
				var endDate = new Date(values.max);
				endDate.setDate(endDate.getDate() + $scope.scroll_step*1);

				var startDate = null;
				if (Date.parse(endDate) >= Date.parse(bounds.max)) {
					var range = (new Date(values.max)) - (new Date(values.min));
					range = Math.ceil(range / (1000 * 3600 * 24))-1;

					startDate = new Date(bounds.max);
					startDate.setDate(startDate.getDate() - range);
				} else {
					startDate = new Date(values.min);
					startDate.setDate(startDate.getDate() + $scope.scroll_step*1);
				}

				$("#slider").dateRangeSlider("values", new Date(startDate), new Date(endDate));
			}
		};

		$scope.stopAutoscroll = function() {
			clearInterval(scroller);
			scroller = null;
		};

		$scope.toggleScrolling = function() {
			if (scroller == null) {
				scroller = setInterval(function(){$scope.autoscroll();}, $scope.scroll_speed);
			} else {
				$scope.stopAutoscroll();
			}
		};

		$scope.setScrollSpeed = function(scroll_speed) {
			$scope.scroll_speed = scroll_speed;
			$scope.toggleScrolling();
			$scope.toggleScrolling();
		};

		$scope.setScrollStep = function(scroll_step) {
			$scope.scroll_step = scroll_step;
			$scope.toggleScrolling();
			$scope.toggleScrolling();
		};

		function init() {
			//Initialize slider
			var defaultMax = new Date();
			var defaultMin = new Date();
			var defaultRange = 30;
			defaultMin.setDate(defaultMax.getDate() - defaultRange);
			
			$("#slider").dateRangeSlider({
				defaultValues:{
					min: defaultMin, //default is one month
					max: defaultMax
				},
				bounds:{
				    min: new Date(2012, 0, 1), //This value should be changed to the latest date available
				    max: new Date()
				  }
				});
			var values = $("#slider").dateRangeSlider("values");
			MapService.setSliderMinMax(values.min, values.max);

			$("#slider").dateRangeSlider({range:{min: {days: 7}}});
			$("#slider").dateRangeSlider({symmetricPositionning: true});

			$("#slider").bind("valuesChanging", function(e, data){
				MapService.setSliderMinMax(data.values.min, data.values.max);
				MapService.temporalSliderFeaturesToggle();
			});

			$("#slider").bind("valuesChanged", function(e, data){
				MapService.setSliderMinMax(data.values.min, data.values.max);
				MapService.temporalSliderFeaturesToggle();
			});
		}

		init();
	}
]);