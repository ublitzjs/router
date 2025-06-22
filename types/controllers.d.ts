import type { Static, TSchema } from "@sinclair/typebox";
import type { HttpRequest, HttpResponse } from "@ublitzjs/core";
type Schemas<Keys extends string = string> = Record<Keys, TSchema>;
/**
 * data, which looks like (HeavyRoute | LightRoute).schemas, but is already validated. Is passed to onError and handler
 */
type RequestData<T extends Schemas> = {
  [type in keyof T]: Static<T[type]>;
};
interface heavyControllerI<T extends Schemas<"meta" | "body">, Shared>
  extends lightControllerI<T, Shared> {
  parseBody: (
    res: HttpResponse,
    req: HttpRequest,
    meta: Static<T["meta"]>
  ) => Static<T["body"]> | Promise<Static<T["body"]>>;
}
interface lightControllerI<T extends Schemas<"meta">, Shared> {
  getMeta: (res: HttpResponse, req: HttpRequest) => Static<T["meta"]>;
  shared?: Shared;
  schemas: T;
  onError?: (error: Error, res: HttpResponse, data: RequestData<T>) => any;
  handler: (
    res: HttpResponse,
    req: HttpRequest,
    data: RequestData<T>
  ) => any | Promise<any>;
}
export class LightController<T extends Schemas<"meta">, Shared>
  implements lightControllerI<T, Shared>
{
  /**
   * function which prepares the request data for the validation (headers, parameters, querystring).
   * @returns data, which will be validated with this.schemas.meta
   */
  getMeta: (res: HttpResponse, req: HttpRequest) => Static<T["meta"]>;
  /**
   * schemas, which will validate the staff you return from heavyRoute.getMeta & heavyRoute.parseBody
   */
  schemas: T;
  /**
   * @param error - what happened
   * @param res - you can close the connection after error, but only if it wasn't aborted before
   * @param data - the data, you returned from preparator as additional request info
   * @returns
   */
  onError?: (error: Error, res: HttpResponse, data: RequestData<T>) => any;
  /**
   * here you may or may not compile strings to arrayBuffers, save headersMap, do WHATEVER you want and use that with this.shared! expression
   */
  shared?: Shared;
  /**
   * @param data same as described in this.schemas, but validated
   */
  handler: (
    res: HttpResponse,
    req: HttpRequest,
    data: RequestData<T>
  ) => any | Promise<any>;
  constructor(opts: lightControllerI<T, Shared>);
}
/**
 * Class controller for handling requests with body.
 * Lifecycle:
 * 1) registerAbort(res)
 * 2) getMeta
 * 3) validate meta (if bad - throws an error + 404 code)
 * 4) await parseBody
 * 5) validate body (if bad - throws an error + 404 code)
 * 6) handler
 * @throws errors into : 1) this.onError OR 2) global app.onError OR 3) empty catch block
 */
export class HeavyController<T extends Schemas<"meta" | "body">, Shared>
  extends LightController<T, Shared>
  implements heavyControllerI<T, Shared>
{
  /**
   * @param meta data, returned from this.getMeta
   * @returns body, which will be validated with this.schemas.body
   */
  parseBody: (
    res: HttpResponse,
    req: HttpRequest,
    meta: Static<T["meta"]>
  ) => Static<T["body"]> | Promise<Static<T["body"]>>;
  constructor(opts: heavyControllerI<T, Shared>);
}
