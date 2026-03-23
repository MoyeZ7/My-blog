import http from "node:http";
import { getPostBySlug, listCategories, listPosts } from "./blog-service.js";
import { sendJson, sendNotFound } from "./response.js";

const port = Number(process.env.PORT ?? 3001);

function handleGetRequest(pathname, searchParams, response) {
  if (pathname === "/api/health") {
    sendJson(response, 200, {
      status: "ok",
      service: "my-blog-api"
    });
    return;
  }

  if (pathname === "/api/posts") {
    sendJson(response, 200, {
      items: listPosts({
        category: searchParams.get("category")
      })
    });
    return;
  }

  if (pathname === "/api/categories") {
    sendJson(response, 200, {
      items: listCategories()
    });
    return;
  }

  const postMatch = pathname.match(/^\/api\/posts\/([a-z0-9-]+)$/);

  if (postMatch) {
    const post = getPostBySlug(postMatch[1]);

    if (!post) {
      sendNotFound(response);
      return;
    }

    sendJson(response, 200, post);
    return;
  }

  sendNotFound(response);
}

const server = http.createServer((request, response) => {
  const host = request.headers.host ?? `localhost:${port}`;
  const url = new URL(request.url ?? "/", `http://${host}`);

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    response.end();
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, {
      message: "Method not allowed"
    });
    return;
  }

  handleGetRequest(url.pathname, url.searchParams, response);
});

server.listen(port, () => {
  console.log(`My Blog API listening on http://localhost:${port}`);
});
