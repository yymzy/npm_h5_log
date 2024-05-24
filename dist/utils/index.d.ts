declare const defaults: {
    ua: string;
    browser: string;
    os: string;
    osVersion: string;
    errUrl: string;
    msg: string;
    url: string;
    line: string;
    col: string;
    error: string;
};
declare type DefaultTypeKeys = typeof defaults;
export declare type DefaultTypeMap = {
    [K in keyof DefaultTypeKeys]: string;
};
export interface RunParamsType {
    name?: string;
    delay?: number;
    success?: () => void;
    fail?: () => void;
    ajax?: {
        url: string;
        data: Record<string, any>;
    };
    dd?: {
        accessToken: string;
        secret: string;
    };
}
export declare type RunParamsFun = (d: DefaultTypeMap) => void;
/**
 * 核心代码区
 **/
declare const run: (params: RunParamsType, callback?: RunParamsFun) => void;
export default run;
