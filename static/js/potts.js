var userIdVal = -1;

function globalizeUserID(n) {
  userIdVal = n;
}

function loginHandler(data) {
  if(data.result["status"] == "ok") {
    $(".login").fadeOut(200);
    $(".mainView").fadeIn(200);
    drawSpendingChart([233.07,27.66,102.03,318.69,329.13,159.33,131.87, 52.93, 0, 0, 0 ,0]);
    drawAllocationChart();
  }
  else {
    $(".login").effect("shake");
  }
}

function addSelectOptions(source, selectID, type) {
  var array = $(source);
  var d = {};
  for(var i = 0; i < array.length; i++) {
    if(!(array[i].textContent in d)) {
      d[array[i].textContent] = "";
    }
  }
  $(selectID).empty().append('<option value="" disabled selected>' + type + '</option>');
  for(var k in d) {
    $(selectID).append('<option value="">' + k + '</option>');  
  }
}

function removeSelectOptions(check, selectID) {
  var array = $(selectID);
  for(var i = 0; i < array.length; i++) {
    if(array[i].textContent == check) {
      array[i].remove();
    }
  }
}

function listCategory(data) {
  var resultArray = data.result["result"];
  $("#editCategoryResult").empty();
  var removeButton = '<div class="col s1"><a class="removeCateg btn-floating btn-small waves-effect waves-light red"><i class="material-icons">remove</i></a></div>';
  for(var i = 0; i < resultArray.length; i++) {
    $("#editCategoryResult").append('<div class="row"><div class="col s6 selectCategory"><p>' + resultArray[i][0] + '</p></div><div class="col s5 selectSubCategory"><p>' 
                                                        + resultArray[i][1] + '</p></div>'
                                                        + removeButton + '</div>');
  }
  $(".removeCateg").click(function() {
    var o = $(this).parent().parent();
    var c = o.find("div.selectCategory p").text();
    var s = o.find("div.selectSubCategory p").text();

    $.getJSON('/delCategory', {userId: userIdVal, rCateg: c, rSubCateg: s}, function(data) {
      if(data.result["status"] == "ok") {
        o.remove();
        removeSelectOptions(c, "#selectCategory option");
        removeSelectOptions(s, "#selectSubCategory option");
        addSelectOptions("div.selectCategory p", "#selectCategory", "Category");
        addSelectOptions("div.selectSubCategory p", "#selectSubCategory", "Sub-Category");
      }
    });
  });
}

function bindEnterKey(query, functionName) {
  $(query).bind('keydown', function(e) {
        if(e.keyCode == 13) {
          functionName();
        }
  });
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