describe('Dora services', function() {

	beforeEach(module('doraServices'));

	describe('QRSServ', function() {
		var QRSServ;

		beforeEach(inject(function(_QRSServ_) {
      QRSServ = _QRSServ_;
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

      QRSServ.addToQRSHistory(QRS1);
      QRSServ.addToQRSHistory(QRS2);
      QRSServ.addToQRSHistory(QRS3);
    }));

    it('should contain 3 QRS in QRSHistory', function() {
      expect(QRSServ.getQRSHistory().length).toBe(3);
    });

    it('should limit to 10 QRS in QRSHistory', function() {
      
      for(var i = 0; i < 15; i++) {
        var QRSstub = {
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
        QRSServ.addToQRSHistory(QRSstub);
      }
      expect(QRSServ.getQRSHistory().length).toBe(10);
    });

    it('should remove specified QRS from QRSHistory', function() {
      var toBeRemovedObj = QRSServ.getQRSHistory()[1];
      QRSServ.removeFromQRSHistory(toBeRemovedObj);
      expect(QRSServ.getQRSHistory().length).toBe(2);
      expect(QRSServ.getQRSHistory().indexOf(toBeRemovedObj)).toBe(-1);

      var index = 1
      var toBeRemovedInd = QRSServ.getQRSHistory()[index];
      QRSServ.removeFromQRSHistory(index);
      expect(QRSServ.getQRSHistory().length).toBe(1);
      expect(QRSServ.getQRSHistory().indexOf(toBeRemovedInd)).toBe(-1);
    });

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
      var QRSHistory = QRSServ.getQRSHistory();
      QRSServ.unionQRSHistory([0,1,2]);
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
      var QRSHistory = QRSServ.getQRSHistory();      
      QRSServ.intersectQRSHistory([0,1,2]);
      expect(QRSHistory[3]).toEqual(intersectAnswer);
    });

	});

  describe('MapServ', function(){
    var MapServ;
    
    beforeEach(inject(function(_MapServ_){
      MapServ = _MapServ_;
    }));

    it('should add a vector layer with 1 point marker', function() {
      var coordinates = ['POINT (131.9055123729999900 -87.8140864197000040)']
      var vectorLayer = MapServ.generatePoints(coordinates);
      expect(vectorLayer.features.length).toBe(1);
    });

  });

});

