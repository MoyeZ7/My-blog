import http from "node:http";
import { getAdminDashboardSummary, getAdminSession, loginAdmin } from "./admin-service.js";
import { getPostBySlug, getSiteStats, listCategories, listPosts, listTags } from "./blog-service.js";
import { sendJson, sendNotFound } from "./response.js";

const port = Number(process.env.PORT ?? 3001);

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

function getBearerToken(request) {
  const authorization = request.headers.authorization ?? "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

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
        category: searchParams.get("category"),
        q: searchParams.get("q"),
        tag: searchParams.get("tag")
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

  if (pathname === "/api/tags") {
    sendJson(response, 200, {
      items: listTags()
    });
    return;
  }

  if (pathname === "/api/stats") {
    sendJson(response, 200, getSiteStats());
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

async function handlePostRequest(pathname, request, response) {
  if (pathname === "/api/admin/login") {
    let credentials;

    try {
      credentials = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, {
        message: "Invalid JSON body"
      });
      return;
    }

    const session = loginAdmin(credentials);

    if (!session) {
      sendJson(response, 401, {
        message: "Invalid admin credentials"
      });
      return;
    }

    sendJson(response, 200, session);
    return;
  }

  sendNotFound(response);
}

const server = http.createServer(async (request, response) => {
  const host = request.headers.host ?? `localhost:${port}`;
  const url = new URL(request.url ?? "/", `http://${host}`);

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization"
    });
    response.end();
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/admin/summary") {
    const session = getAdminSession(getBearerToken(request));

    if (!session) {
      sendJson(response, 401, {
        message: "Missing admin authorization"
      });
      return;
    }

    sendJson(response, 200, {
      session: {
        username: session.username,
        displayName: session.displayName,
        createdAt: session.createdAt
      },
      summary: getAdminDashboardSummary()
    });
    return;
  }

  if (request.method === "GET") {
    handleGetRequest(url.pathname, url.searchParams, response);
    return;
  }

  if (request.method === "POST") {
    await handlePostRequest(url.pathname, request, response);
    return;
  }

  if (request.method !== "GET" && request.method !== "POST") {
    sendJson(response, 405, {
      message: "Method not allowed"
    });
    return;
  }
});

server.listen(port, () => {
  console.log(`My Blog API listening on http://localhost:${port}`);
});
