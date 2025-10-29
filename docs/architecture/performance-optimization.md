# 性能优化策略文档

## 1. 性能优化目标

### 1.1 核心指标
- **首屏加载时间**: ≤ 1.5秒
- **首次内容绘制(FCP)**: ≤ 1.0秒
- **最大内容绘制(LCP)**: ≤ 2.5秒
- **首次输入延迟(FID)**: ≤ 100毫秒
- **累积布局偏移(CLS)**: ≤ 0.1

### 1.2 性能预算
```javascript
// performance-budget.json
{
  "bundle": {
    "javascript": 250 * 1024,    // 250KB
    "css": 50 * 1024,            // 50KB
    "images": 500 * 1024,        // 500KB
    "total": 1000 * 1024         // 1MB
  },
  "requests": {
    "total": 50,                 // 总请求数
    "javascript": 10,           // JS文件数
    "css": 5,                   // CSS文件数
    "images": 20,               // 图片数
    "third-party": 10           // 第三方请求数
  },
  "timing": {
    "fcp": 1000,                // 首次内容绘制
    "lcp": 2500,                // 最大内容绘制
    "fid": 100,                 // 首次输入延迟
    "cls": 0.1                  // 累积布局偏移
  }
}
```

## 2. 构建优化

### 2.1 Vite构建优化
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'element-plus': ['element-plus'],
          'utils': ['axios', 'dayjs', 'lodash-es']
        }
      }
    },
    // 压缩选项
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    //  chunk大小警告
    chunkSizeWarningLimit: 1000
  },
  
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'element-plus',
      'axios',
      'dayjs'
    ]
  }
});
```

### 2.2 依赖优化
```typescript
// 分析依赖大小
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ]
});
```

### 2.3 Tree Shaking优化
```typescript
// 使用具名导出，便于tree shaking
export const formatDate = (date: Date) => { /* ... */ };
export const debounce = (fn: Function, delay: number) => { /* ... */ };

// 避免副作用的导入
import { debounce } from 'lodash-es';
// 而不是
import _ from 'lodash';
```

## 3. 代码层面优化

### 3.1 组件懒加载
```typescript
// 路由懒加载
const routes = [
  {
    path: '/dashboard',
    component: () => import('@/views/dashboard/index.vue')
  }
];

// 组件懒加载
const HeavyComponent = defineAsyncComponent(() =>
  import('@/components/HeavyComponent.vue')
);

// 带加载状态的异步组件
const AsyncComponent = defineAsyncComponent({
  loader: () => import('@/components/HeavyComponent.vue'),
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  delay: 200,
  timeout: 3000
});
```

### 3.2 虚拟滚动优化
```typescript
// 大数据列表虚拟滚动
import { VirtualList } from 'vue-virtual-scroll-list';

<template>
  <virtual-list
    :size="50"
    :remain="10"
    :items="items"
    :item="ItemComponent"
  />
</template>

// 表格虚拟滚动
import { ElTableVirtualScroll } from 'element-plus-virtual-scroll';

<el-table-virtual-scroll
  :data="tableData"
  :height="400"
  :item-size="48"
>
  <el-table-column prop="name" label="名称" />
  <el-table-column prop="value" label="值" />
</el-table-virtual-scroll>
```

### 3.3 图片懒加载
```typescript
// 自定义图片懒加载指令
const lazyLoad: Directive = {
  mounted(el: HTMLImageElement, binding) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          el.src = binding.value;
          observer.unobserve(el);
        }
      });
    });
    
    observer.observe(el);
  }
};

// 使用示例
<img v-lazy-load="imageSrc" :alt="imageAlt" />
```

### 3.4 防抖节流优化
```typescript
// 搜索防抖
const searchDebounce = debounce((keyword: string) => {
  fetchSearchResults(keyword);
}, 500);

// 滚动节流
const scrollThrottle = throttle(() => {
  updateScrollPosition();
}, 100);

// 组合式函数封装
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}
```

## 4. 网络优化

### 4.1 HTTP缓存策略
```typescript
// Service Worker缓存
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      
      return fetch(event.request).then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open('v1').then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        
        return response;
      });
    })
  );
});
```

### 4.2 请求优化
```typescript
// 请求去重
class RequestDeduplication {
  private pendingRequests = new Map<string, Promise<any>>();
  
  async request<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }
    
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });
    
    this.pendingRequests.set(key, promise);
    return promise;
  }
}

// 使用示例
const dedup = new RequestDeduplication();
const userInfo = await dedup.request('user-info', () => getUserInfo());
```

### 4.3 CDN优化
```typescript
// 动态CDN加载
const loadCDNResource = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.head.appendChild(script);
  });
};

// CDN回退机制
const loadResourceWithFallback = async (cdnUrl: string, localUrl: string) => {
  try {
    await loadCDNResource(cdnUrl);
  } catch (error) {
    console.warn(`CDN load failed, falling back to local: ${localUrl}`);
    await loadCDNResource(localUrl);
  }
};
```

## 5. 渲染优化

### 5.1 虚拟DOM优化
```typescript
// 使用key优化列表渲染
<template>
  <div v-for="item in items" :key="item.id">
    {{ item.name }}
  </div>
</template>

// 避免在v-for中使用v-if
<template>
  <!-- 不推荐 -->
  <div v-for="item in items" v-if="item.active" :key="item.id">
    {{ item.name }}
  </div>
  
  <!-- 推荐 -->
  <div v-for="item in activeItems" :key="item.id">
    {{ item.name }}
  </div>
</template>

<script setup>
const activeItems = computed(() => items.filter(item => item.active));
</script>
```

### 5.2 计算属性优化
```typescript
// 使用计算属性缓存
const expensiveValue = computed(() => {
  return heavyComputation(props.data);
});

// 使用watchEffect处理副作用
watchEffect(() => {
  // 自动追踪响应式依赖
  console.log(`Count is: ${count.value}`);
  updateDOM(count.value);
});
```

### 5.3 组件更新优化
```typescript
// 使用shouldComponentUpdate逻辑
export default defineComponent({
  props: {
    data: Object
  },
  setup(props) {
    // 使用shallowRef减少响应式开销
    const largeData = shallowRef(props.data);
    
    // 精确控制更新
    const shouldUpdate = (newProps, oldProps) => {
      return newProps.data.id !== oldProps.data.id;
    };
    
    return { largeData };
  }
});
```

## 6. 内存优化

### 6.1 内存泄漏预防
```typescript
// 及时清理事件监听
onMounted(() => {
  const handleResize = () => {
    updateLayout();
  };
  
  window.addEventListener('resize', handleResize);
  
  // 清理函数
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });
});

// 清理定时器
let timer: NodeJS.Timeout;

onMounted(() => {
  timer = setInterval(() => {
    updateData();
  }, 1000);
});

onUnmounted(() => {
  clearInterval(timer);
});
```

### 6.2 大对象处理
```typescript
// 使用WeakMap避免内存泄漏
const cache = new WeakMap<object, any>();

const processLargeObject = (obj: object) => {
  if (cache.has(obj)) {
    return cache.get(obj);
  }
  
  const result = expensiveProcess(obj);
  cache.set(obj, result);
  return result;
};
```

## 7. 监控与分析

### 7.1 性能监控
```typescript
// Web Vitals监控
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const reportWebVitals = (metric: any) => {
  // 发送到分析服务
  analytics.send('web_vitals', {
    name: metric.name,
    value: metric.value,
    id: metric.id,
    delta: metric.delta
  });
};

getCLS(reportWebVitals);
getFID(reportWebVitals);
getFCP(reportWebVitals);
getLCP(reportWebVitals);
getTTFB(reportWebVitals);
```

### 7.2 性能分析工具
```typescript
// 性能标记
const measurePerformance = (fn: Function, name: string) => {
  performance.mark(`${name}-start`);
  const result = fn();
  performance.mark(`${name}-end`);
  
  performance.measure(
    name,
    `${name}-start`,
    `${name}-end`
  );
  
  return result;
};

// 使用示例
const expensiveOperation = () => {
  // 耗时操作
};

measurePerformance(expensiveOperation, 'expensive-operation');
```

## 8. 优化检查清单

### 8.1 开发阶段检查项
- [ ] 使用懒加载优化组件加载
- [ ] 实现虚拟滚动处理大数据列表
- [ ] 使用防抖节流优化高频事件
- [ ] 合理使用计算属性和watchEffect
- [ ] 避免在v-for中使用v-if
- [ ] 为列表项添加唯一的key
- [ ] 及时清理事件监听和定时器
- [ ] 使用shallowRef减少响应式开销

### 8.2 构建阶段检查项
- [ ] 启用代码分割和懒加载
- [ ] 压缩和混淆代码
- [ ] 移除console和debugger语句
- [ ] 优化依赖包大小
- [ ] 启用Tree Shaking
- [ ] 配置CDN加速
- [ ] 启用Gzip/Brotli压缩

### 8.3 运行时检查项
- [ ] 监控Web Vitals指标
- [ ] 实现错误监控和上报
- [ ] 监控内存使用情况
- [ ] 优化图片加载策略
- [ ] 实现请求缓存和去重
- [ ] 监控API响应时间
- [ ] 实现Service Worker缓存