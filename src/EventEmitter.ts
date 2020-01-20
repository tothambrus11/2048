export class EventEmitter {
    private callbacks: any;

    constructor() {
        this.callbacks = {}
    }

    on(event: string, cb: (data: any) => void) {
        if (!this.callbacks[event]) this.callbacks[event] = [];
        this.callbacks[event].push(cb)
    }

    emit(event: string, data: any) {
        let cbs = this.callbacks[event];
        if (cbs) {
            cbs.forEach((cb: any) => cb(data))
        }
    }
}
