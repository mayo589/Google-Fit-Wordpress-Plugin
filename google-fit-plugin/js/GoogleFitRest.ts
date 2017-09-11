enum Activities {
    Aerobics=	9,
    Badminton =10,
    Baseball =11,
    Basketball =12,
    Biathlon =13,
    Biking =1,
    Handbiking =14,
    Mountain_biking=	15,
    Road_biking	=16,
    Spinning =17,
    Stationary_biking	=18,
    Utility_biking	=19,
    Boxing =20,
    Calisthenics =	21,
    Circuit_training	=22,
    Cricket =23,
    Curling =106,
    Dancing =24,
    Diving =102,
    Elliptical =25,
    Ergometer =103,
    Fencing =26,
    Football_American =27,
    Football_Australian =	28,
    Football_Soccer =29,
    Frisbee =30,
    Gardening =31,
    Golf =32,
    Gymnastics =	33,
    Handball =34,
    Hiking =35,
    Hockey =36,
    Horseback_riding	=37,
    Housework =38,
    Ice_skating	=104,
    In_vehicle=	0,
    Jumping_rope=	39,
    Kayaking =40,
    Kettlebell_training	=41,
    Kickboxing =42,
    Kitesurfing =43,
    Martial_arts	=44,
    Meditation =45,
    Mixed_martial_arts	=46,
    On_foot	=2,
    Other_unclassified_fitness_activity	=108,
    P90X_exercises	=47,
    Paragliding =48,
    Pilates =49,
    Polo =50,
    Racquetball =	51,
    Rock_climbing	=52,
    Rowing =53,
    Rowing_machine	=54,
    Rugby =55
}


class Session {
    activityType: number;
    startTimeMillis: string;
    endTimeMillis: string;
}

class GoogleFitRest {

    access_token: string;
    constructor(access_token: string) {
        this.access_token = access_token;
    }

 
    getTotalDistance(startDate: string, endDate: string, activitiesIds: Array<number>): number {
        var totalDist: number = 0;
        
        var sessions:Array<Session> = this.getSessions(startDate, endDate, activitiesIds);

        totalDist = this.getDistanceBySessions(startDate, endDate, sessions);

        return totalDist;
    }

    private getSessions(startDate: string, endDate: string, activities: Array<number>): Array<Session> {
        var sessions: Array<Session> = new Array<Session>();

        jQuery.ajax({
            url: 'https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=' +
                        this.getRFC3339DateString(startDate) + '&endTime=' +
                        this.getRFC3339DateString(endDate) + '&access_token=' +
                        this.access_token,

            success: function (result: any) {
                
                if (activities.length > 0 && typeof result.session !== "undefined") {
                    for (var i = 0; i < result.session.length; i++) {
                        if (activities.indexOf(result.session[i].activityType) !== -1) {
                            sessions.push(result.session[i]);
                        }
                    }
                } else if (typeof result.session !== "undefined") {
                    sessions = result.session;
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.log(xhr, ajaxOptions, thrownError);
            },
            async: false
        });
        
        return sessions;
    }

    private getDistanceBySessions(startDate, endDate, sessions: Array<Session>): number {
        var distance = 0;

        jQuery.ajax({
            url: 'https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.distance.delta:com.google.android.gms:merge_distance_delta/datasets/' + startDate.getTime() + "000000-" + endDate.getTime() + "000000" + '?access_token=' +
            this.access_token,

            success: function (result: any) {

                console.log(result);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.log(xhr, ajaxOptions, thrownError);
            },
            async: false
        });

        return distance;
    }


    private getRFC3339DateString(d: any): string {
        function pad(n) { return n < 10 ? '0' + n : n }

        return d.getUTCFullYear() + '-'
            + pad(d.getUTCMonth() + 1) + '-'
            + pad(d.getUTCDate()) + 'T'
            + pad(d.getUTCHours()) + ':'
            + pad(d.getUTCMinutes()) + ':'
            + pad(d.getUTCMilliseconds()) + '.'
            + pad(d.getUTCSeconds()) + 'Z';
    }

}