describe('Dora services', function() {

	beforeEach(module('doraServices'));

	describe('QRSService', function(){
		var QRSService, MapService, QRS1, QRS2;

		beforeEach(inject(function(_QRSService_, _MapService_) {
      QRSService = _QRSService_;
      MapService = _MapService_;
      QRS1 = TestingQRS.getStub(0);
      QRS2 = TestingQRS.getStub(1);
    }));

    it('should contain 2 QRS in QRSHistory', function() {
      QRSService.addToQRSHistory(QRS1);
      QRSService.addToQRSHistory(QRS2);
      expect(QRSService.getQRSHistory().length).toBe(2);
    });
 
    it('should limit to 10 QRS in QRSHistory', function() {
      for(var i = 0; i < 15; i++) {
        QRSService.addToQRSHistory(TestingQRS.getStub(0));
      }
      expect(QRSService.getQRSHistory().length).toBe(10);
    });

    it('should remove specified QRS from QRSHistory', function() {
      QRSService.addToQRSHistory(QRS1);
      QRSService.addToQRSHistory(QRS2);

      QRSService.removeFromQRSHistory(QRS1);
      expect(QRSService.getQRSHistory().length).toBe(1);
      expect(QRSService.getQRSHistory().indexOf(QRS1)).toBe(-1);
    });

	});

  describe('MapService', function(){
    var MapService, QRS1, QRS2, QRSService;
    
    beforeEach(inject(function(_MapService_, _QRSService_){
      MapService = _MapService_;
      QRSService = _QRSService_;
      QRS1 = TestingQRS.getStub(0);
      QRS2 = TestingQRS.getStub(1);
    }));

    it('should add a vector layer with 1 cluster of 2 points on map', function() {
      var returnedLayers = MapService.addVectorLayer(QRS1);

      expect(QRS1.clusterLayerId).toBeDefined();
      expect(returnedLayers.clusterLayer.features.length).toBe(1);
      expect(returnedLayers.clusterLayer.features[0].cluster.length).toBe(2);
    });

    it('should add a vector layer with 1 cluster of 1 point to map', function() {
      var returnedLayers = MapService.addVectorLayer(QRS2);

      expect(QRS2.clusterLayerId).toBeDefined();
      expect(returnedLayers.clusterLayer.features.length).toBe(1);
      expect(returnedLayers.clusterLayer.features[0].cluster.length).toBe(1);
    });

    it('should not add a location layer to map', function() {
      var returnedLayers = MapService.addVectorLayer(QRS1);

      expect(QRS1.locationLayerId).not.toBeDefined();
      expect(returnedLayers.locationLayer).not.toBeDefined();
    });

    it('should add a location layer with 1 polygon to map', function() {
      var returnedLayers = MapService.addVectorLayer(QRS2);

      expect(QRS2.locationLayerId).toBeDefined();
      expect(returnedLayers.locationLayer).toBeDefined();
      expect(returnedLayers.locationLayer.features.length).toBe(1);
    });

    it('should switch off cluster strategy of cluster layer', function() {
      var clusterLayer = MapService.addVectorLayer(QRS1).clusterLayer;
      MapService.setClusterStrategyStatus(QRS1, false);

      expect(clusterLayer.features.length).toBe(2);
    });

    it('should set cluster layer and location layer to invisible', function() {
      var returnedLayers = MapService.addVectorLayer(QRS2);
      MapService.setVectorLayerVisibility(QRS2, false);

      expect(returnedLayers.clusterLayer.getVisibility()).toBe(false);
      expect(returnedLayers.locationLayer.getVisibility()).toBe(false);
    });

    it('should remove cluster layer and location layer from map', function() {
      MapService.addVectorLayer(QRS2);
      var map = MapService.removeVectorLayer(QRS2);

      expect(map.getLayersByName('clusterLayer').length).toBe(0);
      expect(map.getLayersByName('locationLayer').length).toBe(0);
    });

    it('should set polygon layer and countries layer to visible', function() {
      expect(MapService.activatePolygonFilters()).toBe(true);
    });

    it('should set polygon layer and countries layer to invisible', function() {
      expect(MapService.deactivatePolygonFilters()).toBe(false);
    });

    it('should clear all polygons in polygon layer and countries layer', function() {
      expect(MapService.clearPolygonFilters()).toBe(0);
    });

    it('should add no polygon to polygon layer', function() {
      var polygonsInWKT = [];
      expect(MapService.addPolygonFilters(polygonsInWKT)).toBe(0);
    });

    it('should add 1 polygon to polygon layer', function() {
      var polygonsInWKT = ["POLYGON((-9.492187500000112 27.44979032978419,-9.84375000000045 7.100892668623654,8.261718750000012 6.926426847059551,6.8554687500000115 34.95799531086818,-9.492187500000112 27.44979032978419))"];
      expect(MapService.addPolygonFilters(polygonsInWKT)).toBe(1);
    });

    it('should add 3 polygons to polygon layer', function() {
      var polygonsInWKT = [
      "POLYGON((-9.492187500000112 27.44979032978419,-9.84375000000045 7.100892668623654,8.261718750000012 6.926426847059551,6.8554687500000115 34.95799531086818,-9.492187500000112 27.44979032978419))",
      "GEOMETRYCOLLECTION(POLYGON((-9.492187500000112 26.44979032978419,-9.84375000000045 6.100892668623654,8.261718750000012 5.926426847059551,6.8554687500000115 33.95799531086818,-9.492187500000112 26.44979032978419)),POLYGON((-8.492187500000112 27.44979032978419,-8.84375000000045 7.100892668623654,7.261718750000012 6.926426847059551,5.8554687500000115 34.95799531086818,-8.492187500000112 27.44979032978419)))"
      ];
      expect(MapService.addPolygonFilters(polygonsInWKT)).toBe(3);
    });

    it('should set slider min bound to the earliest in all visible datasets and return min date', function() {
      //Only one QRS
      QRSService.addToQRSHistory(QRS1);
      expect(QRSService.getQRSHistory().length).toBe(1);
      expect(MapService.setSliderMinBound()).toEqual("Fri Oct 26 2012");

      //On addition of second QRS
      QRSService.addToQRSHistory(QRS2);
      expect(QRSService.getQRSHistory().length).toBe(2);
      expect(MapService.setSliderMinBound()).toEqual("Tue Jun 25 2013");

      //On toggling the visibility of both QRSes to be visible
      QRSHistory = QRSService.getQRSHistory();
      for (index in QRSHistory) {
        QRSHistory[index].isVisible = true;
        MapService.setVectorLayerVisibility(QRSHistory[index], true);
      }
      expect(MapService.setSliderMinBound()).toEqual("Fri Oct 26 2012");
    });

    it('should be able to hide and show features correctly', function() {
			QRSService.addToQRSHistory(QRS1);
      QRSService.addToQRSHistory(QRS2);
      expect(QRSService.getQRSHistory().length).toBe(2);
      QRSHistory = QRSService.getQRSHistory();
      for (index in QRSHistory) {
        QRSHistory[index].isVisible = true;
        MapService.setVectorLayerVisibility(QRSHistory[index], true);
      }

      MapService.setSliderMinMax('11/12/2012', '12/12/2012');
			MapService.temporalSliderFeaturesToggle();
    	expect(verifyOrderInVisibleLayers()).toBe(0);

      MapService.setSliderMinMax('06/24/2011', '06/26/2015');
			MapService.temporalSliderFeaturesToggle();
    	expect(verifyOrderInVisibleLayers()).toBe(0);

      function verifyOrderInVisibleLayers() {
        function checkLayerOrder(clusterLayerId) {
          var features = clusterLayerFeatures[clusterLayerId].features;
          var leftStack = clusterLayerFeatures[clusterLayerId].leftStack;
          var rightStack = clusterLayerFeatures[clusterLayerId].rightStack;

          function checkOrder(array) {
            if (array.length > 1) {
              for (var i = 1; i < array.length; i++) {
                currDate = Date.parse(array[i].attributes.date);
                prevDate = Date.parse(array[i-1].attributes.date);
                if (currDate > prevDate) {
                  return 1;
                }
              }
            }
          }

          function checkArrayConsecutivity(array1, array2) {
            if (array1.length > 0 && array2.length > 0) {
              date1 = Date.parse(array1[array1.length-1].attributes.date);
              date2 = Date.parse(array2[0].attributes.date);
              if (date1 > date2) {
                return 1;
              }
            }
          }

          checkOrder(leftStack);
          checkOrder(features);
          checkOrder(rightStack);
          checkArrayConsecutivity(leftStack, features);
          checkArrayConsecutivity(features, rightStack);

          return 0;
        }

        var visibleLayers = MapService.getVisibleLayers();
        var clusterLayerFeatures = MapService.getClusterLayerFeatures();
        for (var i=0; i<visibleLayers.length;i++) {
          if (checkLayerOrder(visibleLayers[i])) {
            return 1;
          }
        }

        return 0;
      }

    });

  });

  describe('PaletteService', function(){
    var PaletteService;

    beforeEach(inject(function(_PaletteService_) {
      PaletteService = _PaletteService_;
    }));

    it('should return a color that is not in use', function(){
      var nextColor = PaletteService.useNextColor();
      expect(nextColor).toBeDefined();
      expect(nextColor.featureColor).toBeDefined();
      expect(nextColor.buttonStyleIndex).toBeDefined();
    });

    it('should return null if all colors are in use', function(){
      for(var i = 0; i < 15; i++) {
        PaletteService.useNextColor();
      }
      var nextColor = PaletteService.useNextColor();
      expect(nextColor).toBeNull();
    });

    it('should release color in use', function(){
      var firstColor = PaletteService.useNextColor();
      var secondColor = PaletteService.useNextColor();
      expect(firstColor.buttonStyleIndex).not.toEqual(secondColor.buttonStyleIndex);
      
      PaletteService.releaseColor(firstColor);
      var thirdColor = PaletteService.useNextColor();
      expect(firstColor.buttonStyleIndex).toEqual(thirdColor.buttonStyleIndex);

    });

  });

});

