# API 文档

## 概述

Vue3 Element Admin 后端API接口文档。

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **认证方式**: Bearer Token (JWT)

## 认证接口

### 用户登录

```http
POST /api/auth/login
```

**请求体**:
```json
{
  "username": "admin",
  "password": "password123"
}
```

**响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "user_id",
      "username": "admin",
      "email": "admin@example.com",
      "roles": ["admin"],
      "permissions": ["read", "write"]
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token",
      "expiresIn": 604800,
      "tokenType": "Bearer"
    }
  },
  "timestamp": "2025-10-30T06:22:00.000Z"
}
```

### 用户注册

```http
POST /api/auth/register
```

**请求体**:
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

### 获取用户信息

```http
GET /api/auth/profile
Authorization: Bearer {access_token}
```

### 刷新令牌

```http
POST /api/auth/refresh-token
```

**请求体**:
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

### 修改密码

```http
PUT /api/auth/change-password
Authorization: Bearer {access_token}
```

**请求体**:
```json
{
  "oldPassword": "old_password",
  "newPassword": "new_password",
  "confirmPassword": "new_password"
}
```

### 用户登出

```http
POST /api/auth/logout
Authorization: Bearer {access_token}
```

## 系统接口

### 健康检查

```http
GET /api/system/health
```

**响应**:
```json
{
  "success": true,
  "message": "系统运行正常",
  "data": {
    "status": "healthy",
    "uptime": 3600,
    "timestamp": "2025-10-30T06:22:00.000Z",
    "version": "1.0.0",
    "environment": "development"
  }
}
```

## 错误响应

所有错误响应都遵循统一格式：

```json
{
  "success": false,
  "message": "错误描述",
  "error": "error_code",
  "timestamp": "2025-10-30T06:22:00.000Z",
  "code": 400
}
```

### 常见错误码

- `400` - 请求参数错误
- `401` - 未授权访问
- `403` - 权限不足
- `404` - 资源不存在
- `429` - 请求过于频繁
- `500` - 服务器内部错误

## 限流规则

- **窗口时间**: 15分钟
- **最大请求数**: 100次/IP
- **认证接口**: 更严格的限制

## 安全注意事项

1. 所有敏感接口都需要JWT认证
2. 请求体大小限制为1MB
3. CORS配置限制允许的域名
4. 密码必须满足复杂度要求

## 开发环境

- **服务地址**: http://localhost:3000
- **API文档**: http://localhost:3000/api
- **健康检查**: http://localhost:3000/api/system/health