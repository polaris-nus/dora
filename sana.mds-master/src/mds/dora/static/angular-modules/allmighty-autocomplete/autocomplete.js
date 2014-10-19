/* --- Made by justgoscha and licensed under MIT license --- */

/* Modifications by Polaris from NUS:
-add a way to use autocomplete on a string token, instead of the whole input text field
-will now set caret at the end of the input after selection
-tokens delimited by ';'
*/

var app = angular.module('autocomplete', []);

app.directive('autocomplete', function() {
  var index = -1;

  return {
    restrict: 'E',
    scope: {
      searchParam: '=ngModel',
      suggestions: '=data',
      onType: '=onType',
      onSelect: '=onSelect'
    },
    controller: ['$scope', function($scope){
    
      $scope.startIndex = 0;
      $scope.endIndex = 0;
      
      var getCaretPosition = function(inputElem){
      	var caretPos = 0;
      	//IE
      	if (document.selection) {
      		inputElem.focus();
      		var sel = document.selection.createRange();
      		sel.moveStart('character', -inputElem.value.length);
      		caretPos = sel.text.length;
      	}
      	
      	//Firefox, chrome
      	else if(inputElem.selectionStart || inputElem.selectionStart == '0'){
      		caretPos = inputElem.selectionStart;
      	}
      	return caretPos;
      };
      
      $scope.setCaretPositionToEnd = function(inputElem){
      	if (inputElem.setSelectionRange) {
      		inputElem.focus();
      		var length = inputElem.value.length;
      		inputElem.setSelectionRange(length, length);
      	}
      	else if (inputElem.createTextRange) {
      		var range = inputElem.createTextRange();
      		range.collapse(true);
      		range.moveEnd('character', length);
      		range.moveStart('character', length);
      		range.select();
      	}
      };
      
      $scope.updateStartAndEndIndex = function(inputElem, queryString){
      	var caretPos = getCaretPosition(inputElem);
      	var tokens = queryString.split(';');
      	var sum = 0, counter = 0;
      	while (caretPos > sum
      			&& counter < tokens.length 
      			&& caretPos > sum + tokens[counter].length) {
      		sum += tokens[counter].length + 1;
      		counter++;
      	}
      	$scope.startIndex = sum;
      	$scope.endIndex = sum + tokens[counter].length;
      };
      
      function spliceSlice(str, startIndex, endIndex, add) {
        return str.slice(0, startIndex) + add + str.slice(endIndex);
	  }
    
      // the index of the suggestions that's currently selected
      $scope.selectedIndex = -1;

      // set new index
      $scope.setIndex = function(i){
        $scope.selectedIndex = parseInt(i);
      };

      this.setIndex = function(i){
        $scope.setIndex(i);
        $scope.$apply();
      };

      $scope.getIndex = function(i){
        return $scope.selectedIndex;
      };

      // watches if the parameter filter should be changed
      var watching = true;

      // autocompleting drop down on/off
      $scope.completing = false;

      // starts autocompleting on typing in something
      $scope.$watch('searchParam', function(newValue, oldValue){
        if (oldValue === newValue || !oldValue) {
          return;
        }

        if(watching && typeof $scope.searchParam !== 'undefined' && $scope.searchParam !== null) {
          $scope.completing = true;
      	  $scope.updateStartAndEndIndex($scope.inputElem, newValue);
      	  console.log($scope.startIndex + " and " + $scope.endIndex);
      	  console.log(newValue);
          $scope.searchFilter = newValue.substring( $scope.startIndex,  $scope.endIndex);
          console.log($scope.searchFilter);
          $scope.selectedIndex = -1;
        }

        // function thats passed to on-type attribute gets executed
        if($scope.onType)
          $scope.onType($scope.searchParam);
      });
      
      /*$scope.$watch(
      	function() {
      		return getCaretPosition($scope.inputElem);
      	},
      	function(oldValue, newValue){
	      	if (oldValue === newValue || !oldValue) {
	          return;
	        }
	        
	        $scope.updateStartAndEndIndex($scope.inputElem, $scope.searchParam);
	        $scope.startIndex = $scope.startIndex;
	        $scope.endIndex = $scope.endIndex;
	
	        if(watching && typeof $scope.searchParam !== 'undefined' && $scope.searchParam !== null) {
	          $scope.completing = true;
	          $scope.searchFilter = $scope.searchParam.substring( $scope.startIndex,  $scope.endIndex);
	          $scope.selectedIndex = -1;
	        }
      	});*/

      // for hovering over suggestions
      this.preSelect = function(suggestion){

        watching = false;

        // this line determines if it is shown
        // in the input field before it's selected:
        //$scope.searchParam = suggestion;

        $scope.$apply();
        watching = true;

      };

      $scope.preSelect = this.preSelect;

      this.preSelectOff = function(){
        watching = true;
      };

      $scope.preSelectOff = this.preSelectOff;

      // selecting a suggestion with RIGHT ARROW or ENTER
      $scope.select = function(suggestion){
        if(suggestion){
          $scope.searchParam = spliceSlice($scope.searchParam, $scope.startIndex, $scope.endIndex, suggestion + ": ");
          $scope.searchFilter = '';
          if($scope.onSelect)
            $scope.onSelect(suggestion);
        }
   
   		$scope.setCaretPositionToEnd($scope.inputElem);
        watching = false;
        $scope.completing = false;
        setTimeout(function(){watching = true;},1000);
        $scope.setIndex(-1);
      };


    }],
    link: function(scope, element, attrs){
    
      scope.inputElem = element.find('input')[0];

      var attr = '';

      // Default atts
      scope.attrs = {
        "placeholder": "start typing...",
        "class": "",
        "id": "",
        "inputclass": "",
        "inputid": ""
      };

      for (var a in attrs) {
        attr = a.replace('attr', '').toLowerCase();
        // add attribute overriding defaults
        // and preventing duplication
        if (a.indexOf('attr') === 0) {
          scope.attrs[attr] = attrs[a];
        }
      }

      if (attrs.clickActivation) {
        element[0].onclick = function(e){
          if(!scope.searchParam){
            scope.completing = true;
            scope.$apply();
          }
        };
      }

      var key = {left: 37, up: 38, right: 39, down: 40 , enter: 13, esc: 27, tab: 9};

      document.addEventListener("keydown", function(e){
        var keycode = e.keyCode || e.which;

        switch (keycode){
          case key.esc:
            // disable suggestions on escape
            scope.select();
            scope.setIndex(-1);
            scope.$apply();
            e.preventDefault();
        }
      }, true);

      document.addEventListener("blur", function(e){
        // disable suggestions on blur
        // we do a timeout to prevent hiding it before a click event is registered
        setTimeout(function() {
          scope.select();
          scope.setIndex(-1);
          scope.$apply();
        }, 200);
      }, true);

      element[0].addEventListener("keydown",function (e){
        var keycode = e.keyCode || e.which;

        var l = angular.element(this).find('li').length;

        // implementation of the up and down movement in the list of suggestions
        switch (keycode){
          case key.up:

            index = scope.getIndex()-1;
            if(index<-1){
              index = l-1;
            } else if (index >= l ){
              index = -1;
              scope.setIndex(index);
              scope.preSelectOff();
              break;
            }
            scope.setIndex(index);

            if(index!==-1)
              scope.preSelect(angular.element(angular.element(this).find('li')[index]).text());

            scope.$apply();

            break;
          case key.down:
            index = scope.getIndex()+1;
            if(index<-1){
              index = l-1;
            } else if (index >= l ){
              index = -1;
              scope.setIndex(index);
              scope.preSelectOff();
              scope.$apply();
              break;
            }
            scope.setIndex(index);

            if(index!==-1)
              scope.preSelect(angular.element(angular.element(this).find('li')[index]).text());

            break;
          case key.left:
            break;
          case key.right:
          case key.enter:
          case key.tab:

            index = scope.getIndex();
            // scope.preSelectOff();
            if(index !== -1) {
              scope.select(angular.element(angular.element(this).find('li')[index]).text());
              if(keycode == key.enter) {
                e.preventDefault();
              }
            } else {
              if(keycode == key.enter) {
                scope.select();
              }
            }
            scope.setIndex(-1);
            scope.$apply();

            break;
          case key.esc:
            // disable suggestions on escape
            scope.select();
            scope.setIndex(-1);
            scope.$apply();
            e.preventDefault();
            break;
          default:
            return;
        }

      });
    },
    template: '\
        <div class="autocomplete {{ attrs.class }}" id="{{ attrs.id }}">\
          <input\
            type="text"\
            ng-model="searchParam"\
            placeholder="{{ attrs.placeholder }}"\
            class="{{ attrs.inputclass }}"\
            id="{{ attrs.inputid }}"/>\
          <ul ng-show="completing && suggestions.length>0">\
            <li\
              suggestion\
              ng-repeat="suggestion in suggestions | filter:searchFilter | orderBy:\'toString()\' track by $index"\
              index="{{ $index }}"\
              val="{{ suggestion }}"\
              ng-class="{ active: ($index === selectedIndex) }"\
              ng-click="select(suggestion)"\
              ng-bind-html="suggestion | highlight:searchFilter"></li>\
          </ul>\
        </div>'
  };
});

app.filter('highlight', ['$sce', function ($sce) {
  return function (input, searchParam) {
    if (typeof input === 'function') return '';
    if (searchParam) {
      var words = '(' +
            searchParam.split(/\ /).join(' |') + '|' +
            searchParam.split(/\ /).join('|') +
          ')',
          exp = new RegExp(words, 'gi');
      if (words.length) {
        input = input.replace(exp, "<span class=\"highlight\">$1</span>");
      }
    }
    return $sce.trustAsHtml(input);
  };
}]);

app.directive('suggestion', function(){
  return {
    restrict: 'A',
    require: '^autocomplete', // ^look for controller on parents element
    link: function(scope, element, attrs, autoCtrl){
      element.bind('mouseenter', function() {
        autoCtrl.preSelect(attrs.val);
        autoCtrl.setIndex(attrs.index);
      });

      element.bind('mouseleave', function() {
        autoCtrl.preSelectOff();
      });
    }
  };
});
