var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// .wrangler/tmp/bundle-3RQpvK/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// node_modules/unenv/dist/runtime/_internal/utils.mjs
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
__name(PerformanceEntry, "PerformanceEntry");
var PerformanceMark = /* @__PURE__ */ __name(class PerformanceMark2 extends PerformanceEntry {
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
}, "PerformanceMark");
var PerformanceMeasure = class extends PerformanceEntry {
  entryType = "measure";
};
__name(PerformanceMeasure, "PerformanceMeasure");
var PerformanceResourceTiming = class extends PerformanceEntry {
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
__name(PerformanceResourceTiming, "PerformanceResourceTiming");
var PerformanceObserverEntryList = class {
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
__name(PerformanceObserverEntryList, "PerformanceObserverEntryList");
var Performance = class {
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
__name(Performance, "Performance");
var PerformanceObserver = class {
  __unenv__ = true;
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
__name(PerformanceObserver, "PerformanceObserver");
__publicField(PerformanceObserver, "supportedEntryTypes", []);
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
import { Socket } from "node:net";
var ReadStream = class extends Socket {
  fd;
  constructor(fd) {
    super();
    this.fd = fd;
  }
  isRaw = false;
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
  isTTY = false;
};
__name(ReadStream, "ReadStream");

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
import { Socket as Socket2 } from "node:net";
var WriteStream = class extends Socket2 {
  fd;
  constructor(fd) {
    super();
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  columns = 80;
  rows = 24;
  isTTY = false;
};
__name(WriteStream, "WriteStream");

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class extends EventEmitter {
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return "";
  }
  get versions() {
    return {};
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  ref() {
  }
  unref() {
  }
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: () => 0 });
  mainModule = void 0;
  domain = void 0;
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};
__name(Process, "Process");

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var { exit, platform, nextTick } = getBuiltinModule(
  "node:process"
);
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  nextTick
});
var {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  finalization,
  features,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  on,
  off,
  once,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// src/index.ts
import { DurableObject } from "cloudflare:workers";

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context2, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context2.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context2, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context2.error = err;
            res = await onError(err, context2);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context2.finalized === false && onNotFound) {
          res = await onNotFound(context2);
        }
      }
      if (res && (context2.finalized === false || isError)) {
        context2.res = res;
      }
      return context2;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = /* @__PURE__ */ __name((arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      // Normalize the media type (case-insensitive) while keeping parameters like the boundary
      "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase())
    }
  });
  return response.formData();
}, "bufferToFormData");

// node_modules/hono/dist/utils/body.js
var MAX_NESTING_DEPTH = 32;
var MAX_NESTED_OBJECTS = 1e4;
var isRawRequest = /* @__PURE__ */ __name((request) => "headers" in request, "isRawRequest");
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const contentType = headers.get("Content-Type");
  const mediaType = contentType?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) {
    return convertFormDataToBodyData(
      await request.bodyCache.formData,
      options
    );
  }
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) {
    request.bodyCache.formData = formDataPromise;
  }
  const formData = await formDataPromise;
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value, nestingState);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value, state) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".", MAX_NESTING_DEPTH + 2);
  if (keys.length > MAX_NESTING_DEPTH + 1) {
    throwNestingLimitExceeded();
  }
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        if (state.count++ >= MAX_NESTED_OBJECTS) {
          throwNestingLimitExceeded();
        }
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");
var throwNestingLimitExceeded = /* @__PURE__ */ __name(() => {
  throw new Error("Nesting limit exceeded");
}, "throwNestingLimitExceeded");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str, "tryDecodeURIComponent");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return tryDecodeURIComponent(value);
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  const hashIndex = url.indexOf("#", 8);
  if (hashIndex !== -1) {
    url = url.slice(0, hashIndex);
  }
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var HonoRequest = /* @__PURE__ */ __name(class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = tryDecodeURIComponent(value);
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    for (const anyCachedKey in bodyCache) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        const contentType = anyCachedKey === "formData" ? void 0 : raw2.headers.get("content-type");
        return new Response(body, {
          headers: contentType ? { "Content-Type": contentType } : void 0
        })[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    ;
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
}, "HonoRequest");

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context2, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context: context2 }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context2, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = /* @__PURE__ */ __name(class {
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (layout) => this.#layout = layout;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#layout;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   // Append multiple headers using the append option (e.g. Vary)
   *   c.header('Vary', 'Accept-Encoding', { append: true })
   *   c.header('Vary', 'User-Agent', { append: true })
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers)) {
        if (key === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      if (!responseHeaders) {
        let count3 = 0;
        for (const k in headers) {
          if (++count3 > 1 || typeof headers[k] !== "string") {
            responseHeaders = new Headers();
            break;
          }
        }
      }
      if (responseHeaders) {
        for (const k in headers) {
          const v = headers[k];
          if (typeof v === "string") {
            responseHeaders.set(k, v);
          } else {
            responseHeaders.delete(k);
            for (const v2 of v) {
              responseHeaders.append(k, v2);
            }
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibytes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
}, "Context");

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch", "query"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = /* @__PURE__ */ __name(class extends Error {
}, "UnsupportedPathError");

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = /* @__PURE__ */ __name(class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        const methodName = method.toUpperCase();
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(methodName, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(methodName, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          const methodName = m.toUpperCase();
          for (const handler of handlers) {
            this.#addRoute(methodName, this.#path, handler);
          }
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app) {
    const subApp = this.basePath(path);
    app.routes.map((r) => {
      let handler;
      if (app.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env2, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env2, "GET")))();
    }
    const path = this.getPath(request, { env: env2 });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env: env2,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context2 = await composed(c);
        if (!context2.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context2.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} env - env Object
   * @param {ExecutionContext} executionCtx - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
}, "_Hono");

// node_modules/hono/dist/router/utils.js
var createNullObject = /* @__PURE__ */ __name(() => /* @__PURE__ */ Object.create(null), "createNullObject");

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }, "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return b === TAIL_WILDCARD_REG_EXP_STR ? -1 : 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = /* @__PURE__ */ __name(class _Node {
  // handler index of a dynamic path, or -1 for a static path terminal
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context2, isStatic) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : null : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
        if (name && pattern[2]) {
          if (regexpStr === ".*") {
            throw PATH_ERROR;
          }
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) {
            throw PATH_ERROR;
          }
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) {
            throw PATH_ERROR;
          }
        }
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== ONLY_WILDCARD_REG_EXP_STR && regexpStr !== TAIL_WILDCARD_REG_EXP_STR) {
            for (const k in node.#children) {
              if (
                // a single-char pattern coexists with single-char literals as a literal does
                (regexpStr.length > 1 || k.length > 1) && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
              ) {
                throw PATH_ERROR;
              }
            }
          }
          nextNode = node.#children[regexpStr] = new _Node();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context2.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) {
            if (k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR) {
              throw PATH_ERROR;
            }
          }
          nextNode = node.#children[token] = new _Node();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) {
      throw PATH_ERROR;
    }
    node.#index = isStatic ? -1 : index;
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
}, "_Node");

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = /* @__PURE__ */ __name(class {
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  // dynamic path -> [handler index, param assoc]; static paths are not registered
  paths = createNullObject();
  insert(path, isStatic) {
    if (isStatic) {
      this.#root.insert(path.split(""), 0, [], this.#context, true);
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, false);
    this.paths[path] = [this.#index++, paramAssoc];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
}, "Trie");

// node_modules/hono/dist/router/reg-exp-router/router.js
var wildcardRegExpCache = createNullObject();
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    `^${path.replace(
      /\/:[^/{}]+(?:\{\[\^\/]\+})?(?=[/{]|$)|\/?\*$|([.\\+*[^\]$()?{}|])/g,
      (match2, metaChar) => metaChar ? `\\${metaChar}` : match2 === "/*" ? TAIL_WILDCARD_REG_EXP_STR : match2 === "*" ? ONLY_WILDCARD_REG_EXP_STR : `/:${LABEL_REG_EXP_STR}`
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function findMiddleware(middleware, path) {
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = /* @__PURE__ */ __name(class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: createNullObject() };
    this.#routes = { [METHOD_NAME_ALL]: createNullObject() };
    this.#tries = { [METHOD_NAME_ALL]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      this.#tries[method] = new Trie();
      for (const handlerMap of [middleware, routes]) {
        handlerMap[method] = createNullObject();
        for (const p in handlerMap[METHOD_NAME_ALL]) {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
          this.#insertPath(method, p);
        }
      }
    }
    if (path === "/*") {
      path = "*";
    }
    const methods = method === METHOD_NAME_ALL ? Object.keys(middleware) : [method];
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      for (const m of methods) {
        if (!middleware[m][path]) {
          this.#insertPath(m, path);
          middleware[m][path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        }
      }
      for (const handlerMap of [middleware, routes]) {
        for (const m of methods) {
          for (const p in handlerMap[m]) {
            re.test(p) && handlerMap[m][p].push([handler, path]);
          }
        }
      }
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (const path2 of paths) {
      for (const m of methods) {
        if (!routes[m][path2]) {
          this.#insertPath(m, path2);
          routes[m][path2] = findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || [];
        }
        routes[m][path2].push([handler, path2]);
      }
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#routes)) {
      matchers[method] = this.#buildMatcher(method);
    }
    this.#middleware = this.#routes = this.#tries = void 0;
    wildcardRegExpCache = createNullObject();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (const r of [middleware, routes]) {
      for (const path in r) {
        const handlers = r[path];
        const pathData = trie.paths[path];
        if (!pathData) {
          staticMap[path] = [handlers.map(([h]) => [h, createNullObject()]), emptyParam];
          continue;
        }
        handlerData[pathData[0]] = handlers.map(([h, handlerPath]) => [
          h,
          trie.paths[handlerPath][1].reduceRight((map, [key], i) => {
            map[key] = paramReplacementMap[pathData[1][i][1]];
            return map;
          }, createNullObject())
        ]);
      }
    }
    return [regexp, indexReplacementMap.map((i) => handlerData[i]), staticMap];
  }
}, "RegExpRouter");

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = /* @__PURE__ */ __name(class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
}, "SmartRouter");

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = createNullObject();
var order = 0;
var Node2 = /* @__PURE__ */ __name(class _Node2 {
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path, handler) {
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i = 0;
    for (const p of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p;
      const child = curNode.#children[key] ||= new _Node2();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam) {
        possibleKeys.add(pattern[1]);
      }
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: [...possibleKeys],
        score: ++order
      }
    });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key = handlerSet.possibleKeys[i2];
          handlerSet.params[key] = params?.[key] && !i2 ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name, matcher] = pattern;
          if (!part && matcher === true) {
            continue;
          }
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.slice(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  node.#params,
                  params
                );
              }
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1]) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
}, "_Node");

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = /* @__PURE__ */ __name(class {
  name = "TrieRouter";
  #node = new Node2();
  add(method, path, handler) {
    for (const result of checkOptionalParameter(path) || [path]) {
      this.#node.insert(method, result, handler);
    }
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
}, "TrieRouter");

// node_modules/hono/dist/hono.js
var Hono2 = /* @__PURE__ */ __name(class extends Hono {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
}, "Hono");

// src/index.ts
var DEFAULT_ADMIN = {
  id: "usr-admin-01",
  username: "admin",
  password: "password123",
  name: "Network Administrator",
  role: "admin",
  created_at: Date.now()
};
function buildSeedData() {
  const now = Date.now();
  const nodes = [
    {
      id: "node-sw-01",
      name: "Core-Switch-01",
      ip: "192.168.1.1",
      type: "switch",
      status: "online",
      vendor: "Cisco",
      model: "Catalyst 9300 48P",
      location: "HQ Server Room",
      rack: "Rack A-01",
      os_version: "IOS-XE 17.09.04",
      uptime_secs: 142e4,
      cpu_usage: 18.4,
      memory_usage: 42.1,
      disk_usage: 22,
      latency_ms: 0.8,
      packet_loss: 0,
      bandwidth_in_mbps: 482.5,
      bandwidth_out_mbps: 512.1,
      snmp_version: "v2c",
      snmp_community: "public",
      ports_open: "22,80,161,443",
      last_seen: now
    },
    {
      id: "node-sw-02",
      name: "Floor1-Dist-Switch",
      ip: "192.168.1.2",
      type: "switch",
      status: "online",
      vendor: "Aruba",
      model: "CX 6300M 24G PoE+",
      location: "Floor 1 Telecom Closet",
      rack: "Rack B-02",
      os_version: "ArubaOS-CX 10.11",
      uptime_secs: 89e4,
      cpu_usage: 24.1,
      memory_usage: 55.3,
      disk_usage: 30.5,
      latency_ms: 1.2,
      packet_loss: 0,
      bandwidth_in_mbps: 180.2,
      bandwidth_out_mbps: 195.8,
      snmp_version: "v2c",
      snmp_community: "public",
      ports_open: "22,161,443",
      last_seen: now
    },
    {
      id: "node-srv-01",
      name: "VM-Host-R750",
      ip: "192.168.1.10",
      type: "server",
      status: "online",
      vendor: "Dell",
      model: "PowerEdge R750",
      location: "HQ Server Room",
      rack: "Rack A-02",
      os_version: "VMware ESXi 7.0U3",
      uptime_secs: 2592e3,
      cpu_usage: 68.2,
      memory_usage: 81.4,
      disk_usage: 64.8,
      latency_ms: 0.4,
      packet_loss: 0,
      bandwidth_in_mbps: 340,
      bandwidth_out_mbps: 410.2,
      snmp_version: "v3",
      snmp_community: "privKey99",
      ports_open: "22,80,443,5989,902",
      last_seen: now
    },
    {
      id: "node-srv-02",
      name: "App-DB-Primary",
      ip: "192.168.1.12",
      type: "server",
      status: "warning",
      vendor: "HPE",
      model: "ProLiant DL380 Gen10",
      location: "HQ Server Room",
      rack: "Rack A-03",
      os_version: "Ubuntu 22.04.3 LTS",
      uptime_secs: 512e3,
      cpu_usage: 88.5,
      memory_usage: 89.2,
      disk_usage: 91,
      latency_ms: 2.1,
      packet_loss: 0.1,
      bandwidth_in_mbps: 210.4,
      bandwidth_out_mbps: 320.6,
      snmp_version: "v2c",
      snmp_community: "public",
      ports_open: "22,80,443,3306,5432,6379",
      last_seen: now
    },
    {
      id: "node-nas-01",
      name: "Corp-Storage-NAS",
      ip: "192.168.1.20",
      type: "nvr",
      status: "online",
      vendor: "Synology",
      model: "RackStation RS3621xs+",
      location: "HQ Server Room",
      rack: "Rack A-04",
      os_version: "DSM 7.2-64570",
      uptime_secs: 34e5,
      cpu_usage: 32.1,
      memory_usage: 48,
      disk_usage: 78.4,
      latency_ms: 0.9,
      packet_loss: 0,
      bandwidth_in_mbps: 620.1,
      bandwidth_out_mbps: 180.4,
      snmp_version: "v2c",
      snmp_community: "public",
      ports_open: "80,443,5000,5001,2049,445",
      last_seen: now
    },
    {
      id: "node-nvr-01",
      name: "Sec-32CH-NVR",
      ip: "192.168.1.30",
      type: "nvr",
      status: "online",
      vendor: "Hikvision",
      model: "DS-7732NI-K4 / 16P",
      location: "Security Control Room",
      rack: "Rack Sec-01",
      os_version: "V4.61.025_220905",
      uptime_secs: 189e4,
      cpu_usage: 45,
      memory_usage: 61.2,
      disk_usage: 82.5,
      latency_ms: 1.5,
      packet_loss: 0,
      bandwidth_in_mbps: 128,
      bandwidth_out_mbps: 45.2,
      snmp_version: "v2c",
      snmp_community: "public",
      ports_open: "80,554,8000",
      last_seen: now
    },
    {
      id: "node-cam-01",
      name: "Cam-Lobby-Main",
      ip: "192.168.1.101",
      type: "camera",
      status: "online",
      vendor: "Hikvision",
      model: "DS-2CD2143G2-I (4MP Dome)",
      location: "Main Building Lobby",
      rack: "Ceiling Mount L1",
      os_version: "V5.7.10_220830",
      uptime_secs: 95e4,
      cpu_usage: 12,
      memory_usage: 28,
      disk_usage: 0,
      latency_ms: 3.2,
      packet_loss: 0,
      bandwidth_in_mbps: 0,
      bandwidth_out_mbps: 6.2,
      rtsp_url: "rtsp://admin:pass@192.168.1.101:554/Streaming/Channels/101",
      ports_open: "80,554,8000",
      last_seen: now
    },
    {
      id: "node-cam-02",
      name: "Cam-ServerRoom-PTZ",
      ip: "192.168.1.102",
      type: "camera",
      status: "online",
      vendor: "Axis",
      model: "P5655-E PTZ Network Camera",
      location: "HQ Server Room Center",
      rack: "Overhead Mount",
      os_version: "AXIS OS 10.12.1",
      uptime_secs: 12e5,
      cpu_usage: 19.5,
      memory_usage: 34,
      disk_usage: 0,
      latency_ms: 2.1,
      packet_loss: 0,
      bandwidth_in_mbps: 0,
      bandwidth_out_mbps: 8.5,
      rtsp_url: "rtsp://admin:pass@192.168.1.102:554/axis-media/media.amp",
      ports_open: "80,443,554",
      last_seen: now
    },
    {
      id: "node-cam-03",
      name: "Cam-Gate-Perimeter",
      ip: "192.168.1.103",
      type: "camera",
      status: "warning",
      vendor: "Dahua",
      model: "IPC-HFW5842E-ZE (8MP Bullet)",
      location: "Main Gate Entrance",
      rack: "Pole Mount Gate 1",
      os_version: "V3.100.0000000.1",
      uptime_secs: 43e4,
      cpu_usage: 38,
      memory_usage: 52,
      disk_usage: 0,
      latency_ms: 18.5,
      packet_loss: 3.5,
      bandwidth_in_mbps: 0,
      bandwidth_out_mbps: 12.1,
      rtsp_url: "rtsp://admin:pass@192.168.1.103:554/cam/realmonitor?channel=1&subtype=0",
      ports_open: "80,554,37777",
      last_seen: now
    },
    {
      id: "node-fw-01",
      name: "FortiGate-Edge-FW",
      ip: "192.168.1.254",
      type: "firewall",
      status: "online",
      vendor: "Fortinet",
      model: "FortiGate 100F",
      location: "HQ Server Room",
      rack: "Rack A-01",
      os_version: "FortiOS v7.2.5",
      uptime_secs: 28e5,
      cpu_usage: 28.5,
      memory_usage: 62,
      disk_usage: 41.2,
      latency_ms: 1.1,
      packet_loss: 0,
      bandwidth_in_mbps: 820,
      bandwidth_out_mbps: 790.4,
      snmp_version: "v3",
      snmp_community: "secCommunity",
      ports_open: "22,80,443,161,500,4500",
      last_seen: now
    },
    {
      id: "node-pc-01",
      name: "Exec-Desktop-PC1",
      ip: "192.168.1.105",
      type: "pc",
      status: "online",
      vendor: "Lenovo",
      model: "ThinkCentre M90q",
      location: "Executive Suite 401",
      rack: "Desk 401",
      os_version: "Windows 11 Pro 23H2",
      uptime_secs: 32e3,
      cpu_usage: 14.2,
      memory_usage: 45.8,
      disk_usage: 38,
      latency_ms: 2.8,
      packet_loss: 0,
      bandwidth_in_mbps: 12.4,
      bandwidth_out_mbps: 4.1,
      ports_open: "135,139,445,3389",
      last_seen: now
    },
    {
      id: "node-prn-01",
      name: "Reception-M507-Printer",
      ip: "192.168.1.150",
      type: "printer",
      status: "online",
      vendor: "HP",
      model: "LaserJet Enterprise M507",
      location: "Reception Desk",
      rack: "Floor 1",
      os_version: "FutureSmart 5.6",
      uptime_secs: 6e5,
      cpu_usage: 5,
      memory_usage: 22,
      disk_usage: 12,
      latency_ms: 4.5,
      packet_loss: 0,
      bandwidth_in_mbps: 0.2,
      bandwidth_out_mbps: 0.1,
      ports_open: "80,443,515,631,9100,161",
      last_seen: now
    }
  ];
  const switchPorts = [];
  const portDevices = [
    { p: 1, name: "Gi1/0/1 - To FortiGate FW", status: "up", speed: 1e3, vlan: 1, poe: 0, poe_st: "off", conn: "node-fw-01", rx: 820, tx: 790 },
    { p: 2, name: "Gi1/0/2 - VM-Host-R750 Eth0", status: "up", speed: 1e4, vlan: 10, poe: 0, poe_st: "off", conn: "node-srv-01", rx: 340, tx: 410 },
    { p: 3, name: "Gi1/0/3 - App-DB Server", status: "up", speed: 1e4, vlan: 10, poe: 0, poe_st: "off", conn: "node-srv-02", rx: 210, tx: 320 },
    { p: 4, name: "Gi1/0/4 - Corp Storage NAS", status: "up", speed: 1e4, vlan: 10, poe: 0, poe_st: "off", conn: "node-nas-01", rx: 620, tx: 180 },
    { p: 5, name: "Gi1/0/5 - Sec 32CH NVR", status: "up", speed: 1e3, vlan: 30, poe: 0, poe_st: "off", conn: "node-nvr-01", rx: 128, tx: 45 },
    { p: 6, name: "Gi1/0/6 - Cam Lobby Dome", status: "up", speed: 1e3, vlan: 30, poe: 12.4, poe_st: "active", conn: "node-cam-01", rx: 0.1, tx: 6.2 },
    { p: 7, name: "Gi1/0/7 - Cam ServerRoom PTZ", status: "up", speed: 1e3, vlan: 30, poe: 21.8, poe_st: "active", conn: "node-cam-02", rx: 0.2, tx: 8.5 },
    { p: 8, name: "Gi1/0/8 - Cam Gate Perimeter", status: "up", speed: 1e3, vlan: 30, poe: 18.2, poe_st: "active", conn: "node-cam-03", rx: 0.1, tx: 12.1 },
    { p: 9, name: "Gi1/0/9 - Floor1 Dist Switch Link", status: "up", speed: 1e4, vlan: 1, poe: 0, poe_st: "off", conn: "node-sw-02", rx: 180, tx: 195 },
    { p: 10, name: "Gi1/0/10 - Reception Printer", status: "up", speed: 1e3, vlan: 20, poe: 0, poe_st: "off", conn: "node-prn-01", rx: 0.2, tx: 0.1 }
  ];
  for (let p = 1; p <= 24; p++) {
    const match2 = portDevices.find((x) => x.p === p);
    const id = `port-core-${p}`;
    const name = match2 ? match2.name : `Gi1/0/${p} - Unassigned`;
    const status = match2 ? match2.status : p % 4 === 0 ? "down" : "up";
    const speed = match2 ? match2.speed : 1e3;
    const vlan = match2 ? match2.vlan : 1;
    const poe = match2 ? match2.poe : 0;
    const poe_st = match2 ? match2.poe_st : "off";
    const conn = match2 ? match2.conn : null;
    const rx = match2 ? match2.rx : status === "up" ? Math.random() * 20 : 0;
    const tx = match2 ? match2.tx : status === "up" ? Math.random() * 15 : 0;
    switchPorts.push({
      id,
      node_id: "node-sw-01",
      port_number: p,
      port_name: name,
      status,
      speed_mbps: speed,
      vlan,
      poe_watts: poe,
      poe_status: poe_st,
      rx_kbps: rx * 1e3,
      tx_kbps: tx * 1e3,
      errors: p === 8 ? 142 : 0,
      connected_device_id: conn
    });
  }
  const cameraChannels = [
    { id: "chan-01", node_id: "node-nvr-01", channel: 1, name: "CH01 - Main Entrance Lobby", resolution: "4K 3840x2160", fps: 30, bitrate_kbps: 6144, motion_detected: 1, status: "online" },
    { id: "chan-02", node_id: "node-nvr-01", channel: 2, name: "CH02 - Server Room Rack A/B", resolution: "1080p 1920x1080", fps: 30, bitrate_kbps: 4096, motion_detected: 0, status: "online" },
    { id: "chan-03", node_id: "node-nvr-01", channel: 3, name: "CH03 - Perimeter Gate North", resolution: "4K 3840x2160", fps: 25, bitrate_kbps: 8192, motion_detected: 1, status: "online" },
    { id: "chan-04", node_id: "node-nvr-01", channel: 4, name: "CH04 - Loading Dock East", resolution: "1080p 1920x1080", fps: 30, bitrate_kbps: 3072, motion_detected: 0, status: "online" },
    { id: "chan-05", node_id: "node-nvr-01", channel: 5, name: "CH05 - Floor 1 Open Office", resolution: "1080p 1920x1080", fps: 20, bitrate_kbps: 2048, motion_detected: 0, status: "online" },
    { id: "chan-06", node_id: "node-nvr-01", channel: 6, name: "CH06 - Floor 2 Executive Hall", resolution: "1080p 1920x1080", fps: 20, bitrate_kbps: 2048, motion_detected: 0, status: "online" },
    { id: "chan-07", node_id: "node-nvr-01", channel: 7, name: "CH07 - Underground Parking Level -1", resolution: "1080p 1920x1080", fps: 25, bitrate_kbps: 4096, motion_detected: 1, status: "online" },
    { id: "chan-08", node_id: "node-nvr-01", channel: 8, name: "CH08 - Emergency Exit Stairwell", resolution: "720p 1280x720", fps: 15, bitrate_kbps: 1536, motion_detected: 0, status: "online" }
  ];
  const alertRules = [
    { id: "rule-cpu-high", name: "Server CPU Overload (> 85%)", target_type: "server", metric_name: "cpu", condition: "gt", threshold: 85, severity: "warning", enabled: 1 },
    { id: "rule-disk-full", name: "Disk Capacity Critical (> 90%)", target_type: "all", metric_name: "disk", condition: "gt", threshold: 90, severity: "critical", enabled: 1 },
    { id: "rule-lat-high", name: "High Latency Spikes (> 15ms)", target_type: "all", metric_name: "latency", condition: "gt", threshold: 15, severity: "warning", enabled: 1 },
    { id: "rule-pkt-loss", name: "Packet Loss Detected (> 2%)", target_type: "all", metric_name: "packet_loss", condition: "gt", threshold: 2, severity: "critical", enabled: 1 }
  ];
  const alerts = [
    {
      id: "alt-01",
      node_id: "node-srv-02",
      node_name: "App-DB-Primary",
      severity: "critical",
      title: "High Disk Partition Usage",
      message: "Partition /var/log reached 91.0% disk threshold on App-DB-Primary (192.168.1.12). Clean up recommended.",
      status: "active",
      created_at: now - 36e5
    },
    {
      id: "alt-02",
      node_id: "node-cam-03",
      node_name: "Cam-Gate-Perimeter",
      severity: "warning",
      title: "Elevated Latency & Packet Loss",
      message: "Network latency reached 18.5ms with 3.5% packet loss on Cam-Gate-Perimeter. Check cable connection.",
      status: "active",
      created_at: now - 18e5
    }
  ];
  const discoveredDevices = [
    { ip: "192.168.1.108", mac: "BC:24:11:8A:4F:90", vendor: "Apple Inc.", hostname: "MacBookPro-Dev01", detected_type: "pc", open_ports: "22,5000", status: "new", last_scanned: now },
    { ip: "192.168.1.115", mac: "00:1A:2B:3C:4D:5E", vendor: "Raspberry Pi Foundation", hostname: "IoT-Gateway-Floor1", detected_type: "pc", open_ports: "22,80,1883", status: "new", last_scanned: now },
    { ip: "192.168.1.140", mac: "70:EE:50:11:22:33", vendor: "Grandstream Networks", hostname: "GXP2170-IPPhone", detected_type: "phone", open_ports: "80,5060", status: "new", last_scanned: now },
    { ip: "192.168.1.160", mac: "E0:63:DA:AA:BB:CC", vendor: "Ubiquiti Networks", hostname: "U6-Pro-AccessPoint", detected_type: "switch", open_ports: "22,80,443,8080", status: "new", last_scanned: now }
  ];
  const users = [DEFAULT_ADMIN];
  const settings = {
    company_name: "Corporate HQ Network",
    default_subnet: "192.168.1.0/24",
    polling_interval: 2500,
    auth_enabled: 1,
    webhook_url: "https://hooks.slack.com/services/demo"
  };
  const auditLogs = [
    { id: "aud-01", user: "admin", action: "System Setup", details: "Initialized NetPulse Monitoring Infrastructure", timestamp: now - 864e5 },
    { id: "aud-02", user: "admin", action: "Device Added", details: "Probed and added Core-Switch-01 (192.168.1.1)", timestamp: now - 432e5 }
  ];
  const metricHistory = [];
  for (const n of nodes) {
    for (let i = 20; i >= 0; i--) {
      const ts = now - i * 15e3;
      metricHistory.push({
        id: Math.random().toString(36).substring(2),
        node_id: n.id,
        timestamp: ts,
        cpu: Math.min(100, Math.max(2, n.cpu_usage + (Math.random() * 10 - 5))),
        memory: Math.min(100, Math.max(5, n.memory_usage + (Math.random() * 4 - 2))),
        disk: n.disk_usage,
        latency: Math.max(0.2, n.latency_ms + (Math.random() * 2 - 1)),
        rx_mbps: n.bandwidth_in_mbps,
        tx_mbps: n.bandwidth_out_mbps
      });
    }
  }
  return { nodes, switchPorts, cameraChannels, alertRules, alerts, discoveredDevices, users, settings, auditLogs, metricHistory };
}
__name(buildSeedData, "buildSeedData");
var InMemoryStore = class {
  nodes;
  switchPorts;
  cameraChannels;
  alertRules;
  alerts;
  discoveredDevices;
  users;
  settings;
  auditLogs;
  sessions = /* @__PURE__ */ new Map();
  metricHistory;
  constructor() {
    const seed = buildSeedData();
    this.nodes = seed.nodes;
    this.switchPorts = seed.switchPorts;
    this.cameraChannels = seed.cameraChannels;
    this.alertRules = seed.alertRules;
    this.alerts = seed.alerts;
    this.discoveredDevices = seed.discoveredDevices;
    this.users = seed.users;
    this.settings = seed.settings;
    this.auditLogs = seed.auditLogs;
    this.metricHistory = seed.metricHistory;
    this.sessions.set("np_demo_token_admin", DEFAULT_ADMIN);
  }
  logAudit(user, action, details) {
    this.auditLogs.unshift({
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      user,
      action,
      details,
      timestamp: Date.now()
    });
  }
  stepSimulation() {
    const now = Date.now();
    for (const n of this.nodes) {
      if (n.status === "offline")
        continue;
      const cpuDelta = (Math.random() - 0.48) * 4;
      n.cpu_usage = Math.min(99.5, Math.max(1.5, n.cpu_usage + cpuDelta));
      const memDelta = (Math.random() - 0.49) * 2;
      n.memory_usage = Math.min(98, Math.max(5, n.memory_usage + memDelta));
      const latDelta = (Math.random() - 0.5) * 0.5;
      n.latency_ms = Math.max(0.2, n.latency_ms + latDelta);
      n.uptime_secs = (n.uptime_secs || 0) + 2;
      n.last_seen = now;
      if (n.cpu_usage > 92 || n.memory_usage > 92 || n.packet_loss > 3) {
        n.status = "critical";
      } else if (n.cpu_usage > 80 || n.memory_usage > 85 || n.packet_loss > 1) {
        n.status = "warning";
      } else {
        n.status = "online";
      }
      this.metricHistory.push({
        id: Math.random().toString(36).substring(2),
        node_id: n.id,
        timestamp: now,
        cpu: n.cpu_usage,
        memory: n.memory_usage,
        disk: n.disk_usage,
        latency: n.latency_ms,
        rx_mbps: n.bandwidth_in_mbps,
        tx_mbps: n.bandwidth_out_mbps
      });
    }
  }
};
__name(InMemoryStore, "InMemoryStore");
var memStore = new InMemoryStore();
function buildApiRouter(getStore) {
  const router = new Hono2();
  const getUserFromReq = /* @__PURE__ */ __name((c) => {
    const authHeader = c.req.header("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "") || c.req.header("X-NetPulse-Token");
    if (!token)
      return null;
    const { store, isSql } = getStore(c);
    if (isSql) {
      const sess = store.ctx.storage.sql.exec(`SELECT * FROM sessions WHERE token = ?`, token).one();
      if (!sess)
        return null;
      const usr = store.ctx.storage.sql.exec(`SELECT id, username, name, role, created_at FROM users WHERE id = ?`, sess.user_id).one();
      return usr;
    } else {
      return memStore.sessions.get(token) || null;
    }
  }, "getUserFromReq");
  router.use("/api/*", async (c, next) => {
    const path = c.req.path;
    if (path.endsWith("/api/auth/login") || path.endsWith("/api/auth/status") || path.endsWith("/api/dashboard/summary")) {
      return await next();
    }
    const { store, isSql } = getStore(c);
    let authEnabled = true;
    if (isSql) {
      const st = store.ctx.storage.sql.exec(`SELECT auth_enabled FROM settings LIMIT 1`).one();
      if (st && st.auth_enabled === 0)
        authEnabled = false;
    } else {
      if (memStore.settings && memStore.settings.auth_enabled === 0)
        authEnabled = false;
    }
    if (!authEnabled) {
      return await next();
    }
    const user = getUserFromReq(c);
    if (!user) {
      return c.json({ error: "Unauthorized access. Please login.", auth_required: true }, 401);
    }
    c.set("user", user);
    return await next();
  });
  router.get("/api/auth/status", (c) => {
    const { store, isSql } = getStore(c);
    let authEnabled = true;
    let companyName = "Corporate HQ Network";
    if (isSql) {
      const st = store.ctx.storage.sql.exec(`SELECT * FROM settings LIMIT 1`).one();
      if (st) {
        authEnabled = st.auth_enabled === 1;
        companyName = st.company_name;
      }
    } else {
      authEnabled = memStore.settings.auth_enabled === 1;
      companyName = memStore.settings.company_name;
    }
    const currentUser = getUserFromReq(c);
    return c.json({ auth_enabled: authEnabled, company_name: companyName, user: currentUser });
  });
  router.post("/api/auth/login", async (c) => {
    const { store, isSql } = getStore(c);
    const body = await c.req.json();
    const username = (body.username || "").trim().toLowerCase();
    const password = body.password || "";
    let user = null;
    if (isSql) {
      user = store.ctx.storage.sql.exec(`SELECT * FROM users WHERE LOWER(username) = ? AND password = ?`, username, password).one();
    } else {
      user = memStore.users.find((u) => u.username.toLowerCase() === username && u.password === password);
    }
    if (!user) {
      return c.json({ error: "Invalid username or password" }, 401);
    }
    const token = `np_token_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const now = Date.now();
    if (isSql) {
      store.ctx.storage.sql.exec(
        `INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)`,
        token,
        user.id,
        now
      );
      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${now}`,
        user.username,
        "User Login",
        `Logged in from local console`,
        now
      );
    } else {
      memStore.sessions.set(token, { id: user.id, username: user.username, name: user.name, role: user.role, created_at: user.created_at });
      memStore.logAudit(user.username, "User Login", `Logged in from local console`);
    }
    return c.json({
      ok: true,
      token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role }
    });
  });
  router.get("/api/auth/me", (c) => {
    const user = getUserFromReq(c);
    if (!user)
      return c.json({ error: "Not logged in" }, 401);
    return c.json(user);
  });
  router.post("/api/auth/logout", (c) => {
    const authHeader = c.req.header("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "") || c.req.header("X-NetPulse-Token");
    const { store, isSql } = getStore(c);
    if (token) {
      if (isSql) {
        store.ctx.storage.sql.exec(`DELETE FROM sessions WHERE token = ?`, token);
      } else {
        memStore.sessions.delete(token);
      }
    }
    return c.json({ ok: true });
  });
  router.post("/api/auth/change-password", async (c) => {
    const user = getUserFromReq(c);
    if (!user)
      return c.json({ error: "Unauthorized" }, 401);
    const { store, isSql } = getStore(c);
    const { old_password, new_password } = await c.req.json();
    if (!new_password || new_password.length < 4) {
      return c.json({ error: "New password must be at least 4 characters long" }, 400);
    }
    if (isSql) {
      const dbUser = store.ctx.storage.sql.exec(`SELECT * FROM users WHERE id = ?`, user.id).one();
      if (!dbUser || dbUser.password !== old_password) {
        return c.json({ error: "Incorrect current password" }, 400);
      }
      store.ctx.storage.sql.exec(`UPDATE users SET password = ? WHERE id = ?`, new_password, user.id);
      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${Date.now()}`,
        user.username,
        "Password Change",
        `Updated account password`,
        Date.now()
      );
    } else {
      const dbUser = memStore.users.find((u) => u.id === user.id);
      if (!dbUser || dbUser.password !== old_password) {
        return c.json({ error: "Incorrect current password" }, 400);
      }
      dbUser.password = new_password;
      memStore.logAudit(user.username, "Password Change", `Updated account password`);
    }
    return c.json({ ok: true });
  });
  router.get("/api/auth/users", (c) => {
    const { store, isSql } = getStore(c);
    if (isSql) {
      const users = store.ctx.storage.sql.exec(`SELECT id, username, name, role, created_at FROM users`).toArray();
      return c.json(users);
    } else {
      return c.json(memStore.users.map((u) => ({ id: u.id, username: u.username, name: u.name, role: u.role, created_at: u.created_at })));
    }
  });
  router.post("/api/auth/users", async (c) => {
    const activeUser = getUserFromReq(c);
    const { store, isSql } = getStore(c);
    const body = await c.req.json();
    const id = `usr-${Date.now()}`;
    const now = Date.now();
    if (!body.username || !body.password) {
      return c.json({ error: "Username and password are required" }, 400);
    }
    if (isSql) {
      store.ctx.storage.sql.exec(
        `INSERT INTO users (id, username, password, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        id,
        body.username,
        body.password,
        body.name || body.username,
        body.role || "viewer",
        now
      );
      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${now}`,
        activeUser?.username || "admin",
        "Create User",
        `Created user ${body.username} (${body.role})`,
        now
      );
    } else {
      memStore.users.push({
        id,
        username: body.username,
        password: body.password,
        name: body.name || body.username,
        role: body.role || "viewer",
        created_at: now
      });
      memStore.logAudit(activeUser?.username || "admin", "Create User", `Created user ${body.username} (${body.role})`);
    }
    return c.json({ ok: true, id });
  });
  router.get("/api/dashboard/summary", (c) => {
    const { store, isSql } = getStore(c);
    if (isSql) {
      store.stepSimulation();
      const nodes = store.ctx.storage.sql.exec(`SELECT * FROM nodes`).toArray();
      const activeAlerts = store.ctx.storage.sql.exec(`SELECT * FROM alerts WHERE status = 'active' ORDER BY created_at DESC`).toArray();
      const totalNodes = nodes.length;
      const onlineNodes = nodes.filter((n) => n.status === "online").length;
      const warningNodes = nodes.filter((n) => n.status === "warning").length;
      const criticalNodes = nodes.filter((n) => n.status === "critical").length;
      const offlineNodes = nodes.filter((n) => n.status === "offline").length;
      const totalBandwidthIn = nodes.reduce((sum, n) => sum + (n.bandwidth_in_mbps || 0), 0);
      const totalBandwidthOut = nodes.reduce((sum, n) => sum + (n.bandwidth_out_mbps || 0), 0);
      const avgLatency = nodes.length ? nodes.reduce((sum, n) => sum + (n.latency_ms || 0), 0) / nodes.length : 0;
      const avgCpu = nodes.length ? nodes.reduce((sum, n) => sum + (n.cpu_usage || 0), 0) / nodes.length : 0;
      const avgMemory = nodes.length ? nodes.reduce((sum, n) => sum + (n.memory_usage || 0), 0) / nodes.length : 0;
      return c.json({
        totalNodes,
        onlineNodes,
        warningNodes,
        criticalNodes,
        offlineNodes,
        totalBandwidthIn,
        totalBandwidthOut,
        avgLatency,
        avgCpu,
        avgMemory,
        activeAlertsCount: activeAlerts.length,
        recentAlerts: activeAlerts.slice(0, 5)
      });
    } else {
      memStore.stepSimulation();
      const nodes = memStore.nodes;
      const activeAlerts = memStore.alerts.filter((a) => a.status === "active");
      const totalNodes = nodes.length;
      const onlineNodes = nodes.filter((n) => n.status === "online").length;
      const warningNodes = nodes.filter((n) => n.status === "warning").length;
      const criticalNodes = nodes.filter((n) => n.status === "critical").length;
      const offlineNodes = nodes.filter((n) => n.status === "offline").length;
      const totalBandwidthIn = nodes.reduce((sum, n) => sum + (n.bandwidth_in_mbps || 0), 0);
      const totalBandwidthOut = nodes.reduce((sum, n) => sum + (n.bandwidth_out_mbps || 0), 0);
      const avgLatency = nodes.length ? nodes.reduce((sum, n) => sum + (n.latency_ms || 0), 0) / nodes.length : 0;
      const avgCpu = nodes.length ? nodes.reduce((sum, n) => sum + (n.cpu_usage || 0), 0) / nodes.length : 0;
      const avgMemory = nodes.length ? nodes.reduce((sum, n) => sum + (n.memory_usage || 0), 0) / nodes.length : 0;
      return c.json({
        totalNodes,
        onlineNodes,
        warningNodes,
        criticalNodes,
        offlineNodes,
        totalBandwidthIn,
        totalBandwidthOut,
        avgLatency,
        avgCpu,
        avgMemory,
        activeAlertsCount: activeAlerts.length,
        recentAlerts: activeAlerts.slice(0, 5)
      });
    }
  });
  router.get("/api/nodes", (c) => {
    const { store, isSql } = getStore(c);
    const type = c.req.query("type");
    const status = c.req.query("status");
    const search = c.req.query("search")?.toLowerCase();
    let rows = [];
    if (isSql) {
      let sql = `SELECT * FROM nodes WHERE 1=1`;
      const params = [];
      if (type && type !== "all") {
        sql += ` AND type = ?`;
        params.push(type);
      }
      if (status && status !== "all") {
        sql += ` AND status = ?`;
        params.push(status);
      }
      rows = store.ctx.storage.sql.exec(sql, ...params).toArray();
    } else {
      rows = [...memStore.nodes];
      if (type && type !== "all") {
        rows = rows.filter((n) => n.type === type);
      }
      if (status && status !== "all") {
        rows = rows.filter((n) => n.status === status);
      }
    }
    if (search) {
      rows = rows.filter(
        (n) => n.name.toLowerCase().includes(search) || n.ip.toLowerCase().includes(search) || n.vendor?.toLowerCase().includes(search) || n.location?.toLowerCase().includes(search)
      );
    }
    return c.json(rows);
  });
  router.post("/api/nodes/probe-and-add", async (c) => {
    const user = getUserFromReq(c);
    const { store, isSql } = getStore(c);
    const body = await c.req.json();
    const targetIp = (body.ip || "192.168.1.200").trim();
    const id = `node-ip-${Date.now()}`;
    const now = Date.now();
    const isCustomType = body.type && body.type !== "auto";
    let detectedType = isCustomType ? body.type : "server";
    let vendor = body.vendor || "Generic Device";
    let model = body.model || "Standard Enterprise Hardware";
    let osVersion = body.os_version || "Embedded Linux";
    let portsOpen = body.ports_open || "22,80,161,443";
    let latency = Math.round((Math.random() * 2 + 0.5) * 10) / 10;
    let cpu = Math.round((Math.random() * 25 + 10) * 10) / 10;
    let memory = Math.round((Math.random() * 30 + 20) * 10) / 10;
    let disk = Math.round((Math.random() * 40 + 20) * 10) / 10;
    let bwIn = Math.round((Math.random() * 50 + 5) * 10) / 10;
    let bwOut = Math.round((Math.random() * 40 + 5) * 10) / 10;
    if (!isCustomType) {
      const lastOctet = parseInt(targetIp.split(".").pop() || "0", 10);
      if (lastOctet === 1 || lastOctet === 2 || lastOctet === 254) {
        detectedType = "switch";
        vendor = "Cisco";
        model = "Catalyst Managed Switch";
        osVersion = "Cisco IOS-XE 17.6";
        portsOpen = "22,80,161,443";
      } else if (lastOctet >= 100 && lastOctet <= 110) {
        detectedType = "camera";
        vendor = "Hikvision";
        model = "DS-2CD 4MP Dome Camera";
        osVersion = "V5.7 Network Camera Firmware";
        portsOpen = "80,554,8000";
        disk = 0;
      } else if (lastOctet >= 30 && lastOctet <= 40) {
        detectedType = "nvr";
        vendor = "Dahua";
        model = "32-Channel NVR Storage";
        osVersion = "Embedded NVR OS v4.0";
        portsOpen = "80,554,37777";
      } else if (lastOctet >= 150 && lastOctet <= 160) {
        detectedType = "printer";
        vendor = "HP";
        model = "LaserJet Network Printer";
        osVersion = "HP FutureSmart";
        portsOpen = "80,443,9100,161";
      } else if (lastOctet > 110 && lastOctet < 150) {
        detectedType = "pc";
        vendor = "Dell";
        model = "OptiPlex Workstation PC";
        osVersion = "Windows 11 Enterprise";
        portsOpen = "135,139,445,3389";
      }
    }
    const deviceName = body.name || `${detectedType.toUpperCase()}-${targetIp.split(".").slice(-2).join(".")}`;
    const newNode = {
      id,
      name: deviceName,
      ip: targetIp,
      type: detectedType,
      status: "online",
      vendor,
      model,
      location: body.location || "Company Local Subnet",
      rack: body.rack || "Rack-01",
      os_version: osVersion,
      uptime_secs: 86400,
      cpu_usage: cpu,
      memory_usage: memory,
      disk_usage: disk,
      latency_ms: latency,
      packet_loss: 0,
      bandwidth_in_mbps: bwIn,
      bandwidth_out_mbps: bwOut,
      snmp_version: body.snmp_version || "v2c",
      snmp_community: body.snmp_community || "public",
      rtsp_url: body.rtsp_url || (detectedType === "camera" ? `rtsp://admin:pass@${targetIp}:554/live` : null),
      ports_open: portsOpen,
      last_seen: now
    };
    if (isSql) {
      store.ctx.storage.sql.exec(
        `INSERT INTO nodes (id, name, ip, type, status, vendor, model, location, rack, os_version, uptime_secs, cpu_usage, memory_usage, disk_usage, latency_ms, packet_loss, bandwidth_in_mbps, bandwidth_out_mbps, snmp_version, snmp_community, rtsp_url, ports_open, last_seen)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        deviceName,
        targetIp,
        detectedType,
        "online",
        vendor,
        model,
        newNode.location,
        newNode.rack,
        osVersion,
        86400,
        cpu,
        memory,
        disk,
        latency,
        0,
        bwIn,
        bwOut,
        newNode.snmp_version,
        newNode.snmp_community,
        newNode.rtsp_url,
        portsOpen,
        now
      );
      if (detectedType === "switch") {
        for (let p = 1; p <= 24; p++) {
          store.ctx.storage.sql.exec(
            `INSERT INTO switch_ports (id, node_id, port_number, port_name, status, speed_mbps, vlan, poe_watts, poe_status, rx_kbps, tx_kbps, errors, connected_device_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            `port-${id}-${p}`,
            id,
            p,
            `Port ${p}`,
            p % 4 === 0 ? "down" : "up",
            1e3,
            1,
            p <= 8 ? 15.4 : 0,
            p <= 8 ? "active" : "off",
            1200,
            800,
            0,
            null
          );
        }
      }
      if (detectedType === "camera" || detectedType === "nvr") {
        store.ctx.storage.sql.exec(
          `INSERT INTO camera_channels (id, node_id, channel, name, resolution, fps, bitrate_kbps, motion_detected, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          `chan-${id}-1`,
          id,
          1,
          `Stream CH01 - ${deviceName}`,
          "1080p 1920x1080",
          30,
          4096,
          0,
          "online"
        );
      }
      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${now}`,
        user?.username || "admin",
        "Device Added",
        `Added ${deviceName} (${targetIp})`,
        now
      );
    } else {
      memStore.nodes.push(newNode);
      if (detectedType === "switch") {
        for (let p = 1; p <= 24; p++) {
          memStore.switchPorts.push({
            id: `port-${id}-${p}`,
            node_id: id,
            port_number: p,
            port_name: `Port ${p}`,
            status: p % 4 === 0 ? "down" : "up",
            speed_mbps: 1e3,
            vlan: 1,
            poe_watts: p <= 8 ? 15.4 : 0,
            poe_status: p <= 8 ? "active" : "off",
            rx_kbps: 1200,
            tx_kbps: 800,
            errors: 0,
            connected_device_id: null
          });
        }
      }
      if (detectedType === "camera" || detectedType === "nvr") {
        memStore.cameraChannels.push({
          id: `chan-${id}-1`,
          node_id: id,
          channel: 1,
          name: `Stream CH01 - ${deviceName}`,
          resolution: "1080p 1920x1080",
          fps: 30,
          bitrate_kbps: 4096,
          motion_detected: 0,
          status: "online"
        });
      }
      memStore.logAudit(user?.username || "admin", "Device Added", `Added ${deviceName} (${targetIp})`);
    }
    const probeDiagnostics = [
      { step: 1, title: "ICMP Ping Reachability", result: `SUCCESS (${latency}ms round-trip to ${targetIp})` },
      { step: 2, title: "TCP/UDP Port Discovery", result: `SUCCESS (Open Services: ${portsOpen})` },
      { step: 3, title: "SNMP & System Handshake", result: `SUCCESS (Fingerprinted: ${vendor} ${model})` },
      { step: 4, title: "Live Telemetry Stream", result: `ACTIVE (High-frequency metrics initialized)` }
    ];
    return c.json({
      ok: true,
      id,
      node: newNode,
      diagnostics: probeDiagnostics
    });
  });
  router.get("/api/nodes/:id", (c) => {
    const { store, isSql } = getStore(c);
    const id = c.req.param("id");
    if (isSql) {
      const node = store.ctx.storage.sql.exec(`SELECT * FROM nodes WHERE id = ?`, id).one();
      if (!node)
        return c.json({ error: "Node not found" }, 404);
      const history = store.ctx.storage.sql.exec(`SELECT * FROM metric_history WHERE node_id = ? ORDER BY timestamp DESC LIMIT 60`, id).toArray().reverse();
      const ports = store.ctx.storage.sql.exec(`SELECT * FROM switch_ports WHERE node_id = ? ORDER BY port_number ASC`, id).toArray();
      const cameraChannels = store.ctx.storage.sql.exec(`SELECT * FROM camera_channels WHERE node_id = ? ORDER BY channel ASC`, id).toArray();
      const nodeAlerts = store.ctx.storage.sql.exec(`SELECT * FROM alerts WHERE node_id = ? ORDER BY created_at DESC`, id).toArray();
      return c.json({ ...node, history, ports, cameraChannels, alerts: nodeAlerts });
    } else {
      const node = memStore.nodes.find((n) => n.id === id);
      if (!node)
        return c.json({ error: "Node not found" }, 404);
      const history = memStore.metricHistory.filter((h) => h.node_id === id).slice(-60);
      const ports = memStore.switchPorts.filter((p) => p.node_id === id);
      const cameraChannels = memStore.cameraChannels.filter((cc) => cc.node_id === id);
      const nodeAlerts = memStore.alerts.filter((a) => a.node_id === id);
      return c.json({ ...node, history, ports, cameraChannels, alerts: nodeAlerts });
    }
  });
  router.delete("/api/nodes/:id", (c) => {
    const user = getUserFromReq(c);
    const { store, isSql } = getStore(c);
    const id = c.req.param("id");
    if (isSql) {
      store.ctx.storage.sql.exec(`DELETE FROM nodes WHERE id = ?`, id);
      store.ctx.storage.sql.exec(`DELETE FROM switch_ports WHERE node_id = ?`, id);
      store.ctx.storage.sql.exec(`DELETE FROM camera_channels WHERE node_id = ?`, id);
      store.ctx.storage.sql.exec(`DELETE FROM metric_history WHERE node_id = ?`, id);
      store.ctx.storage.sql.exec(`DELETE FROM alerts WHERE node_id = ?`, id);
      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${Date.now()}`,
        user?.username || "admin",
        "Device Deleted",
        `Removed device ${id}`,
        Date.now()
      );
    } else {
      memStore.nodes = memStore.nodes.filter((n) => n.id !== id);
      memStore.switchPorts = memStore.switchPorts.filter((p) => p.node_id !== id);
      memStore.cameraChannels = memStore.cameraChannels.filter((c2) => c2.node_id !== id);
      memStore.metricHistory = memStore.metricHistory.filter((m) => m.node_id !== id);
      memStore.alerts = memStore.alerts.filter((a) => a.node_id !== id);
      memStore.logAudit(user?.username || "admin", "Device Deleted", `Removed device ${id}`);
    }
    return c.json({ ok: true });
  });
  router.post("/api/nodes/:id/simulate-fault", async (c) => {
    const user = getUserFromReq(c);
    const { store, isSql } = getStore(c);
    const id = c.req.param("id");
    const { action } = await c.req.json();
    const now = Date.now();
    let nodeName = "Target Node";
    if (isSql) {
      const node = store.ctx.storage.sql.exec(`SELECT * FROM nodes WHERE id = ?`, id).one();
      if (!node)
        return c.json({ error: "Node not found" }, 404);
      nodeName = node.name;
      if (action === "cpu_spike") {
        store.ctx.storage.sql.exec(`UPDATE nodes SET cpu_usage = 98.4, status = 'critical' WHERE id = ?`, id);
        store.ctx.storage.sql.exec(
          `INSERT INTO alerts (id, node_id, node_name, severity, title, message, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          `alt-${now}`,
          id,
          nodeName,
          "critical",
          "Extreme CPU Spike Triggered",
          `CPU utilization surged to 98.4% on ${nodeName}.`,
          "active",
          now
        );
      } else if (action === "latency_spike") {
        store.ctx.storage.sql.exec(`UPDATE nodes SET latency_ms = 145.2, packet_loss = 12.5, status = 'warning' WHERE id = ?`, id);
        store.ctx.storage.sql.exec(
          `INSERT INTO alerts (id, node_id, node_name, severity, title, message, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          `alt-${now}`,
          id,
          nodeName,
          "warning",
          "High Network Latency",
          `Ping latency reached 145.2ms on ${nodeName}.`,
          "active",
          now
        );
      } else if (action === "offline") {
        store.ctx.storage.sql.exec(`UPDATE nodes SET status = 'offline' WHERE id = ?`, id);
        store.ctx.storage.sql.exec(
          `INSERT INTO alerts (id, node_id, node_name, severity, title, message, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          `alt-${now}`,
          id,
          nodeName,
          "critical",
          "Host Unreachable / Down",
          `Ping check failed for ${nodeName}.`,
          "active",
          now
        );
      } else if (action === "restore") {
        store.ctx.storage.sql.exec(`UPDATE nodes SET status = 'online', cpu_usage = 18.0, latency_ms = 1.2, packet_loss = 0.0 WHERE id = ?`, id);
        store.ctx.storage.sql.exec(`UPDATE alerts SET status = 'resolved' WHERE node_id = ? AND status = 'active'`, id);
      }
      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${now}`,
        user?.username || "admin",
        "Simulation Fault Triggered",
        `${action} on ${nodeName}`,
        now
      );
    } else {
      const node = memStore.nodes.find((n) => n.id === id);
      if (!node)
        return c.json({ error: "Node not found" }, 404);
      nodeName = node.name;
      if (action === "cpu_spike") {
        node.cpu_usage = 98.4;
        node.status = "critical";
        memStore.alerts.unshift({
          id: `alt-${now}`,
          node_id: id,
          node_name: nodeName,
          severity: "critical",
          title: "Extreme CPU Spike Triggered",
          message: `CPU utilization surged to 98.4% on ${nodeName}.`,
          status: "active",
          created_at: now
        });
      } else if (action === "latency_spike") {
        node.latency_ms = 145.2;
        node.packet_loss = 12.5;
        node.status = "warning";
        memStore.alerts.unshift({
          id: `alt-${now}`,
          node_id: id,
          node_name: nodeName,
          severity: "warning",
          title: "High Network Latency",
          message: `Ping latency reached 145.2ms on ${nodeName}.`,
          status: "active",
          created_at: now
        });
      } else if (action === "offline") {
        node.status = "offline";
        memStore.alerts.unshift({
          id: `alt-${now}`,
          node_id: id,
          node_name: nodeName,
          severity: "critical",
          title: "Host Unreachable / Down",
          message: `Ping check failed for ${nodeName}.`,
          status: "active",
          created_at: now
        });
      } else if (action === "restore") {
        node.status = "online";
        node.cpu_usage = 18;
        node.latency_ms = 1.2;
        node.packet_loss = 0;
        memStore.alerts.forEach((a) => {
          if (a.node_id === id && a.status === "active")
            a.status = "resolved";
        });
      }
      memStore.logAudit(user?.username || "admin", "Simulation Fault Triggered", `${action} on ${nodeName}`);
    }
    return c.json({ ok: true });
  });
  router.put("/api/nodes/:nodeId/ports/:portId", async (c) => {
    const user = getUserFromReq(c);
    const { store, isSql } = getStore(c);
    const portId = c.req.param("portId");
    const body = await c.req.json();
    if (isSql) {
      if (body.status !== void 0) {
        store.ctx.storage.sql.exec(`UPDATE switch_ports SET status = ? WHERE id = ?`, body.status, portId);
      }
      if (body.vlan !== void 0) {
        store.ctx.storage.sql.exec(`UPDATE switch_ports SET vlan = ? WHERE id = ?`, body.vlan, portId);
      }
      if (body.poe_status !== void 0) {
        store.ctx.storage.sql.exec(`UPDATE switch_ports SET poe_status = ? WHERE id = ?`, body.poe_status, portId);
      }
      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${Date.now()}`,
        user?.username || "admin",
        "Port Configuration",
        `Updated switch port ${portId}`,
        Date.now()
      );
    } else {
      const port = memStore.switchPorts.find((p) => p.id === portId);
      if (port) {
        if (body.status !== void 0)
          port.status = body.status;
        if (body.vlan !== void 0)
          port.vlan = body.vlan;
        if (body.poe_status !== void 0)
          port.poe_status = body.poe_status;
      }
      memStore.logAudit(user?.username || "admin", "Port Configuration", `Updated switch port ${portId}`);
    }
    return c.json({ ok: true });
  });
  router.post("/api/tools/ping", async (c) => {
    const { target, count: count3 = 4 } = await c.req.json();
    const host = (target || "192.168.1.1").trim();
    const packets = Math.min(10, Math.max(1, count3));
    const lines = [];
    lines.push(`PING ${host} (${host}) 56(84) bytes of data.`);
    let lost = 0;
    let minLat = 999;
    let maxLat = 0;
    let totalLat = 0;
    for (let i = 1; i <= packets; i++) {
      const isDropped = Math.random() < 0.05;
      if (isDropped) {
        lost++;
        lines.push(`Request timeout for icmp_seq ${i}`);
      } else {
        const rtt = Math.round((Math.random() * 3 + 0.4) * 10) / 10;
        minLat = Math.min(minLat, rtt);
        maxLat = Math.max(maxLat, rtt);
        totalLat += rtt;
        lines.push(`64 bytes from ${host}: icmp_seq=${i} ttl=64 time=${rtt} ms`);
      }
    }
    const avgLat = packets > lost ? Math.round(totalLat / (packets - lost) * 10) / 10 : 0;
    const lossPct = Math.round(lost / packets * 100);
    lines.push(`--- ${host} ping statistics ---`);
    lines.push(`${packets} packets transmitted, ${packets - lost} received, ${lossPct}% packet loss, time ${packets * 1e3}ms`);
    lines.push(`rtt min/avg/max = ${minLat === 999 ? 0 : minLat}/${avgLat}/${maxLat} ms`);
    return c.json({
      target: host,
      success: lossPct < 100,
      packetsSent: packets,
      packetsReceived: packets - lost,
      packetLossPct: lossPct,
      avgLatencyMs: avgLat,
      output: lines
    });
  });
  router.post("/api/tools/port-scan", async (c) => {
    const { target } = await c.req.json();
    const host = (target || "192.168.1.1").trim();
    const commonPorts = [
      { port: 22, name: "SSH" },
      { port: 53, name: "DNS" },
      { port: 80, name: "HTTP Web Console" },
      { port: 161, name: "SNMP Agent" },
      { port: 443, name: "HTTPS" },
      { port: 554, name: "RTSP Stream" },
      { port: 3389, name: "RDP Remote Desktop" },
      { port: 5e3, name: "Synology / Custom Web" },
      { port: 8e3, name: "Hikvision SDK" },
      { port: 8080, name: "HTTP Proxy / Admin" }
    ];
    const results = commonPorts.map((p) => {
      const open = Math.random() > 0.4;
      return {
        port: p.port,
        name: p.name,
        state: open ? "open" : "closed",
        latency_ms: open ? Math.round((Math.random() * 2 + 0.5) * 10) / 10 : null
      };
    });
    return c.json({ target: host, scanned_ports: results });
  });
  router.post("/api/tools/traceroute", async (c) => {
    const { target } = await c.req.json();
    const host = (target || "192.168.1.1").trim();
    const hops = [
      { hop: 1, ip: "192.168.1.254", name: "FortiGate-Edge-FW.local", rtt1: "0.4 ms", rtt2: "0.5 ms", rtt3: "0.4 ms" },
      { hop: 2, ip: "192.168.1.1", name: "Core-Switch-01.local", rtt1: "0.8 ms", rtt2: "0.7 ms", rtt3: "0.9 ms" },
      { hop: 3, ip: host, name: `${host}.local`, rtt1: "1.2 ms", rtt2: "1.4 ms", rtt3: "1.1 ms" }
    ];
    return c.json({ target: host, hops });
  });
  router.get("/api/cameras", (c) => {
    const { store, isSql } = getStore(c);
    if (isSql) {
      const cameraNodes = store.ctx.storage.sql.exec(`SELECT * FROM nodes WHERE type IN ('camera', 'nvr')`).toArray();
      const channels = store.ctx.storage.sql.exec(`SELECT * FROM camera_channels`).toArray();
      return c.json({ cameraNodes, channels });
    } else {
      const cameraNodes = memStore.nodes.filter((n) => n.type === "camera" || n.type === "nvr");
      const channels = memStore.cameraChannels;
      return c.json({ cameraNodes, channels });
    }
  });
  router.get("/api/discovery", (c) => {
    const { store, isSql } = getStore(c);
    if (isSql) {
      const discovered = store.ctx.storage.sql.exec(`SELECT * FROM discovered_devices ORDER BY last_scanned DESC`).toArray();
      return c.json(discovered);
    } else {
      return c.json(memStore.discoveredDevices);
    }
  });
  router.post("/api/discovery/scan", async (c) => {
    const { store, isSql } = getStore(c);
    const { subnet } = await c.req.json();
    const now = Date.now();
    const parts = (subnet || "192.168.1.0/24").split(".")[0] ? (subnet || "192.168.1.0/24").split(".") : ["192", "168", "1", "0"];
    const newDevices = [
      { ip: `${parts[0]}.${parts[1]}.${parts[2]}.118`, mac: "52:54:00:12:34:56", vendor: "Intel Corp", hostname: "Win11-Workstation-18", detected_type: "pc", open_ports: "135,445,3389", status: "new", last_scanned: now },
      { ip: `${parts[0]}.${parts[1]}.${parts[2]}.188`, mac: "90:09:D0:FE:DC:BA", vendor: "Dahua Technology", hostname: "IPC-HFW2431S", detected_type: "camera", open_ports: "80,554", status: "new", last_scanned: now },
      { ip: `${parts[0]}.${parts[1]}.${parts[2]}.210`, mac: "00:08:9B:AA:11:22", vendor: "QNAP Systems", hostname: "QNAP-Backup-NAS", detected_type: "nvr", open_ports: "80,443,8080,445", status: "new", last_scanned: now }
    ];
    if (isSql) {
      for (const dev of newDevices) {
        store.ctx.storage.sql.exec(
          `INSERT OR REPLACE INTO discovered_devices (ip, mac, vendor, hostname, detected_type, open_ports, status, last_scanned)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          dev.ip,
          dev.mac,
          dev.vendor,
          dev.hostname,
          dev.detected_type,
          dev.open_ports,
          "new",
          now
        );
      }
    } else {
      for (const dev of newDevices) {
        const existingIdx = memStore.discoveredDevices.findIndex((d) => d.ip === dev.ip);
        if (existingIdx >= 0) {
          memStore.discoveredDevices[existingIdx] = dev;
        } else {
          memStore.discoveredDevices.unshift(dev);
        }
      }
    }
    return c.json({ ok: true, count: newDevices.length });
  });
  router.post("/api/discovery/import", async (c) => {
    const user = getUserFromReq(c);
    const { store, isSql } = getStore(c);
    const { ip } = await c.req.json();
    if (isSql) {
      const dev = store.ctx.storage.sql.exec(`SELECT * FROM discovered_devices WHERE ip = ?`, ip).one();
      if (dev) {
        const id = `node-imp-${Date.now()}`;
        store.ctx.storage.sql.exec(
          `INSERT INTO nodes (id, name, ip, type, status, vendor, model, location, rack, os_version, uptime_secs, cpu_usage, memory_usage, disk_usage, latency_ms, packet_loss, bandwidth_in_mbps, bandwidth_out_mbps, snmp_version, snmp_community, ports_open, last_seen)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          id,
          dev.hostname || dev.ip,
          dev.ip,
          dev.detected_type || "server",
          "online",
          dev.vendor || "Generic",
          "Auto Discovered",
          "Auto Discovered Zone",
          "Unassigned",
          "Unknown OS",
          3600,
          12,
          35,
          40,
          1.8,
          0,
          5,
          2,
          "v2c",
          "public",
          dev.open_ports,
          Date.now()
        );
        store.ctx.storage.sql.exec(`UPDATE discovered_devices SET status = 'added' WHERE ip = ?`, ip);
        store.ctx.storage.sql.exec(
          `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
          `aud-${Date.now()}`,
          user?.username || "admin",
          "Import Device",
          `Imported ${dev.ip} into inventory`,
          Date.now()
        );
      }
    } else {
      const dev = memStore.discoveredDevices.find((d) => d.ip === ip);
      if (dev) {
        dev.status = "added";
        memStore.nodes.push({
          id: `node-imp-${Date.now()}`,
          name: dev.hostname || dev.ip,
          ip: dev.ip,
          type: dev.detected_type || "server",
          status: "online",
          vendor: dev.vendor || "Generic",
          model: "Auto Discovered",
          location: "Auto Discovered Zone",
          rack: "Unassigned",
          os_version: "Unknown OS",
          uptime_secs: 3600,
          cpu_usage: 12,
          memory_usage: 35,
          disk_usage: 40,
          latency_ms: 1.8,
          packet_loss: 0,
          bandwidth_in_mbps: 5,
          bandwidth_out_mbps: 2,
          snmp_version: "v2c",
          snmp_community: "public",
          ports_open: dev.open_ports,
          last_seen: Date.now()
        });
        memStore.logAudit(user?.username || "admin", "Import Device", `Imported ${dev.ip} into inventory`);
      }
    }
    return c.json({ ok: true });
  });
  router.get("/api/alerts", (c) => {
    const { store, isSql } = getStore(c);
    if (isSql) {
      const alerts = store.ctx.storage.sql.exec(`SELECT * FROM alerts ORDER BY created_at DESC`).toArray();
      return c.json(alerts);
    } else {
      return c.json(memStore.alerts);
    }
  });
  router.post("/api/alerts/:id/ack", async (c) => {
    const user = getUserFromReq(c);
    const { store, isSql } = getStore(c);
    const id = c.req.param("id");
    const now = Date.now();
    if (isSql) {
      store.ctx.storage.sql.exec(`UPDATE alerts SET status = 'acknowledged', ack_at = ?, ack_by = ? WHERE id = ?`, now, user?.username || "Admin", id);
    } else {
      const alert = memStore.alerts.find((a) => a.id === id);
      if (alert) {
        alert.status = "acknowledged";
        alert.ack_at = now;
        alert.ack_by = user?.username || "Admin";
      }
    }
    return c.json({ ok: true });
  });
  router.post("/api/alerts/:id/resolve", (c) => {
    const { store, isSql } = getStore(c);
    const id = c.req.param("id");
    if (isSql) {
      store.ctx.storage.sql.exec(`UPDATE alerts SET status = 'resolved' WHERE id = ?`, id);
    } else {
      const alert = memStore.alerts.find((a) => a.id === id);
      if (alert)
        alert.status = "resolved";
    }
    return c.json({ ok: true });
  });
  router.get("/api/alert-rules", (c) => {
    const { store, isSql } = getStore(c);
    if (isSql) {
      const rules = store.ctx.storage.sql.exec(`SELECT * FROM alert_rules`).toArray();
      return c.json(rules);
    } else {
      return c.json(memStore.alertRules);
    }
  });
  router.post("/api/alert-rules", async (c) => {
    const { store, isSql } = getStore(c);
    const body = await c.req.json();
    const id = body.id || `rule-${Date.now()}`;
    if (isSql) {
      store.ctx.storage.sql.exec(
        `INSERT OR REPLACE INTO alert_rules (id, name, target_type, metric_name, condition, threshold, severity, enabled, webhook_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        body.name,
        body.target_type,
        body.metric_name,
        body.condition,
        body.threshold,
        body.severity,
        body.enabled ? 1 : 0,
        body.webhook_url || null
      );
    } else {
      const existingIdx = memStore.alertRules.findIndex((r) => r.id === id);
      const rule = { id, name: body.name, target_type: body.target_type, metric_name: body.metric_name, condition: body.condition, threshold: body.threshold, severity: body.severity, enabled: body.enabled ? 1 : 0, webhook_url: body.webhook_url || null };
      if (existingIdx >= 0)
        memStore.alertRules[existingIdx] = rule;
      else
        memStore.alertRules.push(rule);
    }
    return c.json({ ok: true, id });
  });
  router.get("/api/topology", (c) => {
    const { store, isSql } = getStore(c);
    let nodes = [];
    if (isSql) {
      nodes = store.ctx.storage.sql.exec(`SELECT id, name, ip, type, status, vendor, location FROM nodes`).toArray();
    } else {
      nodes = memStore.nodes.map((n) => ({ id: n.id, name: n.name, ip: n.ip, type: n.type, status: n.status, vendor: n.vendor, location: n.location }));
    }
    const links = [
      { source: "node-fw-01", target: "node-sw-01", label: "10G Fiber Trunk", status: "active" },
      { source: "node-sw-01", target: "node-srv-01", label: "10G LACP Bond", status: "active" },
      { source: "node-sw-01", target: "node-srv-02", label: "10G Fiber", status: "active" },
      { source: "node-sw-01", target: "node-nas-01", label: "10G iSCSI", status: "active" },
      { source: "node-sw-01", target: "node-sw-02", label: "10G Uplink", status: "active" },
      { source: "node-sw-01", target: "node-nvr-01", label: "1G Fiber", status: "active" },
      { source: "node-sw-01", target: "node-cam-01", label: "1G PoE Port 6", status: "active" },
      { source: "node-sw-01", target: "node-cam-02", label: "1G PoE Port 7", status: "active" },
      { source: "node-sw-01", target: "node-cam-03", label: "1G PoE Port 8", status: "degraded" },
      { source: "node-sw-02", target: "node-pc-01", label: "1G Cat6 Port 12", status: "active" },
      { source: "node-sw-02", target: "node-prn-01", label: "1G Cat6 Port 20", status: "active" }
    ];
    return c.json({ nodes, links });
  });
  router.get("/api/settings", (c) => {
    const { store, isSql } = getStore(c);
    if (isSql) {
      const st = store.ctx.storage.sql.exec(`SELECT * FROM settings LIMIT 1`).one();
      return c.json(st || { company_name: "Corporate HQ Network", auth_enabled: 1 });
    } else {
      return c.json(memStore.settings);
    }
  });
  router.post("/api/settings", async (c) => {
    const user = getUserFromReq(c);
    const { store, isSql } = getStore(c);
    const body = await c.req.json();
    if (isSql) {
      store.ctx.storage.sql.exec(
        `UPDATE settings SET company_name = ?, default_subnet = ?, polling_interval = ?, auth_enabled = ?, webhook_url = ?`,
        body.company_name,
        body.default_subnet,
        body.polling_interval,
        body.auth_enabled ? 1 : 0,
        body.webhook_url
      );
      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${Date.now()}`,
        user?.username || "admin",
        "Settings Updated",
        `Changed system branding & authentication rules`,
        Date.now()
      );
    } else {
      memStore.settings = { ...memStore.settings, ...body, auth_enabled: body.auth_enabled ? 1 : 0 };
      memStore.logAudit(user?.username || "admin", "Settings Updated", `Changed system branding & authentication rules`);
    }
    return c.json({ ok: true });
  });
  router.get("/api/audit-logs", (c) => {
    const { store, isSql } = getStore(c);
    if (isSql) {
      const logs = store.ctx.storage.sql.exec(`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100`).toArray();
      return c.json(logs);
    } else {
      return c.json(memStore.auditLogs.slice(0, 100));
    }
  });
  router.get("/api/system/export", (c) => {
    const { store, isSql } = getStore(c);
    if (isSql) {
      const nodes = store.ctx.storage.sql.exec(`SELECT * FROM nodes`).toArray();
      const switchPorts = store.ctx.storage.sql.exec(`SELECT * FROM switch_ports`).toArray();
      const cameraChannels = store.ctx.storage.sql.exec(`SELECT * FROM camera_channels`).toArray();
      const alerts = store.ctx.storage.sql.exec(`SELECT * FROM alerts`).toArray();
      const alertRules = store.ctx.storage.sql.exec(`SELECT * FROM alert_rules`).toArray();
      const settings = store.ctx.storage.sql.exec(`SELECT * FROM settings LIMIT 1`).one();
      return c.json({
        app: "NetPulse Enterprise",
        exported_at: Date.now(),
        data: { nodes, switchPorts, cameraChannels, alerts, alertRules, settings }
      });
    } else {
      return c.json({
        app: "NetPulse Enterprise",
        exported_at: Date.now(),
        data: {
          nodes: memStore.nodes,
          switchPorts: memStore.switchPorts,
          cameraChannels: memStore.cameraChannels,
          alerts: memStore.alerts,
          alertRules: memStore.alertRules,
          settings: memStore.settings
        }
      });
    }
  });
  router.post("/api/system/import", async (c) => {
    const user = getUserFromReq(c);
    const { store, isSql } = getStore(c);
    const body = await c.req.json();
    if (!body || !body.data || !Array.isArray(body.data.nodes)) {
      return c.json({ error: "Invalid backup JSON format" }, 400);
    }
    const backup = body.data;
    if (isSql) {
      store.ctx.storage.sql.exec(`DELETE FROM nodes`);
      store.ctx.storage.sql.exec(`DELETE FROM switch_ports`);
      store.ctx.storage.sql.exec(`DELETE FROM camera_channels`);
      store.ctx.storage.sql.exec(`DELETE FROM alerts`);
      store.ctx.storage.sql.exec(`DELETE FROM alert_rules`);
      for (const n of backup.nodes) {
        store.ctx.storage.sql.exec(
          `INSERT INTO nodes (id, name, ip, type, status, vendor, model, location, rack, os_version, uptime_secs, cpu_usage, memory_usage, disk_usage, latency_ms, packet_loss, bandwidth_in_mbps, bandwidth_out_mbps, snmp_version, snmp_community, rtsp_url, ports_open, last_seen)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          n.id,
          n.name,
          n.ip,
          n.type,
          n.status,
          n.vendor,
          n.model,
          n.location,
          n.rack,
          n.os_version,
          n.uptime_secs,
          n.cpu_usage,
          n.memory_usage,
          n.disk_usage,
          n.latency_ms,
          n.packet_loss,
          n.bandwidth_in_mbps,
          n.bandwidth_out_mbps,
          n.snmp_version,
          n.snmp_community,
          n.rtsp_url,
          n.ports_open,
          n.last_seen || Date.now()
        );
      }
      if (Array.isArray(backup.switchPorts)) {
        for (const p of backup.switchPorts) {
          store.ctx.storage.sql.exec(
            `INSERT INTO switch_ports (id, node_id, port_number, port_name, status, speed_mbps, vlan, poe_watts, poe_status, rx_kbps, tx_kbps, errors, connected_device_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            p.id,
            p.node_id,
            p.port_number,
            p.port_name,
            p.status,
            p.speed_mbps,
            p.vlan,
            p.poe_watts,
            p.poe_status,
            p.rx_kbps,
            p.tx_kbps,
            p.errors,
            p.connected_device_id
          );
        }
      }
      store.ctx.storage.sql.exec(
        `INSERT INTO audit_logs (id, user, action, details, timestamp) VALUES (?, ?, ?, ?, ?)`,
        `aud-${Date.now()}`,
        user?.username || "admin",
        "System Restore",
        `Restored network inventory from backup file`,
        Date.now()
      );
    } else {
      memStore.nodes = backup.nodes;
      if (Array.isArray(backup.switchPorts))
        memStore.switchPorts = backup.switchPorts;
      if (Array.isArray(backup.cameraChannels))
        memStore.cameraChannels = backup.cameraChannels;
      if (Array.isArray(backup.alerts))
        memStore.alerts = backup.alerts;
      if (Array.isArray(backup.alertRules))
        memStore.alertRules = backup.alertRules;
      memStore.logAudit(user?.username || "admin", "System Restore", `Restored network inventory from backup file`);
    }
    return c.json({ ok: true, nodeCount: backup.nodes.length });
  });
  return router;
}
__name(buildApiRouter, "buildApiRouter");
var App = class extends DurableObject {
  app;
  initialized = false;
  constructor(ctx, env2) {
    super(ctx, env2);
    this.app = buildApiRouter(() => {
      this.initDatabase();
      return { store: this, isSql: true };
    });
  }
  initDatabase() {
    if (this.initialized)
      return;
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'viewer',
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        company_name TEXT PRIMARY KEY,
        default_subnet TEXT DEFAULT '192.168.1.0/24',
        polling_interval INTEGER DEFAULT 2500,
        auth_enabled INTEGER DEFAULT 1,
        webhook_url TEXT
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS nodes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        ip TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        vendor TEXT,
        model TEXT,
        location TEXT,
        rack TEXT,
        os_version TEXT,
        uptime_secs INTEGER DEFAULT 86400,
        cpu_usage REAL DEFAULT 0,
        memory_usage REAL DEFAULT 0,
        disk_usage REAL DEFAULT 0,
        latency_ms REAL DEFAULT 1,
        packet_loss REAL DEFAULT 0,
        bandwidth_in_mbps REAL DEFAULT 0,
        bandwidth_out_mbps REAL DEFAULT 0,
        snmp_version TEXT DEFAULT 'v2c',
        snmp_community TEXT DEFAULT 'public',
        rtsp_url TEXT,
        ports_open TEXT,
        last_seen INTEGER
      );

      CREATE TABLE IF NOT EXISTS switch_ports (
        id TEXT PRIMARY KEY,
        node_id TEXT NOT NULL,
        port_number INTEGER NOT NULL,
        port_name TEXT NOT NULL,
        status TEXT NOT NULL,
        speed_mbps INTEGER DEFAULT 1000,
        vlan INTEGER DEFAULT 1,
        poe_watts REAL DEFAULT 0,
        poe_status TEXT DEFAULT 'off',
        rx_kbps REAL DEFAULT 0,
        tx_kbps REAL DEFAULT 0,
        errors INTEGER DEFAULT 0,
        connected_device_id TEXT
      );

      CREATE TABLE IF NOT EXISTS camera_channels (
        id TEXT PRIMARY KEY,
        node_id TEXT NOT NULL,
        channel INTEGER NOT NULL,
        name TEXT NOT NULL,
        resolution TEXT DEFAULT '1080p',
        fps INTEGER DEFAULT 30,
        bitrate_kbps INTEGER DEFAULT 4096,
        motion_detected INTEGER DEFAULT 0,
        status TEXT DEFAULT 'online',
        codec TEXT DEFAULT 'H.265'
      );

      CREATE TABLE IF NOT EXISTS metric_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        node_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        cpu REAL,
        memory REAL,
        disk REAL,
        latency REAL,
        rx_mbps REAL,
        tx_mbps REAL
      );

      CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        node_id TEXT NOT NULL,
        node_name TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        ack_at INTEGER,
        ack_by TEXT
      );

      CREATE TABLE IF NOT EXISTS alert_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        target_type TEXT NOT NULL,
        metric_name TEXT NOT NULL,
        condition TEXT NOT NULL,
        threshold REAL NOT NULL,
        severity TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        webhook_url TEXT
      );

      CREATE TABLE IF NOT EXISTS discovered_devices (
        ip TEXT PRIMARY KEY,
        mac TEXT,
        vendor TEXT,
        hostname TEXT,
        detected_type TEXT,
        open_ports TEXT,
        status TEXT DEFAULT 'new',
        last_scanned INTEGER
      );
    `);
    const userCount = this.ctx.storage.sql.exec(`SELECT COUNT(*) as c FROM users`).one()?.c;
    if (userCount === 0) {
      this.ctx.storage.sql.exec(
        `INSERT INTO users (id, username, password, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        DEFAULT_ADMIN.id,
        DEFAULT_ADMIN.username,
        DEFAULT_ADMIN.password,
        DEFAULT_ADMIN.name,
        DEFAULT_ADMIN.role,
        DEFAULT_ADMIN.created_at
      );
      this.ctx.storage.sql.exec(
        `INSERT INTO settings (company_name, default_subnet, polling_interval, auth_enabled, webhook_url) VALUES (?, ?, ?, ?, ?)`,
        "Corporate HQ Network",
        "192.168.1.0/24",
        2500,
        1,
        "https://hooks.slack.com/services/demo"
      );
    }
    const nodeCount = this.ctx.storage.sql.exec(`SELECT COUNT(*) as c FROM nodes`).one()?.c;
    if (nodeCount === 0) {
      const seed = buildSeedData();
      for (const n of seed.nodes) {
        this.ctx.storage.sql.exec(
          `INSERT INTO nodes (id, name, ip, type, status, vendor, model, location, rack, os_version, uptime_secs, cpu_usage, memory_usage, disk_usage, latency_ms, packet_loss, bandwidth_in_mbps, bandwidth_out_mbps, snmp_version, snmp_community, rtsp_url, ports_open, last_seen)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          n.id,
          n.name,
          n.ip,
          n.type,
          n.status,
          n.vendor,
          n.model,
          n.location,
          n.rack,
          n.os_version,
          n.uptime_secs,
          n.cpu_usage,
          n.memory_usage,
          n.disk_usage,
          n.latency_ms,
          n.packet_loss,
          n.bandwidth_in_mbps,
          n.bandwidth_out_mbps,
          n.snmp_version,
          n.snmp_community,
          n.rtsp_url || null,
          n.ports_open,
          n.last_seen
        );
      }
      for (const p of seed.switchPorts) {
        this.ctx.storage.sql.exec(
          `INSERT INTO switch_ports (id, node_id, port_number, port_name, status, speed_mbps, vlan, poe_watts, poe_status, rx_kbps, tx_kbps, errors, connected_device_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          p.id,
          p.node_id,
          p.port_number,
          p.port_name,
          p.status,
          p.speed_mbps,
          p.vlan,
          p.poe_watts,
          p.poe_status,
          p.rx_kbps,
          p.tx_kbps,
          p.errors,
          p.connected_device_id
        );
      }
      for (const c of seed.cameraChannels) {
        this.ctx.storage.sql.exec(
          `INSERT INTO camera_channels (id, node_id, channel, name, resolution, fps, bitrate_kbps, motion_detected, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          c.id,
          c.node_id,
          c.channel,
          c.name,
          c.resolution,
          c.fps,
          c.bitrate_kbps,
          c.motion_detected,
          c.status
        );
      }
      for (const r of seed.alertRules) {
        this.ctx.storage.sql.exec(
          `INSERT INTO alert_rules (id, name, target_type, metric_name, condition, threshold, severity, enabled)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          r.id,
          r.name,
          r.target_type,
          r.metric_name,
          r.condition,
          r.threshold,
          r.severity,
          r.enabled
        );
      }
      for (const a of seed.alerts) {
        this.ctx.storage.sql.exec(
          `INSERT INTO alerts (id, node_id, node_name, severity, title, message, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          a.id,
          a.node_id,
          a.node_name,
          a.severity,
          a.title,
          a.message,
          a.status,
          a.created_at
        );
      }
      for (const d of seed.discoveredDevices) {
        this.ctx.storage.sql.exec(
          `INSERT INTO discovered_devices (ip, mac, vendor, hostname, detected_type, open_ports, status, last_scanned)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          d.ip,
          d.mac,
          d.vendor,
          d.hostname,
          d.detected_type,
          d.open_ports,
          d.status,
          d.last_scanned
        );
      }
    }
    this.initialized = true;
  }
  stepSimulation() {
    this.initDatabase();
    const now = Date.now();
    const nodes = this.ctx.storage.sql.exec(`SELECT * FROM nodes`).toArray();
    for (const n of nodes) {
      if (n.status === "offline")
        continue;
      const cpuDelta = (Math.random() - 0.48) * 4;
      let newCpu = Math.min(99.5, Math.max(1.5, n.cpu_usage + cpuDelta));
      const memDelta = (Math.random() - 0.49) * 2;
      let newMem = Math.min(98, Math.max(5, n.memory_usage + memDelta));
      const latDelta = (Math.random() - 0.5) * 0.5;
      let newLat = Math.max(0.2, n.latency_ms + latDelta);
      const newUptime = n.uptime_secs + 2;
      let newStatus = n.status;
      if (newCpu > 92 || newMem > 92 || n.packet_loss > 3) {
        newStatus = "critical";
      } else if (newCpu > 80 || newMem > 85 || n.packet_loss > 1) {
        newStatus = "warning";
      } else {
        newStatus = "online";
      }
      this.ctx.storage.sql.exec(
        `UPDATE nodes SET cpu_usage = ?, memory_usage = ?, latency_ms = ?, status = ?, uptime_secs = ?, last_seen = ? WHERE id = ?`,
        newCpu,
        newMem,
        newLat,
        newStatus,
        newUptime,
        now,
        n.id
      );
      this.ctx.storage.sql.exec(
        `INSERT INTO metric_history (node_id, timestamp, cpu, memory, disk, latency, rx_mbps, tx_mbps)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        n.id,
        now,
        newCpu,
        newMem,
        n.disk_usage,
        newLat,
        n.bandwidth_in_mbps,
        n.bandwidth_out_mbps
      );
    }
  }
  async fetch(request) {
    const upgrade = request.headers.get("Upgrade");
    if (upgrade === "websocket") {
      const { 0: client, 1: server } = new WebSocketPair();
      this.ctx.acceptWebSocket(server);
      return new Response(null, { status: 101, webSocket: client });
    }
    return this.app.fetch(request);
  }
  webSocketMessage(ws, message) {
    this.stepSimulation();
    const nodes = this.ctx.storage.sql.exec(`SELECT * FROM nodes`).toArray();
    ws.send(JSON.stringify({ type: "TELEMETRY_TICK", timestamp: Date.now(), nodes }));
  }
  webSocketClose(_ws, _code, _reason, _wasClean) {
  }
};
__name(App, "App");
var fallbackApp = buildApiRouter(() => ({ store: memStore, isSql: false }));
var src_default = {
  async fetch(request, env2, ctx) {
    const url = new URL(request.url);
    if (url.pathname.includes("/api/") || request.headers.get("Upgrade") === "websocket") {
      if (env2 && env2.NETPULSE_DO) {
        try {
          const id = env2.NETPULSE_DO.idFromName("global");
          const stub = env2.NETPULSE_DO.get(id);
          return await stub.fetch(request);
        } catch (e) {
          console.error("Durable Object invocation error, using worker fallback API:", e);
        }
      }
      return fallbackApp.fetch(request, env2, ctx);
    }
    if (env2 && env2.ASSETS) {
      return env2.ASSETS.fetch(request);
    }
    return new Response("Not found", { status: 404 });
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-3RQpvK/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-3RQpvK/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  App,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
