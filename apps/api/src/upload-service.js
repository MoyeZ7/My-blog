import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const defaultUploadDir = process.env.MY_BLOG_UPLOAD_DIR
  ? path.resolve(process.cwd(), process.env.MY_BLOG_UPLOAD_DIR)
  : path.resolve(currentDir, "../../../packages/content/uploads");
const maxUploadSizeBytes = 5 * 1024 * 1024;
const allowedMimeTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"]
]);

function createPublicOrigin(options = {}) {
  if (options.publicOrigin) {
    return options.publicOrigin;
  }

  if (process.env.MY_BLOG_PUBLIC_API_ORIGIN) {
    return process.env.MY_BLOG_PUBLIC_API_ORIGIN;
  }

  return `http://localhost:${process.env.PORT ?? 3001}`;
}

function sanitizeFileStem(value) {
  const stem = String(value ?? "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return stem || "upload";
}

function normalizeUploadPath(fileName) {
  return `/uploads/${encodeURIComponent(fileName)}`;
}

function normalizeFileName(fileName) {
  const normalized = path.basename(String(fileName ?? ""));

  if (!/^[a-z0-9-]+\.(jpg|jpeg|png|webp|gif)$/i.test(normalized)) {
    return null;
  }

  return normalized;
}

function formatUploadTitle(fileName) {
  return `本地上传：${fileName.replace(/\.[a-z0-9]+$/i, "")}`;
}

export function createUploadService(options = {}) {
  const uploadDir = options.uploadDir ?? defaultUploadDir;
  const publicOrigin = createPublicOrigin(options);

  function ensureUploadDir() {
    mkdirSync(uploadDir, { recursive: true });
  }

  function toPublicUrl(fileName) {
    return new URL(normalizeUploadPath(fileName), publicOrigin).toString();
  }

  function listUploadedImages() {
    if (!existsSync(uploadDir)) {
      return [];
    }

    return readdirSync(uploadDir)
      .map((fileName) => {
        const normalizedFileName = normalizeFileName(fileName);

        if (!normalizedFileName) {
          return null;
        }

        const filePath = path.join(uploadDir, normalizedFileName);
        const stats = statSync(filePath);

        if (!stats.isFile()) {
          return null;
        }

        return {
          id: `upload-${normalizedFileName}`,
          title: formatUploadTitle(normalizedFileName),
          url: toPublicUrl(normalizedFileName),
          description: "从后台本地上传后生成的封面资源。",
          source: "本地上传",
          usageCount: 0,
          isDefault: false,
          createdAt: stats.mtime.toISOString()
        };
      })
      .filter(Boolean)
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  }

  function getUploadedAsset(fileName) {
    const normalizedFileName = normalizeFileName(fileName);

    if (!normalizedFileName) {
      return null;
    }

    const extension = path.extname(normalizedFileName).slice(1).toLowerCase();
    const mimeType = [...allowedMimeTypes.entries()].find(([, ext]) => ext === extension)?.[0] ?? null;

    if (!mimeType) {
      return null;
    }

    const filePath = path.join(uploadDir, normalizedFileName);

    if (!existsSync(filePath)) {
      return null;
    }

    return {
      fileName: normalizedFileName,
      mimeType,
      buffer: readFileSync(filePath)
    };
  }

  async function saveUploadedImage(payload) {
    const fileName = String(payload.fileName ?? "").trim();
    const mimeType = String(payload.mimeType ?? "").trim().toLowerCase();
    const contentBase64 = String(payload.contentBase64 ?? "").trim();
    const extension = allowedMimeTypes.get(mimeType);

    if (!fileName) {
      return {
        error: "请选择要上传的图片文件"
      };
    }

    if (!extension) {
      return {
        error: "仅支持 JPG、PNG、WEBP 或 GIF 图片"
      };
    }

    if (!contentBase64) {
      return {
        error: "上传内容为空，请重新选择图片"
      };
    }

    let buffer;

    try {
      buffer = Buffer.from(contentBase64, "base64");
    } catch (error) {
      return {
        error: "图片内容解析失败，请重新上传"
      };
    }

    if (!buffer.length) {
      return {
        error: "上传内容为空，请重新选择图片"
      };
    }

    if (buffer.length > maxUploadSizeBytes) {
      return {
        error: "图片大小不能超过 5MB"
      };
    }

    ensureUploadDir();

    const uniqueFileName = `${sanitizeFileStem(fileName)}-${Date.now()}.${extension}`;
    const filePath = path.join(uploadDir, uniqueFileName);
    writeFileSync(filePath, buffer);

    return {
      asset: {
        fileName: uniqueFileName,
        mimeType,
        size: buffer.length,
        url: toPublicUrl(uniqueFileName)
      }
    };
  }

  return {
    listUploadedImages,
    getUploadedAsset,
    saveUploadedImage,
    meta: {
      uploadDir,
      publicOrigin
    }
  };
}

const defaultService = createUploadService();

export function listUploadedImages() {
  return defaultService.listUploadedImages();
}

export function getUploadedAsset(fileName) {
  return defaultService.getUploadedAsset(fileName);
}

export async function saveUploadedImage(payload) {
  return defaultService.saveUploadedImage(payload);
}

export function getUploadServiceMeta() {
  return defaultService.meta;
}
