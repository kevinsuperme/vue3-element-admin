# 系统架构设计文档

## 1. 总体架构

### 1.1 架构图
```
┌─────────────────────────────────────────────────────────────┐
│                        前端层                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   视图层     │  │   组件层     │  │   工具层     │        │
│  │  (Views)     │  │(Components) │  │  (Utils)    │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                 │                 │               │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐        │
│  │   状态管理   │  │   路由管理   │  │   API层     │        │
│  │   (Pinia)   │  │  (Router)   │  │  (Service)  │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                 │                 │               │
│  └──────────────────────────────────────────────────────┘        │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                           ▼                                 │
│                    接口网关层                               │
│                 (API Gateway)                               │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  认证授权   │  │  限流熔断   │  │  监控日志   │        │
│  │  (Auth)     │  │  (RateLimit)│  │  (Monitor)  │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                 │                 │               │
│  └──────────────────────────────────────────────────────┘        │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                           ▼                                 │
│                    业务服务层                               │
│                 (Micro Services)                              │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  用户服务   │  │  权限服务   │  │  业务服务   │        │
│  │  (User)     │  │ (Permission)│  │  (Business) │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                 │                 │               │
│  └──────────────────────────────────────────────────────┘        │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                           ▼                                 │
│                    数据存储层                               │
│                 (Data Storage)                              │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  关系数据库  │  │   缓存      │  │  对象存储   │        │
│  │  (MySQL)    │  │ (Redis)     │  │  (OSS)      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 2. 前端架构详细设计

### 2.1 技术栈
- **框架**: Vue 3.5.x + TypeScript
- **构建工具**: Vite 6.x
- **UI组件库**: Element Plus 2.x
- **状态管理**: Pinia 2.x
- **路由管理**: Vue Router 4.x
- **HTTP客户端**: Axios
- **代码规范**: ESLint + Prettier

### 2.2 项目结构
```
src/
├── api/                    # API接口层
│   ├── index.ts           # API统一出口
│   ├── types/             # API类型定义
│   └── modules/           # 业务API模块
├── assets/                # 静态资源
├── components/            # 公共组件
│   ├── common/           # 通用组件
│   ├── business/         # 业务组件
│   └── layout/           # 布局组件
├── composables/           # 组合式函数
├── directive/             # 自定义指令
├── icons/                 # 图标资源
├── layout/                # 布局组件
├── router/                # 路由配置
│   ├── index.ts          # 路由主文件
│   ├── guards.ts         # 路由守卫
│   └── modules/          # 路由模块
├── store/                 # 状态管理
│   ├── index.ts          # Pinia主文件
│   └── modules/          # 状态模块
├── styles/                # 样式文件
├── types/                 # 类型定义
├── utils/                 # 工具函数
│   ├── request.ts        # HTTP请求封装
│   ├── auth.ts           # 认证工具
│   ├── error.ts          # 错误处理
│   └── index.ts          # 工具函数出口
└── views/                 # 页面视图
    ├── modules/          # 业务模块页面
    └── common/           # 通用页面
```

## 3. 核心模块设计

### 3.1 API层设计
```typescript
// api/types/common.ts
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

// api/request.ts
class HttpClient {
  private instance: AxiosInstance;
  
  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        const token = getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => {
        const { data } = response;
        if (data.code === 200) {
          return data.data;
        }
        return Promise.reject(new Error(data.message));
      },
      (error) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }
}
```

### 3.2 状态管理设计
```typescript
// store/modules/user.ts
export const useUserStore = defineStore('user', () => {
  const token = ref<string>('');
  const userInfo = ref<UserInfo | null>(null);
  const permissions = ref<string[]>([]);
  
  // 登录
  const login = async (loginForm: LoginForm) => {
    const data = await loginApi(loginForm);
    token.value = data.token;
    setToken(data.token);
  };
  
  // 获取用户信息
  const getUserInfo = async () => {
    const data = await getUserInfoApi();
    userInfo.value = data.userInfo;
    permissions.value = data.permissions;
  };
  
  // 退出登录
  const logout = () => {
    token.value = '';
    userInfo.value = null;
    permissions.value = [];
    removeToken();
  };
  
  return {
    token,
    userInfo,
    permissions,
    login,
    getUserInfo,
    logout
  };
});
```

### 3.3 权限管理设计
```typescript
// permission.ts
export const setupPermission = (router: Router) => {
  router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore();
    
    // 设置页面标题
    document.title = getPageTitle(to.meta.title);
    
    // 获取token
    const hasToken = getToken();
    
    if (hasToken) {
      if (to.path === '/login') {
        // 已登录，跳转到首页
        next({ path: '/' });
      } else {
        // 检查是否有用户信息
        const hasUserInfo = userStore.userInfo;
        if (hasUserInfo) {
          next();
        } else {
          try {
            // 获取用户信息
            await userStore.getUserInfo();
            // 生成可访问的路由表
            const accessRoutes = await generateRoutes(userStore.permissions);
            accessRoutes.forEach(route => {
              router.addRoute(route);
            });
            next({ ...to, replace: true });
          } catch (error) {
            // 获取用户信息失败，重置token并跳转到登录页
            userStore.logout();
            next(`/login?redirect=${to.path}`);
          }
        }
      }
    } else {
      // 没有token
      if (whiteList.indexOf(to.path) !== -1) {
        // 在免登录白名单，直接进入
        next();
      } else {
        // 其他没有访问权限的页面将被重定向到登录页面
        next(`/login?redirect=${to.path}`);
      }
    }
  });
};
```

## 4. 性能优化策略

### 4.1 代码分割
```typescript
// router/index.ts
const routes: RouteRecordRaw[] = [
  {
    path: '/dashboard',
    component: () => import('@/views/dashboard/index.vue'), // 懒加载
    meta: {
      title: 'dashboard'
    }
  }
];
```

### 4.2 组件优化
```typescript
// 使用defineAsyncComponent进行异步组件加载
import { defineAsyncComponent } from 'vue';

const AsyncComponent = defineAsyncComponent(() =>
  import('./components/HeavyComponent.vue')
);
```

### 4.3 状态管理优化
```typescript
// 使用shallowRef减少响应式开销
const largeList = shallowRef([]);

// 使用computed缓存计算结果
const filteredList = computed(() => {
  return largeList.value.filter(item => item.active);
});
```

## 5. 安全设计

### 5.1 XSS防护
```typescript
// 对用户输入进行转义
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};
```

### 5.2 CSRF防护
```typescript
// 请求中添加CSRF token
const csrfToken = getCsrfToken();
if (csrfToken) {
  config.headers['X-CSRF-Token'] = csrfToken;
}
```

### 5.3 敏感数据保护
```typescript
// 对敏感数据进行加密存储
export const encryptSensitiveData = (data: string): string => {
  const key = import.meta.env.VITE_ENCRYPTION_KEY;
  return CryptoJS.AES.encrypt(data, key).toString();
};
```

## 6. 监控与日志

### 6.1 性能监控
```typescript
// 性能监控服务
class PerformanceMonitor {
  static measurePageLoad() {
    window.addEventListener('load', () => {
      const timing = performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      
      // 上报性能数据
      this.reportPerformance({
        type: 'page_load',
        duration: loadTime,
        timestamp: Date.now()
      });
    });
  }
  
  static reportPerformance(data: PerformanceData) {
    // 发送到监控服务
    navigator.sendBeacon('/api/monitor/performance', JSON.stringify(data));
  }
}
```

### 6.2 错误监控
```typescript
// 全局错误处理
window.addEventListener('error', (event) => {
  const errorData = {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    timestamp: Date.now()
  };
  
  // 上报错误信息
  errorMonitor.report(errorData);
});

// Promise未捕获异常
window.addEventListener('unhandledrejection', (event) => {
  const errorData = {
    message: event.reason?.message || 'Unknown error',
    stack: event.reason?.stack,
    timestamp: Date.now()
  };
  
  errorMonitor.report(errorData);
});
```