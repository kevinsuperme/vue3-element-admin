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

服务启动后，访问 `http://localhost:3000/api-docs` 查看完整的API文档。

## 测试

```bash
npm test
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