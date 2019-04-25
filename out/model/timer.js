"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Timer {
    constructor() {
        this.isRunning = false;
    }
    start() {
        this.startTime = Date.now();
    }
    stop() {
        clearInterval();
    }
    GetTimeTracked(endTime) {
        let t = endTime - this.startTime;
        let seconds = Math.floor((t / 1000) % 60);
        let minutes = Math.floor((t / 1000 / 60) % 60);
        let hours = Math.floor((t / 1000 / 60 / 60) % 60);
        return {
            total: t,
            seconds: seconds,
            minutes: minutes,
            hours: hours
        };
    }
    _zeroBase(value) {
        return value < 10 ? `0${value}` : value;
    }
}
exports.default = Timer;
//# sourceMappingURL=timer.js.map