# Gopeed 插件：Authorization 请求头

下载时自动给 HTTP(S) 请求补上 `Authorization`（或自定义名称）的请求头，适合需要 Bearer Token / Basic 认证的下载地址。

## 安装（本地）

1. 打开 Gopeed →「扩展」页面。
2. 连续点击 5 次「安装」按钮，开启开发者模式（仅桌面端）。
3. 选择本文件夹（包含 `manifest.json` 的目录）完成安装。
4. 点击插件的设置按钮，填写下面的配置。

## 设置项

| 名称 | 说明 |
| --- | --- |
| 请求头的值 | 完整的值，如 `Bearer eyJhbGciOi...` 或 `Basic dXNlcjpwYXNz`。留空则插件不做任何事。 |
| 生效域名 | 逗号分隔，支持 `*.example.com`（同时匹配 example.com 本身）。**留空 = 所有 http(s) 下载都会带上**，建议填写，避免把 token 发给无关网站。 |
| 请求头名称 | 默认 `Authorization`，可改为 `X-Auth-Token` 等。 |
| 覆盖已有值 | 默认关闭：任务本身已带有该请求头时保留原值；开启后用设置里的值替换。 |

## 工作方式

- `onResolve`：解析下载链接时加上请求头（解析阶段本身就会请求服务器，所以这里必须带上认证）。
- `onStart`：每次开始或继续下载前再检查一次，这样重启 Gopeed 后继续下载、或跳过解析直接创建的任务也会带上；更新 token 后，暂停再继续即可生效。
- 兼容 Gopeed v1.x（直接修改 `req.extra`）和 v2.x（`req.putHeader()` API）。
- 磁力链接、BT 任务不受影响。

## 排查

日志在 Gopeed 安装目录的 `logs/extension.log`，成功时会输出：

```
[onResolve] added Authorization (Bearer e...) for https://...
```

（日志里的 token 只显示前 8 个字符。）

## 通过仓库地址安装

在 Gopeed 扩展页输入下面的地址并点击安装：

```
https://github.com/ChicAndUnique/gopeed-extension-auth-header
```
