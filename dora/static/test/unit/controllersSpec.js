describe('Dora controllers', function() {

	beforeEach(module('doraControllers'));
	beforeEach(module('doraServices'));

	describe('QueryFormController', function() {
		var scope, ctrl, $httpBackend;

		beforeEach(inject(function(_$httpBackend_, $rootScope, $controller) {
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('http://127.0.0.1:8000/query/?disease=hiv').
          respond({json: 'expected data here'});

      scope = $rootScope.$new();
      ctrl = $controller('QueryFormController', {$scope: scope});
    }));

    it('should add a new filter in "queryFilters" model', function() {
    	expect(scope.queryFilters).toEqual([]);

    	scope.filterFormType = 'gender';
    	scope.filterFormValue = 'M';
    	scope.addFilter();

    	expect(scope.queryFilters).toEqual(
    		[{type: 'gender', value: 'M'}]);
    	expect(scope.filterFormType).toBe('');
    	expect(scope.filterFormValue).toBe('');
    });

	});

	describe('QueryResultController', function() {
		
	});

});

