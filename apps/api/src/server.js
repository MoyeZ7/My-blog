import http from "node:http";
import {
  createAdminPost,
  deleteAdminPost,
  deleteAdminTag,
  getAdminSiteConfig,
  listAdminComments,
  getAdminPostBySlug,
  getAdminDashboardSummary,
  getAdminSession,
  listAdminPosts,
  listAdminTags,
  loginAdmin,
  renameAdminTag,
  updateAdminCommentStatus,
  updateAdminPost,
  updateAdminSiteConfig
} from "./admin-service.js";
import {
  createPublicComment,
  getPublicSiteConfig,
  getPostBySlug,
  getSiteStats,
  listApprovedCommentsByPostSlug,
  listCategories,
  listPosts,
  listTags
} from "./blog-service.js";
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

function getAuthorizedAdminSession(request, response) {
  const session = getAdminSession(getBearerToken(request));

  if (!session) {
    sendJson(response, 401, {
      message: "Missing admin authorization"
    });
    return null;
  }

  return session;
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

  if (pathname === "/api/site-config") {
    sendJson(response, 200, getPublicSiteConfig());
    return;
  }

  const postMatch = pathname.match(/^\/api\/posts\/([a-z0-9-]+)$/);
  const commentMatch = pathname.match(/^\/api\/posts\/([a-z0-9-]+)\/comments$/);

  if (commentMatch) {
    sendJson(response, 200, {
      items: listApprovedCommentsByPostSlug(commentMatch[1])
    });
    return;
  }

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
  const publicCommentMatch = pathname.match(/^\/api\/posts\/([a-z0-9-]+)\/comments$/);

  if (publicCommentMatch) {
    let payload;

    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, {
        message: "Invalid JSON body"
      });
      return;
    }

    const result = createPublicComment(publicCommentMatch[1], payload);

    if (result.error) {
      sendJson(response, 400, {
        message: result.error
      });
      return;
    }

    sendJson(response, 201, result);
    return;
  }

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

  if (pathname === "/api/admin/posts") {
    const session = getAuthorizedAdminSession(request, response);

    if (!session) {
      return;
    }

    let payload;

    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, {
        message: "Invalid JSON body"
      });
      return;
    }

    const result = createAdminPost(payload);

    if (result.error) {
      sendJson(response, 400, {
        message: result.error
      });
      return;
    }

    sendJson(response, 201, {
      session: {
        username: session.username,
        displayName: session.displayName
      },
      ...result
    });
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
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization"
    });
    response.end();
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/admin/summary") {
    const session = getAuthorizedAdminSession(request, response);

    if (!session) {
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

  if (request.method === "GET" && url.pathname === "/api/admin/posts") {
    const session = getAuthorizedAdminSession(request, response);

    if (!session) {
      return;
    }

    sendJson(response, 200, {
      session: {
        username: session.username,
        displayName: session.displayName
      },
      ...listAdminPosts({
        q: url.searchParams.get("q"),
        category: url.searchParams.get("category")
      })
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/admin/comments") {
    const session = getAuthorizedAdminSession(request, response);

    if (!session) {
      return;
    }

    sendJson(response, 200, {
      session: {
        username: session.username,
        displayName: session.displayName
      },
      ...listAdminComments({
        q: url.searchParams.get("q"),
        status: url.searchParams.get("status")
      })
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/admin/tags") {
    const session = getAuthorizedAdminSession(request, response);

    if (!session) {
      return;
    }

    sendJson(response, 200, {
      session: {
        username: session.username,
        displayName: session.displayName
      },
      ...listAdminTags({
        q: url.searchParams.get("q")
      })
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/admin/site-config") {
    const session = getAuthorizedAdminSession(request, response);

    if (!session) {
      return;
    }

    sendJson(response, 200, {
      session: {
        username: session.username,
        displayName: session.displayName
      },
      ...getAdminSiteConfig()
    });
    return;
  }

  const adminPostMatch = url.pathname.match(/^\/api\/admin\/posts\/([a-z0-9-]+)$/);
  const adminCommentMatch = url.pathname.match(/^\/api\/admin\/comments\/(\d+)$/);

  if (request.method === "GET" && adminPostMatch) {
    const session = getAuthorizedAdminSession(request, response);

    if (!session) {
      return;
    }

    const result = getAdminPostBySlug(adminPostMatch[1]);

    if (!result) {
      sendNotFound(response);
      return;
    }

    sendJson(response, 200, {
      session: {
        username: session.username,
        displayName: session.displayName
      },
      ...result
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

  if (request.method === "PUT" && adminPostMatch) {
    const session = getAuthorizedAdminSession(request, response);

    if (!session) {
      return;
    }

    let payload;

    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, {
        message: "Invalid JSON body"
      });
      return;
    }

    const result = updateAdminPost(adminPostMatch[1], payload);

    if (result.error) {
      sendJson(response, 400, {
        message: result.error
      });
      return;
    }

    sendJson(response, 200, {
      session: {
        username: session.username,
        displayName: session.displayName
      },
      ...result
    });
    return;
  }

  if (request.method === "DELETE" && adminPostMatch) {
    const session = getAuthorizedAdminSession(request, response);

    if (!session) {
      return;
    }

    const result = deleteAdminPost(adminPostMatch[1]);

    if (result.error) {
      sendJson(response, 400, {
        message: result.error
      });
      return;
    }

    sendJson(response, 200, {
      session: {
        username: session.username,
        displayName: session.displayName
      },
      ...result
    });
    return;
  }

  if (request.method === "PUT" && adminCommentMatch) {
    const session = getAuthorizedAdminSession(request, response);

    if (!session) {
      return;
    }

    let payload;

    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, {
        message: "Invalid JSON body"
      });
      return;
    }

    const result = updateAdminCommentStatus(adminCommentMatch[1], payload.status);

    if (result.error) {
      sendJson(response, 400, {
        message: result.error
      });
      return;
    }

    sendJson(response, 200, {
      session: {
        username: session.username,
        displayName: session.displayName
      },
      ...result
    });
    return;
  }

  if (request.method === "PUT" && url.pathname === "/api/admin/site-config") {
    const session = getAuthorizedAdminSession(request, response);

    if (!session) {
      return;
    }

    let payload;

    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, {
        message: "Invalid JSON body"
      });
      return;
    }

    const result = updateAdminSiteConfig(payload);

    if (result.error) {
      sendJson(response, 400, {
        message: result.error
      });
      return;
    }

    sendJson(response, 200, {
      session: {
        username: session.username,
        displayName: session.displayName
      },
      ...result
    });
    return;
  }

  if (request.method === "PUT" && url.pathname === "/api/admin/tags") {
    const session = getAuthorizedAdminSession(request, response);

    if (!session) {
      return;
    }

    let payload;

    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, {
        message: "Invalid JSON body"
      });
      return;
    }

    const result = renameAdminTag(payload.currentName, payload.nextName);

    if (result.error) {
      sendJson(response, 400, {
        message: result.error
      });
      return;
    }

    sendJson(response, 200, {
      session: {
        username: session.username,
        displayName: session.displayName
      },
      ...result
    });
    return;
  }

  if (request.method === "DELETE" && url.pathname === "/api/admin/tags") {
    const session = getAuthorizedAdminSession(request, response);

    if (!session) {
      return;
    }

    let payload;

    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, {
        message: "Invalid JSON body"
      });
      return;
    }

    const result = deleteAdminTag(payload.name);

    if (result.error) {
      sendJson(response, 400, {
        message: result.error
      });
      return;
    }

    sendJson(response, 200, {
      session: {
        username: session.username,
        displayName: session.displayName
      },
      ...result
    });
    return;
  }

  if (
    request.method !== "GET" &&
    request.method !== "POST" &&
    request.method !== "PUT" &&
    request.method !== "DELETE"
  ) {
    sendJson(response, 405, {
      message: "Method not allowed"
    });
    return;
  }
});

server.listen(port, () => {
  console.log(`My Blog API listening on http://localhost:${port}`);
});
