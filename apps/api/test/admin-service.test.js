import test from "node:test";
import assert from "node:assert/strict";
import { comments } from "../../../packages/content/src/comments.js";
import { resetContentStore } from "../../../packages/content/src/content-store.js";
import { posts } from "../../../packages/content/src/posts.js";
import { siteConfig } from "../../../packages/content/src/site-config.js";
import { getSiteStats, listApprovedCommentsByPostSlug, listPosts } from "../src/blog-service.js";
import {
  createAdminPost,
  deleteAdminCategory,
  deleteAdminPost,
  deleteAdminTag,
  getDefaultCoverImage,
  getAdminPostBySlug,
  getAdminDashboardSummary,
  getAdminSession,
  getAdminSiteConfig,
  listAdminCategories,
  listAdminComments,
  listAdminCoverOptions,
  listAdminPosts,
  listAdminTags,
  loginAdmin,
  renameAdminCategory,
  renameAdminTag,
  updateAdminCommentStatus,
  updateAdminPost,
  updateAdminSiteConfig
} from "../src/admin-service.js";

const testAdminPassword = process.env.ADMIN_PASSWORD ?? "test-admin-password";

test.afterEach(() => {
  resetContentStore();
});

test("loginAdmin creates a reusable session for valid credentials", () => {
  const session = loginAdmin({
    username: "admin",
    password: testAdminPassword
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

test("createAdminPost validates custom slug format and uniqueness", () => {
  const invalidSlugResult = createAdminPost({
    title: "自定义 slug 测试文章",
    slug: "中文-slug",
    excerpt: "用于验证 slug 格式。",
    category: "测试",
    tags: "slug, 测试",
    content: "正文内容",
    status: "draft"
  });

  assert.equal(invalidSlugResult.error, "Slug 仅支持小写字母、数字和中划线");

  const duplicateSlugResult = createAdminPost({
    title: "重复 slug 测试文章",
    slug: "designing-a-blog-from-first-principles",
    excerpt: "用于验证 slug 唯一性。",
    category: "测试",
    tags: "slug, 唯一",
    content: "正文内容",
    status: "draft"
  });

  assert.equal(duplicateSlugResult.error, "Slug 已存在，请更换标题或自定义 slug");

  const createResult = createAdminPost({
    title: "自定义 slug 成功文章",
    slug: "custom-editorial-slug",
    excerpt: "用于验证自定义 slug。",
    category: "测试",
    tags: "slug, 成功",
    content: "正文内容",
    status: "draft"
  });

  assert.equal(createResult.post?.slug, "custom-editorial-slug");

  posts.splice(0, 1);
});

test("listAdminCoverOptions returns curated covers and can filter by keyword", () => {
  const allCovers = listAdminCoverOptions();
  const filteredCovers = listAdminCoverOptions({ q: "架构" });

  assert.ok(allCovers.total >= 6);
  assert.equal(allCovers.items[0].isDefault, true);
  assert.equal(allCovers.defaultCoverImage, getDefaultCoverImage());
  assert.equal(filteredCovers.total, 1);
  assert.equal(filteredCovers.items[0].title, "结构与架构");
});

test("createAdminPost and updateAdminPost validate cover urls and fill default cover", () => {
  const invalidCreateResult = createAdminPost({
    title: "封面地址校验文章",
    excerpt: "用于验证封面地址校验。",
    category: "测试",
    tags: "封面, 校验",
    coverImage: "not-a-valid-url",
    content: "正文内容",
    status: "draft"
  });

  assert.equal(invalidCreateResult.error, "封面图地址无效，请使用 http 或 https 链接");

  const createResult = createAdminPost({
    title: "封面默认值文章",
    excerpt: "用于验证默认封面回填。",
    category: "测试",
    tags: "封面, 默认",
    coverImage: "",
    content: "正文内容",
    status: "draft"
  });

  assert.ok(createResult.post);
  assert.equal(posts[0].coverImage, getDefaultCoverImage());

  const invalidUpdateResult = updateAdminPost(createResult.post.slug, {
    title: "封面默认值文章",
    excerpt: "用于验证默认封面回填。",
    category: "测试",
    tags: "封面, 默认",
    coverImage: "ftp://invalid",
    content: "正文内容",
    status: "draft"
  });

  assert.equal(invalidUpdateResult.error, "封面图地址无效，请使用 http 或 https 链接");

  posts.splice(0, 1);
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

test("updateAdminPost can change slug and migrate related comments", () => {
  const createResult = createAdminPost({
    title: "slug 迁移测试文章",
    slug: "slug-migration-before",
    excerpt: "用于验证 slug 更新。",
    category: "测试",
    tags: "slug, 迁移",
    content: "正文内容",
    status: "published"
  });

  assert.ok(createResult.post);

  comments.unshift({
    id: 999,
    postSlug: "slug-migration-before",
    author: "测试读者",
    content: "这条评论应该跟着 slug 一起迁移。",
    createdAt: "2026-03-30",
    status: "approved"
  });

  const updateResult = updateAdminPost("slug-migration-before", {
    title: "slug 迁移测试文章",
    slug: "slug-migration-after",
    excerpt: "用于验证 slug 更新。",
    category: "测试",
    tags: "slug, 迁移",
    coverImage: "",
    content: "正文内容",
    status: "published"
  });

  assert.equal(updateResult.post?.slug, "slug-migration-after");
  assert.equal(getAdminPostBySlug("slug-migration-after")?.post.slug, "slug-migration-after");
  assert.equal(listApprovedCommentsByPostSlug("slug-migration-after").length, 1);
  assert.equal(listApprovedCommentsByPostSlug("slug-migration-before").length, 0);

  comments.splice(0, 1);
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

test("listAdminCategories can filter categories by keyword", () => {
  const allCategories = listAdminCategories();
  const filteredCategories = listAdminCategories({ q: "重构" });

  assert.equal(allCategories.total, 3);
  assert.equal(filteredCategories.total, 1);
  assert.equal(filteredCategories.items[0].name, "架构");
  assert.equal(filteredCategories.items[0].relatedPosts[0], "从零开始重构博客系统的第一原则");
});

test("renameAdminCategory updates related posts and merges into target category", () => {
  const originalCategory = posts[2].category;
  const originalUpdatedAt = posts[2].updatedAt;

  const result = renameAdminCategory("后端", "产品工程");

  assert.equal(result.category?.name, "产品工程");
  assert.equal(posts[2].category, "产品工程");
  assert.equal(listPosts({ category: "产品工程" }).length, 1);

  posts[2].category = originalCategory;
  posts[2].updatedAt = originalUpdatedAt;
});

test("deleteAdminCategory moves related posts into a replacement category", () => {
  const originalCategory = posts[0].category;
  const originalUpdatedAt = posts[0].updatedAt;

  const invalidResult = deleteAdminCategory("架构", "");

  assert.equal(invalidResult.error, "删除分类时需要提供迁移分类");

  const result = deleteAdminCategory("架构", "产品工程");

  assert.equal(result.category?.name, "架构");
  assert.equal(result.category?.replacementName, "产品工程");
  assert.equal(posts[0].category, "产品工程");
  assert.equal(listPosts({ category: "产品工程" }).length, 1);

  posts[0].category = originalCategory;
  posts[0].updatedAt = originalUpdatedAt;
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
