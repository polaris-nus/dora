var doraServices = angular.module('doraServices', []);

doraServices.service('QRSHistoryServ', [
	function(){
		var QRSHistory = [];
		return {
			addQRS: function(QRS){
				QRSHistory.push(QRS);
			},
			getQRSHistory: function(){
				return QRSHistory;
			}
		};
	}]);

doraServices.service('QRSGenerateServ', [
	function(){
		

	}]);