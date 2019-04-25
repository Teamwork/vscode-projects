import * as vscode from 'vscode';

export default class Timer {
  constructor() {
  }

public startTime: number;
public endTime: number;
public isRunning: boolean = false;

  public start() {
    this.startTime = Date.now();
  }

  public stop() {
    clearInterval();
  }

  public GetTimeTracked(endTime) {
    let t = endTime - this.startTime;
    let seconds = Math.floor((t / 1000) % 60);
    let minutes = Math.floor((t / 1000 / 60) % 60);
    let hours = Math.floor((t / 1000 / 60 / 60) % 60);
    return {
      total: t,
      seconds:seconds,
      minutes: minutes,
      hours: hours
    };
  }

  private _zeroBase(value) {
    return value < 10 ? `0${value}` : value;
  }
}