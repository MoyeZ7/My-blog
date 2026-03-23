import test from "node:test";
import assert from "node:assert/strict";
import { comments } from "../../../packages/content/src/comments.js";
import { posts } from "../../../packages/content/src/posts.js";
import { siteConfig } from "../../../packages/content/src/site-config.js";
import { getSiteStats, listApprovedCommentsByPostSlug, listPosts } from "../src/blog-service.js";
import {
  createAdminPost,
  deleteAdminPost,
  deleteAdminTag,
  getAdminPostBySlug,
  getAdminDashboardSummary,
  getAdminSession,
  getAdminSiteConfig,
  listAdminComments,
  listAdminPosts,
  listAdminTags,
  loginAdmin,
  renameAdminTag,
  updateAdminCommentStatus,
  updateAdminPost,
  updateAdminSiteConfig
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

test("getAdminSiteConfig and updateAdminSiteConfig manage editable site copy", () => {
  const previousConfig = { ...siteConfig };
  const detail = getAdminSiteConfig();

  assert.equal(detail.config.brandName, "我的博客");

  const invalidResult = updateAdminSiteConfig({
    brandName: "",
    heroTitle: "",
    heroDescription: ""
  });

  assert.equal(invalidResult.error, "站点名称不能为空");

  const updateResult = updateAdminSiteConfig({
    brandName: "我的博客实验室",
    headerNote: "让首页文案可以被后台调整。",
    heroEyebrow: "内容产品实验",
    heroTitle: "让首页主叙事也进入内容工作流。",
    heroDescription: "前台首页的主视觉文案，不应该永远写死在模板里。",
    panelEyebrow: "本轮重点",
    panelTitle: "站点配置已接通",
    panelDescription: "后台现在可以直接驱动首页的关键信息区。",
    featureEyebrow: "配置说明",
    featureTitle: "为什么现在做配置",
    featureDescription: "因为这会让前台内容和后台管理第一次真正打通。"
  });

  assert.equal(updateResult.config.brandName, "我的博客实验室");
  assert.equal(siteConfig.panelTitle, "站点配置已接通");

  Object.assign(siteConfig, previousConfig);
});

test("listAdminTags can filter tags by keyword", () => {
  const allTags = listAdminTags();
  const filteredTags = listAdminTags({ q: "范围控制" });

  assert.equal(allTags.total, 12);
  assert.equal(filteredTags.total, 1);
  assert.equal(filteredTags.items[0].name, "范围控制");
  assert.equal(filteredTags.items[0].relatedPosts[0], "后台面板之前，应该先把什么做对");
});

test("renameAdminTag updates related posts and deleteAdminTag removes a reusable tag", () => {
  const originalUpdatedAt = posts[0].updatedAt;

  const renameResult = renameAdminTag("重构", "系统重构");

  assert.equal(renameResult.tag?.name, "系统重构");
  assert.ok(posts[0].tags.includes("系统重构"));
  assert.ok(!posts[0].tags.includes("重构"));

  const deleteResult = deleteAdminTag("工作流");

  assert.equal(deleteResult.tag?.name, "工作流");
  assert.ok(!posts[0].tags.includes("工作流"));
  assert.equal(posts[0].tags.length, 2);

  posts[0].tags = ["重构", "工作流", "全栈"];
  posts[0].updatedAt = originalUpdatedAt;
});

test("deleteAdminTag refuses to remove the only tag from a related post", () => {
  const createResult = createAdminPost({
    title: "唯一标签测试文章",
    excerpt: "用于验证唯一标签保护。",
    category: "测试",
    tags: "唯一标签",
    content: "用于验证标签删除保护。",
    status: "draft"
  });

  assert.ok(createResult.post);

  const deleteResult = deleteAdminTag("唯一标签");

  assert.equal(deleteResult.error, "无法删除唯一标签，请先为相关文章补充其他标签");

  posts.splice(0, 1);
});
