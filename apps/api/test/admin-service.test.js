import test from "node:test";
import assert from "node:assert/strict";
import {
  getAdminDashboardSummary,
  getAdminSession,
  listAdminPosts,
  loginAdmin
} from "../src/admin-service.js";

test("loginAdmin creates a reusable session for valid credentials", () => {
  const session = loginAdmin({
    username: "admin",
    password: "123456"
  });

  assert.ok(session);
  assert.equal(session?.username, "admin");
  assert.equal(getAdminSession(session?.token)?.displayName, "站点管理员");
});

test("loginAdmin rejects invalid credentials", () => {
  const session = loginAdmin({
    username: "admin",
    password: "wrong-password"
  });

  assert.equal(session, null);
});

test("getAdminDashboardSummary exposes admin-facing content overview", () => {
  const summary = getAdminDashboardSummary();

  assert.equal(summary.recentPosts.length, 4);
  assert.equal(summary.stats.postCount, 4);
  assert.equal(summary.categories[0].name, "设计");
  assert.equal(summary.tags.length, 8);
});

test("listAdminPosts returns admin rows and can filter by keyword and category", () => {
  const filteredByCategory = listAdminPosts({ category: "设计" });
  const filteredByKeyword = listAdminPosts({ q: "范围控制" });

  assert.equal(filteredByCategory.total, 2);
  assert.equal(filteredByCategory.items[0].status, "已发布");
  assert.equal(filteredByKeyword.total, 1);
  assert.equal(filteredByKeyword.items[0].slug, "what-to-build-before-an-admin-panel");
});
