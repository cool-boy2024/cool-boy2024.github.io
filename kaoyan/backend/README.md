# 考研学习教练后台

Cloudflare Worker 同时提供静态打卡网站和 DeepSeek 接口。域名：cokeblog.cc.cd。

## 部署

Node.js 22+，进入此目录运行：

```
npm exec --package=wrangler -- wrangler login
npm exec --package=wrangler -- wrangler secret put DEEPSEEK_API_KEY
npm exec --package=wrangler -- wrangler secret put APP_ACCESS_TOKEN
npm exec --package=wrangler -- wrangler deploy
```

也可在 Cloudflare → Workers 和 Pages → kaoyan-ai → 设置 → 变量和机密中添加两个 Secret。APP_ACCESS_TOKEN 是随机生成的独立访问口令（至少32字符），不要使用 DeepSeek 密钥替代。网页连接设置填写后台地址与该口令。不要将密钥提交到 Git。

`node build.mjs` 打包父目录六个静态资源和 core.mjs。`wrangler deploy` 会自动执行构建。公网只能获取这些静态文件，无法获取服务器环境变量或后端源码。已有学习数据继续通过浏览器本地保存和原 GitHub 私有仓库同步。

## 验证

```
node --test test/*.test.mjs
```

接口：GET /health（需访问口令），POST /chat（需访问口令）。仅允许配置的网页来源。模型输出经科目、日期、字段和长度校验后返回；前端再次验证并检查并发变更，才写入已有学习存储。修改最多覆盖当日起14天且不超过2026-12-18。请求超时、模型截断或无效输出不应用变更。限流为单实例保护，非全局额度；DeepSeek费用由你的账号额度支付。

网页不包含 API 密钥。网页访问口令默认在当前标签页 sessionStorage 中保存；用户勾选记住后才持久保存在本机 localStorage。AI对话、计划覆盖、进度和复习项保存为 notes 中 ai: 前缀条目，沿用原时间戳合并。撤销使用空字符串作为删除标记，避免云同步复活旧内容。

Docker 备选：复制 .env.example 为 .env，填写机密，运行 docker compose up -d --build。Docker服务仅提供接口，生产环境通过HTTPS反向代理访问。


## 当前交互与会话

主站使用 /auth/login、/auth/session、/auth/logout 和7天 HttpOnly/Secure/SameSite=Strict Cookie。聊天界面不再要求填写接口地址或访问口令；旧版浏览器保存的授权在首次成功迁移后清除。首次在其他设备登录仍需私人登录口令。Docker备选仅作为Bearer接口服务使用；本站的同源Cookie模式由Cloudflare Worker提供。

新薄弱点默认pending_confirmation，用户选择needs_review或not_weak之后才正式归类；AI后续不能覆盖用户的判定。照片最多1张，原图8MB以内，浏览器压缩成≤1.5MiB JPEG后提交给DeepSeek Flash vision；网站不持久保存原照片，历史仅保留附件标记和文字回复。

输出校验会规范化可省略的空数组及剔除未使用的额外字段，越界日期和不合法科目仍会拒绝。首次结构错误会自动要求模型修正一次；仍不合规时仅返回明确标记为未执行的文字建议，不应用任何结构化修改。
