import type { IncomingMessage, ServerResponse } from "node:http";
import app from "../server/src/app";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.url) {
    const url = new URL(req.url, "http://localhost");
    const pathParam = url.searchParams.get("path");

    if (url.pathname === "/api/[...path]" && pathParam) {
      const normalizedPath = pathParam.startsWith("/") ? pathParam : `/${pathParam}`;
      url.pathname = normalizedPath;
      url.searchParams.delete("path");
      req.url = `${url.pathname}${url.search}`;
    } else {
      const rewrittenUrl = req.url.replace(/^\/api(?=\/|$)/, "") || "/";
      req.url = rewrittenUrl.startsWith("/") ? rewrittenUrl : `/${rewrittenUrl}`;
    }
  }

  return app(req, res);
}
