<div align="center">
<img src="./public/icon.png" width="120" />

# GioPic

![Static Badge](https://img.shields.io/badge/🚧-开发中-orange?style=flat-square)

GioPic 是一款开源的图片上传软件，支持多种图床系统，同时能够在桌面上更好地管理已上传的图片。

</div>

## 本地编译

### 环境要求

- Windows：[Visual Studio Build Tools](https://visualstudio.microsoft.com/zh-hans/visual-cpp-build-tools/)。
- Linux 或 macOS：GCC 环境。
- Python：版本 3.7 ~ 3.11。
  - 高于 3.11 的版本需安装 `setuptools`，可通过 `pip install setuptools` 完成。
- Node.js 和 pnpm。

### 步骤

```sh
# 安装依赖
pnpm install
# 修复 Electron 安装
pnpx electron-fix start
# 编译依赖
pnpm rebuild
# 启动
pnpm dev
```

## 插件发布工作流

### 版本策略

- 正式版本：发布到 `latest`
- 预发布版本（beta / rc）：发布到 `next`
- 插件版本与 `package.json version`、`plugin.version` 保持同步

### Git 提交规范

推荐使用以下提交前缀：

- 功能：`feat(plugins): ...`
- 修复：`fix(plugins): ...`
- 重构：`refactor(plugins): ...`
- 发布：`release(plugins): vx.y.z`

### 常用命令

#### 仅升级插件版本

```sh
pnpm version:plugins:patch
pnpm version:plugins:minor
pnpm version:plugins:major
pnpm version:plugins:beta
pnpm version:plugins:rc
```

#### 仅发布插件

```sh
pnpm publish:plugins
pnpm publish:plugins:dry
pnpm publish:plugins:next
pnpm publish:plugins:next:dry
```

#### 一步完成版本升级 + Git 提交/Tag + 发布

```sh
pnpm release:plugins:patch
pnpm release:plugins:minor
pnpm release:plugins:major
pnpm release:plugins:beta
pnpm release:plugins:rc
```

### 推荐流程

#### 在 `plugin` 分支开发中

发布预发布版本：

```sh
pnpm release:plugins:beta
```

说明：

- 会生成 prerelease 版本
- 会自动执行 Git commit
- 会自动创建 Git tag
- 会发布到 npm `next` 标签

#### 在 `main` 分支正式发布

```sh
pnpm release:plugins:patch
```

说明：

- 会生成正式版本
- 会自动执行 Git commit
- 会自动创建 Git tag
- 会发布到 npm `latest` 标签

### 发布前检查

先登录 npm：

```sh
npm login
```

先做 dry run：

```sh
pnpm publish:plugins:dry
```

如果是预发布：

```sh
pnpm publish:plugins:next:dry
```
