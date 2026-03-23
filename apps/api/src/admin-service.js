import { randomUUID } from "node:crypto";
import { getSiteStats, listCategories, listPosts, listTags } from "./blog-service.js";

const sessions = new Map();
const adminCredentials = {
  username: process.env.ADMIN_USERNAME ?? "admin",
  password: process.env.ADMIN_PASSWORD ?? "123456",
  displayName: process.env.ADMIN_DISPLAY_NAME ?? "站点管理员"
};

export function loginAdmin({ username, password }) {
  if (username !== adminCredentials.username || password !== adminCredentials.password) {
    return null;
  }

  const token = randomUUID();
  const session = {
    token,
    username: adminCredentials.username,
    displayName: adminCredentials.displayName,
    createdAt: new Date().toISOString()
  };

  sessions.set(token, session);
  return session;
}

export function getAdminSession(token) {
  if (!token) {
    return null;
  }

  return sessions.get(token) ?? null;
}

export function getAdminDashboardSummary() {
  return {
    stats: getSiteStats(),
    recentPosts: listPosts().slice(0, 4),
    categories: listCategories().slice(0, 5),
    tags: listTags().slice(0, 8)
  };
}

export function listAdminPosts(filters = {}) {
  const items = listPosts(filters).map((post) => ({
    ...post,
    status: "已发布",
    updatedAt: post.publishedAt
  }));

  return {
    items,
    total: items.length
  };
}
