![ublitzjs](https://github.com/ublitzjs/core/blob/main/logo.png)

# @ublitzjs/router package

This package removes your headache when sorting the routes, helps with validation and "asynchronous" quirks of uWS

# Contents

- classes Router and ExtendedRouter, created in openapi-like manner;
- classes LightController and HeavyController for making structured controllers, including their validation and error-handling;
- jsonSchemas function, which, isn't as fast as manually written validation schemas along with parsing body, but it lets you write a json parser for LightController and HeavyController in 30 seconds, instead of several minutes.

# Router and ExtendedRouter

## Router

All the difference is that Router can have only controllers, meanwhile in ExtendedRouter you can pass additional data.

```typescript
import { Router } from "@ublitzjs/router";
import { App } from "uWebSockets.js";
import { DeclarativeResponse } from "@ublitzjs/core";
var server = App();
var router = new Router({
  //in this current object you create routes
  "/": {}, //you can even leave it like so
  "/:id": {
    // in this object you can create methods as simple uWS handler
    get(res, req) {
      res.end("hello, " + req.getParameter(0));
    },
    post: new DeclarativeResponse().end("hello"),
    // also websockets
    ws: {
      open(ws) {
        ws.send("hello");
      },
    },
    any(res, req) {
      res.end("hello");
    },
    // and HeavyController or LightController, but about it below
  },
});
```

after defining router you should use some methods of it (which can be chained one by one)

```typescript
//1.1) with this you tell uBlitz to register routes on such server
router.bind(server);
//1.2) by this you tell to register get and websockets, but NOT post request. This is heavily typed in typescript, so don't worry about misspelling your routes
router.define(/*route*/ "/:id", /*...methods*/ "get", "ws");
//1.3) you can add prefixes. if you use .define after it - route will be prefixed. If you use .prefix again -
router.prefix("/api");
//if you use prefix again - it overwrites previous.
router.prefix(undefined); // no prefix
```

And also these methods are THE SAME in ExtendedRouter

## ExtendedRouter

### standard usage

without any extensions it is pointless

```typescript
import { ExtendedRouter } from "@ublitzjs/router";
var router = new ExtendedRouter({
  "/": {
    get: {
      controller(res, req) {
        res.end("hello, " + req.getParameter(0));
      },
    },
    post: {
      controller: new DeclarativeResponse().end("hello"),
    },
    // also websockets
    ws: {
      controller: {
        open(ws) {
          ws.send("hello");
        },
      },
    },
    any: {
      controller(res, req) {
        res.end("hello");
      },
    },
    // and HeavyController or LightController, but about it below
  },
});
```

### with @ublitzjs/openapi as example

```typescript
import { ExtendedRouter, type extPaths } from "@ublitzjs/router";
import {
  RouterPlugin,
  type methodAddOns,
  type routeAddOns,
} from "@ublitzjs/openapi";
var router = new ExtendedRouter(
  {
    "/:id": {
      openapi: {
        summary: "route summary",
      },
      get: {
        // as second property
        openapi: {
          summary: "method summary",
        },
        controller(res, req) {
          res.end("hello, " + req.getParameter(0));
        },
      },
      post: {
        controller: new DeclarativeResponse().end("hello"),
      },
      ws: {
        controller: {
          open(ws) {
            ws.send("hello");
          },
        },
      },
    },
  } satisfies extPaths<methodAddOns, routeAddOns>, // this is needed
  [RouterPlugin] // plugin to use openapi
);
```

# LightController, HeavyController, jsonSchemas - <a href="./examples/Controllers.ts">here</a>
