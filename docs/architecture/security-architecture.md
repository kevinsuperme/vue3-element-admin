# 安全架构设计文档

## 1. 安全架构总览

### 1.1 安全威胁模型
```
┌─────────────────────────────────────────────────────────────┐
│                      安全威胁层                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   网络层     │  │   应用层     │  │   数据层     │        │
│  │  (Network)  │  │Application │  │  (Data)     │        │
│  │             │  │             │  │             │        │
│  │ • DDoS攻击  │  │ • XSS攻击   │  │ • SQL注入   │        │
│  │ • 中间人攻击 │  │ • CSRF攻击  │  │ • 数据泄露  │        │
│  │ • 重放攻击  │  │ • 越权访问  │  │ • 数据篡改  │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                 │                 │               │
│  └──────────────────────────────────────────────────────┘        │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                           ▼                                 │
│                    安全防护层                               │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   认证授权   │  │   输入验证   │  │   数据加密   │        │
│  │  (Auth)     │  │ (Validation)│  │ (Encryption)│        │
│  │             │  │             │  │             │        │
│  │ • JWT认证   │  │ • 参数校验  │  │ • 传输加密  │        │
│  │ • RBAC权限  │  │ • 类型检查  │  │ • 存储加密  │        │
│  │ • 多因子认证 │  │ • 长度限制  │  │ • 密钥管理  │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                 │                 │               │
│  └──────────────────────────────────────────────────────┘        │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                           ▼                                 │
│                    监控审计层                               │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   日志审计   │  │   异常监控   │  │   安全扫描   │        │
│  │  (Logging)  │  │ (Monitoring)│  │  (Scanning) │        │
│  │             │  │             │  │             │        │
│  │ • 访问日志  │  │ • 异常告警  │  │ • 漏洞扫描  │        │
│  │ • 操作审计  │  │ • 性能监控  │  │ • 依赖检查  │        │
│  │ • 日志分析  │  │ • 链路追踪  │  │ • 代码审计  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 安全设计原则
1. **最小权限原则**: 用户和系统只拥有完成任务所需的最小权限
2. **深度防御**: 多层安全防护，不依赖单一安全机制
3. **失败安全**: 系统出错时默认拒绝访问
4. **开放设计**: 安全机制不依赖保密性
5. **权限分离**: 关键功能需要多人协作完成
6. **完全审计**: 记录所有安全相关操作

## 2. 认证与授权

### 2.1 JWT认证机制
```typescript
// types/auth.ts
interface JWTPayload {
  sub: string;          // 用户ID
  name: string;         // 用户名
  email: string;        // 邮箱
  roles: string[];      // 角色列表
  permissions: string[]; // 权限列表
  iat: number;          // 签发时间
  exp: number;          // 过期时间
  jti: string;          // JWT ID
  device: string;       // 设备信息
  ip: string;          // IP地址
}

// utils/auth.ts
class AuthManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly TOKEN_EXPIRY_KEY = 'token_expiry';
  
  // 存储token（使用加密存储）
  static setToken(token: string, refreshToken: string): void {
    const encryptedToken = this.encryptToken(token);
    const encryptedRefreshToken = this.encryptToken(refreshToken);
    
    localStorage.setItem(this.ACCESS_TOKEN_KEY, encryptedToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, encryptedRefreshToken);
    
    // 设置过期时间（提前5分钟）
    const payload = this.decodeToken(token);
    const expiryTime = (payload.exp - 300) * 1000;
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
  }
  
  // 获取token
  static getToken(): string | null {
    const encryptedToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    return encryptedToken ? this.decryptToken(encryptedToken) : null;
  }
  
  // 检查token是否即将过期
  static isTokenExpiring(): boolean {
    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;
    
    return Date.now() >= parseInt(expiryTime);
  }
  
  // 加密token
  private static encryptToken(token: string): string {
    const key = import.meta.env.VITE_TOKEN_ENCRYPTION_KEY;
    return CryptoJS.AES.encrypt(token, key).toString();
  }
  
  // 解密token
  private static decryptToken(encryptedToken: string): string {
    const key = import.meta.env.VITE_TOKEN_ENCRYPTION_KEY;
    const bytes = CryptoJS.AES.decrypt(encryptedToken, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
  
  // 解码token
  private static decodeToken(token: string): JWTPayload {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  }
  
  // 清除token
  static clearToken(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }
}
```

### 2.2 多因子认证
```typescript
// types/mfa.ts
interface MFAConfig {
  enabled: boolean;
  methods: MFAMethod[];
  backupCodes: string[];
}

interface MFAMethod {
  type: 'totp' | 'sms' | 'email' | 'app';
  enabled: boolean;
  verified: boolean;
}

// utils/mfa.ts
class MFAManager {
  // TOTP验证
  static async verifyTOTP(secret: string, code: string): Promise<boolean> {
    const expectedCode = this.generateTOTP(secret);
    return this.timingSafeEqual(code, expectedCode);
  }
  
  // 生成TOTP密钥
  static generateSecret(): string {
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    return this.base32Encode(bytes);
  }
  
  // 生成备份码
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
  
  // 时间安全比较（防时序攻击）
  private static timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
  
  // Base32编码
  private static base32Encode(data: Uint8Array): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let bits = 0;
    let value = 0;
    
    for (const byte of data) {
      value = (value << 8) | byte;
      bits += 8;
      
      while (bits >= 5) {
        result += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    
    if (bits > 0) {
      result += alphabet[(value << (5 - bits)) & 31];
    }
    
    return result;
  }
}
```

### 2.3 RBAC权限模型
```typescript
// types/rbac.ts
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  condition?: string;
}

interface UserRole {
  userId: string;
  roleId: string;
  grantedAt: Date;
  grantedBy: string;
}

// directive/permission.ts
export const permission: Directive = {
  mounted(el: HTMLElement, binding) {
    const { value } = binding;
    const userStore = useUserStore();
    
    if (!value || !Array.isArray(value) || value.length !== 2) {
      throw new Error('权限指令需要传入[资源, 操作]数组');
    }
    
    const [resource, action] = value;
    const hasPermission = userStore.hasPermission(resource, action);
    
    if (!hasPermission) {
      el.style.display = 'none';
      el.setAttribute('data-no-permission', 'true');
    }
  },
  
  updated(el: HTMLElement, binding) {
    const { value } = binding;
    const userStore = useUserStore();
    
    if (value && Array.isArray(value) && value.length === 2) {
      const [resource, action] = value;
      const hasPermission = userStore.hasPermission(resource, action);
      
      if (hasPermission) {
        el.style.display = '';
        el.removeAttribute('data-no-permission');
      } else {
        el.style.display = 'none';
        el.setAttribute('data-no-permission', 'true');
      }
    }
  }
};
```

## 3. 输入验证与防护

### 3.1 XSS防护
```typescript
// utils/xss.ts
class XSSProtector {
  private static readonly XSS_REGEX = /<(script|iframe|object|embed|form|img|style|link|meta|body|html|head)(\s|>)/gi;
  private static readonly EVENT_REGEX = /on\w+\s*=/gi;
  
  // HTML转义
  static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      '/': '&#x2F;'
    };
    
    return text.replace(/[&<>"'\/]/g, s => map[s]);
  }
  
  // 清理HTML内容
  static sanitizeHtml(html: string): string {
    // 移除危险标签
    let cleaned = html.replace(this.XSS_REGEX, (match) => {
      return match.replace(/</g, '&lt;');
    });
    
    // 移除事件处理器
    cleaned = cleaned.replace(this.EVENT_REGEX, (match) => {
      return match.replace(/=/g, '&#61;');
    });
    
    return cleaned;
  }
  
  // 验证URL
  static isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      
      // 只允许http和https协议
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }
      
      // 检查是否包含JavaScript
      if (url.toLowerCase().includes('javascript:')) {
        return false;
      }
      
      // 检查是否包含data URI
      if (url.toLowerCase().startsWith('data:')) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  // CSP策略生成
  static generateCSP(): string {
    const policies = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.trusted-cdn.com",
      "style-src 'self' 'unsafe-inline' *.trusted-cdn.com",
      "img-src 'self' data: *.trusted-cdn.com",
      "font-src 'self' *.trusted-cdn.com",
      "connect-src 'self' *.api-domain.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ];
    
    return policies.join('; ');
  }
}

// 使用示例
export const sanitizeInput = (input: string): string => {
  return XSSProtector.escapeHtml(input.trim());
};
```

### 3.2 SQL注入防护
```typescript
// utils/validation.ts
class InputValidator {
  // SQL注入检测模式
  private static readonly SQL_INJECTION_PATTERNS = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|script|declare|truncate)\b)/gi,
    /(--|\/\*|\*\/|xp_)/gi,
    /(\b(or|and)\b.*=.*)/gi
  ];
  
  // 参数化查询构建器
  static buildWhereClause(conditions: Record<string, any>): { clause: string; params: any[] } {
    const clauses: string[] = [];
    const params: any[] = [];
    
    Object.entries(conditions).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // 验证字段名（只允许字母数字和下划线）
        if (!/^[a-zA-Z_]\w*$/.test(key)) {
          throw new Error(`Invalid field name: ${key}`);
        }
        
        // 验证值是否包含SQL注入
        if (this.containsSQLInjection(String(value))) {
          throw new Error(`Potential SQL injection detected in value: ${value}`);
        }
        
        clauses.push(`\`${key}\` = ?`);
        params.push(value);
      }
    });
    
    return {
      clause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
      params
    };
  }
  
  // 检测SQL注入
  private static containsSQLInjection(input: string): boolean {
    return this.SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
  }
  
  // 输入清理
  static sanitizeInput(input: string, type: 'string' | 'number' | 'email' | 'phone'): string {
    switch (type) {
      case 'string':
        return this.sanitizeString(input);
      case 'number':
        return this.sanitizeNumber(input);
      case 'email':
        return this.sanitizeEmail(input);
      case 'phone':
        return this.sanitizePhone(input);
      default:
        return this.sanitizeString(input);
    }
  }
  
  private static sanitizeString(input: string): string {
    // 移除潜在的危险字符
    return input
      .replace(/[<>"'%;()&+]/g, '')
      .trim()
      .slice(0, 255); // 长度限制
  }
  
  private static sanitizeNumber(input: string): string {
    const sanitized = input.replace(/[^0-9.-]/g, '');
    const num = parseFloat(sanitized);
    
    if (isNaN(num)) {
      throw new Error('Invalid number format');
    }
    
    return num.toString();
  }
  
  private static sanitizeEmail(input: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = input.toLowerCase().trim();
    
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }
    
    return sanitized;
  }
  
  private static sanitizePhone(input: string): string {
    return input.replace(/[^0-9+\-\s()]/g, '').slice(0, 20);
  }
}
```

### 3.3 CSRF防护
```typescript
// utils/csrf.ts
class CSRFProtector {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_KEY = 'csrf_token';
  
  // 生成CSRF令牌
  static generateToken(): string {
    const array = new Uint8Array(this.TOKEN_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // 存储CSRF令牌
  static storeToken(token: string): void {
    // 存储在sessionStorage中
    sessionStorage.setItem(this.TOKEN_KEY, token);
    
    // 同时设置在cookie中（HttpOnly=false，允许JS读取）
    document.cookie = `csrf_token=${token}; Path=/; SameSite=Strict`;
  }
  
  // 获取CSRF令牌
  static getToken(): string {
    return sessionStorage.getItem(this.TOKEN_KEY) || this.getCookieToken();
  }
  
  // 验证CSRF令牌
  static validateToken(requestToken: string): boolean {
    const storedToken = this.getToken();
    
    if (!storedToken || !requestToken) {
      return false;
    }
    
    return this.timingSafeCompare(storedToken, requestToken);
  }
  
  // 在请求中添加CSRF令牌
  static addTokenToRequest(config: AxiosRequestConfig): AxiosRequestConfig {
    const token = this.getToken();
    
    if (token) {
      // 添加到请求头
      config.headers['X-CSRF-Token'] = token;
      
      // 对于表单请求，也添加到请求体
      if (config.method?.toLowerCase() !== 'get' && config.data instanceof FormData) {
        config.data.append('csrf_token', token);
      }
    }
    
    return config;
  }
  
  // 从cookie获取令牌
  private static getCookieToken(): string {
    const name = 'csrf_token=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(';');
    
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length, cookie.length);
      }
    }
    
    return '';
  }
  
  // 时间安全比较
  private static timingSafeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }
}

// Axios拦截器配置
export const setupCSRFProtection = () => {
  // 请求拦截器：添加CSRF令牌
  axios.interceptors.request.use((config) => {
    return CSRFProtector.addTokenToRequest(config);
  });
  
  // 响应拦截器：处理CSRF验证失败
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 403 && error.response?.data?.code === 'CSRF_INVALID') {
        // CSRF令牌无效，重新获取
        const newToken = CSRFProtector.generateToken();
        CSRFProtector.storeToken(newToken);
        
        // 重试请求
        return axios.request(error.config);
      }
      
      return Promise.reject(error);
    }
  );
};
```

## 4. 数据加密与保护

### 4.1 数据传输加密
```typescript
// utils/encryption.ts
class EncryptionManager {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  
  // 生成加密密钥
  static async generateKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      true,
      ['encrypt', 'decrypt']
    );
  }
  
  // 加密数据
  static async encrypt(data: string, key: CryptoKey): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // 生成随机IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv
      },
      key,
      dataBuffer
    );
    
    return {
      data: Array.from(new Uint8Array(encryptedBuffer)),
      iv: Array.from(iv)
    };
  }
  
  // 解密数据
  static async decrypt(encryptedData: EncryptedData, key: CryptoKey): Promise<string> {
    const encryptedBuffer = new Uint8Array(encryptedData.data);
    const iv = new Uint8Array(encryptedData.iv);
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: iv
      },
      key,
      encryptedBuffer
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }
  
  // 导出密钥
  static async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    return Array.from(new Uint8Array(exported))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  // 导入密钥
  static async importKey(keyData: string): Promise<CryptoKey> {
    const keyBuffer = new Uint8Array(
      keyData.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    return crypto.subtle.importKey(
      'raw',
      keyBuffer,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      true,
      ['encrypt', 'decrypt']
    );
  }
}

interface EncryptedData {
  data: number[];
  iv: number[];
}
```

### 4.2 敏感数据存储
```typescript
// utils/secure-storage.ts
class SecureStorage {
  private static readonly STORAGE_KEY_PREFIX = 'secure_';
  private static encryptionKey: CryptoKey | null = null;
  
  // 初始化加密密钥
  static async initialize(): Promise<void> {
    const storedKey = localStorage.getItem('encryption_key');
    
    if (storedKey) {
      this.encryptionKey = await EncryptionManager.importKey(storedKey);
    } else {
      this.encryptionKey = await EncryptionManager.generateKey();
      const keyData = await EncryptionManager.exportKey(this.encryptionKey);
      localStorage.setItem('encryption_key', keyData);
    }
  }
  
  // 安全存储数据
  static async setItem(key: string, value: any): Promise<void> {
    if (!this.encryptionKey) {
      await this.initialize();
    }
    
    const jsonString = JSON.stringify(value);
    const encrypted = await EncryptionManager.encrypt(
      jsonString,
      this.encryptionKey!
    );
    
    const secureKey = this.STORAGE_KEY_PREFIX + key;
    localStorage.setItem(secureKey, JSON.stringify(encrypted));
  }
  
  // 安全读取数据
  static async getItem<T>(key: string): Promise<T | null> {
    if (!this.encryptionKey) {
      await this.initialize();
    }
    
    const secureKey = this.STORAGE_KEY_PREFIX + key;
    const encryptedData = localStorage.getItem(secureKey);
    
    if (!encryptedData) {
      return null;
    }
    
    try {
      const encrypted = JSON.parse(encryptedData);
      const decrypted = await EncryptionManager.decrypt(
        encrypted,
        this.encryptionKey!
      );
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return null;
    }
  }
  
  // 删除安全数据
  static removeItem(key: string): void {
    const secureKey = this.STORAGE_KEY_PREFIX + key;
    localStorage.removeItem(secureKey);
  }
  
  // 清除所有安全数据
  static clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
}
```

## 5. 安全监控与审计

### 5.1 安全日志系统
```typescript
// utils/security-logger.ts
enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  PASSWORD_CHANGED = 'password_changed',
  PERMISSION_DENIED = 'permission_denied',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  XSS_ATTEMPT = 'xss_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  CSRF_ATTEMPT = 'csrf_attempt'
}

interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ip: string;
  userAgent: string;
  timestamp: number;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class SecurityLogger {
  private static readonly LOG_ENDPOINT = '/api/security/logs';
  private static readonly MAX_QUEUE_SIZE = 100;
  private static logQueue: SecurityEvent[] = [];
  
  // 记录安全事件
  static log(event: Omit<SecurityEvent, 'timestamp' | 'ip' | 'userAgent'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
      ip: this.getClientIP(),
      userAgent: navigator.userAgent
    };
    
    // 立即发送到服务器（高优先级事件）
    if (['high', 'critical'].includes(event.severity)) {
      this.sendLogToServer(fullEvent);
    } else {
      // 添加到队列（批量发送）
      this.logQueue.push(fullEvent);
      
      if (this.logQueue.length >= this.MAX_QUEUE_SIZE) {
        this.flushLogs();
      }
    }
    
    // 控制台输出（开发环境）
    if (import.meta.env.DEV) {
      console.log(`[Security] ${event.type}:`, fullEvent);
    }
  }
  
  // 批量发送日志
  static async flushLogs(): Promise<void> {
    if (this.logQueue.length === 0) return;
    
    const logs = [...this.logQueue];
    this.logQueue = [];
    
    try {
      await fetch(this.LOG_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AuthManager.getToken()}`
        },
        body: JSON.stringify({ logs })
      });
    } catch (error) {
      console.error('Failed to send security logs:', error);
      // 重新添加到队列
      this.logQueue.unshift(...logs);
    }
  }
  
  // 获取客户端IP
  private static getClientIP(): string {
    // 从服务器获取真实IP
    return window.clientIP || 'unknown';
  }
  
  // 记录登录成功
  static logLoginSuccess(userId: string): void {
    this.log({
      type: SecurityEventType.LOGIN_SUCCESS,
      userId,
      severity: 'low',
      details: {
        provider: 'local',
        mfa_verified: true
      }
    });
  }
  
  // 记录登录失败
  static logLoginFailed(username: string, reason: string): void {
    this.log({
      type: SecurityEventType.LOGIN_FAILED,
      severity: 'medium',
      details: {
        username,
        reason,
        attempt_count: this.getLoginAttemptCount(username)
      }
    });
  }
  
  // 记录权限拒绝
  static logPermissionDenied(userId: string, resource: string, action: string): void {
    this.log({
      type: SecurityEventType.PERMISSION_DENIED,
      userId,
      severity: 'medium',
      details: { resource, action }
    });
  }
  
  // 记录XSS攻击尝试
  static logXSSAttempt(input: string, context: string): void {
    this.log({
      type: SecurityEventType.XSS_ATTEMPT,
      severity: 'high',
      details: { input, context }
    });
  }
  
  // 获取登录尝试次数
  private static getLoginAttemptCount(username: string): number {
    // 从本地存储或服务器获取
    const key = `login_attempts_${username}`;
    const attempts = parseInt(localStorage.getItem(key) || '0');
    return attempts;
  }
}

// 定期发送日志
setInterval(() => {
  SecurityLogger.flushLogs();
}, 30000); // 每30秒发送一次

// 页面卸载时发送剩余日志
window.addEventListener('beforeunload', () => {
  SecurityLogger.flushLogs();
});
```

### 5.2 异常行为检测
```typescript
// utils/anomaly-detection.ts
class AnomalyDetector {
  private static readonly THRESHOLDS = {
    LOGIN_ATTEMPTS: 5,        // 5分钟内最大登录尝试次数
    API_REQUESTS: 100,        // 1分钟内最大API请求数
    FAILED_REQUESTS: 20,      // 1分钟内最大失败请求数
    PASSWORD_RESETS: 3,       // 1小时内最大密码重置次数
    GEO_DISTANCE: 1000        // 最大地理距离（公里）
  };
  
  // 检测异常登录行为
  static detectAnomalousLogin(userId: string, loginData: LoginData): boolean {
    const recentLogins = this.getRecentLogins(userId);
    
    // 检查登录频率
    if (recentLogins.length >= this.THRESHOLDS.LOGIN_ATTEMPTS) {
      this.flagAnomaly('excessive_login_attempts', userId, {
        attempts: recentLogins.length,
        threshold: this.THRESHOLDS.LOGIN_ATTEMPTS
      });
      return true;
    }
    
    // 检查地理位置异常
    if (recentLogins.length > 0) {
      const lastLogin = recentLogins[0];
      const distance = this.calculateDistance(
        loginData.location,
        lastLogin.location
      );
      
      const timeDiff = Date.now() - lastLogin.timestamp;
      const impossibleTravel = distance > this.THRESHOLDS.GEO_DISTANCE &&
                               timeDiff < (distance / 1000) * 3600 * 1000; // 计算所需时间
      
      if (impossibleTravel) {
        this.flagAnomaly('impossible_travel', userId, {
          distance,
          time_diff: timeDiff,
          last_location: lastLogin.location,
          current_location: loginData.location
        });
        return true;
      }
    }
    
    return false;
  }
  
  // 检测API滥用
  static detectAPIAbuse(userId: string, endpoint: string): boolean {
    const requestHistory = this.getAPIRequestHistory(userId, endpoint);
    const timeWindow = 60 * 1000; // 1分钟
    
    const recentRequests = requestHistory.filter(
      req => Date.now() - req.timestamp < timeWindow
    );
    
    if (recentRequests.length > this.THRESHOLDS.API_REQUESTS) {
      this.flagAnomaly('api_abuse', userId, {
        endpoint,
        request_count: recentRequests.length,
        threshold: this.THRESHOLDS.API_REQUESTS,
        time_window: timeWindow
      });
      return true;
    }
    
    return false;
  }
  
  // 标记异常行为
  private static flagAnomaly(type: string, userId: string, details: any): void {
    SecurityLogger.log({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      userId,
      severity: 'high',
      details: {
        anomaly_type: type,
        ...details
      }
    });
    
    // 发送实时告警
    this.sendRealTimeAlert(userId, type, details);
  }
  
  // 获取最近登录记录
  private static getRecentLogins(userId: string): LoginRecord[] {
    // 从本地存储或服务器获取
    const key = `login_history_${userId}`;
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    
    return history.filter((record: LoginRecord) => 
      record.timestamp > fiveMinutesAgo
    );
  }
  
  // 计算地理距离（公里）
  private static calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371; // 地球半径（公里）
    const dLat = this.toRadians(loc2.latitude - loc1.latitude);
    const dLon = this.toRadians(loc2.longitude - loc1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(loc1.latitude)) * 
              Math.cos(this.toRadians(loc2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
  
  // 发送实时告警
  private static sendRealTimeAlert(userId: string, type: string, details: any): void {
    // 通过WebSocket或API发送告警
    fetch('/api/security/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        type,
        details,
        timestamp: Date.now()
      })
    }).catch(console.error);
  }
}
```

## 6. 安全响应机制

### 6.1 自动响应策略
```typescript
// utils/security-response.ts
class SecurityResponse {
  // 自动响应安全事件
  static async respondToSecurityEvent(event: SecurityEvent): Promise<void> {
    switch (event.type) {
      case SecurityEventType.LOGIN_FAILED:
        await this.handleLoginFailed(event);
        break;
        
      case SecurityEventType.XSS_ATTEMPT:
      case SecurityEventType.SQL_INJECTION_ATTEMPT:
        await this.handleMaliciousInput(event);
        break;
        
      case SecurityEventType.PERMISSION_DENIED:
        await this.handlePermissionDenied(event);
        break;
        
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
        await this.handleSuspiciousActivity(event);
        break;
        
      default:
        console.warn('Unknown security event type:', event.type);
    }
  }
  
  // 处理登录失败
  private static async handleLoginFailed(event: SecurityEvent): Promise<void> {
    const { username } = event.details;
    const attempts = SecurityLogger.getLoginAttemptCount(username);
    
    if (attempts >= 5) {
      // 锁定账户
      await this.lockAccount(username, 15 * 60 * 1000); // 锁定15分钟
      
      SecurityLogger.log({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: 'high',
        details: {
          reason: 'excessive_login_attempts',
          attempts,
          username
        }
      });
    }
  }
  
  // 处理恶意输入
  private static async handleMaliciousInput(event: SecurityEvent): Promise<void> {
    const { userId } = event;
    
    // 增加用户风险评分
    await this.increaseRiskScore(userId, 50);
    
    // 临时限制访问
    await this.temporaryRestrict(userId, 30 * 60 * 1000); // 限制30分钟
    
    // 记录详细日志
    SecurityLogger.log({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      userId,
      severity: 'critical',
      details: {
        reason: 'malicious_input_detected',
        input: event.details.input,
        context: event.details.context
      }
    });
  }
  
  // 锁定账户
  private static async lockAccount(identifier: string, duration: number): Promise<void> {
    const lockUntil = Date.now() + duration;
    
    localStorage.setItem(`account_lock_${identifier}`, lockUntil.toString());
    
    // 发送到服务器
    await fetch('/api/security/lock-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier,
        lockUntil,
        reason: 'excessive_login_attempts'
      })
    });
  }
  
  // 检查账户是否被锁定
  static isAccountLocked(identifier: string): boolean {
    const lockUntil = localStorage.getItem(`account_lock_${identifier}`);
    
    if (!lockUntil) return false;
    
    const lockTime = parseInt(lockUntil);
    return Date.now() < lockTime;
  }
  
  // 临时限制访问
  private static async temporaryRestrict(userId: string, duration: number): Promise<void> {
    const restrictUntil = Date.now() + duration;
    
    sessionStorage.setItem(`access_restrict_${userId}`, restrictUntil.toString());
    
    // 显示警告消息
    ElMessage.error({
      message: '检测到异常行为，您的访问已暂时受限',
      duration: 5000
    });
  }
  
  // 增加风险评分
  private static async increaseRiskScore(userId: string, points: number): Promise<void> {
    const currentScore = parseInt(sessionStorage.getItem(`risk_score_${userId}`) || '0');
    const newScore = Math.min(currentScore + points, 100);
    
    sessionStorage.setItem(`risk_score_${userId}`, newScore.toString());
    
    // 如果风险评分过高，采取更强措施
    if (newScore >= 80) {
      await this.forceLogout(userId);
      await this.requireAdditionalVerification(userId);
    }
  }
  
  // 强制登出
  private static async forceLogout(userId: string): Promise<void> {
    const userStore = useUserStore();
    userStore.logout();
    
    SecurityLogger.log({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      userId,
      severity: 'critical',
      details: {
        reason: 'force_logout_due_to_high_risk'
      }
    });
  }
  
  // 要求额外验证
  private static async requireAdditionalVerification(userId: string): Promise<void> {
    // 跳转到额外验证页面
    router.push({
      name: 'AdditionalVerification',
      query: { userId, reason: 'high_risk_score' }
    });
  }
}
```

这个安全架构设计文档涵盖了现代Web应用的主要安全威胁和防护措施。通过实施这些安全机制，可以显著提升应用的安全性，保护用户数据和系统资源免受各种攻击。