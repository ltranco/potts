var userIdVal = -1;
var views = ["#cashFlowView", "#allocationView", "#editView", "#goalView"];
var netFields = ["cash", "investments", "property", "retirement", "loan", "debt", "morgages"];
var expenseTable = $("#editExpenseResult").DataTable({"bInfo" : false, "iDisplayLength": 5});
var goalTable = $('#editGoalResult').DataTable({"bInfo" : false, "iDisplayLength": 5});

(function($) {
    $.fn.closest_descendent = function(filter) {
        var $found = $(),
            $currentSet = this; // Current place
        while ($currentSet.length) {
            $found = $currentSet.filter(filter);
            if ($found.length) break;  // At least one match: break loop
            // Get all children of the current set
            $currentSet = $currentSet.children();
        }
        return $found.first(); // Return first match of the collection
    }
})(jQuery);

function Potts() {
  $("#loginButton").click(function() {loginButtonHandler();});
  $("#addCategoryButton").click(function() {addCategoryButtonHandler();});
  $("#addExpenseButton").click(function() {addExpenseButtonHandler();});
  $("#editNetButton").click(function() {editNetButtonHandler();});
  $("#addGoalButton").click(function() {addGoalButtonHandler();});
  $("#cashFlowViewButton").click(function() {displayView("#cashFlowViewButton");});
  $("#allocationViewButton").click(function() {displayView("#allocationViewButton");});
  $("#goalViewButton").click(function() {displayView("#goalViewButton");});
  $("#editViewButton").click(function() {displayView("#editViewButton");});
  bindEnterKey("input[name='usr']", loginButtonHandler);
  bindEnterKey("input[name='pwd']", loginButtonHandler);
  bindEnterKey("input[name='addCateg']", addCategoryButtonHandler);
  bindEnterKey("input[name='expenseName']", addExpenseButtonHandler);
  bindEnterKey("input[name='expenseAmount']", addExpenseButtonHandler);
  bindEnterKey("input[name='expenseDate']", addExpenseButtonHandler);
  bindEnterKey("input[name='cash']", editNetButtonHandler);
  bindEnterKey("input[name='investments']", editNetButtonHandler);
  bindEnterKey("input[name='property']", editNetButtonHandler);
  bindEnterKey("input[name='retirement']", editNetButtonHandler);
  bindEnterKey("input[name='loan']", editNetButtonHandler);
  bindEnterKey("input[name='debt']", editNetButtonHandler);
  bindEnterKey("input[name='morgages']", editNetButtonHandler);
  bindEnterKey("input[name='addGoal']", addGoalButtonHandler);
  bindEnterKey("input[name='exAmt']", addGoalButtonHandler);
  bindEnterKey("input[name='curAmt']", addGoalButtonHandler);
}

function queryNet() {
  $.getJSON('/queryNet', {userId:userIdVal}, function(data) {
    var vals = data.result["vals"];
    for(var i in netFields) {
      $("input[name='" + netFields[i] + "']").val(parseFloat(vals[i]).toFixed(2));
    }
    editNetButtonHandler();
  });
}

function sanitizeDictionary(d) {
    for(var k in d) {
        d[k] = d[k].replace(/,/g, '');
        if(d[k] == "")
            d[k] = "0";
    }
    return d;
}
function editNetButtonHandler() {
  var assetArray = {"cash":$("input[name='cash']").val(), "investments":$("input[name='investments']").val(), "property":$("input[name='property']").val(), "retirement":$("input[name='retirement']").val()};
  var liabilityArray = {"loan":$("input[name='loan']").val(), "debt":$("input[name='debt']").val(), "morgages":$("input[name='morgages']").val()};
  assetArray = sanitizeDictionary(assetArray);
  liabilityArray = sanitizeDictionary(liabilityArray);
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
    if($('input[name="usr"]').val() == '' && $('input[name="pwd"]').val() == '') {
        userIdVal = 2;
        $(".login").fadeOut();
        $(".loginRow").fadeOut();
        $(".mainView").fadeIn(200);
        calculateMonthlyExpenses();
        queryCategory();
        queryExpenses();
        queryNet();
        queryIncome();
        queryGoal();
    }
    else {
      $.getJSON('/authenticate', {usr: $('input[name="usr"]').val(), pwd: $('input[name="pwd"]').val()}, function(data) {
        userIdVal = data.result["userId"];
        loginHandler(data);
        queryCategory();
        queryExpenses();
        queryNet();
        queryIncome();
        queryGoal();
      });
    }
}

function queryGoal() {
    $.getJSON('/queryGoal', {userId:userIdVal}, function(data) {
        var goals = data.result["result"], g = $("#editGoalResult");
        var categ = [], expected = [], current = [];
        var rm = '<a class="removeGoal btn-floating btn-small waves-effect waves-light red"><i class="material-icons">remove</i></a>';
        var sv = '<a class="saveGoal btn-floating btn-small waves-effect waves-light accent-4 green"><i class="material-icons">save</i></a>';
        g.empty().append("<thead><tr><th>Goal</th><th>Expected</th><th>Current</th><th></th><th></th></tr></thead>");
        for(var i in goals) {
            categ.push(goals[i][0]);
            expected.push(goals[i][1]);
            current.push(goals[i][2]);
            g.append("<tr><td class='gN'>" + goals[i][0] + "</td>" +
                    "<td><input class='exA' name='editExA' type='text' value='" + goals[i][1] + "'></td>" +
                    "<td><input class='cuA' name='editCuA' type='text' value='" + goals[i][2] + "'></td>" +
                    "<td width='50px'>" + sv + "</td><td>" +
                    rm + "</td></tr>");
        }

        goalTable.destroy();
        goalTable = $("#editGoalResult").DataTable({"bInfo" : false, "iDisplayLength": 5});

        $(".saveGoal").click(function() {
            var g = $(this).parent().parent();
            var n = g.find("td.gN").text();
            var newEx = g.find("input.exA").val();
            var newCu = g.find("input.cuA").val();
            console.log(newEx);
            console.log(newCu);
            $.getJSON('/updateGoal', {userId: userIdVal, name: n, exAmount:newEx, curAmount:newCu}, function(data) {
                if(data.result["status"] = "ok") {
                    queryGoal();
                }
            });
        });

        $(".removeGoal").click(function() {
            var g = $(this).parent().parent();
            var n = g.find("td.gN").text();
            var e = g.find("input.exA").val();
            var c = g.find("input.cuA").val();
            console.log(n);
            console.log(e);
            console.log(c);
            $.getJSON('/delGoal', {userId: userIdVal, name: n, exAmount:e, curAmount:c}, function(data) {
                if(data.result["status"] == "ok") {
                    g.remove();
                    queryGoal();
                }
            });
        });
        drawGoalChart(categ, expected, current);
    });
}

function querySavingRate() {
  var e = $("#expenseCard").text().replace("$ ", "").replace(",", "");
  var i = $("#incomeCard").text().replace("$ ", "").replace(",", "");;
  e = parseFloat(e);
  i = parseFloat(i);
  $("#savingCard").text(((i - e)/i * 100.0).toFixed(2) + "%");
}

function queryIncome() {
  $.getJSON('/queryIncome', {userId:userIdVal}, function(data) {
    $("#incomeCard").text("$ " + numberWithCommas(data.result["income"]));
    querySavingRate();
  });
}

function loginHandler(data) {
  if(data.result["status"] == "ok") {
    $(".loginRow").fadeOut(200);
    $(".login").fadeOut(200);
    $(".mainView").fadeIn(200);
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
    $("#expenseCard").text("$ " + numberWithCommas(sum.toFixed(2)));
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

function addGoalButtonHandler() {
    var i1 = $('input[name="addGoal"]').val();
    var i2 = $('input[name="exAmt"]').val();
    var i3 = $('input[name="curAmt"]').val();
    if(i1 != "" && !isNaN(i2) && !isNaN(i3)) {
        console.log(i1 + i2 + i3);
        $.getJSON('/addGoal', {userId: userIdVal, goalName: i1, exAmount:i2, curAmount:i3}, function(data) {
            if(data.result["status"] == "ok") {
                queryGoal();
                confirmationAnimation("#addGoalIcon", ["input[name='addGoal']", "input[name='exAmt']", "input[name='curAmt']"]);
            }
        });
    }
    else {
        $("#addGoalRow").effect("shake");
    }
}

function drawGoalChart(categ, expected, current) {
    $("#goalView").highcharts({
        chart: {type: 'bar'},
        title: {text: 'Goals'},
        navigation: {buttonOptions: {enabled: false}},
        xAxis: {categories: categ, title: {text: null}},
        yAxis: {min: 0, title: {text: '$', align: 'high'}, labels: {overflow: 'justify'}},
        tooltip: {valuePrefix: '$'},
        colors: ["#00c96d", "#00A549"],
        plotOptions: {bar: {dataLabels: {enabled: true}}},
        legend: {layout: 'vertical', align: 'right', verticalAlign: 'top', x: -40, y: 80, floating: true, borderWidth: 1, backgroundColor: '#FFFFFF', shadow: true},
        credits: {enabled: false},
        series: [{name: 'Expected', data: expected}, {name: 'Current', data: current}]
    });
    $("#goalView").prepend('<h4 class="light">Goals</h4>');
}
function queryCategory() {
  $.getJSON('/queryCategory', {userId: userIdVal, excludeIncome:"false"}, function(data) {
      listCategory(data);
      addSelectOptions("span.selectCategory", "#selectCategory", "Category");
  });
};

function listCategory(data) {
  var resultArray = data.result["result"];
  $("#editCategoryResult").empty();
  var removeButton = '<a class="removeCateg btn-floating btn-small waves-effect waves-light red"><i class="material-icons smallRemove">remove</i></a>';
  for(var i = 0; i < resultArray.length; i++) {
    $("#editCategoryResult").append('<div class="col s3"><div class="card-panel teal"><span class="white-text selectCategory">' + resultArray[i][0] +'</span>' + removeButton + '</div></div>');
  }

  calculateAllocation();
  $(".removeCateg").click(function() {
    var o = $(this).parent().parent();
    var c = o.find("span").text();
    $.getJSON('/delCategory', {userId: userIdVal, rCateg: c}, function(data) {
      if(data.result["status"] == "ok") {
        o.remove();
        removeSelectOptions(c, "#selectCategory option");
        addSelectOptions("div.selectCategory p", "#selectCategory", "Category");
        queryCategory();
      }
    });
  });
}

function addSelectOptions(source, selectID, type) {
  var array = $(source);
  var d = {};
  for(var i = 0; i < array.length; i++) {
    var t = $.trim(array[i].textContent);
    if(!(t in d)) {
      d[t] = "";
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
  $.getJSON('/queryCategory', {userId: userIdVal, excludeIncome:"true"}, function(data) {
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
  setColorArray("#00c96d", "pie");
  var dataArray = data;
  var options = {
    chart: {renderTo: 'allocationView', plotBackgroundColor: null, plotBorderWidth: null, plotShadow: false, type: 'pie'},
    title: {text: ""},
    tooltip: {pointFormat: '<b>{point.percentage:.1f}%</b>'},
    plotOptions: {pie: {allowPointSelect: true, cursor: 'pointer', dataLabels: {enabled: false}, showInLegend: true}},
    series: [{colorByPoint: true, data: dataArray}],
    navigation: {buttonOptions: {enabled: false}}
  };
  var chart = new Highcharts.Chart(options);
  $("#allocationView").prepend('<h4 class="light">Spending Allocation</h4>');
}

function setColorArray(color, type) {
    var f = (function () {
        var colors = [], base = color, i;
        for (i = 0; i < 10; i += 1) {
            colors.push(Highcharts.Color(base).brighten((i - 1) / 7).get());
        }
        return colors;
    }());
    if(type == "pie") {
        Highcharts.getOptions().plotOptions.pie.colors = f;
    }
    else if(type == "bar") {
        Highcharts.getOptions().plotOptions.bar.colors = f;
    }
}

function queryExpenses() {
  $.getJSON('/queryExpense', {userId: userIdVal}, function(data) {
    var resultArray = data.result["result"];
    var tableHeader = "<thead><tr><th>Category</th><th>Expense</th><th>Amount</th><th>Date</th><th></th></tr></thead>";
    $("#editExpenseResult").empty().append(tableHeader);
    for(var i = 0; i < resultArray.length; i++) {
        $("#editExpenseResult").append( '<tr><td class="eC">' + resultArray[i][0] + '</td>' +
                                        '<td class="eN">' + resultArray[i][1] + '</td>' +
                                        '<td class="eA">' + parseFloat(resultArray[i][2]).toFixed(2) + '</td>' +
                                        '<td class="eD">' + resultArray[i][3] + '</td>' +
                                        '<td><a class="removeExpense btn-floating btn-small waves-effect waves-light red"><i class="material-icons">remove</i></a></td></tr>');
    }

    expenseTable.destroy();
    expenseTable = $("#editExpenseResult").DataTable({"bInfo" : false, "iDisplayLength": 5});

    $("#editExpenseResult tbody").on("click", "td", function(event){
        var td = $(this);
        if(td.index() == 4) {
            var o = td.parent();
            var c = o.find("td.eC").text();
            var n = o.find("td.eN").text();
            var a = o.find("td.eA").text();
            var d = o.find("td.eD").text();
            d = formatToDateTime(d);
            $.getJSON('/delExpense', {userId: userIdVal, rCateg: c, rName:n, eAmount:a, rDate:d}, function(data) {
                if(data.result["status"] == "ok") {
                  o.remove();
                  calculateMonthlyExpenses();
                  calculateAllocation();
                  queryIncome();
                }
            });
        }
    });
  });
}

function formatToDateTime(d) {
  var a = d.split("/");
  return (a[2] + "-" + a[1] + "-" + a[0]);
}

function addCategoryButtonHandler() {
  var i1 = $('input[name="addCateg"]').val();
  if(i1 != "") {
    $.getJSON('/addCategory', {userId: userIdVal, categ: i1}, function(data) {
      queryCategory();
      confirmationAnimation("#addCategoryIcon", ["input[name='addCateg']"]);
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
  var i3 = $('input[name="expenseName"]').val();
  var i4 = $('input[name="expenseAmount"]').val();
  var i5 = $('input[name="expenseDate"]').val();
  console.log(i5);
  console.log(i5.match(/^(\d{4})-(\d{2})-(\d{2})$/));
  if(i1 != "Category" && !isNaN(i4) && i5.match(/^(\d{4})-(\d{2})-(\d{2})$/) != null) {
    $.getJSON('/insertExpense', {userId:userIdVal, categ:i1, eName:i3, eAmount:i4, eDate:i5}, function(data) {
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
  var a = d.split("/");mmddyy
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