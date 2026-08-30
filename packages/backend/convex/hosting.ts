import { components } from "@repo/backend/convex/_generated/api";
import {
  type ActionCtx,
  httpAction,
} from "@repo/backend/convex/_generated/server";
import type { HttpRouter } from "convex/server";

const pageRoutes = [
  { asset: "/en/index.html", path: "/en/" },
  { asset: "/en/profile/index.html", path: "/en/profile/" },
  { asset: "/en/applications/index.html", path: "/en/applications/" },
  { asset: "/id/index.html", path: "/id/" },
  { asset: "/id/profile/index.html", path: "/id/profile/" },
  { asset: "/id/applications/index.html", path: "/id/applications/" },
] as const;

/** Streams one generated Next.js page from component-owned storage. */
async function pageResponse(ctx: ActionCtx, assetPath: string) {
  const asset = await ctx.runQuery(
    components.staticHosting.lib.resolveAssetForHttp,
    {
      path: assetPath,
      spaFallback: false,
    }
  );
  if (!asset?.storageUrl) {
    return new Response("Not Found", {
      headers: { "Content-Type": "text/plain" },
      status: 404,
    });
  }

  const storageResponse = await fetch(asset.storageUrl);
  if (!(storageResponse.ok && storageResponse.body)) {
    return new Response("Storage error", {
      headers: { "Content-Type": "text/plain" },
      status: 500,
    });
  }

  return new Response(storageResponse.body, {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Type": "text/html; charset=utf-8",
      ...(asset.etag ? { ETag: asset.etag } : {}),
      "X-Content-Type-Options": "nosniff",
    },
    status: 200,
  });
}

/** Creates one exact page handler for a generated route asset. */
function pageHandler(assetPath: string) {
  return httpAction((ctx) => pageResponse(ctx, assetPath));
}

/** Creates a permanent canonical redirect without exposing index.html. */
function redirectHandler(canonicalPath: string) {
  return httpAction((_ctx, request) => {
    const destination = new URL(canonicalPath, request.url);
    return Promise.resolve(Response.redirect(destination, 308));
  });
}

/** Registers clean Next.js page URLs before the static asset catch-all. */
export function registerPageRoutes(http: HttpRouter) {
  http.route({
    handler: redirectHandler("/"),
    method: "GET",
    path: "/index.html",
  });

  for (const route of pageRoutes) {
    http.route({
      handler: pageHandler(route.asset),
      method: "GET",
      path: route.path,
    });
    http.route({
      handler: redirectHandler(route.path),
      method: "GET",
      path: route.path.slice(0, -1),
    });
    http.route({
      handler: redirectHandler(route.path),
      method: "GET",
      path: route.asset,
    });
  }
}
