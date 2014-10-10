// Load the Visualization API and the piechart package.
google.load('visualization', '1.0', {'packages':['corechart']});

// Set a callback to run when the Google Visualization API is loaded.
google.setOnLoadCallback(drawChart);

// Callback that creates and populates a data table,
// instantiates the pie chart, passes in the data and
// draws it.
function drawChart() {
  // Create the data table.
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Topping');
  data.addColumn('number', 'Slices');
  data.addRows([
    ['Alive', 52],
    ['Dead', 18],
    ['Cured', 30],
    ]);

  // Set chart options
  var options = {title:'Current Condition of Patients',
  pieSliceText: 'label',
  chartArea:{left:10,top:30,width:'100%',height:'70%'}
};

  // Instantiate and draw our chart, passing in some options.
  var chart = new google.visualization.PieChart(document.getElementById('pie-chart'));
  chart.draw(data, options);

  var data2 = google.visualization.arrayToDataTable([
    ['Year', 'New', 'Total'],
    ['2009',  107,      507],
    ['2010',  117,      624],
    ['2011',  66,       690],
    ['2012',  103,      793],
    ['2013',  10,      803],
    ['2014',  7,      810]
    ]);

  var options2 = {
    title: 'Patient Number',
    chartArea:{left:30,top:30,width:'60%',height:'50%'}
  };

  var chart2 = new google.visualization.LineChart(document.getElementById('line-chart'));

  chart2.draw(data2, options2);
}


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
