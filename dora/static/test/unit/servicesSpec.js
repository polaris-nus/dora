describe('Dora services', function() {
  var QRS1, QRS2, QRS3;

	beforeEach(module('doraServices'));
  beforeEach(function() {
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
        ],
        'locationFeature': 'GEOMETRYCOLLECTION(POLYGON((-16.171874999996632 16.13026201203599,-10.019531249996126 5.790896812872936,-3.515624999996452 13.239945499287394,-16.171874999996632 16.13026201203599)))'
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
  });

	describe('QRSServ', function() {
		var QRSServ;

		beforeEach(inject(function(_QRSServ_) {
      QRSServ = _QRSServ_;
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
    });

	});

  describe('MapServ', function(){
    var MapServ;
    
    beforeEach(inject(function(_MapServ_){
      MapServ = _MapServ_;
    }));

    it('should add a vector layer with 1 point marker to map', function() {
      var returnedLayers = MapServ.addVectorLayer(QRS1);
      expect(QRS1.clusterLayerId).toBeDefined();
      expect(returnedLayers.clusterLayer.features.length).toBe(1);
    });

    it('should add a vector layer and a polygon layer to map', function() {
      var returnedLayers = MapServ.addVectorLayer(QRS2);
      expect(QRS2.clusterLayerId).toBeDefined();
      expect(QRS2.locationLayerId).toBeDefined();
      expect(returnedLayers.clusterLayer).toBeDefined();
      expect(returnedLayers.locationLayer).toBeDefined();
    });

  });

});

