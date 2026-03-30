import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { createContentStore } from "../../../packages/content/src/content-store.js";

test("createContentStore persists changes to json files and can reset them", () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "my-blog-content-store-"));

  try {
    const store = createContentStore({
      dataDir: tempDir,
      persistenceDisabled: false
    });

    assert.equal(store.posts.length, 4);
    assert.equal(store.comments.length, 3);
    assert.equal(store.siteConfig.brandName, "我的博客");

    store.posts[0].title = "持久化标题测试";
    store.siteConfig.brandName = "持久化博客";
    store.savePosts();
    store.saveSiteConfig();

    const reloadedStore = createContentStore({
      dataDir: tempDir,
      persistenceDisabled: false
    });

    assert.equal(reloadedStore.posts[0].title, "持久化标题测试");
    assert.equal(reloadedStore.siteConfig.brandName, "持久化博客");

    reloadedStore.reset({ persist: true });

    const resetStore = createContentStore({
      dataDir: tempDir,
      persistenceDisabled: false
    });

    assert.equal(resetStore.posts[0].title, "从零开始重构博客系统的第一原则");
    assert.equal(resetStore.siteConfig.brandName, "我的博客");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
