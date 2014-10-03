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
			},
			unionQRSHistory: function(unionList){
				//Initialize data structures
				var unionQRS = {};
				unionQRS.assigned = [];
				unionQRS.unassigned = [];

				for (var i=0; i<unionList.length;i++) {
				if (unionList[i] >= QRSHistory.length) { return 0; } //if the given list is faulty, we don't do anything, and return a 0.
					var assignedList = QRSHistory[unionList[i]].assigned;
					var unassignedList = QRSHistory[unionList[i]].unassigned;
					for (var j=0; j<assignedList.length; j++) { //loop through array of objects with coordinates in the given Historical QRS
						unionQRS.assigned.push(assignedList[j]);
					}
					for (var j=0; j<unassignedList.length; j++) { //loop through array of objects with coordinates in the given Historical QRS
						unionQRS.unassigned.push(unassignedList[j]);
					}
				}
				QRSHistory.push(unionQRS);
				return unionQRS;
			},
			intersectQRSHistory: function(intersectList){
				//set up datastructures
				var intersectQRS = {};
				intersectQRS.assigned = [];
				intersectQRS.unassigned = [];
				var hashTable = {};
				hashTable.assigned = {};
				hashTable.unassigned = {};

				var populateHashTable = function(list, flag) {
					for (var j=0; j<list.length; j++) {
						if (hashTable[flag][list[j].patient.uuid] == null) {
							hashTable[flag][list[j].patient.uuid] = 1;
						} else {
							hashTable[flag][list[j].patient.uuid] += 1;
						}
					}
				};

				var populateIntersectQRS = function(list, flag) {
					for (var j=0; j<list.length; j++) {
						if (hashTable[flag][list[j].patient.uuid] == intersectList.length) {
							intersectQRS[flag].push(list[j]);
						}
					}
				};

				//Run through once to look at how many times each item is seen and store in hashtable
				for (var i=0; i<intersectList.length;i++) {
					if (intersectList[i] >= QRSHistory.length) { return 0; } //if the given list is faulty, we don't do anything, and return a 0.
					var assignedList = QRSHistory[intersectList[i]].assigned;
					var unassignedList = QRSHistory[intersectList[i]].unassigned;
					populateHashTable(assignedList, 'assigned');
					populateHashTable(unassignedList, 'unassigned');
				}

				//Add to list of objects iff uuid number_seen === intersectList.length
				for (var i=0; i<intersectList.length;i++) {
					var assignedList = QRSHistory[intersectList[i]].assigned;
					var unassignedList = QRSHistory[intersectList[i]].unassigned;
					populateIntersectQRS(assignedList, 'assigned');
					populateIntersectQRS(unassignedList, 'unassigned');	
				}

				QRSHistory.push(intersectQRS);

				return intersectQRS;
			}
		};
	}
]);
