import test from "node:test";
import assert from "node:assert/strict";
import { getPostBySlug, listCategories, listPosts } from "../src/blog-service.js";

test("listPosts returns seeded posts in descending published order", () => {
  const items = listPosts();

  assert.equal(items.length, 3);
  assert.equal(items[0].slug, "designing-a-blog-from-first-principles");
  assert.equal(items[1].slug, "editorial-layouts-that-do-not-feel-generic");
});

test("listPosts can filter by category", () => {
  const items = listPosts({ category: "Design" });

  assert.equal(items.length, 1);
  assert.equal(items[0].category, "Design");
});

test("getPostBySlug returns related posts from the same category", () => {
  const item = getPostBySlug("designing-a-blog-from-first-principles");

  assert.equal(item?.slug, "designing-a-blog-from-first-principles");
  assert.deepEqual(item?.relatedPosts, []);
});

test("listCategories returns counts", () => {
  const items = listCategories();

  assert.deepEqual(items, [
    { name: "Architecture", count: 1 },
    { name: "Backend", count: 1 },
    { name: "Design", count: 1 }
  ]);
});
