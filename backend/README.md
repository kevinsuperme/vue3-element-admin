# Backend API for Vue3 Element Admin

基于 Node.js + Express + TypeScript + MongoDB 的后端API服务，为Vue3 Element Admin前端项目提供完整的数据交互支持。

## 技术栈

- **运行时**: Node.js
- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: MongoDB (Mongoose ODM)
- **认证**: JWT (JSON Web Token)
- **日志**: Winston
- **安全**: Helmet, CORS, Rate Limiting
- **文件上传**: Multer
- **数据验证**: express-validator

## 功能特性

- 🔐 用户认证与授权 (JWT)
- 👥 用户管理
- 🔑 角色权限管理
- 📝 错误日志记录
- 📊 数据分页与过滤
- 🛡️ 安全防护 (CORS, Helmet, Rate Limiting)
- 📁 文件上传支持
- 📝 完整的API文档
- 🧪 单元测试

## 项目结构

```
backend/
├── src/
│   ├── config/          # 配置文件
│   ├── controllers/     # 控制器
│   ├── middleware/      # 中间件
│   ├── models/         # 数据模型
│   ├── routes/         # 路由
│   ├── services/       # 业务逻辑
│   ├── types/          # TypeScript类型定义
│   ├── utils/          # 工具函数
│   ├── validators/     # 数据验证
│   └── server.ts       # 服务器入口
├── logs/               # 日志文件
├── uploads/            # 上传文件
├── tests/              # 测试文件
└── package.json
```

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm >= 8.0.0

### 安装依赖

```bash
cd backend
npm install
```

### 环境配置

创建 `.env` 文件：

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/vue3-admin
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
UPLOAD_MAX_SIZE=5242880
```

### 启动服务

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm run build
npm start
```

## API文档

### 主要端点

#### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/profile` - 获取当前用户信息
- `PUT /api/auth/profile` - 更新用户信息
- `POST /api/auth/refresh-token` - 刷新令牌

#### 用户管理（需要admin权限）
- `GET /api/auth/users` - 获取用户列表
- `GET /api/auth/users/:id` - 获取单个用户
- `PUT /api/auth/users/:id` - 更新用户
- `DELETE /api/auth/users/:id` - 删除用户

#### 系统管理
- `GET /api/system/health` - 系统健康检查
- `GET /api/system/info` - 系统信息
- `GET /api/system/stats` - 统计信息（需要admin权限）

服务启动后，访问以下地址：
- API根目录: `http://localhost:3000/api`
- 健康检查: `http://localhost:3000/api/system/health`

### 默认账户

系统会自动创建默认管理员账户：
- 用户名: `admin`
- 邮箱: `admin@example.com`
- 密码: `admin123456`

**重要**: 首次登录后请立即修改默认密码！

## 测试

```bash
npm test
npm run test:watch
```

## API使用示例

### 用户登录
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123456"
  }'
```

### 获取用户信息
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 健康检查
```bash
curl http://localhost:3000/api/system/health
```

## 部署

1. 构建项目：
```bash
npm run build
```

2. 设置环境变量

3. 启动服务：
```bash
npm start
```

## 许可证

MIT