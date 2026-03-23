import test from "node:test";
import assert from "node:assert/strict";
import { getAdminDashboardSummary, getAdminSession, loginAdmin } from "../src/admin-service.js";

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
