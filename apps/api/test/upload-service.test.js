import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { createUploadService } from "../src/upload-service.js";

const tinyPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9p2QfO0AAAAASUVORK5CYII=";

test("createUploadService saves uploaded images and exposes them for listing and reading", async () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "my-blog-upload-service-"));

  try {
    const service = createUploadService({
      uploadDir: tempDir,
      publicOrigin: "http://localhost:3999"
    });

    const result = await service.saveUploadedImage({
      fileName: "cover-preview.png",
      mimeType: "image/png",
      contentBase64: tinyPngBase64
    });

    assert.ok(result.asset);
    assert.match(result.asset.url, /^http:\/\/localhost:3999\/uploads\/cover-preview-\d+\.png$/);

    const items = service.listUploadedImages();

    assert.equal(items.length, 1);
    assert.equal(items[0].source, "本地上传");
    assert.equal(items[0].usageCount, 0);

    const fileName = result.asset.url.split("/").pop();
    const asset = service.getUploadedAsset(fileName);

    assert.ok(asset);
    assert.equal(asset?.mimeType, "image/png");
    assert.ok(asset?.buffer.length > 0);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("createUploadService validates upload payload", async () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "my-blog-upload-service-"));

  try {
    const service = createUploadService({
      uploadDir: tempDir,
      publicOrigin: "http://localhost:3999"
    });

    const invalidType = await service.saveUploadedImage({
      fileName: "cover.svg",
      mimeType: "image/svg+xml",
      contentBase64: tinyPngBase64
    });
    const emptyContent = await service.saveUploadedImage({
      fileName: "cover.png",
      mimeType: "image/png",
      contentBase64: ""
    });

    assert.equal(invalidType.error, "仅支持 JPG、PNG、WEBP 或 GIF 图片");
    assert.equal(emptyContent.error, "上传内容为空，请重新选择图片");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
