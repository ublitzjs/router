import { Type } from "@sinclair/typebox";
import { checkContentLength, toAB } from "@ublitzjs/core";
import { basicParseSimpleBody } from "@ublitzjs/payload";
import { LightController, Router, HeavyController } from "@ublitzjs/router";
import { jsonSchemas } from "@ublitzjs/router/json-schemas";
var router = new Router({
  "/": {
    // takes an object
    get: new LightController({
      // first - schemas. in LightController - only meta (headers, query, parameters). In heavy one you also deal with "body" schema
      schemas: {
        //go straight to ajv with "coerceTypes: true". For now - it is only @sinclair/typebox, but soon simple schemas will also be allowed
        meta: Type.Object({
          hello: Type.Integer(),
        }),
      },
      // Second - getMeta. What you return from it will be validated with schemas.meta
      // Even though ajv changes types of data, it is heavily typed with typescript.
      // Your IDE or text editor with plugins won't let you leave it different from schema
      // This function can be ONLY synchronous.
      getMeta(res, req) {
        return {
          hello: Number(
            // here is used shared property for speed optimization
            req.getQuery(
              (this as any).shared.message /*a little typescript quirk*/
            )
          ),
        };
      },
      // then (in LightContorller ONLY) you have handler, where third param looks like schemas but with actual data
      // Also handler SHOULD NOT RETURN a promise (return new Promise()), unless marked as "async"
      // If marked as "async" - you cannot use "req" object (just like in native uWS).
      handler(res, req, data) {
        console.log(data.meta.hello);
        res.end(this.shared!.message);
      },
      // shared properties. Very useful for non-global scope
      shared: {
        message: toAB("hello"),
      },
      // catches errors in handlers and after validation
      onError(error, res, data) {
        if (!res.aborted && !res.finished) res.close();
        console.log("ERROR", error, "DATA", data.meta);
      },
    }),
    post: new HeavyController({
      schemas: {
        meta: Type.Object({ "content-length": Type.Integer() }),
        body: Type.Object({
          id: Type.Integer(),
        }),
      },
      getMeta(res, req) {
        return {
          "content-length": checkContentLength(res, req),
        };
      },
      //in heavy controller you parse body AFTER getMeta.
      // if asynchronous - you cannot use request object
      // (also you SHOULD NOT return a promise, unless function is marked as "async")
      async parseBody(res, req, meta): Promise<any /*needed*/> {
        // return everything for validation
        return await basicParseSimpleBody({
          CT: "application/json",
          res,
          limit: meta["content-length"],
        });
      },
      // handler comes after getMeta and parseBody.
      // if validation failed in any of the functions - error goes to onError, if specified, and disappears in void, if not
      handler(res, req, data) {
        if (res.aborted) return;
        console.log("DATA", data.meta, data.body);
      },
    }),
  },
  "/dont-care": {
    // if you don't care about the performace - use jsonSchemas ( Fastify-like way )
    // all it does - creates getMeta and parseBody, but they use string instead of ArrayBuffers (slower)
    post: new HeavyController({
      ...jsonSchemas({
        headers: Type.Object({}),
        params: Type.Object({}),
        query: Type.Object({}),
        body: Type.Object({}),
      }),
      handler(res, req, data) {
        res.end("OK");
      },
    }),
  },
});
