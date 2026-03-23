import test from "node:test";
import assert from "node:assert/strict";
import { comments } from "../../../packages/content/src/comments.js";
import { posts } from "../../../packages/content/src/posts.js";
import { getSiteStats, listApprovedCommentsByPostSlug, listPosts } from "../src/blog-service.js";
import {
  createAdminPost,
  deleteAdminPost,
  getAdminPostBySlug,
  getAdminDashboardSummary,
  getAdminSession,
  listAdminComments,
  listAdminPosts,
  loginAdmin,
  updateAdminCommentStatus,
  updateAdminPost
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

test("getAdminPostBySlug returns editable post detail and updateAdminPost can change status", () => {
  const createResult = createAdminPost({
    title: "后台编辑流程测试文章",
    excerpt: "用于验证后台编辑流程。",
    category: "编辑",
    tags: "编辑, 后台",
    content: "初始正文",
    status: "draft"
  });

  assert.ok(createResult.post);

  const detail = getAdminPostBySlug(createResult.post.slug);
  assert.equal(detail?.post.title, "后台编辑流程测试文章");
  assert.equal(detail?.post.status, "draft");

  const updateResult = updateAdminPost(createResult.post.slug, {
    title: "后台编辑流程测试文章已更新",
    excerpt: "更新后的摘要。",
    category: "编辑",
    tags: "编辑, 发布",
    content: "更新后的正文",
    status: "published"
  });

  assert.ok(updateResult.post);
  assert.equal(updateResult.post?.status, "已发布");
  assert.equal(listPosts({ category: "编辑" }).length, 1);

  posts.splice(0, 1);
});

test("deleteAdminPost removes the target post from admin and public lists", () => {
  const createResult = createAdminPost({
    title: "后台删除流程测试文章",
    excerpt: "用于验证后台删除流程。",
    category: "删除",
    tags: "删除, 后台",
    content: "准备删除的正文",
    status: "published"
  });

  assert.ok(createResult.post);
  assert.equal(listAdminPosts({ category: "删除" }).total, 1);
  assert.equal(listPosts({ category: "删除" }).length, 1);

  const deleteResult = deleteAdminPost(createResult.post.slug);

  assert.ok(deleteResult.post);
  assert.equal(deleteResult.post?.title, "后台删除流程测试文章");
  assert.equal(listAdminPosts({ category: "删除" }).total, 0);
  assert.equal(listPosts({ category: "删除" }).length, 0);
});

test("listApprovedCommentsByPostSlug only returns approved public comments", () => {
  const items = listApprovedCommentsByPostSlug("building-better-reading-rhythm");

  assert.equal(items.length, 1);
  assert.equal(items[0].author, "周宁");
});

test("listAdminComments and updateAdminCommentStatus manage moderation state", () => {
  const pendingBefore = listAdminComments({ status: "pending" });

  assert.equal(pendingBefore.total, 1);
  assert.equal(pendingBefore.items[0].author, "陈序");

  const result = updateAdminCommentStatus(3, "approved");

  assert.ok(result.comment);
  assert.equal(result.comment?.status, "已通过");
  assert.equal(listApprovedCommentsByPostSlug("designing-a-blog-from-first-principles").length, 1);

  comments.find((item) => item.id === 3).status = "pending";
});
