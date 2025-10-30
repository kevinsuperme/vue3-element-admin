# 开发指南

## 项目结构

```
vue3-element-admin/
├── src/                     # 前端源代码
│   ├── api/                # API接口
│   ├── components/         # 公共组件
│   ├── views/             # 页面组件
│   ├── router/            # 路由配置
│   ├── store/             # 状态管理
│   ├── utils/             # 工具函数
│   ├── types/             # TypeScript类型定义
│   └── assets/            # 静态资源
├── backend/                # 后端源代码
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── services/      # 业务逻辑
│   │   ├── models/        # 数据模型
│   │   ├── middleware/    # 中间件
│   │   ├── routes/        # 路由
│   │   ├── utils/         # 工具函数
│   │   └── config/        # 配置文件
│   ├── tests/             # 测试文件
│   └── dist/              # 编译输出
├── docs/                  # 项目文档
├── tests/                 # 测试文件
└── scripts/               # 构建脚本
```

## 开发环境设置

### 前端开发

```bash
# 安装依赖
npm install

# 开发模式启动
npm run dev:test    # 测试环境
npm run dev:prod    # 生产环境预览

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 单元测试
npm run test:unit
```

### 后端开发

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 开发模式启动
npm run dev

# 构建项目
npm run build

# 运行测试
npm test

# 代码检查
npm run lint
```

## 代码规范

### TypeScript

- 使用严格的TypeScript配置
- 避免使用`any`类型，使用明确的接口定义
- 函数必须有明确的返回类型
- 使用`interface`而非`type`定义对象结构

### Vue组件

- 使用Composition API
- 组件名称使用PascalCase
- Props必须有类型定义
- 使用`<script setup>`语法

### 命名规范

- **文件名**: kebab-case (`user-profile.vue`)
- **组件名**: PascalCase (`UserProfile`)
- **变量名**: camelCase (`userName`)
- **常量名**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **函数名**: camelCase (`getUserInfo`)

### 注释规范

```typescript
/**
 * 用户登录接口
 * @param data - 登录数据
 * @returns Promise<ApiResponse<LoginResponse>>
 */
export function login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  // 实现逻辑
}
```

## 环境变量

### 前端环境变量

```bash
# .env.dev_test
VITE_ENV=development
VITE_API_BASE_URL=http://localhost:3000/api
```

### 后端环境变量

```bash
# .env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/vue3-admin
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret
CORS_ORIGIN=http://localhost:5173
```

## 调试技巧

### 前端调试

1. 使用Vue DevTools
2. 利用浏览器开发者工具
3. 查看Network面板的API请求
4. 使用console.log进行调试（生产环境自动移除）

### 后端调试

1. 使用VS Code调试器
2. 查看logs目录下的日志文件
3. 使用Postman测试API接口
4. 检查MongoDB连接状态

## 常见问题

### 开发环境问题

1. **端口冲突**: 修改vite.config.ts中的端口配置
2. **CORS错误**: 检查backend/src/config/index.ts中的CORS配置
3. **类型错误**: 运行`npm run type-check`查看详细错误信息

### 构建问题

1. **内存不足**: 增加Node.js内存限制
2. **依赖冲突**: 删除node_modules重新安装
3. **权限问题**: 使用管理员权限运行命令

## 性能优化

### 前端优化

- 使用路由懒加载
- 组件按需引入
- 图片资源优化
- 使用CDN加速

### 后端优化

- 数据库索引优化
- API响应缓存
- 请求限流
- 连接池管理

## 安全最佳实践

1. **输入验证**: 所有用户输入必须验证
2. **SQL注入防护**: 使用参数化查询
3. **XSS防护**: 输出转义
4. **CSRF防护**: 使用CSRF令牌
5. **密码安全**: 使用bcrypt加密
6. **JWT安全**: 设置合理的过期时间

## 测试策略

### 前端测试

- 单元测试：组件逻辑测试
- 集成测试：页面流程测试
- E2E测试：完整业务流程测试

### 后端测试

- 单元测试：服务层逻辑测试
- 集成测试：API接口测试
- 性能测试：负载和压力测试

## 部署指南

### 生产环境构建

```bash
# 前端构建
npm run build:prod

# 后端构建
cd backend
npm run build
```

### 部署检查清单

- [ ] 环境变量配置正确
- [ ] 数据库连接正常
- [ ] HTTPS证书配置
- [ ] 防火墙规则设置
- [ ] 日志收集配置
- [ ] 监控系统配置
- [ ] 备份策略制定