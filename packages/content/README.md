# Content 模块

`packages/content` 负责博客内容数据的文件化存储。

当前阶段已经实现：

- 文章、评论、站点配置的种子数据
- 基于 `JSON` 文件的数据目录
- 统一的 `content store`
- 运行时写入磁盘的持久化能力
- 测试环境下的内存模式与数据复位

## 数据目录

默认数据目录：

```text
packages/content/data
```

当前包含：

- `posts.json`
- `comments.json`
- `site-config.json`

## 环境变量

- `MY_BLOG_DATA_DIR`
  用于覆盖默认数据目录，适合本地实验或临时验证。
- `MY_BLOG_DISABLE_PERSISTENCE=1`
  用于关闭文件写入，测试会使用这个模式保证隔离。

## 当前工作方式

- API 启动时会加载数据目录
- 如果数据文件不存在，会自动用种子数据初始化
- 后台对文章、评论、标签、分类、站点配置的修改会直接落盘
