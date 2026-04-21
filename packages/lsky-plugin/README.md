# @giopic/lsky-plugin

> GioPic 图床插件 - 兰空 (Lsky)

## 概述

`@giopic/lsky-plugin` 是 [GioPic](https://github.com/isYangs/GioPic) 的官方插件，集成兰空图床平台的支持。该插件同时兼容 Lsky 社区版和企业版 API。

## 先决条件

- 已安装 [GioPic](https://github.com/isYangs/GioPic)
- 拥有 Lsky 图床实例（社区版或企业版 v1）
- 获取有效的 API Token

## 安装

在 GioPic 软件内通过「插件管理」安装。

## 功能

| 功能 | 描述 |
|------|------|
| 双版本支持 | 同时支持 Lsky 社区版和企业版 |
| 策略管理 | 自动适配多策略配置 |
| 图片上传 | 支持拖拽、粘贴、批量上传 |
| 相册管理 | 远程相册同步与浏览 |

## 快速开始

1. 在 GioPic 中打开「插件管理」
2. 安装并启用 `@giopic/lsky-plugin`
3. 配置兰空图床地址和 Token
4. 开始使用

## 配置说明

| 参数 | 必填 | 描述 |
|------|------|------|
| `api` | 是 | 兰空图床 API 地址 |
| `token` | 是 | 访问令牌 |

## 许可证

[AGPL-3.0](./LICENSE)
