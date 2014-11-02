describe('Dora services', function() {

	beforeEach(module('doraServices'));

	describe('QRSServ', function(){
		var QRSServ, MapServ, QRS1, QRS2;

		beforeEach(inject(function(_QRSServ_, _MapServ_) {
      QRSServ = _QRSServ_;
      MapServ = _MapServ_;
      QRS1 = TestingQRS.getStub(0);
      QRS2 = TestingQRS.getStub(1);
      spyOn(MapServ, 'setSliderMinBound');
    }));

    it('should contain 2 QRS in QRSHistory', function() {
      QRSServ.addToQRSHistory(QRS1);
      QRSServ.addToQRSHistory(QRS2);
      expect(QRSServ.getQRSHistory().length).toBe(2);
    });

    it('should limit to 10 QRS in QRSHistory', function() {
      for(var i = 0; i < 15; i++) {
        QRSServ.addToQRSHistory(TestingQRS.getStub(0));
      }
      expect(QRSServ.getQRSHistory().length).toBe(10);
    });

    it('should remove specified QRS from QRSHistory', function() {
      QRSServ.addToQRSHistory(QRS1);
      QRSServ.addToQRSHistory(QRS2);

      QRSServ.removeFromQRSHistory(QRS1);
      expect(QRSServ.getQRSHistory().length).toBe(1);
      expect(QRSServ.getQRSHistory().indexOf(QRS1)).toBe(-1);
    });

    xit('should union two or more QRS', function() {
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


    xit('should intersect two or more QRS', function() {
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
    var MapServ, QRS1, QRS2;
    
    beforeEach(inject(function(_MapServ_){
      MapServ = _MapServ_;
      QRS1 = TestingQRS.getStub(0);
      QRS2 = TestingQRS.getStub(1);
      spyOn(MapServ, 'setSliderMinBound');
    }));

    it('should add a vector layer with 1 cluster of 2 points on map', function() {
      var returnedLayers = MapServ.addVectorLayer(QRS1);

      expect(QRS1.clusterLayerId).toBeDefined();
      expect(returnedLayers.clusterLayer.features.length).toBe(1);
      expect(returnedLayers.clusterLayer.features[0].cluster.length).toBe(2);
    });

    it('should add a vector layer with 1 cluster of 1 point to map', function() {
      var returnedLayers = MapServ.addVectorLayer(QRS2);

      expect(QRS2.clusterLayerId).toBeDefined();
      expect(returnedLayers.clusterLayer.features.length).toBe(1);
      expect(returnedLayers.clusterLayer.features[0].cluster.length).toBe(1);
    });

    it('should not add a location layer to map', function() {
      var returnedLayers = MapServ.addVectorLayer(QRS1);

      expect(QRS1.locationLayerId).not.toBeDefined();
      expect(returnedLayers.locationLayer).not.toBeDefined();
    });

    it('should add a location layer with 1 polygon to map', function() {
      var returnedLayers = MapServ.addVectorLayer(QRS2);

      expect(QRS2.locationLayerId).toBeDefined();
      expect(returnedLayers.locationLayer).toBeDefined();
      expect(returnedLayers.locationLayer.features.length).toBe(1);
    });

    it('should switch off cluster strategy of cluster layer', function() {
      var clusterLayer = MapServ.addVectorLayer(QRS1).clusterLayer;
      MapServ.setClusterStrategyStatus(QRS1, false);

      expect(clusterLayer.features.length).toBe(2);
    });

    it('should set cluster layer and location layer to invisible', function() {
      var returnedLayers = MapServ.addVectorLayer(QRS2);
      MapServ.setVectorLayerVisibility(QRS2, false);

      expect(returnedLayers.clusterLayer.getVisibility()).toBe(false);
      expect(returnedLayers.locationLayer.getVisibility()).toBe(false);
    });

    it('should remove cluster layer and location layer from map', function() {
      MapServ.addVectorLayer(QRS2);
      var map = MapServ.removeVectorLayer(QRS2);

      expect(map.getLayersByName('clusterLayer').length).toBe(0);
      expect(map.getLayersByName('locationLayer').length).toBe(0);
    });

    it('should set polygon layer and countries layer to visible', function() {
      expect(MapServ.activatePolygonFilters()).toBe(true);
    });

    it('should set polygon layer and countries layer to invisible', function() {
      expect(MapServ.deactivatePolygonFilters()).toBe(false);
    });

    it('should clear all polygons in polygon layer and countries layer', function() {
      expect(MapServ.clearPolygonFilters()).toBe(0);
    });

    it('should add no polygon to polygon layer', function() {
      var polygonsInWKT = [];
      expect(MapServ.addPolygonFilters(polygonsInWKT)).toBe(0);
    });

    it('should add 1 polygon to polygon layer', function() {
      var polygonsInWKT = ["POLYGON((-9.492187500000112 27.44979032978419,-9.84375000000045 7.100892668623654,8.261718750000012 6.926426847059551,6.8554687500000115 34.95799531086818,-9.492187500000112 27.44979032978419))"];
      expect(MapServ.addPolygonFilters(polygonsInWKT)).toBe(1);
    });

    it('should add 3 polygons to polygon layer', function() {
      var polygonsInWKT = [
      "POLYGON((-9.492187500000112 27.44979032978419,-9.84375000000045 7.100892668623654,8.261718750000012 6.926426847059551,6.8554687500000115 34.95799531086818,-9.492187500000112 27.44979032978419))",
      "GEOMETRYCOLLECTION(POLYGON((-9.492187500000112 26.44979032978419,-9.84375000000045 6.100892668623654,8.261718750000012 5.926426847059551,6.8554687500000115 33.95799531086818,-9.492187500000112 26.44979032978419)),POLYGON((-8.492187500000112 27.44979032978419,-8.84375000000045 7.100892668623654,7.261718750000012 6.926426847059551,5.8554687500000115 34.95799531086818,-8.492187500000112 27.44979032978419)))"
      ];
      expect(MapServ.addPolygonFilters(polygonsInWKT)).toBe(3);
    });

  });

  ddescribe('PaletteServ', function(){
    var PaletteServ;

    beforeEach(inject(function(_PaletteServ_) {
      PaletteServ = _PaletteServ_;
    }));

    it('should return a color that is not in use', function(){
      var nextColor = PaletteServ.useNextColor();
      expect(nextColor).toBeDefined();
      expect(nextColor.featureColor).toBeDefined();
      expect(nextColor.buttonStyleIndex).toBeDefined();
    });

    it('should return null if all colors are in use', function(){
      for(var i = 0; i < 15; i++) {
        PaletteServ.useNextColor();
      }
      var nextColor = PaletteServ.useNextColor();
      expect(nextColor).toBeNull();
    });

    it('should release color in use', function(){
      var firstColor = PaletteServ.useNextColor();
      var secondColor = PaletteServ.useNextColor();
      expect(firstColor.buttonStyleIndex).not.toEqual(secondColor.buttonStyleIndex);
      
      PaletteServ.releaseColor(firstColor);
      var thirdColor = PaletteServ.useNextColor();
      expect(firstColor.buttonStyleIndex).toEqual(thirdColor.buttonStyleIndex);

    });

  });

});

