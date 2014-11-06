describe('Dora controllers', function() {

	beforeEach(module('doraControllers'));
	beforeEach(module('doraServices'));

	describe('QueryFormController', function() {
		var scope, ctrl, $httpBackend, MapServ, QRSServ;

		beforeEach(inject(function(_QRSServ_, _MapServ_, _$httpBackend_, $rootScope, $controller) {
      		$httpBackend = _$httpBackend_;
      		MapServ = _MapServ_;
      		QRSServ = _QRSServ_;
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
    var QRSServ, QRS1, QRS2;

    beforeEach(inject(function($rootScope, $controller, _QRSServ_) {
      scope = $rootScope.$new();
      ctrl = $controller('QueryResultController', {$scope: scope});
      QRSServ = _QRSServ_;
      QRS1 = {
        'assigned':[
          {
            "disease": "EBOLA",
            "patient": {
              "uuid": "one"
            },
            "location": {
              "coords": "POINT (-87.1134192674000050 -4.0753749522299998)",
              "alt": "alt!"
            }
          }
        ],
        'unassigned':[
          {
            "disease": "EBOLA",
            "patient": {
              "uuid": "three"
            }
          }
        ]
      };

      QRS2 = {
        'assigned':[
          {
            "disease": "TB",
            "patient": {
              "uuid": "four"
            },
            "location": {
              "coords": "POINT (158.4795246920000100 74.5477679921000060)",
              "alt": "alt!"
            }
          }
        ],
        'unassigned':[
          {
            "disease": "TB",
            "patient": {
              "uuid": "three"
            }
          }
        ]
      };

      QRS3 = {
        'assigned':[
          {
            "disease": "HIV",
            "patient": {
              "uuid": "six"
            },
            "location": {
              "coords": "POINT (40.3393490166000030 -41.1745275103999970)",
              "alt": "alt!"
            }
          }
        ],
        'unassigned':[
          {
            "disease": "HIV",
            "patient": {
              "uuid": "three"
            }
          }
        ]
      };
      QRSServ.addToQRSHistory(QRS1);
      QRSServ.addToQRSHistory(QRS2);
      QRSServ.addToQRSHistory(QRS3);

      //Make sure variables are always initiated properly
      expect(scope.selectedQRSList).toEqual([]);
      expect(scope.selectionFlag).toBe(false);
      expect(scope.selectionFunction).toBe('');

    }));

    it('should be able to toggle choosing of union', function() {
      var unionAnswer = {
        'assigned':[
          {
            "disease": "EBOLA",
            "patient": {
              "uuid": "one"
            },
            "location": {
              "coords": "POINT (-87.1134192674000050 -4.0753749522299998)",
              "alt": "alt!"
            }
          },
          {
            "disease": "TB",
            "patient": {
              "uuid": "four"
            },
            "location": {
              "coords": "POINT (158.4795246920000100 74.5477679921000060)",
              "alt": "alt!"
            }
          },
          {
            "disease": "HIV",
            "patient": {
              "uuid": "six"
            },
            "location": {
              "coords": "POINT (40.3393490166000030 -41.1745275103999970)",
              "alt": "alt!"
            }
          }
        ],
        'unassigned':[
          {
            "disease": "EBOLA",
            "patient": {
              "uuid": "three"
            }
          },
          {
            "disease": "TB",
            "patient": {
              "uuid": "three"
            }
          },
          {
            "disease": "HIV",
            "patient": {
              "uuid": "three"
            }
          }
        ]
      };
      //Allow for selection of QRS
      scope.selectionFlag = true;
      scope.selectionFunction = 'union';

      scope.selectQRS(0);
      scope.selectQRS(1);
      scope.selectQRS(2);
      expect(scope.selectedQRSList).toEqual([0,1,2]);

      scope.selectQRS(2);
      expect(scope.selectedQRSList).toEqual([0,1]);

      scope.selectQRS(2);
      expect(scope.selectedQRSList).toEqual([0,1,2]);

      //Make sure variables are always reset
      scope.executeUnionIntersection();
      var QRSHistory = QRSServ.getQRSHistory();

      //Check individula arrays by iterating
      assignedList = QRSHistory[3].assigned;
      unassignedList = QRSHistory[3].unassigned;
      assignedAnswer = unionAnswer.assigned;
      unassignedAnswer = unionAnswer.unassigned;

      //Start Testing - Need to test the two lists separately due to the extra ID field added in.
      expect(assignedList.length).toBe(assignedAnswer.length);
      for (var i = 0; i < assignedList.length; i++) {
        expect(assignedList[i]).toEqual(assignedAnswer[i]);
      }

      expect(unassignedList.length).toBe(unassignedAnswer.length);
      for (var i = 0; i < unassignedList.length; i++) {
        expect(unassignedList[i]).toEqual(unassignedAnswer[i]);
      }

      expect(scope.selectedQRSList).toEqual([]);
      expect(scope.selectionFlag).toBe(false);
      expect(scope.selectionFunction).toBe('');
    });    

    it('should be able to toggle choosing of intersect', function() {
      var intersectAnswer = {
        'assigned':[],
        'unassigned':[
          {
            "disease": "EBOLA",
            "patient": {
              "uuid": "three"
            }
          },
          {
            "disease": "TB",
            "patient": {
              "uuid": "three"
            }
          },
          {
            "disease": "HIV",
            "patient": {
              "uuid": "three"
            }
          }
        ]
      };
      //Allow for selection of QRS
      scope.selectionFlag = true;
      scope.selectionFunction = 'intersect';

      scope.selectQRS(0);
      scope.selectQRS(1);
      scope.selectQRS(2);
      expect(scope.selectedQRSList).toEqual([0,1,2]);

      scope.selectQRS(2);
      expect(scope.selectedQRSList).toEqual([0,1]);

      scope.selectQRS(2);
      expect(scope.selectedQRSList).toEqual([0,1,2]);

      //Make sure variables are always reset
      scope.executeUnionIntersection();
      var QRSHistory = QRSServ.getQRSHistory();


      //Check individula arrays by iterating
      assignedList = QRSHistory[3].assigned;
      unassignedList = QRSHistory[3].unassigned;
      assignedAnswer = intersectAnswer.assigned;
      unassignedAnswer = intersectAnswer.unassigned;

      //Start Testing - Need to test the two lists separately due to the extra ID field added in.
      expect(assignedList.length).toBe(assignedAnswer.length);
      for (var i = 0; i < assignedList.length; i++) {
        expect(assignedList[i]).toEqual(assignedAnswer[i]);
      }

      expect(unassignedList.length).toBe(unassignedAnswer.length);
      for (var i = 0; i < unassignedList.length; i++) {
        expect(unassignedList[i]).toEqual(unassignedAnswer[i]);
      }

      expect(scope.selectedQRSList).toEqual([]);
      expect(scope.selectionFlag).toBe(false);
      expect(scope.selectionFunction).toBe('');
    });    

  });

});

