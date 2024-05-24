import run, { RunParamsFun, RunParamsType } from "./utils";

export function h5Log(params: RunParamsType, callback?: RunParamsFun) {
  return run(params, callback);
}
