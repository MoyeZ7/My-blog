import test from "node:test";
import assert from "node:assert/strict";
import { posts } from "../../../packages/content/src/posts.js";
import { getSiteStats, listPosts } from "../src/blog-service.js";
import {
  createAdminPost,
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

test("createAdminPost validates fields and stores draft or published posts", () => {
  const beforeCount = posts.length;
  const invalidResult = createAdminPost({
    title: "",
    excerpt: "",
    category: "",
    tags: "",
    content: ""
  });

  assert.equal(invalidResult.error, "标题不能为空");

  const createResult = createAdminPost({
    title: "后台创建流程测试文章",
    excerpt: "用于验证后台创建流程。",
    category: "测试",
    tags: "测试, 后台",
    content: "第一段内容\n第二段内容",
    status: "draft"
  });

  assert.ok(createResult.post);
  assert.equal(createResult.post?.status, "草稿");
  assert.equal(posts.length, beforeCount + 1);
  assert.equal(listAdminPosts({ category: "测试" }).total, 1);
  assert.equal(listPosts({ category: "测试" }).length, 0);
  assert.equal(getSiteStats().postCount, beforeCount);

  posts.splice(0, 1);
  assert.equal(posts.length, beforeCount);
});
