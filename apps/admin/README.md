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

- `POST /api/admin/login`
- `GET /api/admin/summary`
- `GET /api/admin/posts`
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

## 当前默认账号

```text
username: admin
password: 123456
```

后续会继续补充：

- 文章创建与编辑
- 草稿与发布状态
- 评论审核
- 站点配置管理
