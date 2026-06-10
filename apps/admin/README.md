# Admin 模块

`apps/admin` 是博客后台管理端的独立前端模块。

当前阶段已经实现：

- 后台登录页
- 基于 API 的管理员登录流程
- 后台仪表盘首页
- 文章、分类、标签和站点统计概览
- 后台文章列表
- 文章关键词与分类筛选
- 后台新建文章表单
- 自定义 slug、自动生成与公开链接预览
- SEO 标题、SEO 描述与搜索结果预览
- Canonical、OG 图片与 SEO 关键词管理
- 文章置顶与自定义排序管理
- 封面预览、默认封面与封面库选择
- 本地图片上传并作为文章封面使用
- 文章创建后自动刷新后台概览与列表
- 后台文章编辑与表单回填
- 在编辑流程中切换草稿 / 发布状态
- 后台删除文章
- 后台评论列表与筛选
- 评论通过 / 拒绝审核
- 后台站点配置编辑
- 首页品牌文案与说明区文案管理
- 后台标签列表与关键词筛选
- 标签重命名与安全删除
- 后台分类列表与关键词筛选
- 分类重命名与删除迁移

## 启动方式

在项目根目录执行：

```bash
npm run start:admin
```

默认访问地址：

```text
http://localhost:3002
```

## 当前依赖的接口

- `GET /api/admin/auth-config`
- `GET /api/admin/session`
- `POST /api/admin/login`
- `DELETE /api/admin/session`
- `GET /api/admin/summary`
- `GET /api/admin/posts`
- `GET /api/admin/covers`
- `POST /api/admin/uploads`
- `POST /api/admin/posts`
- `GET /api/admin/posts/:slug`
- `PUT /api/admin/posts/:slug`
- `DELETE /api/admin/posts/:slug`
- `GET /api/admin/comments`
- `PUT /api/admin/comments/:id`
- `GET /api/admin/site-config`
- `PUT /api/admin/site-config`
- `GET /api/admin/tags`
- `PUT /api/admin/tags`
- `DELETE /api/admin/tags`
- `GET /api/admin/categories`
- `PUT /api/admin/categories`
- `DELETE /api/admin/categories`

## 管理员凭证配置

```text
ADMIN_USERNAME=admin
ADMIN_PASSWORD=请自行设置一个强密码
ADMIN_SESSION_TTL_MS=43200000
```

说明：

- 未配置 `ADMIN_PASSWORD` 时，后台为演示模式，只需输入账号即可登录
- 配置 `ADMIN_PASSWORD` 后，后台为密码模式，登录页会自动提示需要输入密码
- 会话默认有效期为 12 小时，可通过 `ADMIN_SESSION_TTL_MS` 调整

后续会继续补充：

- 文章创建与编辑
- 草稿与发布状态
- 评论审核
- 站点配置管理
