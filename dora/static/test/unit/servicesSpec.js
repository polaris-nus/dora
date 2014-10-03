describe('Dora Services', function() {

	beforeEach(module('doraServices'));

	describe('QRSHistoryServ', function() {
		var service;

		beforeEach(inject(function(QRSHistoryServ) {
      service = QRSHistoryServ;
      var QRS1 = {
        'assigned':[
          {
            "disease": "EBOLA",
            "patient": {
              "uuid": "one"
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

      var QRS2 = {
        'assigned':[
          {
            "disease": "TB",
            "patient": {
              "uuid": "four"
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

      var QRS3 = {
        'assigned':[
          {
            "disease": "HIV",
            "patient": {
              "uuid": "six"
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

      service.addQRS(QRS1);
      service.addQRS(QRS2);
      service.addQRS(QRS3);
    }));

    it('should union two or more QRS', function() {
      var unionAnswer = {
        'assigned':[
          {
            "disease": "EBOLA",
            "patient": {
              "uuid": "one"
            }
          },
          {
            "disease": "TB",
            "patient": {
              "uuid": "four"
            }
          },
          {
            "disease": "HIV",
            "patient": {
              "uuid": "six"
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
      var QRSHistory = service.getQRSHistory();
      service.unionQRSHistory([0,1,2]);
    	expect(QRSHistory[3]).toEqual(unionAnswer);
    });


    it('should intersect two or more QRS', function() {
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
      var QRSHistory = service.getQRSHistory();      
      service.intersectQRSHistory([0,1,2]);
      expect(QRSHistory[3]).toEqual(intersectAnswer);
    });

	});

});

