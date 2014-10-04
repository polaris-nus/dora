describe('Dora services', function() {

	beforeEach(module('doraServices'));

	describe('QRSServ', function() {
		var QRSServ, QRS1, QRS2, QRS3;

		beforeEach(inject(function(_QRSServ_) {
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
    }));

    it('should contain 3 QRS in QRSHistory', function() {
      expect(QRSServ.getQRSHistory().length).toBe(3);
    });

    it('should limit to 10 QRS in QRSHistory', function() {
      
      for(var i = 0; i < 15; i++) {
        QRSServ.addToQRSHistory(QRS1);
      }
      expect(QRSServ.getQRSHistory().length).toBe(10);
    });

    it('should remove specified QRS from QRSHistory', function() {
      var toBeRemoved = QRSServ.getQRSHistory()[1];
      QRSServ.removeFromQRSHistory(toBeRemoved);
      expect(QRSServ.getQRSHistory().length).toBe(2);
      expect(QRSServ.getQRSHistory().indexOf(toBeRemoved)).toBe(-1);
    });

    it('should union two or more QRS', function() {
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
      var QRS = {
        "assigned" : [
          {
            "disease": "HIV",
            "patient": {
                "family_name": "obed",
                "uuid": "2c5787df-c09f-4d08-a1a6-ce7ec07abc33",
                "given_name": "wheaton",
                "dob": "July 3, 1989, 10:47 a.m.",
                "gender": "F"
            },
            "created_date": "Nov. 25, 2011, 1:28 p.m.",
            "modified_date": "Nov. 25, 2011, 1:28 p.m.",
            "location": {
                "coords": "POINT (131.9055123729999900 -87.8140864197000040)",
                "alt": "alt!"
            }
          }
        ],
        "unassigned" : []
      }
      var vectorLayer = MapServ.addClusterLayer(QRS);
      expect(vectorLayer.features.length).toBe(1);
    });

  });

});

