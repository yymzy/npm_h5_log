import Robot from "dingtalk-robot-sender";
import CollectError, { MsgType } from "./collect";

/*
 *  默认上报的错误信息
 */
const defaults = {
  ua: window.navigator.userAgent,
  browser: getBrowser(),
  os: getDevices(),
  osVersion: getSystemVersion(),
  errUrl: window.location.href,
  msg: "", // 错误的具体信息
  url: "", // 错误所在的url
  line: "", // 错误所在的行
  col: "", // 错误所在的列
  error: "", // 具体的error对象
};

type DefaultTypeKeys = typeof defaults;
export type DefaultTypeMap = { [K in keyof DefaultTypeKeys]: string };

export interface RunParamsType {
  name?: string;
  delay?: number;
  success?: () => void;
  fail?: () => void;
  ajax?: { url: string; data: Record<string, any> };
  dd?: {
    accessToken: string;
    secret: string;
  };
}

export type RunParamsFun = (d: DefaultTypeMap) => void;

/**
 *
 * @description 获取系统版本
 * @returns
 */
function getSystemVersion() {
  const ua = window.navigator.userAgent;
  if (ua.indexOf("CPU iPhone OS ") >= 0) {
    return ua.substring(
      ua.indexOf("CPU iPhone OS ") + 14,
      ua.indexOf(" like Mac OS X")
    );
  }
  if (ua.indexOf("Android ") >= 0) {
    return ua.substr(ua.indexOf("Android ") + 8, 3);
  }
  return "";
}

/**
   获取浏览器类型
  */
function getBrowser() {
  const userAgent = window.navigator.userAgent; // 取得浏览器的userAgent字符串
  const isOpera = userAgent.indexOf("Opera") > -1;
  if (isOpera) {
    return "Opera";
  } // 判断是否Opera浏览器
  if (userAgent.indexOf("Firefox") > -1) {
    return "FF";
  } // 判断是否Firefox浏览器
  if (userAgent.indexOf("Chrome") > -1) {
    return "Chrome";
  }
  if (userAgent.indexOf("Safari") > -1) {
    return "Safari";
  } // 判断是否Safari浏览器
  if (
    userAgent.indexOf("compatible") > -1 &&
    userAgent.indexOf("MSIE") > -1 &&
    !isOpera
  ) {
    return "IE";
  } // 判断是否IE浏览器
}

/**
   获取设备是安卓、IOS  还是PC端
  */
function getDevices() {
  const u = window.navigator.userAgent;
  if (
    /AppleWebKit.*Mobile/i.test(window.navigator.userAgent) ||
    /MIDP|SymbianOS|NOKIA|SAMSUNG|LG|NEC|TCL|Alcatel|BIRD|DBTEL|Dopod|PHILIPS|HAIER|LENOVO|MOT-|Nokia|SonyEricsson|SIE-|Amoi|ZTE/.test(
      window.navigator.userAgent
    )
  ) {
    if (window.location.href.indexOf("?mobile") < 0) {
      try {
        if (/iPhone|mac|iPod|iPad/i.test(window.navigator.userAgent)) {
          return "iPhone";
        } else {
          return "Android";
        }
      } catch (e) { }
    }
  }
  if (u.indexOf("iPad") > -1) {
    return "iPhone";
  }
  return "Android";
}

function Markdown() {
  this.text = '';
  this.title = '';
  this.items = [];
  this.setTitle = function (title) {
    this.title = title;
    return this;
  }
  this.add = function (text) {
    if (Array.isArray(text)) {
      this.items.concat(text);
    } else {
      this.items.push(text);
    }
    this.text = this.items.join('\n');
    return this;
  }
}

function ddNotice(params: RunParamsType, msgs: MsgType) {
  return new Promise((resolve, reject) => {
    // 钉钉机器人群通知
    const ddIns = new Robot({
      baseUrl: "https://oapi.dingtalk.com/robot/send",
      ...params.dd,
    });

    const markdownTitle = params.name || 'Error';
    const content = new Markdown()
      .setTitle(markdownTitle)
      .add(`[${markdownTitle}]\n`);

    // 第一条是title
    msgs.forEach((item, index) => {
      if (index > 0) {
        content.add(`--------------ERROR${`${index}`.padStart(3, '0')}--------------\n`)
      }
      if (Array.isArray(item)) {
        item.forEach(iitem => {
          content.add(`${iitem}\n`);
        });
      } else {
        content.add(`${item}\n`);
      }
    });
    ddIns.markdown(content.title, content.text)
      .then(resolve)
      .catch(reject);
  });
}
/**
 *
 * @description 触发上报
 * @param msgs
 * @param params
 */
function report(msgs: MsgType, params: RunParamsType) {
  if (params.dd) {
    return ddNotice(params, msgs)
      .then(params.success)
      .catch(params.fail);
  }
  return Promise.resolve();
}



/**
 * 核心代码区
 **/
const run = function (params: RunParamsType, callback?: RunParamsFun) {
  const errIns = new CollectError();
  let timer: NodeJS.Timeout;
  window.onerror = function (msg, url, line, col, error) {
    // 采用异步的方式,避免阻塞
    setTimeout(function () {
      // 不一定所有浏览器都支持col参数，如果不支持就用window.event来兼容
      col = col || (window.event && (window.event as any).errorCharacter) || 0;

      defaults.url = url;
      defaults.line = `${line}`;
      defaults.col = `${col}`;

      if (error && error.stack) {
        // 如果浏览器有堆栈信息，直接使用
        defaults.msg = error.stack.toString();
      } else if (arguments.callee) {
        // 尝试通过callee拿堆栈信息
        const ext = [];
        let fn = arguments.callee.caller;
        let floor = 3; // 这里只拿三层堆栈信息
        while (fn && --floor > 0) {
          ext.push(fn.toString());
          if (fn === fn.caller) {
            break; // 如果有环
          }
          fn = fn.caller;
        }
        defaults.msg = ext.join(",");
      }
      // 合并上报的数据，包括默认上报的数据和自定义上报的数据
      const reportData = {
        ...params.ajax?.data,
        ...defaults,
      };
      if (typeof callback === "function") {
        callback(reportData);
      }

      // 收集错误
      errIns.collect([
        `position：${defaults.url}:${defaults.line}:${defaults.col}`,
        `message：${defaults.msg}`
      ], defaults.ua);
      clearTimeout(timer);
      // 延迟上报
      timer = setTimeout(() => {
        report(errIns.get(), params).then(() => {
          errIns.clear();
        });
      }, (params.delay || 1) * 1000);
    }, 0);

    return true; // 错误不会console浏览器上,如需要，可将这样注释
  };
};

export default run;
