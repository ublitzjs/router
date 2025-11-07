var {
  registerAbort,
  seeOtherMethods,
  badRequest,
} = require("@ublitzjs/core");
var { Ajv } = require("ajv");
var ajv = new Ajv({ strict: true });
function bindValidate(res, validators, data) {
  return (field) => {
    if (validators[field](data[field])) return;
    if (!res.aborted && !res.finished)
      badRequest(
        res,
        JSON.stringify(validators[field].errors[0]),
        "bad " + field
      );
    throw new Error("bad field " + field);
  };
}
function checkDuplicates(methods) {
  if (new Set(methods).size !== methods.length)
    throw new Error("Http methods duplicate registered", { cause: { path } });
}
/* @__PURE__ */
function dynamicallyCreateNewHandler(server, route) {
  var isAsync = (fn) => fn[Symbol.toStringTag] === "AsyncFunction",
    isRouteHeavy = route instanceof HeavyController,
    errorHandler = route.onError || server._errHandler,
    isParseBodyAsync = isRouteHeavy && isAsync(route.parseBody),
    isErrorHandlerAsync = isAsync(errorHandler || 0),
    isFinalHandlerAsync =
      isAsync(route.handler) || isParseBodyAsync ? "async" : "",
    catchBlock = errorHandler
      ? `catch(error){${
          isErrorHandlerAsync ? "await " : ""
        }onErr(error,res,data);}`
      : "catch{};",
    validators = `var vals={meta:ajv.compile(route.schemas.meta),${
      isRouteHeavy ? "body:ajv.compile(route.schemas.body)," : ""
    }};`,
    bodyValidation = isRouteHeavy
      ? `data.body=${
          isParseBodyAsync ? "await" : ""
        } route.parseBody(res,req,data.meta);val("body");`
      : "",
    metaValidation = "data.meta=route.getMeta(res, req);val('meta');",
    userHandler =
      (isAsync(route.handler) ? "await " : "") + "route.handler(res,req,data);",
    vars = "regAb(res);var data={},val=bindVal(res,vals,data);";
  return new Function(
    "regAb",
    "onErr",
    "ajv",
    "route",
    "bindVal",
    `${validators}return ${isFinalHandlerAsync}(res,req)=>{${vars}try{${metaValidation}${bodyValidation}${userHandler}}${catchBlock}}`
  )(registerAbort, errorHandler, ajv, route, bindValidate);
}

var specMethods = new Set(["any", "ws"]);
var changeAjv = (jv) => (ajv = jv);
class AbstractRouter {
  constructor(paths) {
    this.paths = paths;
  }
  bind(server) {
    return (this.server = server), this;
  }
  prefix(str) {
    return (this._pre = str), this;
  }
  // grants easy access from anywhere
  get prefixedPath() {
    return (this._pre || "") + this._currentPath;
  }
  registerAnyMethod(route, methods) {
    var controller = route.any;
    if (controller instanceof LightController)
      throw new Error("No Route classes for 'any' routes");
    if (!controller) controller = seeOtherMethods(methods);
    this.server.any(this.prefixedPath, controller);
  }
  // all apart from "any" method
  registerMostMethods(route, methods) {
    for (const method of methods) {
      // Need special checks
      if (specMethods.has(method)) continue;
      var usrHandler = route[method];
      if (usrHandler.controller) usrHandler = usrHandler.controller;
      this.server[method](
        this.prefixedPath,
        usrHandler instanceof LightController
          ? dynamicallyCreateNewHandler(this.server, usrHandler)
          : // functional controller
            usrHandler
      );
    }
  }
  define(path, ...methods) {
    checkDuplicates(methods);
    var route = this.paths[path];
    this._currentPath = path;
    this.registerMostMethods(route, methods);
    if (methods.includes("ws")) this.server.ws(this.prefixedPath, route.ws);
    this.registerAnyMethod(route, methods);
    return this;
  }
}
class Router extends AbstractRouter {}
class ExtendedRouter extends Router {
  constructor(paths, cbs) {
    super(paths);
    this.defineCBs = cbs;
  }
  /**
   * @override
   */
  define(path, ...methods) {
    super.define(...arguments);
    if (this.defineCBs)
      for (const cb of this.defineCBs) cb.apply(this, [methods]);
    return this;
  }
}
class LightController {
  constructor(opts) {
    Object.assign(this, opts);
  }
}
class HeavyController extends LightController {
  constructor(opts) {
    super(opts);
    this.getMeta = opts.getMeta;
    this.parseBody = opts.parseBody;
  }
}
export { HeavyController, LightController, Router, ExtendedRouter, changeAjv };
