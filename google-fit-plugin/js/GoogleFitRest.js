var Activities;
(function (Activities) {
    Activities[Activities["Aerobics"] = 9] = "Aerobics";
    Activities[Activities["Badminton"] = 10] = "Badminton";
    Activities[Activities["Baseball"] = 11] = "Baseball";
    Activities[Activities["Basketball"] = 12] = "Basketball";
    Activities[Activities["Biathlon"] = 13] = "Biathlon";
    Activities[Activities["Biking"] = 1] = "Biking";
    Activities[Activities["Handbiking"] = 14] = "Handbiking";
    Activities[Activities["Mountain_biking"] = 15] = "Mountain_biking";
    Activities[Activities["Road_biking"] = 16] = "Road_biking";
    Activities[Activities["Spinning"] = 17] = "Spinning";
    Activities[Activities["Stationary_biking"] = 18] = "Stationary_biking";
    Activities[Activities["Utility_biking"] = 19] = "Utility_biking";
    Activities[Activities["Boxing"] = 20] = "Boxing";
    Activities[Activities["Calisthenics"] = 21] = "Calisthenics";
    Activities[Activities["Circuit_training"] = 22] = "Circuit_training";
    Activities[Activities["Cricket"] = 23] = "Cricket";
    Activities[Activities["Curling"] = 106] = "Curling";
    Activities[Activities["Dancing"] = 24] = "Dancing";
    Activities[Activities["Diving"] = 102] = "Diving";
    Activities[Activities["Elliptical"] = 25] = "Elliptical";
    Activities[Activities["Ergometer"] = 103] = "Ergometer";
    Activities[Activities["Fencing"] = 26] = "Fencing";
    Activities[Activities["Football_American"] = 27] = "Football_American";
    Activities[Activities["Football_Australian"] = 28] = "Football_Australian";
    Activities[Activities["Football_Soccer"] = 29] = "Football_Soccer";
    Activities[Activities["Frisbee"] = 30] = "Frisbee";
    Activities[Activities["Gardening"] = 31] = "Gardening";
    Activities[Activities["Golf"] = 32] = "Golf";
    Activities[Activities["Gymnastics"] = 33] = "Gymnastics";
    Activities[Activities["Handball"] = 34] = "Handball";
    Activities[Activities["Hiking"] = 35] = "Hiking";
    Activities[Activities["Hockey"] = 36] = "Hockey";
    Activities[Activities["Horseback_riding"] = 37] = "Horseback_riding";
    Activities[Activities["Housework"] = 38] = "Housework";
    Activities[Activities["Ice_skating"] = 104] = "Ice_skating";
    Activities[Activities["In_vehicle"] = 0] = "In_vehicle";
    Activities[Activities["Jumping_rope"] = 39] = "Jumping_rope";
    Activities[Activities["Kayaking"] = 40] = "Kayaking";
    Activities[Activities["Kettlebell_training"] = 41] = "Kettlebell_training";
    Activities[Activities["Kickboxing"] = 42] = "Kickboxing";
    Activities[Activities["Kitesurfing"] = 43] = "Kitesurfing";
    Activities[Activities["Martial_arts"] = 44] = "Martial_arts";
    Activities[Activities["Meditation"] = 45] = "Meditation";
    Activities[Activities["Mixed_martial_arts"] = 46] = "Mixed_martial_arts";
    Activities[Activities["On_foot"] = 2] = "On_foot";
    Activities[Activities["Other_unclassified_fitness_activity"] = 108] = "Other_unclassified_fitness_activity";
    Activities[Activities["P90X_exercises"] = 47] = "P90X_exercises";
    Activities[Activities["Paragliding"] = 48] = "Paragliding";
    Activities[Activities["Pilates"] = 49] = "Pilates";
    Activities[Activities["Polo"] = 50] = "Polo";
    Activities[Activities["Racquetball"] = 51] = "Racquetball";
    Activities[Activities["Rock_climbing"] = 52] = "Rock_climbing";
    Activities[Activities["Rowing"] = 53] = "Rowing";
    Activities[Activities["Rowing_machine"] = 54] = "Rowing_machine";
    Activities[Activities["Rugby"] = 55] = "Rugby";
})(Activities || (Activities = {}));
var Session = (function () {
    function Session() {
    }
    return Session;
}());
var GoogleFitRest = (function () {
    function GoogleFitRest(access_token) {
        this.access_token = access_token;
    }
    GoogleFitRest.prototype.getTotalDistance = function (startDate, endDate, activitiesIds) {
        var totalDist = 0;
        var sessions = this.getSessions(startDate, endDate, activitiesIds);
        totalDist = this.getDistanceBySessions(startDate, endDate, sessions);
        return totalDist;
    };
    GoogleFitRest.prototype.getSessions = function (startDate, endDate, activities) {
        var sessions = new Array();
        jQuery.ajax({
            url: 'https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=' +
                this.getRFC3339DateString(startDate) + '&endTime=' +
                this.getRFC3339DateString(endDate) + '&access_token=' +
                this.access_token,
            success: function (result) {
                if (activities.length > 0 && typeof result.session !== "undefined") {
                    for (var i = 0; i < result.session.length; i++) {
                        if (activities.indexOf(result.session[i].activityType) !== -1) {
                            sessions.push(result.session[i]);
                        }
                    }
                }
                else if (typeof result.session !== "undefined") {
                    sessions = result.session;
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.log(xhr, ajaxOptions, thrownError);
            },
            async: false
        });
        return sessions;
    };
    GoogleFitRest.prototype.getDistanceBySessions = function (startDate, endDate, sessions) {
        var distance = 0;
        jQuery.ajax({
            url: 'https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.distance.delta:com.google.android.gms:merge_distance_delta/datasets/' + startDate.getTime() + "000000-" + endDate.getTime() + "000000" + '?access_token=' +
                this.access_token,
            success: function (result) {
                console.log(result);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.log(xhr, ajaxOptions, thrownError);
            },
            async: false
        });
        return distance;
    };
    GoogleFitRest.prototype.getRFC3339DateString = function (d) {
        function pad(n) { return n < 10 ? '0' + n : n; }
        return d.getUTCFullYear() + '-'
            + pad(d.getUTCMonth() + 1) + '-'
            + pad(d.getUTCDate()) + 'T'
            + pad(d.getUTCHours()) + ':'
            + pad(d.getUTCMinutes()) + ':'
            + pad(d.getUTCMilliseconds()) + '.'
            + pad(d.getUTCSeconds()) + 'Z';
    };
    return GoogleFitRest;
}());
//# sourceMappingURL=GoogleFitRest.js.map