var userIdVal = -1;
var views = ["#cashFlowView", "#allocationView", "#editView"];
var netFields = ["cash", "investments", "property", "retirement", "loan", "debt", "morgages"];

function Potts() {
  $("#loginButton").click(function() {loginButtonHandler();});
  $("#addCategoryButton").click(function() {addCategoryButtonHandler();});
  $("#addExpenseButton").click(function() {addExpenseButtonHandler();});
  $("#editNetButton").click(function() {editNetButtonHandler();});
  $("#cashFlowViewButton").click(function() {displayView("#cashFlowViewButton");});
  $("#allocationViewButton").click(function() {displayView("#allocationViewButton");});
  $("#editViewButton").click(function() {displayView("#editViewButton");});
  bindEnterKey("input[name='usr']", loginButtonHandler);
  bindEnterKey("input[name='pwd']", loginButtonHandler);
  bindEnterKey("input[name='addCateg']", addCategoryButtonHandler);
  bindEnterKey("input[name='addSubCateg']", addCategoryButtonHandler);
  bindEnterKey("input[name='expenseName']", addExpenseButtonHandler);
  bindEnterKey("input[name='expenseAmount']", addExpenseButtonHandler);
  bindEnterKey("input[name='expenseDate']", addExpenseButtonHandler);
}

function queryNet() {
  $.getJSON('/queryNet', {userId:userIdVal}, function(data) {
    var vals = data.result["vals"];
    for(var i in netFields) {
      $("input[name='" + netFields[i] + "']").val(vals[i]);
    }
    editNetButtonHandler();
  });
}

function editNetButtonHandler() {
  var assetArray = {"cash":$("input[name='cash']").val(), "investments":$("input[name='investments']").val(), "property":$("input[name='property']").val(), "retirement":$("input[name='retirement']").val()};
  var liabilityArray = {"loan":$("input[name='loan']").val(), "debt":$("input[name='debt']").val(), "morgages":$("input[name='morgages']").val()};
  $.getJSON('/editNet', {userId:userIdVal, asset:JSON.stringify(assetArray), liability:JSON.stringify(liabilityArray)}, function(data) {
    if(data.result["status"] == "ok") {
      var aSum = 0.0;
      var lSum = 0.0;
      for(var k in assetArray) {
        aSum += parseFloat(assetArray[k]);
      }
      for(var k in liabilityArray) {
        lSum += parseFloat(liabilityArray[k]);
      }
      $("#netCard").text("$ " + numberWithCommas((aSum - lSum).toFixed(2)));
    }
  });
}

function loginButtonHandler() {
  $.getJSON('/authenticate', {usr: $('input[name="usr"]').val(), pwd: $('input[name="pwd"]').val()}, function(data) {
      userIdVal = data.result["userId"];
      loginHandler(data);
      queryCategory();
      queryExpenses();
      queryNet();
      queryIncome();
  });
}

function querySavingRate() {
  var e = $("#expenseCard").text().replace("$ ", "").replace(",", "");
  var i = $("#incomeCard").text().replace("$ ", "").replace(",", "");;
  e = parseFloat(e);
  i = parseFloat(i);
  var realE = (e - i).toFixed(2);
  $("#expenseCard").text("$ " + numberWithCommas(realE));
  $("#savingCard").text(((i - realE)/i * 100.0).toFixed(2) + "%"); 
}

function queryIncome() {
  $.getJSON('/queryIncome', {userId:userIdVal}, function(data) {
    $("#incomeCard").text("$ " + numberWithCommas(data.result["income"]));
    querySavingRate();
  });
}

function loginHandler(data) {
  if(data.result["status"] == "ok") {
    $(".login").fadeOut(200);
    $(".mainView").fadeIn(200);
    $(".leftView").fadeIn(200);
    calculateMonthlyExpenses();
  }
  else {
    $(".login").effect("shake");
  }
}

function calculateMonthlyExpenses() {
  $.getJSON('/getMonthlyExpense', {userId:userIdVal}, function(data) {
    var sum = 0.0;
    var meArray = data.result["meArray"];
    for(var i in meArray) {
      sum += meArray[i];
    }
    $("#expenseCard").text("$ " + numberWithCommas(sum));
    drawSpendingChart(meArray);
  });  
}

function drawSpendingChart(spendingData) {
  var total = 0.0;
  for(var i = 0; i < spendingData.length; i++) {
    total += spendingData[i];
  }
  total = "Total: $" + total.toFixed(2).toString();
  $('#cashFlowView').highcharts({
    chart: {type: 'column'},
    title: {text: total},
    xAxis: {categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], crosshair: true},
    yAxis: {min: 0, title: {text: 'Amount ($)'}},
    tooltip: {headerFormat: '<span style="font-size:10px">{point.key}</span><table>', pointFormat: '<td style="padding:0"><b>${point.y:.2f}</b></td></tr>', footerFormat: '</table>', shared: true, useHTML: true},
    plotOptions: {column: {color:'#00c96d', pointPadding: 0.2, borderWidth: 0}},
    series: [{name: 'Spending', data: spendingData}],
    navigation: {buttonOptions: {enabled: false}}
  });
  $("#cashFlowView").prepend('<h4 class="light">Spending Summary</h4>');
}

function queryCategory() {
  $.getJSON('/queryCategory', {userId: userIdVal}, function(data) {
      listCategory(data);
      addSelectOptions("div.selectCategory p", "#selectCategory", "Category");
      addSelectOptions("div.selectSubCategory p", "#selectSubCategory", "Sub-Category");
  });
};

function listCategory(data) {
  var resultArray = data.result["result"];
  $("#editCategoryResult").empty();
  var removeButton = '<div class="col s1"><a class="removeCateg btn-floating btn-small waves-effect waves-light red"><i class="material-icons">remove</i></a></div>';
  for(var i = 0; i < resultArray.length; i++) {
    $("#editCategoryResult").append('<div class="row"><div class="col s6 selectCategory"><p>' + resultArray[i][0] + '</p></div><div class="col s5 selectSubCategory"><p>' 
                                                        + resultArray[i][1] + '</p></div>'
                                                        + removeButton + '</div>');
  }
  calculateAllocation();
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
        queryCategory();
      }
    });
  });
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

function calculateAllocation() {
  $.getJSON('/queryCategory', {userId: userIdVal}, function(data) {
      var resultArray = data.result["result"];
      var categList = [];
      var d = {};

      for(var i in resultArray) {
        var el = resultArray[i][0];
        if(!(el in d)) {
          categList.push(el);
          d[el] = "";
        }
      }

      $.getJSON('/getAllocation', {userId:userIdVal, cArray:JSON.stringify(categList)}, function(data) {
        var categArray = getCategoryArray(data.result["aArray"]);
        drawAllocationChart(categArray);
      });
  });
}

function getCategoryArray(data) {
  var d = [];
  for(var i in data) {
    d.push({name:data[i][0], y:data[i][1]});
  }
  return d;
}

function drawAllocationChart(data) {
  setColorArray("#00c96d");
  var dataArray = data;
  var options = {
    chart: {renderTo: 'allocationView', plotBackgroundColor: null, plotBorderWidth: null, plotShadow: false, type: 'pie'},
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
        data: dataArray
    }],
    navigation: {buttonOptions: {enabled: false}}
  };
  var chart = new Highcharts.Chart(options);
  $("#allocationView").prepend('<h4 class="light">Spending Allocation</h4>');
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

function queryExpenses() {
  $.getJSON('/queryExpense', {userId: userIdVal}, function(data) {
    var resultArray = data.result["result"];
    console.log(resultArray);
    $("#editExpenseResult").empty();
    var removeButton = '<div class="col s1"><a class="removeExpense btn-floating btn-small waves-effect waves-light red"><i class="material-icons">remove</i></a></div>';
    for(var i = 0; i < resultArray.length; i++) {
      $("#editExpenseResult").append( '<div class="row"><div class="eC col s2"><p>'  + resultArray[i][0] + '</p></div>' + 
                                                        '<div class="eS col s2"><p>' + resultArray[i][1] + '</p></div>' +
                                                        '<div class="eN col s3"><p>' + resultArray[i][2] + '</p></div>' +
                                                        '<div class="eA col s2"><p>' + resultArray[i][3] + '</p></div>' +
                                                        '<div class="eD col s2"><p>' + resultArray[i][4] + '</p></div>' +
                                                        removeButton + '</div>');
    }
    $(".removeExpense").click(function() {
      var o = $(this).parent().parent();
      var c = o.find("div.eC p").text();
      var s = o.find("div.eS p").text();
      var n = o.find("div.eN p").text();
      var a = o.find("div.eA p").text();
      var d = o.find("div.eD p").text();
      d = formatToDateTime(d);
      $.getJSON('/delExpense', {userId: userIdVal, rCateg: c, rSubCateg: s, rName:n, eAmount:a, rDate:d}, function(data) {
        if(data.result["status"] == "ok") {
          o.remove();
          calculateMonthlyExpenses();
          queryIncome();
        }
      });
    });
  });
}

function formatToDateTime(d) {
  var a = d.split("/");
  return (a[2] + "-" + a[1] + "-" + a[0]);
}

function addCategoryButtonHandler() {
  var i1 = $('input[name="addCateg"]').val();
  var i2 = $('input[name="addSubCateg"]').val();
  if(i1 != "" && i2 != "") {
    $.getJSON('/addCategory', {userId: userIdVal, categ: i1, sub: i2}, function(data) {
      queryCategory();
      confirmationAnimation("#addCategoryIcon", ["input[name='addCateg']", "input[name='addSubCateg']"]);
    });  
  }
  else {
    $("#addCategoryRow").effect("shake");
  }
}

function confirmationAnimation(id, inputToClear) {
  $(id).text("check");
  window.setTimeout(function () {$(id).text("add");}, 500);
  for(var i = 0; i < inputToClear.length; i++) {
    $(inputToClear[i]).val("");  
  }
}

function addExpenseButtonHandler() {
  var i1 = $('#selectCategory :selected').text();
  var i2 = $('#selectSubCategory :selected').text();
  var i3 = $('input[name="expenseName"]').val();
  var i4 = $('input[name="expenseAmount"]').val();
  var i5 = $('input[name="expenseDate"]').val();
  if(i1 != "Category" && i2 != "Sub-Category" && i3 != "" && !isNaN(i4) && i5.match(/^(\d{2})\/(\d{2})\/(\d{4})$/) != null) {
    i5 = formatDate(i5);
    $.getJSON('/insertExpense', {userId:userIdVal, categ:i1, sub:i2, eName:i3, eAmount:i4, eDate:i5}, function(data) {
      queryExpenses();
      calculateMonthlyExpenses();
      calculateAllocation();
      confirmationAnimation("#addExpenseIcon", ["input[name='expenseName']", "input[name='expenseAmount']", "input[name='expenseDate']"]);
      queryIncome();
    });  
  }
  else {
    $("#addExpenseRow").effect("shake");
  }
}

function formatDate(d) {
  var a = d.split("/");
  return (a[2] + "-" + a[0] + "-" + a[1]);
}

function displayView(s) {
  var id = s.replace("Button", "");
  for(var i = 0; i < views.length; i++) {
    if(id == views[i]) {
      $(views[i]).show();
    }
    else {
      $(views[i]).hide();
    }
  }
}

function bindEnterKey(query, functionName) {
  $(query).bind('keydown', function(e) {
        if(e.keyCode == 13) {
          functionName();
        }
  });
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}