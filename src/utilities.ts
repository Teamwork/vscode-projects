import * as fs from 'fs';
export class Utilities{


    public static DateCompare(date: Date, compareDuration: number) : boolean {
        var moment = require('moment');

        var startMoment = moment(date);
        var endMoment = moment();

        var dif = endMoment.diff(startMoment,'minutes');

        if(dif < compareDuration) { return true; }

        return false;
    }



}