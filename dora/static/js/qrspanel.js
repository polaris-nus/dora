$(document).ready(function(){
	// hide patient list at beginning
	$("#pl").hide();

	//toggle the visibility of patient list 
	$("#togglePL").click(function(){
		$("#pl").toggle();
	});

	// read patient list from json file
	$.getJSON('qrs.json', function(data) {
		var output="<br/>";
		for (var i in data.patients) {
		output+="<p>" + data.patients[i].firstName + " " + data.patients[i].lastName + " - " + data.patients[i].joined.month+" "+data.patients[i].joined.day+"th, "+data.patients[i].joined.year+"</p>";
		}
		output+="<a href=\"#\" class=\"patient-name\" data-toggle=\"popover\" title=\"Patient Detail Information\" data-content=\"Name: Tom, Gender: Male\" role=\"button\">Tom</a>";
	
		document.getElementById("pl").innerHTML=output;
	});
});