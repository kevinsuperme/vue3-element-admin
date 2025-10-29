# API接口设计规范

## 1. 接口设计原则

### 1.1 RESTful设计规范
- 使用HTTP动词表示操作：GET（查询）、POST（创建）、PUT（更新）、DELETE（删除）
- 使用复数名词表示资源集合
- 使用HTTP状态码表示操作结果
- 使用统一的响应格式

### 1.2 接口版本管理
```
/api/v1/users      # 版本1
/api/v2/users      # 版本2
```

### 1.3 统一响应格式
```typescript
interface ApiResponse<T = any> {
  code: number;        // 业务状态码
  message: string;     // 响应消息
  data: T;            // 响应数据
  timestamp: number;   // 时间戳
  requestId: string;   // 请求ID，用于链路追踪
}
```

## 2. 接口分类与设计

### 2.1 用户管理模块
```typescript
// 用户登录
POST /api/v1/auth/login
{
  username: string;
  password: string;
  captcha?: string;
}

// 用户登出
POST /api/v1/auth/logout

// 获取用户信息
GET /api/v1/users/profile

// 更新用户信息
PUT /api/v1/users/profile
{
  nickname?: string;
  avatar?: string;
  email?: string;
  phone?: string;
}

// 修改密码
PUT /api/v1/users/password
{
  oldPassword: string;
  newPassword: string;
}

// 获取用户权限
GET /api/v1/users/permissions
```

### 2.2 权限管理模块
```typescript
// 获取角色列表
GET /api/v1/roles?page=1&size=10&name=admin

// 创建角色
POST /api/v1/roles
{
  name: string;
  description: string;
  permissions: string[];
}

// 更新角色
PUT /api/v1/roles/:id
{
  name?: string;
  description?: string;
  permissions?: string[];
}

// 删除角色
DELETE /api/v1/roles/:id

// 获取权限列表
GET /api/v1/permissions
```

### 2.3 业务模块示例
```typescript
// 文章管理
GET    /api/v1/articles          // 获取文章列表
POST   /api/v1/articles           // 创建文章
GET    /api/v1/articles/:id       // 获取文章详情
PUT    /api/v1/articles/:id       // 更新文章
DELETE /api/v1/articles/:id       // 删除文章

// 文件上传
POST /api/v1/files/upload
{
  file: File;
  type: 'image' | 'document' | 'video';
}
```

## 3. 请求/响应规范

### 3.1 请求规范
```typescript
// 分页请求参数
interface PageRequest {
  page: number;      // 页码，从1开始
  size: number;      // 每页条数
  sort?: string;     // 排序字段
  order?: 'asc' | 'desc'; // 排序方式
}

// 列表查询请求
interface ListRequest extends PageRequest {
  keyword?: string;  // 搜索关键词
  filters?: Record<string, any>; // 筛选条件
}

// 标准请求头
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {token}',
  'X-Request-ID': '{uuid}',      // 请求ID，用于链路追踪
  'X-Client-Version': '1.0.0',   // 客户端版本
  'X-Timestamp': '1640995200000' // 请求时间戳
}
```

### 3.2 响应规范
```typescript
// 分页响应格式
interface PageResponse<T> {
  code: number;
  message: string;
  data: {
    list: T[];
    total: number;
    page: number;
    size: number;
    pages: number;
  };
  timestamp: number;
  requestId: string;
}

// 列表响应格式
interface ListResponse<T> {
  code: number;
  message: string;
  data: T[];
  timestamp: number;
  requestId: string;
}

// 单条数据响应格式
interface SingleResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
  requestId: string;
}
```

### 3.3 错误响应格式
```typescript
interface ErrorResponse {
  code: number;           // 错误码
  message: string;        // 错误消息
  details?: string[];     // 详细错误信息
  timestamp: number;     // 时间戳
  requestId: string;     // 请求ID
  path: string;          // 请求路径
  method: string;        // 请求方法
}

// 业务错误码定义
enum ErrorCode {
  SUCCESS = 200,           // 成功
  BAD_REQUEST = 400,       // 请求参数错误
  UNAUTHORIZED = 401,     // 未认证
  FORBIDDEN = 403,        // 无权限
  NOT_FOUND = 404,        // 资源不存在
  INTERNAL_ERROR = 500,   // 服务器内部错误
  BUSINESS_ERROR = 1000   // 业务错误
}
```

## 4. 安全设计

### 4.1 认证机制
```typescript
// JWT Token结构
interface JWTPayload {
  sub: string;        // 用户ID
  name: string;       // 用户名
  roles: string[];    // 角色列表
  permissions: string[]; // 权限列表
  iat: number;        // 签发时间
  exp: number;        // 过期时间
  jti: string;        // JWT ID
}

// Token刷新机制
POST /api/v1/auth/refresh
{
  refreshToken: string;
}
```

### 4.2 接口安全
```typescript
// 请求签名
const generateSignature = (method: string, path: string, params: any, timestamp: number): string => {
  const data = `${method.toUpperCase()}${path}${JSON.stringify(params)}${timestamp}`;
  return CryptoJS.HmacSHA256(data, SECRET_KEY).toString();
};

// 使用示例
const timestamp = Date.now();
const signature = generateSignature('GET', '/api/v1/users', params, timestamp);

// 请求头中添加签名
{
  'X-Timestamp': timestamp,
  'X-Signature': signature,
  'X-Api-Key': API_KEY
}
```

### 4.3 限流机制
```typescript
// 基于IP的限流
interface RateLimitConfig {
  windowMs: number;     // 时间窗口（毫秒）
  max: number;         // 最大请求数
  message: string;     // 错误消息
  standardHeaders: boolean; // 是否在响应头中包含限流信息
  legacyHeaders: boolean;  // 是否包含X-RateLimit-*头
}

// 基于用户的限流
interface UserRateLimitConfig {
  free: RateLimitConfig;    // 免费用户
  premium: RateLimitConfig; // 付费用户
  enterprise: RateLimitConfig; // 企业用户
}
```

## 5. 版本管理策略

### 5.1 URL版本管理
```
/api/v1/users           # 版本1
/api/v2/users           # 版本2（不兼容更新）
/api/v1.1/users         # 小版本更新（兼容更新）
```

### 5.2 Header版本管理
```
Accept: application/vnd.api+json;version=1.0
```

### 5.3 版本兼容性策略
- **主版本号**：不兼容的API变更
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

## 6. 文档规范

### 6.1 OpenAPI规范
```yaml
openapi: 3.0.0
info:
  title: Vue3 Element Admin API
  version: 1.0.0
  description: 后台管理系统API文档

paths:
  /api/v1/auth/login:
    post:
      summary: 用户登录
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                username:
                  type: string
                password:
                  type: string
      responses:
        '200':
          description: 登录成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'
```

### 6.2 接口文档工具
- **Swagger UI**: API文档展示
- **Redoc**: 美观的API文档
- **Postman**: API测试和文档

## 7. 测试策略

### 7.1 单元测试
```typescript
// API测试示例
describe('User API', () => {
  it('should login successfully', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admin',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.code).toBe(200);
    expect(response.body.data.token).toBeDefined();
  });
});
```

### 7.2 集成测试
- API接口集成测试
- 数据库操作测试
- 第三方服务集成测试

### 7.3 性能测试
- 接口响应时间测试
- 并发请求测试
- 负载测试

## 8. 监控与告警

### 8.1 接口监控指标
- 请求成功率
- 平均响应时间
- 错误率
- 并发量

### 8.2 告警机制
```typescript
interface AlertConfig {
  threshold: number;     // 阈值
  duration: number;      // 持续时间
  severity: 'warning' | 'critical';
  notification: {
    email: string[];
    sms: string[];
    webhook: string[];
  };
}
```