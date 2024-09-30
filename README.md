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
# 编译依赖
pnpm rebuild
# 启动
pnpm dev
```
