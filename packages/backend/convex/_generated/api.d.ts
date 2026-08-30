/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as applications from "../applications.js";
import type * as auth from "../auth.js";
import type * as cv from "../cv.js";
import type * as hosting from "../hosting.js";
import type * as http from "../http.js";
import type * as legacy from "../legacy.js";
import type * as lib_discover from "../lib/discover.js";
import type * as lib_guard from "../lib/guard.js";
import type * as lib_searchwork from "../lib/searchwork.js";
import type * as mail from "../mail.js";
import type * as model from "../model.js";
import type * as opportunities from "../opportunities.js";
import type * as profiles from "../profiles.js";
import type * as searches from "../searches.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  applications: typeof applications;
  auth: typeof auth;
  cv: typeof cv;
  hosting: typeof hosting;
  http: typeof http;
  legacy: typeof legacy;
  "lib/discover": typeof lib_discover;
  "lib/guard": typeof lib_guard;
  "lib/searchwork": typeof lib_searchwork;
  mail: typeof mail;
  model: typeof model;
  opportunities: typeof opportunities;
  profiles: typeof profiles;
  searches: typeof searches;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
  auth: import("@convex-dev/auth/core/_generated/component.js").ComponentApi<"auth">;
  agentmail: import("@agentmail/convex/_generated/component.js").ComponentApi<"agentmail">;
  authPasswordProvider: import("@convex-dev/auth/providers/password/_generated/component.js").ComponentApi<"authPasswordProvider">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  firecrawl: import("@firecrawl/firecrawl-convex/_generated/component.js").ComponentApi<"firecrawl">;
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
  authUsername: import("@convex-dev/auth/username/_generated/component.js").ComponentApi<"authUsername">;
  searchWorkpool: import("@convex-dev/workpool/_generated/component.js").ComponentApi<"searchWorkpool">;
};
