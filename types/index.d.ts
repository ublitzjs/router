import type {
  HttpControllerFn,
  HttpMethods,
  Server,
  DeclarativeResType,
  DocumentedWSBehavior,
} from "@ublitzjs/core";
import type { HeavyController, LightController } from "./controllers";
import type Ajv from "ajv";
declare abstract class AbstractRouter<
  Paths extends RouterPaths | extPaths<{}, {}>
> {
  protected _pre?: string;
  public _currentPath: string;
  protected paths: Paths;
  protected server?: Server | undefined;
  /**
   * When you use definePlugin - you get the server instance, which you "bind" to your router
   */
  public bind(server: Server): this;
  /**
   * prefixes all routes, which are defined after it. Can be used several times
   * @example
   * router
   *   .bind(server)
   *   .prefix("/api")
   *   .define("/users","get") // it is /api/users
   *   .prefix("/register") //several times
   *   .define("/refresh","post") // it is /register/refresh
   */
  public prefix(str: string | undefined): this;
  protected get prefixedPath(): string;
  protected registerMostMethods(route: Paths[string], methods: string[]): void;
  protected registerAnyMethod(route: Paths[string], methods: string[]): void;
  constructor(opts: Paths);
  /**
   * This function gives uWS your controllers. If you don't call this function - controller won't work
   * @example
   * router.bind(server).define(PATH, ...registeredMethods)
   */
  public define<Path extends keyof Paths>(
    path: Path,
    ...methods: (keyof Paths[Path])[]
  ): this;
}
/**
 * This class lets you register endpoints like in openapi. Look into examples.
 */
export class Router<Paths extends RouterPaths> extends AbstractRouter<Paths> {}
/**
 * this is the interface of function, you pass in ExtendedRouter as a plugin. It is called on each "define" call, so when using "this" keyword you are refering to ExtendedRouter on defining route stage
 */
type defineCB = (this: ExtendedRouter<any>, methods: any[]) => any;
/**
 * Same as Router, but "extended". You can combine it with @ublitzjs/openapi or write own plugins extensions for this. But extensions !== middlewares. They are mainly needed in development and used once while registrating routes.
 */
export class ExtendedRouter<
  Paths extends extPaths<{}, {}>
> extends AbstractRouter<Paths> {
  private defineCBs: defineCB[];
  constructor(opts: Paths, cbs?: defineCB[]);
  public override define<Path extends keyof Paths>(
    path: Path,
    ...methods: (keyof Paths[Path])[]
  ): this;
}

type RouterPath = Partial<{
  /*method*/ [Method in HttpMethods]: Method extends "ws"
    ? DocumentedWSBehavior<any>
    :
        | HeavyController<any, any>
        | LightController<any, any>
        | HttpControllerFn
        | DeclarativeResType;
}>;
type RouterPaths = Record</*route*/ string, RouterPath>;
export type extendedHttpRouteI<ra, ma> = {
  /*method*/ [Method in HttpMethods]: {
    controller: Method extends "ws"
      ? DocumentedWSBehavior<any>
      :
          | HeavyController<any, any>
          | LightController<any, any>
          | HttpControllerFn
          | DeclarativeResType;
    [k: string]: any;
  } & ma;
} & ra;
/**
 * this interface is used to extend ExtendedRouter (just doesn't work on class parameters alone), but be aware of wrong types in 'define' function when you use routeAddOns.
 * @example
 * var router = new ExtendedRouter({
 *   "/": {
 *     openapi: {
 *       summary: "hello",
 *     },
 *     get: {
 *       openapi: {
 *         summary: "main page",
 *       },
 *       controller: new DeclarativeResponse().end("hi"),
 *     },
 *   },
 * } satisfies extPaths<methodAddOns, routeAddOns>);
 * router
 *  .bind(server)
 *  .define(
 *    "/",
 *    "get" //"openapi" will also appear in vscode tips but actually using this WILL THROW AN ERROR
 *   );
 */
export type extPaths<methodAddOns, routeAddOns> = Record<
  /*route*/ string,
  Partial<extendedHttpRouteI<routeAddOns, methodAddOns>>
>;
export function changeAjv(jv: Ajv): unknown;
export * from "./controllers";
