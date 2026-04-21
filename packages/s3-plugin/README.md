# @giopic/s3-plugin

> GioPic 图床插件 - S3 兼容对象存储

## 概述

`@giopic/s3-plugin` 是 [GioPic](https://github.com/isYangs/GioPic) 的官方插件，集成所有 S3 兼容对象存储服务的支持。支持 AWS S3、Cloudflare R2、腾讯云 COS、阿里云 OSS 等主流对象存储平台。

## 先决条件

- 已安装 [GioPic](https://github.com/isYangs/GioPic)
- 拥有支持 S3 协议的对象存储服务
- 获取有效的 Access Key 和 Secret Key

## 安装

在 GioPic 软件内通过「插件管理」安装。

## 支持的存储服务

| 服务商 | 兼容性 |
|--------|--------|
| AWS S3 | ✅ 官方支持 |
| Cloudflare R2 | ✅ 官方支持 |
| 腾讯云 COS | ✅ 官方支持 |
| 阿里云 OSS | ✅ 官方支持 |
| 其他 S3 兼容存储 | ✅ 兼容 |

## 功能

| 功能 | 描述 |
|------|------|
| 多平台支持 | 一键切换不同 S3 兼容服务 |
| 路径管理 | 灵活的存储路径配置 |
| 签名策略 | 支持多种鉴权方式 |
| CDN 集成 | 可配置自定义域名 / CDN |

## 快速开始

1. 在 GioPic 中打开「插件管理」
2. 安装并启用 `@giopic/s3-plugin`
3. 填写存储节点信息
4. 开始使用

## 配置说明

| 参数 | 必填 | 描述 |
|------|------|------|
| `endpoint` | 是 | S3 兼容 API 端点 |
| `region` | 是 | 区域 / 数据中心 |
| `bucket` | 是 | 存储桶名称 |
| `accessKeyId` | 是 | 访问密钥 ID |
| `secretAccessKey` | 是 | 访问密钥 Secret |

## 许可证

[AGPL-3.0](./LICENSE)
