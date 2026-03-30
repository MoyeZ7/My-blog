import { randomUUID } from "node:crypto";
import {
  comments,
  posts,
  saveComments,
  savePosts,
  saveSiteConfig,
  siteConfig
} from "../../../packages/content/src/content-store.js";
import { listPosts } from "./blog-service.js";
import { listUploadedImages } from "./upload-service.js";

const sessions = new Map();
const adminCredentials = {
  username: process.env.ADMIN_USERNAME ?? "admin",
  password: process.env.ADMIN_PASSWORD ?? "",
  displayName: process.env.ADMIN_DISPLAY_NAME ?? "站点管理员"
};
const defaultCoverImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";
const curatedCoverLibrary = [
  {
    id: "default-cover",
    title: "系统默认封面",
    url: defaultCoverImage,
    description: "适合后台和产品类文章的通用封面。",
    source: "系统默认",
    isDefault: true
  },
  {
    id: "reading-rhythm",
    title: "阅读节奏",
    url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
    description: "适合阅读体验、内容策略和首页编排相关主题。",
    source: "内置封面",
    isDefault: false
  },
  {
    id: "editorial-layout",
    title: "编辑排版",
    url: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80",
    description: "适合设计、排版和前端表现层内容。",
    source: "内置封面",
    isDefault: false
  },
  {
    id: "architecture-notes",
    title: "结构与架构",
    url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
    description: "适合架构、重构和系统设计类文章。",
    source: "内置封面",
    isDefault: false
  },
  {
    id: "ops-and-workflow",
    title: "流程与后台",
    url: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
    description: "适合后台工作流、审核与运营流程。",
    source: "内置封面",
    isDefault: false
  },
  {
    id: "library-desk",
    title: "书桌与资料",
    url: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&w=1200&q=80",
    description: "适合复盘、资料整理和经验总结类内容。",
    source: "内置封面",
    isDefault: false
  }
];

function normalize(value) {
  return value?.trim() ?? "";
}

function normalizeStatus(status) {
  return status === "draft" ? "draft" : "published";
}

function normalizeCoverImage(value) {
  const normalizedValue = normalize(value);

  if (!normalizedValue) {
    return {
      value: defaultCoverImage
    };
  }

  if (!/^https?:\/\//i.test(normalizedValue)) {
    return {
      error: "封面图地址无效，请使用 http 或 https 链接"
    };
  }

  return {
    value: normalizedValue
  };
}

function formatAdminSiteConfig() {
  return {
    brandName: siteConfig.brandName,
    headerNote: siteConfig.headerNote,
    heroEyebrow: siteConfig.heroEyebrow,
    heroTitle: siteConfig.heroTitle,
    heroDescription: siteConfig.heroDescription,
    panelEyebrow: siteConfig.panelEyebrow,
    panelTitle: siteConfig.panelTitle,
    panelDescription: siteConfig.panelDescription,
    featureEyebrow: siteConfig.featureEyebrow,
    featureTitle: siteConfig.featureTitle,
    featureDescription: siteConfig.featureDescription,
    updatedAt: siteConfig.updatedAt
  };
}

function getReadingTime(content) {
  const totalLength = content.join("").replace(/\s+/g, "").length;
  return Math.max(1, Math.ceil(totalLength / 320));
}

function slugify(value) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalized) {
    return normalized;
  }

  return `post-${Date.now()}`;
}

function normalizeSlug(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function validateSlug(value) {
  const slug = normalizeSlug(value);

  if (!slug) {
    return {
      error: "Slug 不能为空"
    };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      error: "Slug 仅支持小写字母、数字和中划线"
    };
  }

  return {
    value: slug
  };
}

function parseTags(value) {
  return [...new Set(
    String(value ?? "")
      .split(/[,\n，]/)
      .map((item) => item.trim())
      .filter(Boolean)
  )];
}

function parseContent(value) {
  return String(value ?? "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSeoTitle(value, fallbackTitle) {
  const seoTitle = normalize(value) || fallbackTitle;

  if (seoTitle.length > 80) {
    return {
      error: "SEO 标题不能超过 80 个字符"
    };
  }

  return {
    value: seoTitle
  };
}

function normalizeSeoDescription(value, fallbackExcerpt) {
  const seoDescription = normalize(value) || fallbackExcerpt;

  if (seoDescription.length > 180) {
    return {
      error: "SEO 描述不能超过 180 个字符"
    };
  }

  return {
    value: seoDescription
  };
}

function formatAdminPost(post) {
  const status = normalizeStatus(post.status);
  const activityDate = post.updatedAt ?? post.publishedAt ?? new Date().toISOString().slice(0, 10);

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    tags: post.tags,
    coverImage: post.coverImage,
    publishedAt: post.publishedAt,
    readingTimeMinutes: getReadingTime(post.content),
    status: status === "draft" ? "草稿" : "已发布",
    updatedAt: activityDate
  };
}

function formatAdminEditorPost(post) {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    seoTitle: post.seoTitle ?? post.title,
    seoDescription: post.seoDescription ?? post.excerpt,
    excerpt: post.excerpt,
    category: post.category,
    tags: post.tags.join(", "),
    coverImage: post.coverImage,
    content: post.content.join("\n"),
    status: normalizeStatus(post.status)
  };
}

function formatAdminComment(comment) {
  const relatedPost = posts.find((post) => post.slug === comment.postSlug);
  const statusMap = {
    approved: "已通过",
    pending: "待审核",
    rejected: "已拒绝"
  };

  return {
    id: comment.id,
    postSlug: comment.postSlug,
    postTitle: relatedPost?.title ?? "未知文章",
    author: comment.author,
    content: comment.content,
    createdAt: comment.createdAt,
    status: statusMap[comment.status] ?? "待审核"
  };
}

function formatAdminTag(name, count) {
  const relatedPosts = posts
    .filter((post) => post.tags.includes(name))
    .map((post) => post.title)
    .slice(0, 3);

  return {
    name,
    count,
    postCount: count,
    relatedPosts
  };
}

function formatAdminCategory(name, count) {
  const relatedPosts = posts
    .filter((post) => post.category === name)
    .map((post) => post.title)
    .slice(0, 3);

  return {
    name,
    count,
    postCount: count,
    relatedPosts
  };
}

function collectAdminCategories() {
  const categoryMap = new Map();

  for (const post of posts) {
    const current = categoryMap.get(post.category) ?? 0;
    categoryMap.set(post.category, current + 1);
  }

  return [...categoryMap.entries()]
    .map(([name, count]) => formatAdminCategory(name, count))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, "zh-Hans-CN"));
}

function collectAdminTags() {
  const tagMap = new Map();

  for (const post of posts) {
    for (const tag of post.tags) {
      const current = tagMap.get(tag) ?? 0;
      tagMap.set(tag, current + 1);
    }
  }

  return [...tagMap.entries()]
    .map(([name, count]) => formatAdminTag(name, count))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, "zh-Hans-CN"));
}

function collectCoverUsage() {
  const usageMap = new Map();

  for (const post of posts) {
    const coverImage = post.coverImage || defaultCoverImage;
    const current = usageMap.get(coverImage) ?? 0;
    usageMap.set(coverImage, current + 1);
  }

  return usageMap;
}

function createCoverItemFromPost(post, usageMap) {
  return {
    id: `post-cover-${post.id}`,
    title: `来自文章：${post.title}`,
    url: post.coverImage || defaultCoverImage,
    description: `${post.category} · 已在文章列表中使用`,
    source: "文章已用",
    usageCount: usageMap.get(post.coverImage || defaultCoverImage) ?? 0,
    isDefault: (post.coverImage || defaultCoverImage) === defaultCoverImage
  };
}

function getAdminStats() {
  return {
    postCount: posts.length,
    categoryCount: collectAdminCategories().length,
    tagCount: collectAdminTags().length
  };
}

export function loginAdmin({ username, password }) {
  if (!adminCredentials.password) {
    return null;
  }

  if (username !== adminCredentials.username || password !== adminCredentials.password) {
    return null;
  }

  const token = randomUUID();
  const session = {
    token,
    username: adminCredentials.username,
    displayName: adminCredentials.displayName,
    createdAt: new Date().toISOString()
  };

  sessions.set(token, session);
  return session;
}

export function getAdminSession(token) {
  if (!token) {
    return null;
  }

  return sessions.get(token) ?? null;
}

export function isAdminCredentialsConfigured() {
  return Boolean(adminCredentials.password);
}

export function getAdminDashboardSummary() {
  return {
    stats: getAdminStats(),
    recentPosts: listAdminPosts().items.slice(0, 4),
    categories: collectAdminCategories().slice(0, 5),
    tags: collectAdminTags().slice(0, 8),
    commentStats: {
      total: comments.length,
      pending: comments.filter((comment) => comment.status === "pending").length
    }
  };
}

export function getAdminSiteConfig() {
  return {
    config: formatAdminSiteConfig()
  };
}

export function getDefaultCoverImage() {
  return defaultCoverImage;
}

export function listAdminCoverOptions(filters = {}) {
  const keyword = normalize(filters.q).toLowerCase();
  const usageMap = collectCoverUsage();
  const coverMap = new Map();

  for (const item of curatedCoverLibrary) {
    coverMap.set(item.url, {
      ...item,
      usageCount: usageMap.get(item.url) ?? 0
    });
  }

  for (const post of posts) {
    const coverImage = post.coverImage || defaultCoverImage;

    if (!coverMap.has(coverImage)) {
      coverMap.set(coverImage, createCoverItemFromPost(post, usageMap));
    }
  }

  for (const item of listUploadedImages()) {
    coverMap.set(item.url, {
      ...item,
      usageCount: usageMap.get(item.url) ?? item.usageCount
    });
  }

  const items = [...coverMap.values()]
    .filter((item) => {
      if (!keyword) {
        return true;
      }

      const searchTarget = [item.title, item.description, item.source, item.url].join(" ").toLowerCase();
      return searchTarget.includes(keyword);
    })
    .sort((left, right) => {
      if (left.isDefault !== right.isDefault) {
        return left.isDefault ? -1 : 1;
      }

      if (left.usageCount !== right.usageCount) {
        return right.usageCount - left.usageCount;
      }

      return left.title.localeCompare(right.title, "zh-Hans-CN");
    });

  return {
    items,
    total: items.length,
    defaultCoverImage
  };
}

export function listAdminCategories(filters = {}) {
  const keyword = normalize(filters.q).toLowerCase();
  const items = collectAdminCategories().filter((category) => {
    if (!keyword) {
      return true;
    }

    const searchTarget = [category.name, ...category.relatedPosts].join(" ").toLowerCase();
    return searchTarget.includes(keyword);
  });

  return {
    items,
    total: items.length
  };
}

export function listAdminTags(filters = {}) {
  const keyword = normalize(filters.q).toLowerCase();
  const items = collectAdminTags().filter((tag) => {
    if (!keyword) {
      return true;
    }

    const searchTarget = [tag.name, ...tag.relatedPosts].join(" ").toLowerCase();
    return searchTarget.includes(keyword);
  });

  return {
    items,
    total: items.length
  };
}

export function listAdminPosts(filters = {}) {
  const keyword = normalize(filters.q).toLowerCase();
  const category = normalize(filters.category).toLowerCase();

  const items = [...posts]
    .filter((post) => {
      if (category && post.category.toLowerCase() !== category) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const searchTarget = [post.title, post.excerpt, post.category, ...post.tags, ...post.content]
        .join(" ")
        .toLowerCase();

      return searchTarget.includes(keyword);
    })
    .sort((left, right) => {
      const leftDate = new Date(left.updatedAt ?? left.publishedAt ?? 0);
      const rightDate = new Date(right.updatedAt ?? right.publishedAt ?? 0);
      return rightDate - leftDate;
    })
    .map(formatAdminPost);

  return {
    items,
    total: items.length
  };
}

export function getAdminPostBySlug(slug) {
  const post = posts.find((item) => item.slug === slug);

  if (!post) {
    return null;
  }

  return {
    post: formatAdminEditorPost(post)
  };
}

export function createAdminPost(input) {
  const title = normalize(input.title);
  const excerpt = normalize(input.excerpt);
  const category = normalize(input.category);
  const coverImage = normalizeCoverImage(input.coverImage);
  const seoTitle = normalizeSeoTitle(input.seoTitle, title);
  const seoDescription = normalizeSeoDescription(input.seoDescription, excerpt);
  const tags = parseTags(input.tags);
  const content = parseContent(input.content);
  const status = normalizeStatus(input.status);

  if (!title) {
    return {
      error: "标题不能为空"
    };
  }

  if (!excerpt) {
    return {
      error: "摘要不能为空"
    };
  }

  if (!category) {
    return {
      error: "分类不能为空"
    };
  }

  if (!tags.length) {
    return {
      error: "至少需要一个标签"
    };
  }

  if (!content.length) {
    return {
      error: "正文不能为空"
    };
  }

  if (seoTitle.error) {
    return {
      error: seoTitle.error
    };
  }

  if (seoDescription.error) {
    return {
      error: seoDescription.error
    };
  }

  if (coverImage.error) {
    return {
      error: coverImage.error
    };
  }

  const slugResult = input.slug ? validateSlug(input.slug) : { value: slugify(title) };

  if (slugResult.error) {
    return {
      error: slugResult.error
    };
  }

  const slug = slugResult.value;

  if (posts.some((post) => post.slug === slug)) {
    return {
      error: "Slug 已存在，请更换标题或自定义 slug"
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const nextId = posts.reduce((currentMax, post) => Math.max(currentMax, post.id), 0) + 1;

  const post = {
    id: nextId,
    slug,
    title,
    seoTitle: seoTitle.value,
    seoDescription: seoDescription.value,
    excerpt,
    content,
    category,
    tags,
    coverImage: coverImage.value,
    publishedAt: status === "published" ? today : null,
    updatedAt: today,
    status
  };

  posts.unshift(post);
  savePosts();

  return {
    post: formatAdminPost(post)
  };
}

export function updateAdminPost(slug, input) {
  const post = posts.find((item) => item.slug === slug);

  if (!post) {
    return {
      error: "文章不存在"
    };
  }

  const title = normalize(input.title);
  const excerpt = normalize(input.excerpt);
  const category = normalize(input.category);
  const coverImage = normalizeCoverImage(input.coverImage);
  const seoTitle = normalizeSeoTitle(input.seoTitle, title);
  const seoDescription = normalizeSeoDescription(input.seoDescription, excerpt);
  const tags = parseTags(input.tags);
  const content = parseContent(input.content);
  const status = normalizeStatus(input.status);

  if (!title) {
    return {
      error: "标题不能为空"
    };
  }

  if (!excerpt) {
    return {
      error: "摘要不能为空"
    };
  }

  if (!category) {
    return {
      error: "分类不能为空"
    };
  }

  if (!tags.length) {
    return {
      error: "至少需要一个标签"
    };
  }

  if (!content.length) {
    return {
      error: "正文不能为空"
    };
  }

  if (seoTitle.error) {
    return {
      error: seoTitle.error
    };
  }

  if (seoDescription.error) {
    return {
      error: seoDescription.error
    };
  }

  if (coverImage.error) {
    return {
      error: coverImage.error
    };
  }

  const slugResult = validateSlug(input.slug ?? post.slug);

  if (slugResult.error) {
    return {
      error: slugResult.error
    };
  }

  const nextSlug = slugResult.value;

  if (posts.some((item) => item.slug === nextSlug && item !== post)) {
    return {
      error: "Slug 已存在，请更换标题或自定义 slug"
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const previousSlug = post.slug;
  post.title = title;
  post.seoTitle = seoTitle.value;
  post.seoDescription = seoDescription.value;
  post.slug = nextSlug;
  post.excerpt = excerpt;
  post.category = category;
  post.coverImage = coverImage.value;
  post.tags = tags;
  post.content = content;
  post.status = status;
  post.updatedAt = today;

  if (status === "published" && !post.publishedAt) {
    post.publishedAt = today;
  }

  if (status === "draft") {
    post.publishedAt = null;
  }

  if (previousSlug !== nextSlug) {
    for (const comment of comments) {
      if (comment.postSlug === previousSlug) {
        comment.postSlug = nextSlug;
      }
    }

    saveComments();
  }

  savePosts();

  return {
    post: formatAdminPost(post)
  };
}

export function deleteAdminPost(slug) {
  const index = posts.findIndex((item) => item.slug === slug);

  if (index === -1) {
    return {
      error: "文章不存在"
    };
  }

  const [removedPost] = posts.splice(index, 1);
  savePosts();

  return {
    post: formatAdminPost(removedPost)
  };
}

export function listAdminComments(filters = {}) {
  const keyword = normalize(filters.q).toLowerCase();
  const status = normalize(filters.status).toLowerCase();

  const items = comments
    .filter((comment) => {
      if (status && comment.status !== status) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const relatedPost = posts.find((post) => post.slug === comment.postSlug);
      const searchTarget = [
        comment.author,
        comment.content,
        relatedPost?.title ?? "",
        relatedPost?.category ?? ""
      ]
        .join(" ")
        .toLowerCase();

      return searchTarget.includes(keyword);
    })
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .map(formatAdminComment);

  return {
    items,
    total: items.length
  };
}

export function updateAdminCommentStatus(id, status) {
  const normalizedStatus = normalizeStatusForComment(status);
  const comment = comments.find((item) => item.id === Number(id));

  if (!comment) {
    return {
      error: "评论不存在"
    };
  }

  comment.status = normalizedStatus;
  saveComments();

  return {
    comment: formatAdminComment(comment)
  };
}

export function updateAdminSiteConfig(input) {
  const brandName = normalize(input.brandName);
  const heroTitle = normalize(input.heroTitle);
  const heroDescription = normalize(input.heroDescription);

  if (!brandName) {
    return {
      error: "站点名称不能为空"
    };
  }

  if (!heroTitle) {
    return {
      error: "首页主标题不能为空"
    };
  }

  if (!heroDescription) {
    return {
      error: "首页说明不能为空"
    };
  }

  siteConfig.brandName = brandName;
  siteConfig.headerNote = normalize(input.headerNote);
  siteConfig.heroEyebrow = normalize(input.heroEyebrow);
  siteConfig.heroTitle = heroTitle;
  siteConfig.heroDescription = heroDescription;
  siteConfig.panelEyebrow = normalize(input.panelEyebrow);
  siteConfig.panelTitle = normalize(input.panelTitle);
  siteConfig.panelDescription = normalize(input.panelDescription);
  siteConfig.featureEyebrow = normalize(input.featureEyebrow);
  siteConfig.featureTitle = normalize(input.featureTitle);
  siteConfig.featureDescription = normalize(input.featureDescription);
  siteConfig.updatedAt = new Date().toISOString().slice(0, 10);
  saveSiteConfig();

  return {
    config: formatAdminSiteConfig()
  };
}

export function renameAdminCategory(currentName, nextName) {
  const sourceName = normalize(currentName);
  const targetName = normalize(nextName);

  if (!sourceName) {
    return {
      error: "当前分类不能为空"
    };
  }

  if (!targetName) {
    return {
      error: "新分类名称不能为空"
    };
  }

  const relatedPosts = posts.filter((post) => post.category === sourceName);

  if (!relatedPosts.length) {
    return {
      error: "分类不存在"
    };
  }

  const today = new Date().toISOString().slice(0, 10);

  for (const post of relatedPosts) {
    post.category = targetName;
    post.updatedAt = today;
  }

  savePosts();

  return {
    category: collectAdminCategories().find((item) => item.name === targetName)
      ?? formatAdminCategory(targetName, relatedPosts.length)
  };
}

export function deleteAdminCategory(name, replacementName) {
  const sourceName = normalize(name);
  const targetName = normalize(replacementName);

  if (!sourceName) {
    return {
      error: "分类名称不能为空"
    };
  }

  const relatedPosts = posts.filter((post) => post.category === sourceName);

  if (!relatedPosts.length) {
    return {
      error: "分类不存在"
    };
  }

  if (!targetName) {
    return {
      error: "删除分类时需要提供迁移分类"
    };
  }

  if (targetName === sourceName) {
    return {
      error: "迁移分类不能与当前分类相同"
    };
  }

  const today = new Date().toISOString().slice(0, 10);

  for (const post of relatedPosts) {
    post.category = targetName;
    post.updatedAt = today;
  }

  savePosts();

  return {
    category: {
      name: sourceName,
      replacementName: targetName,
      movedPostCount: relatedPosts.length
    }
  };
}

export function renameAdminTag(currentName, nextName) {
  const sourceName = normalize(currentName);
  const targetName = normalize(nextName);

  if (!sourceName) {
    return {
      error: "当前标签不能为空"
    };
  }

  if (!targetName) {
    return {
      error: "新标签名称不能为空"
    };
  }

  const relatedPosts = posts.filter((post) => post.tags.includes(sourceName));

  if (!relatedPosts.length) {
    return {
      error: "标签不存在"
    };
  }

  for (const post of relatedPosts) {
    post.tags = [...new Set(post.tags.map((tag) => (tag === sourceName ? targetName : tag)))];
    post.updatedAt = new Date().toISOString().slice(0, 10);
  }

  savePosts();

  return {
    tag: collectAdminTags().find((item) => item.name === targetName) ?? formatAdminTag(targetName, 0)
  };
}

export function deleteAdminTag(name) {
  const targetName = normalize(name);

  if (!targetName) {
    return {
      error: "标签名称不能为空"
    };
  }

  const relatedPosts = posts.filter((post) => post.tags.includes(targetName));

  if (!relatedPosts.length) {
    return {
      error: "标签不存在"
    };
  }

  if (relatedPosts.some((post) => post.tags.length === 1)) {
    return {
      error: "无法删除唯一标签，请先为相关文章补充其他标签"
    };
  }

  for (const post of relatedPosts) {
    post.tags = post.tags.filter((tag) => tag !== targetName);
    post.updatedAt = new Date().toISOString().slice(0, 10);
  }

  savePosts();

  return {
    tag: {
      name: targetName
    }
  };
}

function normalizeStatusForComment(status) {
  if (status === "approved" || status === "rejected") {
    return status;
  }

  return "pending";
}
