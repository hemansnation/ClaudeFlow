import { ClaudeEvent } from './ClaudeActivityDetector';

export class EventHistory {
  private events: ClaudeEvent[] = [];
  private maxEvents = 200;

  addEvent(evt: ClaudeEvent) {
    this.events.push(evt);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  getEvents(): ClaudeEvent[] {
    return [...this.events];
  }
}