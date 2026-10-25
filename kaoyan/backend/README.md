# 考研学习教练后台

Cloudflare Worker 同时提供静态打卡网站与 DeepSeek 接口。主站为 https://cokeblog.cc.cd/。

## 部署

Node.js 22+，进入 backend 目录运行：

```
npm exec --package=wrangler -- wrangler login
npm exec --package=wrangler -- wrangler secret put DEEPSEEK_API_KEY
npm exec --package=wrangler -- wrangler secret put APP_ACCESS_TOKEN
npm exec --package=wrangler -- wrangler deploy
```

也可在 Cloudflare 的 kaoyan-ai Worker 设置中保存两个加密 Secret。APP_ACCESS_TOKEN 为独立随机口令，至少32字符，不得使用 DeepSeek 密钥替代，也不要提交到仓库。用户在“账户”页输入私人登录口令。/auth/login 验证后签发7天 HttpOnly、Secure、SameSite=Strict Cookie；聊天页不存口令。/auth/session 检查会话，/auth/logout 退出当前设备。Docker 备选仅提供 Bearer API，需要 HTTPS 反向代理；主站使用 Worker 的同源会话。

build.mjs 将七个公开前端资源、core.mjs、auth.mjs 打包为 Worker。静态路由按白名单提供资源，不会暴露 .private、密钥或学习数据。主站部署授权与私有学习仓库授权分别管理。

## 学习数据与调整

- 学习数据保存在本机，GitHub 私有仓库是独立的同步功能。手机与电脑需要各自连接同一仓库；AI登录不会自动同步学习数据。
- 不同条目按字段时间戳合并，同一条目采用更新的版本；时间戳相同时使用一致的稳定顺序。切换设备前应先同步，避免同时编辑同一条记录。
- 多标签页通过 storage 事件刷新并在写入前合并最新数据。计时暂存在当前标签页 sessionStorage，结束后才保存专注记录，不把每秒计时快照写入整个学习数据集。
- AI读取今后14天计划及打卡、过去7天任务、最近专注记录、知识点笔记、进度摘要、近期对话、待复习和已完成复习。
- AI进度摘要不会自动勾选整科任务；“核对今日打卡”供用户确认。任务完成状态绑定实际内容，旧内容的勾选不会套给重排后的内容。
- 新薄弱主题先进入 pending_confirmation。本人确认后才安排该主题的复习；本人判定不会被AI自动覆盖。
- 同科同主题的“已掌握”与待复习状态联动；已完成记录可重新巩固。移除记录不等于掌握，移除后可以恢复。
- reviews 用于新增，reviewUpdates 通过已有复习 id 改期，避免新增重复任务代替顺延。
- 应用变更和助手回复一起保存。撤销记录保留在本设备浏览器中，刷新后有效；普通聊天不覆盖撤销。如果相关条目已有后续编辑，拒绝整批撤销。
- 时间统一按北京时间，凌晨03:00换学习日；计划、日志日期、复习提醒一起更新。

## 照片与输出校验

最多一张原图8MB以内，浏览器压缩成不超过2MiB data URL 的 JPEG 后提交给 DeepSeek。原照片不持久保存，历史仅保留附件标记与文字回答；后续看原题需要重新附图。错误照片可取消后继续发文字，发送期间锁定输入与照片选择。

修改范围为当日起14天，且不超过2026-12-18。科目、日期、字段、长度和已有复习id均经过校验。格式问题自动修复一次，仍失败时返回明确标记的文字建议，不应用结构化变更。超时、截断及并发修改同样不覆盖计划。限流为单实例保护，不是全局费用预算。

## 验证

```
node --test backend/test/*.test.mjs tests/plan.test.js
node tests/ui-smoke.cjs
node tests/chat-session-smoke.cjs
node tests/photo-smoke.cjs
node tests/loop-audit.cjs
```

以上命令从项目根目录运行。浏览器测试使用本机 Playwright 和 http://127.0.0.1:8765/ 静态服务，使用隔离的浏览器与模拟API，不写真实学习记录或私有云仓库。完整审查结论见 LOGIC-AUDIT.md。
