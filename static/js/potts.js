$('.datepicker').pickadate({
    selectMonths: true, // Creates a dropdown to control month
    selectYears: 15 // Creates a dropdown of 15 years to control year
});

function loginHandler(data) {
  if(data.result["status"] != "ok") {
    $(".login").fadeOut(200);
    $(".mainView").fadeIn(200);
    drawSpendingChart([233.07,27.66,102.03,318.69,329.13,159.33,131.87, 52.93, 0, 0, 0 ,0]);
    drawAllocationChart();
  }
  else {
    $(".login").effect("shake");
  }
}

function drawSpendingChart(spendingData) {
  var total = 0.0;
  for(var i = 0; i < spendingData.length; i++) {
    total += spendingData[i];
  }
  total = "Total: $" + total.toFixed(2).toString();
  $('#spendingChart').highcharts({
    chart: {type: 'column'},
    title: {text: total},
    xAxis: {categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], crosshair: true},
    yAxis: {min: 0, title: {text: 'Amount ($)'}},
    tooltip: {headerFormat: '<span style="font-size:10px">{point.key}</span><table>', pointFormat: '<td style="padding:0"><b>${point.y:.1f}</b></td></tr>', footerFormat: '</table>', shared: true, useHTML: true},
    plotOptions: {column: {color:'#00c96d', pointPadding: 0.2, borderWidth: 0}},
    series: [{name: 'Spending', data: spendingData}],
    navigation: {buttonOptions: {enabled: false}}
  });
}

function setColorArray(color) {
  Highcharts.getOptions().plotOptions.pie.colors = (function () {
        var colors = [], base = color, i;
        for (i = 0; i < 10; i += 1) {
            colors.push(Highcharts.Color(base).brighten((i - 1) / 7).get());
        }
        return colors;
    }());
}
 
function drawAllocationChart() {
  setColorArray("#00c96d");
  $('#allocationChart').highcharts({
    chart: {plotBackgroundColor: null, plotBorderWidth: null, plotShadow: false, type: 'pie'},
    title: {text: ""},
    tooltip: {pointFormat: '<b>{point.percentage:.1f}%</b>'},
    plotOptions: {
        pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
                enabled: false
            },
            showInLegend: true
        }
    },
    series: [{
        colorByPoint: true,
        data: [{
            name: "IE",
            y: 56.33
        }, {
            name: "Chrome",
            y: 24.03
        }, {
            name: "Firefox",
            y: 10.38
        }, {
            name: "Safari",
            y: 4.77
        }, {
            name: "Opera",
            y: 0.91
        }]
    }],
    navigation: {buttonOptions: {enabled: false}}
  });
}