import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(currentDir, "public");
const port = Number(process.env.PORT ?? 3000);

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"]
]);

function resolvePathname(pathname) {
  if (pathname === "/") {
    return "/index.html";
  }

  if (pathname === "/post") {
    return "/post.html";
  }

  return pathname;
}

function buildSafeFilePath(pathname) {
  const resolvedPath = resolvePathname(pathname);
  const candidate = path.normalize(path.join(publicDir, resolvedPath));

  if (!candidate.startsWith(publicDir)) {
    return null;
  }

  return candidate;
}

const server = http.createServer(async (request, response) => {
  const host = request.headers.host ?? `localhost:${port}`;
  const url = new URL(request.url ?? "/", `http://${host}`);
  const filePath = buildSafeFilePath(url.pathname);

  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const file = await readFile(filePath);
    const extension = path.extname(filePath);

    response.writeHead(200, {
      "Content-Type": mimeTypes.get(extension) ?? "application/octet-stream"
    });
    response.end(file);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      response.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8"
      });
      response.end("Not found");
      return;
    }

    response.writeHead(500, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    response.end("Internal server error");
  }
});

server.listen(port, () => {
  console.log(`My Blog Web listening on http://localhost:${port}`);
});
