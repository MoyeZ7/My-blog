import test from "node:test";
import assert from "node:assert/strict";
import {
  getPostBySlug,
  getSiteStats,
  listCategories,
  listPosts,
  listTags
} from "../src/blog-service.js";

test("listPosts returns seeded posts in descending published order", () => {
  const items = listPosts();

  assert.equal(items.length, 4);
  assert.equal(items[0].slug, "designing-a-blog-from-first-principles");
  assert.equal(items[1].slug, "editorial-layouts-that-do-not-feel-generic");
  assert.equal(items[0].readingTimeMinutes, 1);
});

test("listPosts can filter by category", () => {
  const items = listPosts({ category: "设计" });

  assert.equal(items.length, 2);
  assert.equal(items[0].category, "设计");
});

test("getPostBySlug returns related posts from the same category", () => {
  const item = getPostBySlug("editorial-layouts-that-do-not-feel-generic");

  assert.equal(item?.slug, "editorial-layouts-that-do-not-feel-generic");
  assert.equal(item?.relatedPosts.length, 1);
  assert.equal(item?.relatedPosts[0].slug, "building-better-reading-rhythm");
});

test("listCategories returns counts", () => {
  const items = listCategories();

  assert.deepEqual(items, [
    { name: "设计", count: 2 },
    { name: "后端", count: 1 },
    { name: "架构", count: 1 }
  ]);
});

test("listPosts can search by keyword and tag", () => {
  const searchItems = listPosts({ q: "范围控制" });
  const tagItems = listPosts({ tag: "前端" });

  assert.equal(searchItems.length, 1);
  assert.equal(searchItems[0].slug, "what-to-build-before-an-admin-panel");
  assert.equal(tagItems.length, 1);
  assert.equal(tagItems[0].slug, "editorial-layouts-that-do-not-feel-generic");
});

test("listTags and site stats summarize content", () => {
  const tags = listTags();
  const stats = getSiteStats();

  assert.equal(tags.length, 12);
  assert.equal(tags[0].count, 1);
  assert.deepEqual(stats, {
    postCount: 4,
    categoryCount: 3,
    tagCount: 12
  });
});
