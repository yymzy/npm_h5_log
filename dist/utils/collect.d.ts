export declare type MsgType = (string[] | string)[];
declare class CollectError {
    constructor();
    maps: MsgType;
    title: string;
    collect(msg: string[], title?: string): void;
    get(): (string | string[])[];
    clear(): void;
}
export default CollectError;
