# API 使用示例

## 认证相关接口

### 1. 用户注册

```bash
curl -X POST http://localhost:3000/api/auth/register \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "username": "testuser",\n    "email": "test@example.com",\n    "password": "password123",\n    "firstName": "测试",\n    "lastName": "用户",\n    "phone": "13800138000",\n    "department": "技术部",\n    "position": "开发工程师"\n  }'
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

### 2. 用户登录

```bash
curl -X POST http://localhost:3000/api/auth/login \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "username": "admin",\n    "password": "admin123456",\n    "rememberMe": true\n  }'
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

### 3. 使用 X-Token 认证

```bash
curl -X GET http://localhost:3000/api/users/profile \\\n  -H "X-Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. 使用 JWT Bearer Token 认证

```bash
curl -X GET http://localhost:3000/api/users/profile \\\n  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 用户管理接口

### 1. 获取用户列表（分页）

```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=10&search=admin&status=active" \\\n  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**响应示例：**
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "users": [
      {
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
        "isActive": true,
        "isEmailVerified": true,
        "createdAt": "2023-12-01T00:00:00.000Z",
        "updatedAt": "2023-12-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 2. 创建用户

```bash
curl -X POST http://localhost:3000/api/users \\\n  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "username": "newuser",\n    "email": "newuser@example.com",\n    "password": "password123",\n    "firstName": "新",\n    "lastName": "用户",\n    "roles": ["507f1f77bcf86cd799439012"],\n    "isActive": true\n  }'
```

### 3. 更新用户信息

```bash
curl -X PUT http://localhost:3000/api/users/507f1f77bcf86cd799439011 \\\n  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "firstName": "更新",\n    "lastName": "用户",\n    "email": "updated@example.com",\n    "phone": "13900139000",\n    "department": "更新部门",\n    "position": "更新职位"\n  }'
```

### 4. 修改用户状态

```bash
curl -X PATCH http://localhost:3000/api/users/507f1f77bcf86cd799439011/status \\\n  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "isActive": false\n  }'
```

### 5. 删除用户

```bash
curl -X DELETE http://localhost:3000/api/users/507f1f77bcf86cd799439011 \\\n  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 角色管理接口

### 1. 获取角色列表

```bash
curl -X GET http://localhost:3000/api/roles \\\n  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**响应示例：**
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "roles": [
      {
        "id": "507f1f77bcf86cd799439012",
        "name": "管理员",
        "code": "admin",
        "description": "系统管理员，拥有所有权限",
        "permissions": ["user.*", "role.*", "article.*"],
        "menuIds": ["users", "roles", "articles", "system"],
        "status": "active",
        "sort": 1,
        "createdAt": "2023-12-01T00:00:00.000Z",
        "updatedAt": "2023-12-01T00:00:00.000Z"
      }
    ]
  }
}
```

### 2. 创建角色

```bash
curl -X POST http://localhost:3000/api/roles \\\n  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "name": "编辑",\n    "code": "editor",\n    "description": "内容编辑人员",\n    "permissions": ["article.read", "article.create", "article.update"],\n    "menuIds": ["articles", "profile"],\n    "status": "active",\n    "sort": 4\n  }'
```

## 文章管理接口

### 1. 获取文章列表（分页）

```bash
curl -X GET "http://localhost:3000/api/articles?page=1&limit=10&search=Vue3&status=published&category=技术" \\\n  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**响应示例：**
```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "articles": [
      {
        "id": "507f1f77bcf86cd799439013",
        "title": "Vue3新特性介绍",
        "content": "# Vue3新特性\\n\\nVue3带来了许多新特性...",
        "excerpt": "Vue3的新特性概览",
        "status": "published",
        "tags": ["vue3", "javascript", "frontend"],
        "category": "技术文章",
        "coverImage": "https://example.com/image.jpg",
        "isFeatured": true,
        "viewCount": 1250,
        "likeCount": 89,
        "author": {
          "id": "507f1f77bcf86cd799439011",
          "username": "admin",
          "fullName": "管理员系统"
        },
        "createdAt": "2023-12-01T00:00:00.000Z",
        "updatedAt": "2023-12-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 2. 创建文章

```bash
curl -X POST http://localhost:3000/api/articles \\\n  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "title": "Vue3新特性介绍",\n    "content": "# Vue3新特性\\n\\nVue3带来了许多新特性...",\n    "excerpt": "Vue3的新特性概览",\n    "status": "published",\n    "tags": ["vue3", "javascript", "frontend"],\n    "category": "技术文章",\n    "coverImage": "https://example.com/image.jpg",\n    "isFeatured": true\n  }'
```

### 3. 更新文章信息

```bash
curl -X PUT http://localhost:3000/api/articles/507f1f77bcf86cd799439013 \\\n  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "title": "更新后的Vue3新特性介绍",\n    "content": "# 更新后的Vue3新特性\\n\\nVue3带来了许多新特性...",\n    "excerpt": "更新后的Vue3新特性概览",\n    "status": "published",\n    "tags": ["vue3", "javascript", "frontend", "update"],\n    "category": "技术文章"\n  }'
```

### 4. 删除文章

```bash
curl -X DELETE http://localhost:3000/api/articles/507f1f77bcf86cd799439013 \\\n  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 错误处理示例

### 1. 认证失败

```json
{
  "success": false,
  "message": "认证失败",
  "error": {
    "code": "TOKEN_INVALID",
    "details": [
      {
        "field": "token",
        "message": "令牌无效或已过期"
      }
    ]
  }
}
```

### 2. 参数验证失败

```json
{
  "success": false,
  "message": "参数验证失败",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      },
      {
        "field": "password",
        "message": "密码长度至少8位"
      }
    ]
  }
}
```

### 3. 权限不足

```json
{
  "success": false,
  "message": "权限不足",
  "error": {
    "code": "PERMISSION_DENIED",
    "details": [
      {
        "message": "需要管理员权限"
      }
    ]
  }
}
```

### 4. 资源不存在

```json
{
  "success": false,
  "message": "资源不存在",
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "details": [
      {
        "message": "用户不存在"
      }
    ]
  }
}
```

### 5. 请求频率限制

```json
{
  "success": false,
  "message": "请求过于频繁",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "details": [
      {
        "message": "请稍后再试"
      }
    ]
  }
}
```

## 测试脚本示例

### JavaScript (使用 axios)

```javascript
const axios = require('axios');

// 基础配置
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 登录函数
async function login(username, password) {
  try {
    const response = await api.post('/auth/login', {
      username,
      password,
      rememberMe: true
    });
    
    const { accessToken, refreshToken } = response.data.data.tokens;
    
    // 设置默认认证头
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    
    console.log('登录成功');
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('登录失败:', error.response?.data?.message || error.message);
    throw error;
  }
}

// 获取用户列表
async function getUsers(page = 1, limit = 10) {
  try {
    const response = await api.get('/users', {
      params: { page, limit }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('获取用户列表失败:', error.response?.data?.message || error.message);
    throw error;
  }
}

// 创建用户
async function createUser(userData) {
  try {
    const response = await api.post('/users', userData);
    return response.data.data;
  } catch (error) {
    console.error('创建用户失败:', error.response?.data?.message || error.message);
    throw error;
  }
}

// 使用示例
async function main() {
  try {
    // 登录
    const { accessToken } = await login('admin', 'admin123456');
    
    // 获取用户列表
    const users = await getUsers(1, 5);
    console.log('用户列表:', users);
    
    // 创建新用户
    const newUser = await createUser({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: '测试',
      lastName: '用户',
      roles: [],
      isActive: true
    });
    console.log('新用户:', newUser);
    
  } catch (error) {
    console.error('执行失败:', error);
  }
}

// 运行示例
main();
```

### Python (使用 requests)

```python
import requests
import json

class VueAdminAPI:
    def __init__(self, base_url="http://localhost:3000/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token = None
        
    def login(self, username, password):
        """用户登录"""
        url = f"{self.base_url}/auth/login"
        data = {
            "username": username,
            "password": password,
            "rememberMe": True
        }
        
        response = self.session.post(url, json=data)
        response.raise_for_status()
        
        result = response.json()
        self.access_token = result["data"]["tokens"]["accessToken"]
        
        # 设置认证头
        self.session.headers.update({
            "Authorization": f"Bearer {self.access_token}"
        })
        
        print("登录成功")
        return result["data"]
    
    def get_users(self, page=1, limit=10, search=None, status=None):
        """获取用户列表"""
        url = f"{self.base_url}/users"
        params = {"page": page, "limit": limit}
        
        if search:
            params["search"] = search
        if status:
            params["status"] = status
            
        response = self.session.get(url, params=params)
        response.raise_for_status()
        
        return response.json()["data"]
    
    def create_user(self, user_data):
        """创建用户"""
        url = f"{self.base_url}/users"
        response = self.session.post(url, json=user_data)
        response.raise_for_status()
        
        return response.json()["data"]
    
    def update_user_status(self, user_id, is_active):
        """更新用户状态"""
        url = f"{self.base_url}/users/{user_id}/status"
        data = {"isActive": is_active}
        
        response = self.session.patch(url, json=data)
        response.raise_for_status()
        
        return response.json()["data"]

# 使用示例
if __name__ == "__main__":
    api = VueAdminAPI()
    
    try:
        # 登录
        api.login("admin", "admin123456")
        
        # 获取用户列表
        users = api.get_users(page=1, limit=5)
        print(f"用户列表: {json.dumps(users, indent=2, ensure_ascii=False)}")
        
        # 创建新用户
        new_user = api.create_user({
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123",
            "firstName": "测试",
            "lastName": "用户",
            "roles": [],
            "isActive": True
        })
        print(f"新用户: {json.dumps(new_user, indent=2, ensure_ascii=False)}")
        
        # 更新用户状态
        user_status = api.update_user_status("507f1f77bcf86cd799439011", False)
        print(f"用户状态更新: {json.dumps(user_status, indent=2, ensure_ascii=False)}")
        
    except requests.exceptions.RequestException as e:
        print(f"API调用失败: {e}")
    except Exception as e:
        print(f"执行失败: {e}")
```

## 常见使用场景

### 1. 用户注册和登录流程

```javascript
// 1. 用户注册
const registerResponse = await api.post('/auth/register', {
  username: 'newuser',
  email: 'newuser@example.com',
  password: 'password123',
  firstName: '新',
  lastName: '用户'
});

// 2. 用户登录
const loginResponse = await api.post('/auth/login', {
  username: 'newuser',
  password: 'password123'
});

// 3. 保存token
const { accessToken, refreshToken } = loginResponse.data.data.tokens;
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// 4. 使用token访问受保护资源
const profileResponse = await api.get('/users/profile', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### 2. 分页数据处理

```javascript
// 获取用户列表（分页）
async function fetchUsers(page = 1, limit = 10) {
  const response = await api.get('/users', {
    params: { page, limit, search: 'admin' }
  });
  
  const { users, pagination } = response.data.data;
  
  console.log(`当前页: ${pagination.page}/${pagination.pages}`);
  console.log(`总记录数: ${pagination.total}`);
  console.log(`是否有下一页: ${pagination.hasNext}`);
  
  return { users, pagination };
}

// 分页加载更多数据
async function loadMoreUsers() {
  let currentPage = 1;
  const allUsers = [];
  
  while (true) {
    const { users, pagination } = await fetchUsers(currentPage);
    allUsers.push(...users);
    
    if (!pagination.hasNext) break;
    currentPage++;
  }
  
  return allUsers;
}
```

### 3. 错误处理

```javascript
// 统一的错误处理
async function apiCallWithErrorHandling(apiCall) {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    if (error.response) {
      // 服务器响应错误
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          console.error('参数错误:', data.message);
          // 显示具体的字段错误
          if (data.error?.details) {
            data.error.details.forEach(detail => {
              console.error(`${detail.field}: ${detail.message}`);
            });
          }
          break;
        case 401:
          console.error('认证失败:', data.message);
          // 跳转到登录页面
          window.location.href = '/login';
          break;
        case 403:
          console.error('权限不足:', data.message);
          break;
        case 404:
          console.error('资源不存在:', data.message);
          break;
        case 429:
          console.error('请求过于频繁:', data.message);
          break;
        default:
          console.error('服务器错误:', data.message);
      }
    } else if (error.request) {
      // 请求发送失败
      console.error('网络错误:', error.message);
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
    }
    
    throw error;
  }
}

// 使用示例
const result = await apiCallWithErrorHandling(() => 
  api.get('/users/profile')
);
```

### 4. 文件上传

```javascript
// 文件上传示例
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', 'avatar');
  
  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${accessToken}`
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log(`上传进度: ${percentCompleted}%`);
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('文件上传失败:', error);
    throw error;
  }
}

// 使用示例
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    try {
      const result = await uploadFile(file);
      console.log('文件上传成功:', result);
    } catch (error) {
      console.error('文件上传失败:', error);
    }
  }
});
```

### 5. 实时数据更新

```javascript
// 使用轮询获取实时数据
class RealtimeDataManager {
  constructor(api, endpoint, interval = 5000) {
    this.api = api;
    this.endpoint = endpoint;
    this.interval = interval;
    this.timer = null;
    this.callbacks = [];
  }
  
  start() {
    this.fetchData();
    this.timer = setInterval(() => {
      this.fetchData();
    }, this.interval);
  }
  
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  
  async fetchData() {
    try {
      const response = await this.api.get(this.endpoint);
      const data = response.data.data;
      
      // 通知所有回调函数
      this.callbacks.forEach(callback => {
        callback(data);
      });
    } catch (error) {
      console.error('获取实时数据失败:', error);
    }
  }
  
  onData(callback) {
    this.callbacks.push(callback);
  }
  
  offData(callback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }
}

// 使用示例
const realtimeManager = new RealtimeDataManager(api, '/users/realtime', 3000);

// 添加数据更新回调
realtimeManager.onData((data) => {
  console.log('收到实时数据更新:', data);
  // 更新UI
  updateUI(data);
});

// 开始轮询
realtimeManager.start();

// 停止轮询（在组件卸载时）
// realtimeManager.stop();
```

这些示例展示了如何使用 Vue3 Element Admin API 进行各种常见操作，包括认证、用户管理、错误处理、文件上传和实时数据更新等。