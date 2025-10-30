# Vue3 Element Admin API 文档

## 项目概述

Vue3 Element Admin 是一个基于 Vue3 和 Element Plus 的后台管理系统，提供完整的用户管理、权限管理、文章管理等功能。

## API 基础信息

- **基础URL**: `http://localhost:3000/api`
- **认证方式**: JWT Token + X-Token 双认证
- **数据格式**: JSON
- **编码**: UTF-8

## 认证方式

### 1. JWT Bearer Token
在请求头中添加：
```
Authorization: Bearer <your-jwt-token>
```

### 2. X-Token
在请求头中添加：
```
X-Token: <your-token>
```

> **注意**: 系统同时支持两种认证方式，优先使用 X-Token

## 响应格式

### 成功响应
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 具体数据
  }
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误信息",
  "error": {
    "code": "ERROR_CODE",
    "details": [
      {
        "field": "fieldName",
        "message": "字段错误信息"
      }
    ]
  }
}
```

## 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权，需要登录 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如用户名已存在） |
| 423 | 账户被锁定 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

## 分页参数

支持分页的接口使用以下参数：

| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| page | integer | 页码，从1开始 | 1 |
| limit | integer | 每页数量，最大100 | 10 |
| search | string | 搜索关键词 | - |
| sort | string | 排序，格式：`field:asc\|desc` | - |

### 分页响应格式
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "users": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## API 接口列表

### 🔐 认证相关

#### 1. 用户注册
**POST** `/auth/register`

创建新用户账户。

**请求参数：**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "firstName": "测试",
  "lastName": "用户",
  "phone": "13800138000",
  "department": "技术部",
  "position": "开发工程师"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "testuser",
      "email": "test@example.com",
      "firstName": "测试",
      "lastName": "用户",
      "fullName": "测试用户",
      "roles": [],
      "isActive": true,
      "isEmailVerified": false,
      "createdAt": "2023-12-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

#### 2. 用户登录
**POST** `/auth/login`

用户身份验证。

**请求参数：**
```json
{
  "username": "admin",
  "password": "admin123456",
  "rememberMe": true
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "admin",
      "email": "admin@example.com",
      "firstName": "管理员",
      "lastName": "系统",
      "fullName": "管理员系统",
      "roles": [
        {
          "id": "507f1f77bcf86cd799439012",
          "name": "管理员",
          "code": "admin"
        }
      ],
      "permissions": ["user.*", "role.*", "article.*"],
      "isActive": true,
      "isEmailVerified": true,
      "lastLoginAt": "2023-12-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

#### 3. 刷新令牌
**POST** `/auth/refresh`

使用刷新令牌获取新的访问令牌。

**请求参数：**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 4. 用户登出
**POST** `/auth/logout`

用户退出登录。

**请求头：**
```
Authorization: Bearer <access-token>
```

#### 5. 忘记密码
**POST** `/auth/forgot-password`

发送密码重置邮件。

**请求参数：**
```json
{
  "email": "user@example.com"
}
```

#### 6. 重置密码
**POST** `/auth/reset-password`

使用重置令牌设置新密码。

**请求参数：**
```json
{
  "token": "reset-token-from-email",
  "password": "newPassword123"
}
```

### 👥 用户管理

#### 1. 获取用户列表
**GET** `/users?page=1&limit=10&search=关键词&status=active`

分页获取用户列表，支持搜索和筛选。

#### 2. 创建用户
**POST** `/users`

创建新用户（管理员权限）。

**请求参数：**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "新",
  "lastName": "用户",
  "roles": ["507f1f77bcf86cd799439012"],
  "isActive": true
}
```

#### 3. 获取用户信息
**GET** `/users/{id}`

根据ID获取用户详细信息。

#### 4. 更新用户信息
**PUT** `/users/{id}`

更新用户基本信息。

#### 5. 删除用户
**DELETE** `/users/{id}`

删除指定用户。

#### 6. 更新用户状态
**PATCH** `/users/{id}/status`

启用或禁用用户账户。

**请求参数：**
```json
{
  "isActive": false
}
```

#### 7. 获取当前用户信息
**GET** `/users/profile`

获取当前登录用户的详细信息。

#### 8. 更新当前用户信息
**PUT** `/users/profile`

更新当前登录用户的基本信息。

#### 9. 修改密码
**PUT** `/users/profile/password`

修改当前用户的密码。

**请求参数：**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

### 🎭 角色管理

#### 1. 获取角色列表
**GET** `/roles`

获取所有角色信息。

#### 2. 创建角色
**POST** `/roles`

创建新角色。

**请求参数：**
```json
{
  "name": "编辑",
  "code": "editor",
  "description": "内容编辑人员",
  "permissions": ["article.read", "article.create", "article.update"],
  "menuIds": ["articles", "profile"],
  "status": "active",
  "sort": 4
}
```

#### 3. 获取角色信息
**GET** `/roles/{id}`

根据ID获取角色详细信息。

#### 4. 更新角色信息
**PUT** `/roles/{id}`

更新角色基本信息。

#### 5. 删除角色
**DELETE** `/roles/{id}`

删除指定角色。

### 📝 文章管理

#### 1. 获取文章列表
**GET** `/articles?page=1&limit=10&search=关键词&status=published&category=技术`

分页获取文章列表，支持搜索和筛选。

#### 2. 创建文章
**POST** `/articles`

创建新文章。

**请求参数：**
```json
{
  "title": "Vue3新特性介绍",
  "content": "# Vue3新特性\n\nVue3带来了许多新特性...",
  "excerpt": "Vue3的新特性概览",
  "status": "published",
  "tags": ["vue3", "javascript", "frontend"],
  "category": "技术文章",
  "coverImage": "https://example.com/image.jpg",
  "isFeatured": true
}
```

#### 3. 获取文章信息
**GET** `/articles/{id}`

根据ID获取文章详细信息。

#### 4. 更新文章信息
**PUT** `/articles/{id}`

更新文章基本信息。

#### 5. 删除文章
**DELETE** `/articles/{id}`

删除指定文章。

## 默认账户

系统初始化时会创建以下默认账户：

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123456 | 管理员 | 拥有所有权限 |
| user | user123456 | 普通用户 | 基本权限 |
| moderator | moderator123456 | 版主 | 管理文章权限 |

## 环境变量配置

主要环境变量说明：

```bash
# 应用配置
NODE_ENV=development
PORT=3000
API_PREFIX=/api

# 数据库
MONGODB_URI=mongodb://localhost:27017/vue3-admin

# JWT配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# 安全配置
BCRYPT_SALT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=1800000
SESSION_TIMEOUT=3600000

# 文件上传
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

## 错误处理

### 常见错误代码

| 错误代码 | 说明 |
|----------|------|
| INVALID_CREDENTIALS | 用户名或密码错误 |
| ACCOUNT_LOCKED | 账户被锁定 |
| TOKEN_EXPIRED | 令牌已过期 |
| TOKEN_INVALID | 令牌无效 |
| PERMISSION_DENIED | 权限不足 |
| RESOURCE_NOT_FOUND | 资源不存在 |
| VALIDATION_ERROR | 参数验证失败 |
| RATE_LIMIT_EXCEEDED | 请求频率超限 |

## 开发建议

1. **错误处理**: 始终检查响应的 `success` 字段，处理错误情况
2. **分页处理**: 列表接口都支持分页，注意处理分页信息
3. **认证刷新**: 在令牌过期前使用刷新令牌获取新令牌
4. **请求重试**: 对网络错误进行适当的重试机制
5. **数据缓存**: 合理使用缓存，减少不必要的API调用

## 相关资源

- [Swagger UI](http://localhost:3000/api-docs) - 在线API文档
- [Postman Collection](./postman-collection.json) - Postman集合
- [前端项目](../frontend) - Vue3前端代码
- [数据库初始化](../scripts/init-db.js) - 数据库初始化脚本