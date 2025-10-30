import dotenv from 'dotenv';
import logger from '../utils/logger';

// 加载环境变量
dotenv.config();

interface Config {
  env: string;
  port: number;
  app: {
    name: string;
    version: string;
    description: string;
  };
  api: {
    prefix: string;
    version: string;
  };
  pagination: {
    defaultPageSize: number;
    maxPageSize: number;
  };
  cache: {
    ttl: number;
    prefix: string;
  };
  storage: {
    type: 'local' | 's3' | 'oss';
    path: string;
    baseUrl: string;
  };
  database: {
    uri: string;
    connectionTimeout: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  cors: {
    origin: string[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    maxAge: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
    fileMaxSize: number;
    fileMaxFiles: number;
  };
  upload: {
    maxSize: number;
    uploadDir: string;
    allowedFileTypes: string[];
  };
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
  email?: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  security: {
    bcryptSaltRounds: number;
    sessionSecret: string;
    passwordMinLength: number;
    passwordRequireSpecialChars: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number;
    sessionTimeout: number;
    maxRequestSize: number;
    allowedFileTypes: string[];
  };
}

// 获取环境变量
const nodeEnv = process.env.NODE_ENV || 'development';

// JWT密钥生成函数
const generateJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'your-super-secret-jwt-key') {
    if (nodeEnv === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    // 开发环境使用固定的测试密钥，避免重启后令牌失效
    logger.warn('Using fixed test JWT secret for development. Set JWT_SECRET environment variable for production.');
    return 'development-jwt-secret-key-64-bytes-long-for-testing-only';
  }
  return secret;
};

// Session密钥生成函数
const generateSessionSecret = (): string => {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret === 'your-session-secret') {
    if (nodeEnv === 'production') {
      throw new Error('SESSION_SECRET environment variable is required in production');
    }
    logger.warn('Using random session secret for development. Set SESSION_SECRET environment variable for production.');
    return require('crypto').randomBytes(64).toString('hex');
  }
  return secret;
};

// CORS配置函数
const generateCorsOrigin = (): string[] => {
  const origins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173'];
  // 生产环境应该明确指定允许的域名
  if (nodeEnv === 'production' && origins.includes('*')) {
    throw new Error('Wildcard CORS origin (*) is not allowed in production');
  }
  return origins;
};

const config: Config = {
  env: nodeEnv,
  port: parseInt(process.env.PORT || '3000', 10),
  app: {
    name: process.env.SYSTEM_NAME || 'Vue3 Element Admin',
    version: process.env.SYSTEM_VERSION || '1.0.0',
    description: process.env.SYSTEM_DESCRIPTION || 'Vue3 Element Admin Backend System'
  },
  api: {
    prefix: process.env.API_PREFIX || '/api',
    version: process.env.API_VERSION || 'v1'
  },
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '10', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10)
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
    prefix: process.env.CACHE_PREFIX || 'vue3_admin'
  },
  storage: {
    type: (process.env.STORAGE_TYPE as 'local' | 's3' | 'oss') || 'local',
    path: process.env.STORAGE_PATH || 'uploads',
    baseUrl: process.env.STORAGE_BASE_URL || 'http://localhost:3000/uploads'
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/vue3-admin',
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000', 10)
  },
  jwt: {
    secret: generateJWTSecret(),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  cors: {
    origin: generateCorsOrigin(),
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
    maxAge: 86400 // 24小时
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    fileMaxSize: parseInt(process.env.LOG_FILE_MAX_SIZE || '10485760', 10),
    fileMaxFiles: parseInt(process.env.LOG_FILE_MAX_FILES || '5', 10)
  },
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880', 10),
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES ? process.env.ALLOWED_FILE_TYPES.split(',')
      : ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  },
  redis: process.env.REDIS_HOST ? {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD
  } : undefined,
  email: process.env.EMAIL_HOST ? {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  } : undefined,
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
    sessionSecret: generateSessionSecret(),
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    passwordRequireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL_CHARS === 'true',
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000', 10), // 15分钟
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '86400000', 10), // 24小时
    maxRequestSize: parseInt(process.env.MAX_REQUEST_SIZE || '1048576', 10), // 1MB
    allowedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/json'
    ]
  }
};

export default config;
