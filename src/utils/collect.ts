export type MsgType = (string[] | string)[]
class CollectError {
    constructor() { }
    maps: MsgType = [];
    title: string = '';
    collect(msg: string[], title?: string) {
        this.maps.push(msg);
        if (!this.title) {
            this.title = title;
        }
    }
    get() {
        return [this.title, ...this.maps];
    }
    clear() {
        this.title = '';
        this.maps = [];
    }
}

export default CollectError;