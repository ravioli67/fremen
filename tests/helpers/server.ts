import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

export type Route = string | { redirectTo: string };

export interface TestServer {
  url: string;
  close: () => Promise<void>;
}

/** Start a local HTTP server on a random port serving the given routes (path -> HTML or redirect). */
export async function startServer(routes: Record<string, Route>): Promise<TestServer> {
  const server = createServer((req, res) => {
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    const route = Object.hasOwn(routes, path) ? routes[path] : undefined;

    if (route === undefined) {
      res.writeHead(404, { "content-type": "text/html" });
      res.end("<html><body><h1>Not found</h1></body></html>");
    } else if (typeof route === "string") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end(route);
    } else {
      res.writeHead(302, { location: route.redirectTo });
      res.end();
    }
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.closeAllConnections();
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}
