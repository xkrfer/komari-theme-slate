# Slate

Slate 是一套简洁克制的 [Komari](https://github.com/komari-monitor/komari) 主题，首页默认用表格展示节点。基于 **Vite**、**React**、**TypeScript**、**Tailwind CSS** 和 **shadcn/ui** 构建，打包为静态资源后可作为 Komari 主题上传使用。

[English](README.md) · [下载主题](https://github.com/xkrfer/komari-theme-slate/releases/latest)

> 本仓库只包含前端。界面需要一个正在运行的 Komari 后端。推荐从 Release 下载 ZIP，在 Komari 管理后台上传并启用。

> [!IMPORTANT]
> 需要 **Komari >= 1.0.7**（RPC2）。低于该版本时无法拉取节点数据。

![预览](preview.png)

## 功能特性

- 实时仪表盘：总览在线 / 离线数量与上下行流量、网速
- 三种首页视图：表格、卡片、地图（桌面默认表格，手机默认卡片）
- 表格视图：名称、状态、系统图标、运行天数、CPU / 内存 / 磁盘占用、实时网速
- 卡片视图：地区旗帜、IPv4 / IPv6 标签、到期剩余天数、续费价格、流量与资源占用
- 地图视图：按地区聚合节点，点击进入对应实例
- 节点搜索、分组筛选、多字段排序（名称 / 状态 / 地区 / 运行时间 / CPU / 内存 / 磁盘 / 网速）
- 实例详情：概览、硬件规格、实时指标；负载与 Ping 图表；实时 / 1 天 / 7 天 / 30 天；Ping 削峰
- 管理员登录（支持 2FA），登录后可进入 Komari 后台
- 简体中文 / English；浅色 / 深色 / 跟随系统
- 主题设置可在 Komari 后台配置，并写入访客首次访问的默认值
- 适配 Komari 主题系统的 ZIP 打包与 GitHub Release 流程

## 技术栈

- **构建：** Vite 8（开发代理 `/api`，生产静态导出到 `dist/`）
- **语言：** TypeScript、React 19
- **路由 / 数据：** TanStack Router、TanStack Query、TanStack Table
- **UI：** shadcn/ui（Base UI）、Tailwind CSS v4、Lucide
- **图表 / 地图：** ECharts、TopoJSON
- **校验：** Zod
- **包管理：** pnpm

生产环境通过 WebSocket 调用 `/api/rpc2` 刷新节点状态（约 2 秒一次），失败时回退到 HTTP 轮询。开发模式下 Vite 代理不转发 WebSocket，因此始终使用 HTTP 轮询。

## 前置要求

- **Node.js** 22 或更高版本（CI 使用 24）
- **pnpm** 10（仓库已锁定 `packageManager`）
- 一个可访问的 **Komari >= 1.0.7** 后端

## 安装

1. 从 [Releases](https://github.com/xkrfer/komari-theme-slate/releases/latest) 下载 `komari-theme-slate-v*.zip`，或本地执行 `pnpm package`。
2. 在 Komari 后台上传 ZIP 并启用 **Slate**。
3. 按需在主题设置中调整默认外观和访客默认视图。

ZIP 内包含：

```text
komari-theme.json
preview.png
dist/
```

## 开发

只使用 pnpm。克隆仓库后：

```bash
pnpm install
cp .env.example .env
pnpm dev
```

然后打开 `http://localhost:5173`。

### 配置 API 目标

开发服务器会把 `/api` 代理到 Komari 后端。在项目根目录的 `.env` 中设置：

```env
VITE_API_TARGET=http://127.0.0.1:25774
VITE_THEME_VERSION=0.1.0
```

将 `VITE_API_TARGET` 改成你的 Komari 实例地址。

## 环境变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `VITE_API_TARGET` | 开发时代理的 Komari 后端地址 | `http://127.0.0.1:25774` |
| `VITE_THEME_VERSION` | 页脚与打包使用的主题版本；需与 `komari-theme.json` 的 `version` 一致 | `komari-theme.json` 中的 `version` |

这两项只在本地开发和打包时使用。作为 Komari 主题部署后，浏览器会请求当前站点的 `/api/rpc2` 与 `/api/login`。

## 主题设置

`komari-theme.json` 声明了可在 Komari 后台管理的配置：

| 分组 | 配置 |
| --- | --- |
| 基础设置 | 默认外观、默认视图、默认语言、节点默认排序 |
| 首页 | 顶部统计卡片、地图视图 |
| 节点卡片 | 节点标签、账单信息、资源总量、网络流量、Swap 指标 |
| 游客显示 | 价格、到期状态 |

访客选择外观、语言或视图后会写入本地存储（`appearance`、`language`、`slate:view`），之后优先使用本地值。游客价格和到期状态默认关闭；登录用户不受这两项限制。关闭地图后，已保存的地图视图会自动回退到可用视图。

## 构建与打包

```bash
pnpm build
pnpm package
```

`pnpm build` 将静态站点输出到 `dist/`。`pnpm package` 会校验 `komari-theme.json`、`preview.png`、`dist/index.html` 以及版本号一致，然后生成：

```text
komari-theme-slate-v{version}.zip
```

提交前 husky + lint-staged 会跑 Biome。也可手动执行：

```bash
pnpm typecheck
pnpm lint
pnpm format
```

## 发布

使用 GitHub Actions 工作流 **Release theme**（`workflow_dispatch`）：

1. 在仓库 Actions 中运行该工作流。
2. 输入不带 `v` 前缀的 SemVer，例如 `0.1.0` 或 `0.2.0-beta.1`。
3. 工作流会校验版本、跑 typecheck / lint、构建并打包，然后创建 GitHub Release 并附上 ZIP。含 `-` 的版本会标记为 pre-release。

## 脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动 Vite 开发服务器 |
| `pnpm build` | 构建静态资源到 `dist/` |
| `pnpm preview` | 预览生产构建 |
| `pnpm package` | 构建并打包主题 ZIP |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm lint` | Biome 检查 |
| `pnpm format` | Biome 格式化并修复 |

## 致谢

界面与交互参考了：

- [nezha-dash](https://github.com/hamster1963/nezha-dash) — 哪吒监控仪表盘的信息密度与表格布局
- [komari-next](https://github.com/tonyliuzj/komari-next) — Komari 主题打包方式、地图、卡片账单信息与实例详情结构

后端来自 [Komari](https://github.com/komari-monitor/komari)。

## License

[MIT](LICENSE) © DouDou
