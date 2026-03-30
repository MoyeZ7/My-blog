import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { seedComments, seedPosts, seedSiteConfig } from "./seed-content.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const defaultDataDir = process.env.MY_BLOG_DATA_DIR
  ? path.resolve(process.cwd(), process.env.MY_BLOG_DATA_DIR)
  : path.resolve(currentDir, "../data");
const defaultStorageMode = process.env.MY_BLOG_STORAGE ?? "file";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function syncArray(target, source) {
  target.splice(0, target.length, ...source);
}

function syncObject(target, source) {
  for (const key of Object.keys(target)) {
    delete target[key];
  }

  Object.assign(target, source);
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

function createSeedSnapshot() {
  return {
    posts: clone(seedPosts),
    comments: clone(seedComments),
    siteConfig: clone(seedSiteConfig)
  };
}

function cloneSnapshot(snapshot) {
  return {
    posts: clone(snapshot.posts),
    comments: clone(snapshot.comments),
    siteConfig: clone(snapshot.siteConfig)
  };
}

export function createContentStore(options = {}) {
  const dataDir = options.dataDir ?? defaultDataDir;
  const persistenceDisabled = options.persistenceDisabled ?? false;
  const posts = [];
  const comments = [];
  const siteConfig = {};
  const filePaths = {
    posts: path.join(dataDir, "posts.json"),
    comments: path.join(dataDir, "comments.json"),
    siteConfig: path.join(dataDir, "site-config.json")
  };

  function syncState(snapshot) {
    syncArray(posts, snapshot.posts);
    syncArray(comments, snapshot.comments);
    syncObject(siteConfig, snapshot.siteConfig);
  }

  function ensureDataFiles() {
    mkdirSync(dataDir, { recursive: true });

    if (!existsSync(filePaths.posts)) {
      writeJson(filePaths.posts, seedPosts);
    }

    if (!existsSync(filePaths.comments)) {
      writeJson(filePaths.comments, seedComments);
    }

    if (!existsSync(filePaths.siteConfig)) {
      writeJson(filePaths.siteConfig, seedSiteConfig);
    }
  }

  function loadFromDisk() {
    ensureDataFiles();

    return {
      posts: readJson(filePaths.posts),
      comments: readJson(filePaths.comments),
      siteConfig: readJson(filePaths.siteConfig)
    };
  }

  function reload() {
    const snapshot = persistenceDisabled ? createSeedSnapshot() : loadFromDisk();
    syncState(snapshot);
  }

  function savePosts() {
    if (persistenceDisabled) {
      return;
    }

    ensureDataFiles();
    writeJson(filePaths.posts, posts);
  }

  function saveComments() {
    if (persistenceDisabled) {
      return;
    }

    ensureDataFiles();
    writeJson(filePaths.comments, comments);
  }

  function saveSiteConfig() {
    if (persistenceDisabled) {
      return;
    }

    ensureDataFiles();
    writeJson(filePaths.siteConfig, siteConfig);
  }

  function saveAll() {
    if (persistenceDisabled) {
      return;
    }

    ensureDataFiles();
    writeJson(filePaths.posts, posts);
    writeJson(filePaths.comments, comments);
    writeJson(filePaths.siteConfig, siteConfig);
  }

  function getSnapshot() {
    return cloneSnapshot({
      posts,
      comments,
      siteConfig
    });
  }

  function replaceSnapshot(snapshot, options = {}) {
    syncState(snapshot);

    if (options.persist && !persistenceDisabled) {
      saveAll();
    }
  }

  function reset(options = {}) {
    const snapshot = createSeedSnapshot();
    syncState(snapshot);

    if (options.persist && !persistenceDisabled) {
      saveAll();
    }
  }

  reload();

  return {
    posts,
    comments,
    siteConfig,
    savePosts,
    saveComments,
    saveSiteConfig,
    saveAll,
    getSnapshot,
    replaceSnapshot,
    reload,
    reset,
    meta: {
      dataDir,
      persistenceDisabled
    }
  };
}

const defaultStore = createContentStore({
  dataDir: defaultDataDir,
  persistenceDisabled:
    process.env.MY_BLOG_DISABLE_PERSISTENCE === "1" || defaultStorageMode === "mysql"
});

export const posts = defaultStore.posts;
export const comments = defaultStore.comments;
export const siteConfig = defaultStore.siteConfig;

export function savePosts() {
  defaultStore.savePosts();
}

export function saveComments() {
  defaultStore.saveComments();
}

export function saveSiteConfig() {
  defaultStore.saveSiteConfig();
}

export function saveAllContent() {
  defaultStore.saveAll();
}

export function getContentSnapshot() {
  return defaultStore.getSnapshot();
}

export function replaceContentSnapshot(snapshot, options) {
  defaultStore.replaceSnapshot(snapshot, options);
}

export function reloadContentStore() {
  defaultStore.reload();
}

export function resetContentStore(options) {
  defaultStore.reset(options);
}

export function getContentStoreMeta() {
  return defaultStore.meta;
}
