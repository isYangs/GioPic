# @giopic/lskypro-plugin

> GioPic 图床插件 - 兰空 Pro (Lsky Pro)

## 概述

`@giopic/lskypro-plugin` 是 [GioPic](https://github.com/isYangs/GioPic) 的官方插件，专为 Lsky Pro 用户提供深度集成支持。

## 先决条件

- 已安装 [GioPic](https://github.com/isYangs/GioPic)
- 拥有 Lsky Pro 图床实例
- 获取有效的 API Token

## 安装

在 GioPic 软件内通过「插件管理」安装。

## 功能

| 功能 | 描述 |
|------|------|
| Lsky Pro 专有 API | 完整支持 Lsky Pro v1 所有接口 |
| 策略管理 | 多策略自动切换与手动选择 |
| 批量操作 | 支持批量上传、删除、管理 |
| 权限控制 | 基于 Token 的细粒度权限 |

## 快速开始

1. 在 GioPic 中打开「插件管理」
2. 安装并启用 `@giopic/lskypro-plugin`
3. 填入 Lsky Pro API 地址和 Token
4. 开始使用

## 配置说明

| 参数 | 必填 | 描述 |
|------|------|------|
| `api` | 是 | Lsky Pro API 地址 |
| `token` | 是 | 访问令牌 |

## 许可证

[AGPL-3.0](./LICENSE)
