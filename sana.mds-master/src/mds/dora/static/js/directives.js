var doraDirectives = angular.module('doraDirectives', []);

doraDirectives.directive('dynamicFilter', [function(){
	
	return {
		restrict: 'E',
		templateUrl: '/static/html/dynamic-filter.html'
	};
}]);

doraDirectives.directive("outsideClick", ['$document','$parse', function( $document, $parse ){
    return {
        link: function( $scope, $element, $attributes ){
            var scopeExpression = $attributes.outsideClick,
                onDocumentClick = function(event){
                    var isDescendent = $(event.target).parents().index($element[0]) >= 0;

                    if(!isDescendent) {
                        $scope.$apply(scopeExpression);
                    }
                };

            $document.on("click", onDocumentClick);

            $element.on('$destroy', function() {
                $document.off("click", onDocumentClick);
            });
        }
    };
}]);