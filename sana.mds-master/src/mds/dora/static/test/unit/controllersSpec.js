describe('Dora controllers', function() {

	beforeEach(module('doraControllers'));
	beforeEach(module('doraServices'));

	describe('QueryFormController', function() {
		var scope, ctrl, $httpBackend, MapService, QRSService;

		beforeEach(inject(function(_QRSService_, _MapService_, _$httpBackend_, $rootScope, $controller) {
      		$httpBackend = _$httpBackend_;
      		MapService = _MapService_;
      		QRSService = _QRSService_;
      		$httpBackend.expectGET('http://127.0.0.1:8000/query/?disease=hiv').
          			respond({json: 'expected data here'});

      		scope = $rootScope.$new();
      		ctrl = $controller('QueryFormController', {$scope: scope});
    	}));

    	// QueryFormController Specs go here!
    	it('should add a new filter', function() {
      		scope.key = 'Drainage at surgery site';
      		scope.input = 'Yes';
      		scope.submitFilter();
      		expect(scope.filters).toEqual([{key:"Drainage at surgery site", value: "Yes"},]);
    	});
    	

	});

	describe('QueryResultController', function() {
    
  });

});

