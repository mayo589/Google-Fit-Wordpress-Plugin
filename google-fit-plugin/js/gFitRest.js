/*
    Author:     Marek Mihalech
    Year:       2016
    
    Description:
    Basic functionalities for seting up oAuth connection for Google APIs
*/

var URL_FTINESS_API = "https://www.googleapis.com/fitness/v1/";

var DataTypeName = {};
DataTypeName.CALORIES = "com.google.calories.expended";
DataTypeName.DISTANCE = "com.google.distance.delta";
DataTypeName.STEPS = "com.google.step_count.delta";
DataTypeName.ACTIVITIES = "com.google.activity.segment";

var BucketTimeMillis = {};
BucketTimeMillis.HOUR = 3600000;
BucketTimeMillis.DAY = BucketTimeMillis.HOUR * 24;
BucketTimeMillis.WEEK = BucketTimeMillis.DAY * 7;
BucketTimeMillis.MONTH = BucketTimeMillis.DAY * 30;

/*
    Basic function for quering Google FIT Api.
    Runs synchronously.
    returns queried data in array of buckets
*/
function getAggregatedData(dataTypeName, startDate, endDate, bucketMillis) {
    var defer = $.Deferred();

    var retVal = null;
    var d =
    {
        "aggregateBy": 
        [
            {"dataTypeName": dataTypeName}
        ],
        "endTimeMillis": endDate.getTime().toString(),
        "startTimeMillis": startDate.getTime().toString(),
        "bucketByTime": {
            "durationMillis": bucketMillis
        }
    };
    
     jQuery.ajax({
        url: URL_FTINESS_API + 'users/me/dataset:aggregate',
        type : 'post',
        contentType: "application/json",
        data: JSON.stringify(d), 
        beforeSend: function (xhr) {
                xhr.setRequestHeader ("Authorization", "Bearer " + window.google_app_access_token);
        },
        success: function (result) {
            console.log(result);
            //retVal = result;
            var returnBuckets = [];
            for(var i = 0; i < result.bucket.length; i++){
                var dataBucket = result.bucket[i];
                
                var bucketParsed = {};
                bucketParsed.startDate = new Date( parseInt(dataBucket.startTimeMillis) );
                bucketParsed.endDate = new Date( parseInt(dataBucket.endTimeMillis) );
                
                switch(dataTypeName) {
                case DataTypeName.CALORIES:
                case DataTypeName.DISTANCE:
                    if(typeof dataBucket.dataset[0].point != "undefined" &&
                        typeof dataBucket.dataset[0].point[0] != "undefined"){
                        bucketParsed.value = dataBucket.dataset[0].point[0].value[0].fpVal;
                    }
                    else{
                        bucketParsed.value = 0;
                    }
                    break;
                case  DataTypeName.STEPS:
                    if(typeof dataBucket.dataset[0].point != "undefined" &&
                        typeof dataBucket.dataset[0].point[0] != "undefined"){
                        bucketParsed.value = dataBucket.dataset[0].point[0].value[0].intVal; 
                    }
                    else{
                        bucketParsed.value = 0;
                    }
                    break;
                case DataTypeName.ACTIVITIES:
                {
                    bucketParsed.activities = [];
                    if(typeof dataBucket.dataset[0].point != "undefined"){
                        for(var j = 0; j < dataBucket.dataset[0].point.length; j++){
                            var activityData = dataBucket.dataset[0].point[j];
                            var activityParsed = {};
                            activityParsed.type = activityData.value[0].intVal;
                            activityParsed.name = activityTypes[activityParsed.type]; 
                            activityParsed.durationMillis = activityData.value[1].intVal;
                            activityParsed.startDate =  (new Date( parseInt(activityData.startTimeNanos.substr(0, activityData.startTimeNanos.length-6) )));  
                            activityParsed.endDate =  (new Date( parseInt(activityData.endTimeNanos.substr(0, activityData.endTimeNanos.length-6) )));
                            bucketParsed.activities.push(activityParsed);
                        }
                    }
                    break;
                }
                default:
                    break;
                }
                returnBuckets.push(bucketParsed);
            }
            retVal = returnBuckets;
            defer.resolve( retVal );
        },
        error: function () {
            if(arguments && arguments[0] && arguments[0].responseText){
                console.log(arguments[0].responseText);
                console.log(this.data);
            }
            defer.reject();
        },
        async: true
    });

    return defer;
}


/*
    returns Activity index by Activity name
*/
function getActivityTypeIndex(name){
    for(var i = 0; i < activityTypes.length; i++){
        if(name == activityTypes[i])
            return i;
    }
}






















function displayAllCharts(){
    $.when(getLastNMonthsValues(6, 1, DataTypeName.CALORIES)).then(function (dataCals) {
        displayChart(dataCals, getLastNMonthNames(6, 1), DataTypeName.CALORIES, 'bar', 'chart-calories'); 
    });

    $.when(getLastNMonthsValues(6, 1, DataTypeName.DISTANCE)).then(function (dataDistance) {
        displayChart(dataDistance, getLastNMonthNames(6, 1), DataTypeName.DISTANCE, 'line', 'chart-distance'); 
    });

    $.when(getLastNMonthsValues(6, 1, DataTypeName.STEPS)).then(function (dataSteps) {
        displayChart(dataSteps, getLastNMonthNames(6, 1), DataTypeName.STEPS, 'bar', 'chart-steps'); 
    });

    $.when( getLastNMonthsActivities(6, 1)).then(function (dataActivities) {
        displayChartActivities(dataActivities, 6, 1, "line");
    });
    
    $.when( getLastNMonthsActivities(1, 1) ).then(function (dataMonthPie) {
        displayMonthPieChartActivities(dataMonthPie);
    });
}

function displayChart(data, labels, dataType, chartType, elementId){
    var ctxChart = document.getElementById(elementId).getContext('2d');
    var chart = new Chart(ctxChart,
        {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total ' + dataType.toString() +  ' per month',
                    data: data,
                    borderWidth: 1,
                    backgroundColor: "rgba(75,192,192,0.6)",
                    borderColor: "rgba(75,192,192,1)",
                    borderJoinStyle: 'miter',
                    pointHitRadius: 10,
                }]
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            callback: function (value, index, values) {
                                return Math.round(value / 1000) + "k";
                            },
                        }
                    }]
                },
                tooltips: {
                    mode: 'label',
                    callbacks: {
                        title: function (item, data) {
                            var title = "";
                            title += "Total Calorie outtake in " + item[0].xLabel + ": " + Math.round(item[0].yLabel);
                            return title;
                        },
                        label: function (item, data) {
                            var afterTitle = "";
                            var month = getMonthByName(item.xLabel);
                            afterTitle += "Average per day: " + Math.round(parseInt(item.yLabel) / daysInMonth(month, (new Date()).getFullYear()));
                            return afterTitle;
                        },

                    }
                },
                responsive: false
            },
        });
}
/*
function displayChartCalories(dataCals) {
    var ctxCals = document.getElementById("chart-calories").getContext('2d');
    var chartCals = new Chart(ctxCals,
        {
            type: 'bar',
            data: {
                labels: getLastNMonthNames(6, 1),
                datasets: [{
                    label: 'Total Calories per month',
                    data: dataCals,
                    borderWidth: 1,
                    backgroundColor: "rgba(75,192,192,0.6)",
                    borderColor: "rgba(75,192,192,1)",
                    borderJoinStyle: 'miter',
                    pointHitRadius: 10,
                }]
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            callback: function (value, index, values) {
                                return Math.round(value / 1000) + "k";
                            },
                        }
                    }]
                },
                tooltips: {
                    mode: 'label',
                    callbacks: {
                        title: function (item, data) {
                            var title = "";
                            title += "Total Calorie outtake in " + item[0].xLabel + ": " + Math.round(item[0].yLabel);
                            return title;
                        },
                        label: function (item, data) {
                            var afterTitle = "";
                            var month = getMonthByName(item.xLabel);
                            afterTitle += "Average per day: " + Math.round(parseInt(item.yLabel) / daysInMonth(month, (new Date()).getFullYear()));
                            return afterTitle;
                        },

                    }
                },
                responsive: false
            },
        });
}

function displayChartDistance(dataDistance){
    var ctxDist = document.getElementById("chart-distance").getContext('2d');
    var chartDistance = new Chart(ctxDist, 
    {
        type: 'line',
        data: {
            labels: getLastNMonthNames(6, 1),
            datasets: [{
                label: 'Total Distance per month',
                data: dataDistance,
                borderWidth: 1,
                backgroundColor: "rgba(63,191,63,0.6)",
                borderColor: "rgba(63,191,63,1)",
                borderJoinStyle: 'miter',
                pointHitRadius: 10,
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        callback: function(value, index, values) {
                                return Math.round(value / 1000) + " km";
                            },
                    }
                }]
            },
            tooltips: {
                mode: 'label',
                callbacks: {
                    title: function(item, data) {
                        var title = "";
                        title += "Total distance in " + item[0].xLabel + ": " + (parseInt(item[0].yLabel) / 1000).toFixed(1)   + " km";
                        return title;
                    },
                    label: function(item, data){
                        var afterTitle = "";
                        var month = getMonthByName(item.xLabel);
                        afterTitle += "Average per day: " + ( (parseInt(item.yLabel) /  daysInMonth(month, (new Date()).getFullYear())) / 1000 ).toFixed(1) + " km"; 
                        return afterTitle;
                    },
                    
                }
            },
            responsive: false
        }, 
    });
}

function displayChartSteps(dataSteps){
    var ctxSteps = document.getElementById("chart-steps").getContext('2d');
    var chartSteps = new Chart(ctxSteps, 
    {
        type: 'bar',
        data: {
            labels: getLastNMonthNames(6, 1),
            datasets: [{
                label: 'Total step count per month',
                data: dataSteps,
                borderWidth: 1,
                backgroundColor: "rgba(191,63,63,0.6)",
                borderColor: "rgba(191,63,63,1)",
                borderJoinStyle: 'miter',
                pointHitRadius: 10,
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                            callback: function(value, index, values) {
                                return Math.round(value / 1000) + "k";
                            },
                    }
                }]
            },
            tooltips: {
                mode: 'label',
                callbacks: {
                    title: function(item, data) {
                        var title = "";
                        title += "Total step count in " + item[0].xLabel + ": " + parseInt(item[0].yLabel);
                        return title;
                    },
                    label: function(item, data){
                        var afterTitle = "";
                        var month = getMonthByName(item.xLabel);
                        afterTitle += "Average per day: " + Math.round( (parseInt(item.yLabel) /  daysInMonth(month, (new Date()).getFullYear())) ); 
                        return afterTitle;
                    },
                    
                }
            },
            responsive: false
        }, 
    });
}
*/
function displayChartActivities(dataActivities, numOfMonth, offset, chartType){
    if(!chartType)
        chartType = "line";
    
    var ctxActivities = document.getElementById("chart-activities").getContext('2d');
    var chartActivities = new Chart(ctxActivities, 
    {
        type: chartType,
        data: {
            labels: getLastNMonthNames(numOfMonth, offset),
            datasets: dataActivities, 
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                            callback: function(value, index, values) {
                                return msToTime(value, "short");
                            },
                            stepSize: 10800000
                    },
                }]
            },
            tooltips: {
                    mode: 'label', //single or label 
                    callbacks: {
                        title: function(item, data) {
                            var title = "";
                            var totalDuration = 0;
                            for(var i = 0; i < item.length; i++){
                                totalDuration += item[i].yLabel;
                            }
                            title += "Total sport activity duration in " + item[0].xLabel + ": " + msToTime(totalDuration);
                            return title;
                        },
                        label: function(item, data){
                            var afterTitle = "";
                            var month = getMonthByName(item.xLabel);
                            afterTitle += data.datasets[item.datasetIndex].label;
                            afterTitle += " total: " + msToTime(item.yLabel, "short");
                            afterTitle += " Average per day: " +  msToTime( (item.yLabel /  daysInMonth(month, (new Date()).getFullYear())), "short" ); 
                            return afterTitle;
                        },
                    }
                },
            responsive: false
        }, 
    });
}

function displayMonthPieChartActivities(dataMonthPie){
    var lastMonthActivities = dataMonthPie;
    var labels = [];
    var pieData = [];
    var piecolors = [];
    for(var ds in lastMonthActivities){
        labels.push(lastMonthActivities[ds].label);
        pieData.push(lastMonthActivities[ds].data[0]);    
        piecolors.push(lastMonthActivities[ds].backgroundColor);
    }
    var ctxActivitiesMonthPie = document.getElementById("chart-month-pie").getContext('2d');
    var chartActivitiesMonthPie = new Chart(ctxActivitiesMonthPie, 
    {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [
            {
                data: pieData,
                backgroundColor: piecolors,
            }],
        },
        options: {
            tooltips: {
                    mode: 'label', //single or label 
                    callbacks: {
                        label: function(item, data){
                            var afterTitle = "";
                            afterTitle += data.labels[item.index] + ": " + msToTime( data.datasets[item.datasetIndex].data[item.index] ); 
                            return afterTitle;
                        },
                    }
                },
            responsive: false,
        },
    });
}

function displayCalendar(){
    jQuery('#stats-calendar').datetimepicker({
        format:'d.m.Y',
        inline:true,
        timepicker:false,
        defaultDate: (new Date()).setHours(0,0,0,0),
        /*onChangeDateTime: function(current_time,$input){
            displayCalendarDayStats(current_time);
        },*/
        onGenerate: function(current_time,$input){
            $(this).addClass("stats-calendar-container"); //For css styling      
            displayCalendarDayStats(current_time);
        }
    });    
}

function displayCalendarDayStats(current_time){
    $("#stats-calendar-day .day-header td:nth-child(2)").text(current_time.toDateString());
            
    $.when(getAggregatedData(DataTypeName.CALORIES, current_time, (current_time).addDays(1), BucketTimeMillis.DAY )).then(function (d){
        var cals = d[0].value;
        $("#stats-calendar-day .day-cals td:nth-child(2)").text(Math.round(cals));
    });

    $.when(getAggregatedData(DataTypeName.DISTANCE, current_time, (current_time).addDays(1), BucketTimeMillis.DAY )).then(function (d){
        var dist = d[0].value;
        $("#stats-calendar-day .day-distance td:nth-child(2)").text(Math.round(dist));
    });

    $.when(getAggregatedData(DataTypeName.STEPS, current_time, (current_time).addDays(1), BucketTimeMillis.DAY )).then(function (d){
        var steps = d[0].value;
        $("#stats-calendar-day .day-steps td:nth-child(2)").text(steps);    
    });
    
    $("#stats-calendar-day .day-activity").remove();
    
    $.when(getAggregatedData(DataTypeName.ACTIVITIES, current_time, (current_time).addDays(1), BucketTimeMillis.DAY )).done(function (d){
        var activitiesResult = d;
        var activitiesHTML = "";
        for(var i = 0; i < activitiesResult[0].activities.length; i++){
            var activity = activitiesResult[0].activities[i];
            if(!isActivitySport(activity.name) ){
                continue;
            } 
            //$("#stats-calendar-day .day-activities").parent().append
            $("#stats-calendar-day .day-activities").parent().append("<tr class='day-activity'><td>" + activity.name + "</td><td>" + msToTime(activity.durationMillis, "short") + "</td></tr>");
        }

        if($("#stats-calendar-day .day-activity") === null || $("#stats-calendar-day .day-activity").length === 0){
            $("#stats-calendar-day .day-activities").parent().append("<tr class='day-activity'><td colspan='2'>No activities</td></tr>");
        }
    });   
}

function getLastNMonthsValues(numOfMonth, offset, dataType){
    var defer = $.Deferred();

    var monthCals = [];
    var today = new Date();
    var startDate = new Date(today.getFullYear(), today.getMonth()-numOfMonth-offset + 1, 1, 0, 0, 0, 0);
    var endDate = new Date(today.getFullYear(), today.getMonth()-offset + 1, 0, 0, 0, 0, 0);
    
    var tmpDate = startDate;
    
    var numDays = days_between(startDate, endDate);
    var requests = [];
    //Maximum treshold for query is 90 days
    for(var i = 1; i <= numDays; i = i + 89){
        var daysToAdd = 0;
        if(i+89 <= numDays)
            daysToAdd = 89;
        else
            daysToAdd = numDays - i + 1;
        
        requests.push(getAggregatedData(dataType, tmpDate, tmpDate.addDays(daysToAdd), BucketTimeMillis.DAY ) );
        tmpDate = tmpDate.addDays(daysToAdd);
    }

    $.when.apply($, requests).done(function () {
        $.each(arguments, function (i, data) {
            for(var j = 0; j < data.length; j++){
                if(typeof monthCals[data[j].endDate.getMonth()]  == "undefined")
                    monthCals[data[j].endDate.getMonth()] = 0;
             
                monthCals[data[j].endDate.getMonth()] += data[j].value;
            }
        });
        return defer.resolve(monthCals.filter(function(val){return val;}));
    });
    return defer.promise();
}

function getLastNMonthsActivities(numOfMonth, offset) {
    var defer = $.Deferred();
    var monthActivities = [];

    var today = new Date();
    var startDate = new Date(today.getFullYear(), today.getMonth() - numOfMonth - offset + 1, 1, 0, 0, 0, 0);
    var endDate = new Date(today.getFullYear(), today.getMonth() - offset + 1, 0, 0, 0, 0, 0);

    var tmpDate = startDate;
    var numDaysBetween = days_between(startDate, endDate);

    var requests = [];
    //Maximum treshold for query is 90 days
    for (var i = 1; i <= numDaysBetween; i = i + 89) {
        var daysToAdd = (i + 89 <= numDaysBetween) ? 89 :  (numDaysBetween - i + 1);

        requests.push(getAggregatedData(DataTypeName.ACTIVITIES, tmpDate, tmpDate.addDays(daysToAdd), BucketTimeMillis.DAY));
        tmpDate = tmpDate.addDays(daysToAdd);
    }

    $.when.apply($, requests).done(function () {
        $.each(arguments, function (i, data) {
            for (var k = 0; k < data.length; k++) {
                for (var j = 0; j < data[k].activities.length; j++) {
                    var activity = data[k].activities[j];
                    if (!isActivitySport(activity.name)) {
                        continue;
                    }

                    if (typeof monthActivities[activity.type] == "undefined") {
                        var color = randomColor({
                            luminosity: 'light',
                            format: 'rgba',
                            alpha: 0.6
                        });
                        monthActivities[activity.type] = {
                            label: activity.name,
                            data: Array.apply(null, Array(numOfMonth)).map(function () { return 0; }),
                            borderWidth: 1,
                            backgroundColor: color,
                            borderColor: color.replace("0.6", "1"),
                            borderJoinStyle: 'miter',
                            pointHitRadius: 10,
                        };

                    }

                    var monthIndex;
                    if(activity.startDate.getMonth() - startDate.getMonth() >= 0)
                        monthIndex = activity.startDate.getMonth() - startDate.getMonth();
                    else
                        monthIndex = activity.startDate.getMonth() + (12 - startDate.getMonth());
                    monthActivities[activity.type].data[monthIndex] += activity.durationMillis;
                }
            }
        });
        return defer.resolve(monthActivities.filter(function (val) { return val; }));
    });

    return defer.promise();
}

function isActivitySport(activityName){
    return  !(typeof activityName === "undefined" ||
            activityName === null ||
            activityName.match(/still/i) ||
            activityName.match(/sleep/i) ||
            activityName.match(/vehicle/i) ||
            activityName.toLowerCase() == "walking");
} 

























/*utils*/
function msToTime(s, type) {
    var strSecs, strHours, strMins = "";
    if(type == "short"){
        strHours = "h ";
        strMins = "m ";
        strSecs = "s ";
    }
    else{
        strHours = " hours ";
        strMins = " minutes ";
        strSecs = " seconds ";
    }
    
  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;

  var retVal = "";
  if(hrs > 0){
        retVal += hrs + strHours; 
  }
  if(mins > 0){
      retVal += mins + strMins;
  }
  if(secs > 0 || retVal === ""){
      retVal += secs + strSecs;
  }
  return retVal;
}

function days_between(date1, date2) {
    var ONE_DAY = 1000 * 60 * 60 * 24;
    var date1_ms = date1.getTime();
    var date2_ms = date2.getTime();
    var difference_ms = Math.abs(date1_ms - date2_ms);
    return Math.round(difference_ms/ONE_DAY);
}

Date.prototype.addDays = function(days){
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
};


function daysInMonth(month,year) {
    return new Date(year, month, 0).getDate();
}

var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getMonthByName(monthName){
    for(var i = 0; i < monthNames.length; i++){
        if(monthNames[i] == monthName)
            return i;
    }
}

function getLastNMonthNames(numOfMonth, offset){
    var retMonthNames = [];
    for(var i = 0; i < numOfMonth; i++){
        var d = new Date();
        d.setMonth(d.getMonth()-i-offset);
        retMonthNames.push(monthNames[d.getMonth()]);
    }
    return retMonthNames.reverse();
}
























/*
    Array of supported Google Fit Activity types
*/
var activityTypes = [];
activityTypes[0]= 'In vehicle';
activityTypes[1]= 'Biking';
activityTypes[2]= 'On foot';
activityTypes[3]= 'Still (not moving)';
activityTypes[4]= 'Unknown (unable to detect activity)';
activityTypes[5]= 'Tilting (sudden device gravity change)';
activityTypes[7]= 'Walking';
activityTypes[8]= 'Running';
activityTypes[9]= 'Aerobics';
activityTypes[10]= 'Badminton';
activityTypes[11]= 'Baseball';
activityTypes[12]= 'Basketball';
activityTypes[13]= 'Biathlon';
activityTypes[14]= 'Handbiking';
activityTypes[15]= 'Mountain biking';
activityTypes[16]= 'Road biking';
activityTypes[17]= 'Spinning';
activityTypes[18]= 'Stationary biking';
activityTypes[19]= 'Utility biking';
activityTypes[20]= 'Boxing';
activityTypes[21]= 'Calisthenics';
activityTypes[22]= 'Circuit training';
activityTypes[23]= 'Cricket';
activityTypes[24]= 'Dancing';
activityTypes[25]= 'Elliptical';
activityTypes[26]= 'Fencing';
activityTypes[27]= 'Football (American)';
activityTypes[28]= 'Football (Australian)';
activityTypes[29]= 'Football (Soccer)';
activityTypes[30]= 'Frisbee';
activityTypes[31]= 'Gardening';
activityTypes[32]= 'Golf';
activityTypes[33]= 'Gymnastics';
activityTypes[34]= 'Handball';
activityTypes[35]= 'Hiking';
activityTypes[36]= 'Hockey';
activityTypes[37]= 'Horseback riding';
activityTypes[38]= 'Housework';
activityTypes[39]= 'Jumping rope';
activityTypes[40]= 'Kayaking';
activityTypes[41]= 'Kettlebell training';
activityTypes[42]= 'Kickboxing';
activityTypes[43]= 'Kitesurfing';
activityTypes[44]= 'Martial arts';
activityTypes[45]= 'Meditation';
activityTypes[46]= 'Mixed martial arts';
activityTypes[47]= 'P90X exercises';
activityTypes[48]= 'Paragliding';
activityTypes[49]= 'Pilates';
activityTypes[50]= 'Polo';
activityTypes[51]= 'Racquetball';
activityTypes[52]= 'Rock climbing';
activityTypes[53]= 'Rowing';
activityTypes[54]= 'Rowing machine';
activityTypes[55]= 'Rugby';
activityTypes[56]= 'Jogging';
activityTypes[57]= 'Running on sand';
activityTypes[58]= 'Running (treadmill)';
activityTypes[59]= 'Sailing';
activityTypes[60]= 'Scuba diving';
activityTypes[61]= 'Skateboarding';
activityTypes[62]= 'Skating';
activityTypes[63]= 'Cross skating';
activityTypes[64]= 'Inline skating (rollerblading)';
activityTypes[65]= 'Skiing';
activityTypes[66]= 'Back-country skiing';
activityTypes[67]= 'Cross-country skiing';
activityTypes[68]= 'Downhill skiing';
activityTypes[69]= 'Kite skiing';
activityTypes[70]= 'Roller skiing';
activityTypes[71]= 'Sledding';
activityTypes[72]= 'Sleeping';
activityTypes[73]= 'Snowboarding';
activityTypes[74]= 'Snowmobile';
activityTypes[75]= 'Snowshoeing';
activityTypes[76]= 'Squash';
activityTypes[77]= 'Stair climbing';
activityTypes[78]= 'Stair-climbing machine';
activityTypes[79]= 'Stand-up paddleboarding';
activityTypes[80]= 'Strength training';
activityTypes[81]= 'Surfing';
activityTypes[82]= 'Swimming';
activityTypes[83]= 'Swimming (swimming pool)';
activityTypes[84]= 'Swimming (open water)';
activityTypes[85]= 'Table tennis (ping pong)';
activityTypes[86]= 'Team sports';
activityTypes[87]= 'Tennis';
activityTypes[88]= 'Treadmill (walking or running)';
activityTypes[89]= 'Volleyball';
activityTypes[90]= 'Volleyball (beach)';
activityTypes[91]= 'Volleyball (indoor)';
activityTypes[92]= 'Wakeboarding';
activityTypes[93]= 'Walking (fitness)';
activityTypes[94]= 'Nording walking';
activityTypes[95]= 'Walking (treadmill)';
activityTypes[96]= 'Waterpolo';
activityTypes[97]= 'Weightlifting';
activityTypes[98]= 'Wheelchair';
activityTypes[99]= 'Windsurfing';
activityTypes[100]= 'Yoga';
activityTypes[101]= 'Zumba';
activityTypes[102]= 'Diving';
activityTypes[103]= 'Ergometer';
activityTypes[104]= 'Ice skating';
activityTypes[105]= 'Indoor skating';
activityTypes[106]= 'Curling';
activityTypes[108]= 'Other (unclassified fitness activity)';
activityTypes[109]= 'Light sleep';
activityTypes[110]= 'Deep sleep';
activityTypes[111]= 'REM sleep';
activityTypes[112]= 'Awake (during sleep cycle)';