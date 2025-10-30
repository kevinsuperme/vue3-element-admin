import { Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse, FileInfo } from '../types';
import { asyncHandler, AuthRequest } from '../middleware';
import config from '../config';
import crypto from 'crypto';
import logger from '../utils/logger';
import { performanceMonitor } from '../utils/performance';

// 定义 Multer 文件类型
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// 创建上传目录
const uploadDir = path.join(process.cwd(), config.upload.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 文件存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const dest = path.join(uploadDir, String(year), month, day);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

// 安全的文件扩展名验证
const getSafeFileExtension = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  // 只允许特定的安全扩展名
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.json'];
  return allowedExtensions.includes(ext) ? ext : '';
};

// MIME类型到扩展名的映射验证
const mimeToExtensionMap: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'application/json': ['.json']
};

// 验证MIME类型和扩展名的一致性
const validateFileType = (mimetype: string, originalname: string): boolean => {
  if (!config.upload.allowedFileTypes.includes(mimetype)) {
    return false;
  }

  const extension = getSafeFileExtension(originalname);
  if (!extension) {
    return false;
  }

  const allowedExtensions = mimeToExtensionMap[mimetype];
  return allowedExtensions ? allowedExtensions.includes(extension) : false;
};

// 文件过滤器
const fileFilter = (req: Request, file: MulterFile, cb: FileFilterCallback) => {
  if (validateFileType(file.mimetype, file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型或文件扩展名与MIME类型不匹配') as unknown as null, false);
  }
};

// 路径遍历防护函数
const sanitizeFilePath = (filename: string): string => {
  // 移除路径遍历字符
  const sanitized = filename.replace(/[./\\]/g, '');
  // 只允许字母、数字、下划线和连字符
  return sanitized.replace(/[^a-zA-Z0-9_-]/g, '');
};

// 验证文件路径是否安全
const isValidFilePath = (filePath: string): boolean => {
  // 检查是否包含路径遍历序列
  if (filePath.includes('..') || filePath.includes('./') || filePath.includes('.\\')) {
    return false;
  }

  // 确保路径在upload目录内
  const resolvedPath = path.resolve(filePath);
  const resolvedUploadDir = path.resolve(uploadDir);

  return resolvedPath.startsWith(resolvedUploadDir);
};

// Multer配置
const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxSize,
    files: 10 // 限制单次上传文件数量
  },
  fileFilter
});

export class FileController {
  // 计算文件哈希值
  private calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('error', reject);
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  // 单文件上传
  uploadSingle = [
    upload.single('file'),
    asyncHandler(async (req: Request, res: Response) => {
      const startTime = Date.now();
      const requestId = req.headers['x-request-id'] as string || `file_upload_${startTime}`;

      logger.info('Single file upload attempt:', {
        requestId,
        originalname: req.file?.originalname,
        mimetype: req.file?.mimetype,
        size: req.file?.size,
        ip: req.ip
      });

      if (!req.file) {
        logger.warn('File upload failed: no file provided', { requestId });
        return res.status(400).json({
          success: false,
          message: '未上传文件',
          timestamp: new Date()
        });
      }

      // 验证文件大小
      if (req.file.size > config.upload.maxSize) {
        // 删除上传的文件
        fs.unlinkSync(req.file.path);

        logger.warn('File upload failed: size exceeded', {
          requestId,
          originalname: req.file.originalname,
          size: req.file.size,
          maxSize: config.upload.maxSize
        });

        return res.status(413).json({
          success: false,
          message: '文件大小超过限制',
          timestamp: new Date()
        });
      }

      try {
        // 计算文件哈希值用于完整性验证
        const fileHash = await this.calculateFileHash(req.file.path);

        const fileInfo: FileInfo = {
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
          url: `/uploads/${req.file.filename}`,
          uploadedAt: new Date(),
          uploadedBy: (req as AuthRequest).user?.username,
          hash: fileHash
        };

        const response: ApiResponse = {
          success: true,
          message: '文件上传成功',
          data: fileInfo,
          timestamp: new Date()
        };

        const duration = Date.now() - startTime;
        logger.info('Single file upload successful:', {
          requestId,
          originalname: req.file.originalname,
          size: req.file.size,
          duration: `${duration}ms`
        });

        // 记录性能指标
        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
        performanceMonitor.recordMetric({
          requestId,
          method: 'POST',
          url: '/api/files/upload',
          statusCode: 200,
          responseTime: duration,
          memoryUsage: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            rss: memoryUsage.rss,
            external: memoryUsage.external
          },
          cpuUsage: 0,
          timestamp: new Date()
        });

        res.json(response);
      } catch (error) {
        // 删除上传的文件
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        const duration = Date.now() - startTime;
        logger.error('Single file upload failed:', {
          requestId,
          originalname: req.file.originalname,
          error: error instanceof Error ? error.message : String(error),
          duration: `${duration}ms`
        });

        // 记录错误性能指标
        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
        performanceMonitor.recordMetric({
          requestId,
          method: 'POST',
          url: '/api/files/upload',
          statusCode: 500,
          responseTime: duration,
          memoryUsage: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            rss: memoryUsage.rss,
            external: memoryUsage.external
          },
          cpuUsage: 0,
          timestamp: new Date()
        });

        throw error;
      }
    })
  ];

  // 多文件上传
  uploadMultiple = [
    upload.array('files', 10),
    asyncHandler(async (req: Request, res: Response) => {
      const startTime = Date.now();
      const requestId = req.headers['x-request-id'] as string || `files_upload_${startTime}`;

      const files = req.files as MulterFile[];

      logger.info('Multiple files upload attempt:', {
        requestId,
        fileCount: files?.length || 0,
        ip: req.ip
      });

      if (!files || files.length === 0) {
        logger.warn('Files upload failed: no files provided', { requestId });
        return res.status(400).json({
          success: false,
          message: '未上传文件',
          timestamp: new Date()
        });
      }

      const uploadResults: FileInfo[] = [];
      const errors: string[] = [];

      for (const file of files) {
        try {
          // 验证文件大小
          if (file.size > config.upload.maxSize) {
            fs.unlinkSync(file.path);
            errors.push(`文件 ${file.originalname} 大小超过限制`);

            logger.warn('File size exceeded during multiple upload:', {
              requestId,
              originalname: file.originalname,
              size: file.size,
              maxSize: config.upload.maxSize
            });

            continue;
          }

          // 计算文件哈希值
          const fileHash = await this.calculateFileHash(file.path);

          const fileInfo: FileInfo = {
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            url: `/uploads/${file.filename}`,
            uploadedAt: new Date(),
            uploadedBy: (req as AuthRequest).user?.username,
            hash: fileHash
          };

          uploadResults.push(fileInfo);

          logger.info('Individual file uploaded successfully:', {
            requestId,
            originalname: file.originalname,
            size: file.size,
            hash: fileHash
          });
        } catch (error) {
          // 删除上传失败的文件
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }

          const errorMsg = `文件 ${file.originalname} 处理失败: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);

          logger.error('Individual file upload failed:', {
            requestId,
            originalname: file.originalname,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      const duration = Date.now() - startTime;
      const successCount = uploadResults.length;
      const errorCount = errors.length;

      const response: ApiResponse = {
        success: successCount > 0,
        message: successCount > 0
          ? `成功上传 ${successCount} 个文件${errorCount > 0 ? `，${errorCount} 个文件失败` : ''}`
          : '所有文件上传失败',
        data: {
          uploaded: uploadResults,
          errors
        },
        timestamp: new Date()
      };

      logger.info('Multiple files upload completed:', {
        requestId,
        successCount,
        errorCount,
        duration: `${duration}ms`
      });

      // 记录性能指标
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();
      const statusCode = successCount > 0 ? 200 : 400;
      performanceMonitor.recordMetric({
        requestId,
        method: 'POST',
        url: '/api/files/upload-multiple',
        statusCode,
        responseTime: duration,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      res.status(statusCode).json(response);
    })
  ];

  // 获取文件列表
  getFiles = asyncHandler(async (req: Request, res: Response) => {
    const startTime = performanceMonitor.getCurrentTime();
    const requestId = performanceMonitor.generateRequestId();

    logger.info('开始获取文件列表', {
      requestId,
      query: req.query,
      user: (req as AuthRequest).user?.username || 'anonymous'
    });

    try {
      const { page = 1, limit = 10 } = req.query;

      // 这里应该从数据库获取文件列表，暂时返回空列表
      const response: ApiResponse = {
        success: true,
        message: '获取文件列表成功',
        data: {
          files: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 0
          }
        },
        timestamp: new Date()
      };

      const duration = performanceMonitor.getCurrentTime() - startTime;
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();

      logger.info('文件列表获取成功', {
        requestId,
        duration: `${duration}ms`,
        pagination: (response.data as Record<string, unknown>).pagination
      });

      // 记录性能指标
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: '/api/files',
        statusCode: 200,
        responseTime: duration,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      res.json(response);
    } catch (error) {
      const duration = performanceMonitor.getCurrentTime() - startTime;
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();

      logger.error('文件列表获取失败', {
        requestId,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // 记录性能指标
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: '/api/files',
        statusCode: 500,
        responseTime: duration,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      throw error;
    }
  });

  // 下载文件
  downloadFile = asyncHandler(async (req: Request, res: Response) => {
    const startTime = performanceMonitor.getCurrentTime();
    const requestId = performanceMonitor.generateRequestId();

    logger.info('开始下载文件', {
      requestId,
      filename: req.params.filename,
      user: (req as AuthRequest).user?.username || 'anonymous'
    });

    try {
      const { filename } = req.params;

      // 清理和验证文件名
      const sanitizedFilename = sanitizeFilePath(filename);
      if (!sanitizedFilename) {
        logger.warn('无效的文件名', {
          requestId,
          filename: req.params.filename
        });

        const duration = performanceMonitor.getCurrentTime() - startTime;
        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();

        // 记录性能指标
        performanceMonitor.recordMetric({
          requestId,
          method: 'GET',
          url: '/api/files/download',
          statusCode: 400,
          responseTime: duration,
          memoryUsage: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            rss: memoryUsage.rss,
            external: memoryUsage.external
          },
          cpuUsage: 0,
          timestamp: new Date()
        });

        return res.status(400).json({
          success: false,
          message: '无效的文件名',
          timestamp: new Date()
        });
      }

      // 构建文件路径
      const filePath = path.join(uploadDir, sanitizedFilename);

      // 验证文件路径安全性
      if (!isValidFilePath(filePath)) {
        logger.warn('文件路径访问被拒绝', {
          requestId,
          filename: sanitizedFilename,
          filePath
        });

        const duration = performanceMonitor.getCurrentTime() - startTime;
        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();

        // 记录性能指标
        performanceMonitor.recordMetric({
          requestId,
          method: 'GET',
          url: '/api/files/download',
          statusCode: 403,
          responseTime: duration,
          memoryUsage: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            rss: memoryUsage.rss,
            external: memoryUsage.external
          },
          cpuUsage: 0,
          timestamp: new Date()
        });

        return res.status(403).json({
          success: false,
          message: '访问被拒绝',
          timestamp: new Date()
        });
      }

      if (!fs.existsSync(filePath)) {
        logger.warn('文件不存在', {
          requestId,
          filename: sanitizedFilename,
          filePath
        });

        const duration = performanceMonitor.getCurrentTime() - startTime;
        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();

        // 记录性能指标
        performanceMonitor.recordMetric({
          requestId,
          method: 'GET',
          url: '/api/files/download',
          statusCode: 404,
          responseTime: duration,
          memoryUsage: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            rss: memoryUsage.rss,
            external: memoryUsage.external
          },
          cpuUsage: 0,
          timestamp: new Date()
        });

        return res.status(404).json({
          success: false,
          message: '文件不存在',
          timestamp: new Date()
        });
      }

      const duration = performanceMonitor.getCurrentTime() - startTime;
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();

      logger.info('文件下载成功', {
        requestId,
        filename: sanitizedFilename,
        duration: `${duration}ms`,
        fileSize: fs.statSync(filePath).size
      });

      // 记录性能指标
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: '/api/files/download',
        statusCode: 200,
        responseTime: duration,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      res.download(filePath, sanitizedFilename);
    } catch (error) {
      const duration = performanceMonitor.getCurrentTime() - startTime;
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();

      logger.error('文件下载失败', {
        requestId,
        filename: req.params.filename,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // 记录性能指标
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: '/api/files/download',
        statusCode: 500,
        responseTime: duration,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      throw error;
    }
  });

  // 删除文件
  deleteFile = asyncHandler(async (req: Request, res: Response) => {
    const startTime = performanceMonitor.getCurrentTime();
    const requestId = performanceMonitor.generateRequestId();

    logger.info('开始删除文件', {
      requestId,
      filename: req.params.filename,
      user: (req as AuthRequest).user?.username || 'anonymous'
    });

    try {
      const { filename } = req.params;

      // 清理和验证文件名
      const sanitizedFilename = sanitizeFilePath(filename);
      if (!sanitizedFilename) {
        logger.warn('无效的文件名', {
          requestId,
          filename: req.params.filename
        });

        const duration = performanceMonitor.getCurrentTime() - startTime;
        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();

        // 记录性能指标
        performanceMonitor.recordMetric({
          requestId,
          method: 'DELETE',
          url: '/api/files',
          statusCode: 400,
          responseTime: duration,
          memoryUsage: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            rss: memoryUsage.rss,
            external: memoryUsage.external
          },
          cpuUsage: 0,
          timestamp: new Date()
        });

        return res.status(400).json({
          success: false,
          message: '无效的文件名',
          timestamp: new Date()
        });
      }

      // 构建文件路径
      const filePath = path.join(uploadDir, sanitizedFilename);

      // 验证文件路径安全性
      if (!isValidFilePath(filePath)) {
        logger.warn('文件路径访问被拒绝', {
          requestId,
          filename: sanitizedFilename,
          filePath
        });

        const duration = performanceMonitor.getCurrentTime() - startTime;
        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();

        // 记录性能指标
        performanceMonitor.recordMetric({
          requestId,
          method: 'DELETE',
          url: '/api/files',
          statusCode: 403,
          responseTime: duration,
          memoryUsage: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            rss: memoryUsage.rss,
            external: memoryUsage.external
          },
          cpuUsage: 0,
          timestamp: new Date()
        });

        return res.status(403).json({
          success: false,
          message: '访问被拒绝',
          timestamp: new Date()
        });
      }

      if (!fs.existsSync(filePath)) {
        logger.warn('文件不存在', {
          requestId,
          filename: sanitizedFilename,
          filePath
        });

        const duration = performanceMonitor.getCurrentTime() - startTime;
        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();

        // 记录性能指标
        performanceMonitor.recordMetric({
          requestId,
          method: 'DELETE',
          url: '/api/files',
          statusCode: 404,
          responseTime: duration,
          memoryUsage: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            rss: memoryUsage.rss,
            external: memoryUsage.external
          },
          cpuUsage: 0,
          timestamp: new Date()
        });

        return res.status(404).json({
          success: false,
          message: '文件不存在',
          timestamp: new Date()
        });
      }

      fs.unlinkSync(filePath);

      const duration = performanceMonitor.getCurrentTime() - startTime;
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();

      logger.info('文件删除成功', {
        requestId,
        filename: sanitizedFilename,
        duration: `${duration}ms`,
        fileSize: fs.statSync(filePath).size
      });

      // 记录性能指标
      performanceMonitor.recordMetric({
        requestId,
        method: 'DELETE',
        url: '/api/files',
        statusCode: 200,
        responseTime: duration,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      const response: ApiResponse = {
        success: true,
        message: '文件删除成功',
        timestamp: new Date()
      };

      res.json(response);
    } catch (error) {
      const duration = performanceMonitor.getCurrentTime() - startTime;
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();

      logger.error('文件删除失败', {
        requestId,
        filename: req.params.filename,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // 记录性能指标
      performanceMonitor.recordMetric({
        requestId,
        method: 'DELETE',
        url: '/api/files',
        statusCode: 500,
        responseTime: duration,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      throw error;
    }
  });

  // 批量删除文件
  deleteFiles = asyncHandler(async (req: Request, res: Response) => {
    const startTime = performanceMonitor.getCurrentTime();
    const requestId = performanceMonitor.generateRequestId();

    logger.info('开始批量删除文件', {
      requestId,
      filenamesCount: req.body.filenames?.length || 0,
      user: (req as AuthRequest).user?.username || 'anonymous'
    });

    try {
      const { filenames } = req.body;

      if (!Array.isArray(filenames) || filenames.length === 0) {
        logger.warn('批量删除文件参数无效', {
          requestId,
          filenames: req.body.filenames
        });

        const duration = performanceMonitor.getCurrentTime() - startTime;
        const memoryUsage = performanceMonitor.getCurrentMemoryUsage();

        // 记录性能指标
        performanceMonitor.recordMetric({
          requestId,
          method: 'DELETE',
          url: '/api/files/batch',
          statusCode: 400,
          responseTime: duration,
          memoryUsage: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            rss: memoryUsage.rss,
            external: memoryUsage.external
          },
          cpuUsage: 0,
          timestamp: new Date()
        });

        return res.status(400).json({
          success: false,
          message: '请提供要删除的文件名列表',
          timestamp: new Date()
        });
      }

      const results = filenames.map(filename => {
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          return { filename, success: true };
        }
        return { filename, success: false, error: '文件不存在' };
      });

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      const duration = performanceMonitor.getCurrentTime() - startTime;
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();

      logger.info('批量删除文件完成', {
        requestId,
        duration: `${duration}ms`,
        totalFiles: filenames.length,
        successCount,
        failureCount
      });

      // 记录性能指标
      performanceMonitor.recordMetric({
        requestId,
        method: 'DELETE',
        url: '/api/files/batch',
        statusCode: 200,
        responseTime: duration,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      const response: ApiResponse = {
        success: true,
        message: '批量删除文件完成',
        data: results,
        timestamp: new Date()
      };

      res.json(response);
    } catch (error) {
      const duration = performanceMonitor.getCurrentTime() - startTime;
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();

      logger.error('批量删除文件失败', {
        requestId,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // 记录性能指标
      performanceMonitor.recordMetric({
        requestId,
        method: 'DELETE',
        url: '/api/files/batch',
        statusCode: 500,
        responseTime: duration,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      throw error;
    }
  });

  // 获取文件统计信息
  getFileStats = asyncHandler(async (req: Request, res: Response) => {
    const startTime = performanceMonitor.getCurrentTime();
    const requestId = performanceMonitor.generateRequestId();

    logger.info('开始获取文件统计信息', {
      requestId,
      user: (req as AuthRequest).user?.username || 'anonymous'
    });

    try {
      // 这里应该统计文件信息，暂时返回模拟数据
      const response: ApiResponse = {
        success: true,
        message: '获取文件统计信息成功',
        data: {
          totalFiles: 0,
          totalSize: 0,
          fileTypes: {},
          recentUploads: []
        },
        timestamp: new Date()
      };

      const duration = performanceMonitor.getCurrentTime() - startTime;
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();

      logger.info('文件统计信息获取成功', {
        requestId,
        duration: `${duration}ms`,
        stats: (response.data as Record<string, unknown>)
      });

      // 记录性能指标
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: '/api/files/stats',
        statusCode: 200,
        responseTime: duration,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      res.json(response);
    } catch (error) {
      const duration = performanceMonitor.getCurrentTime() - startTime;
      const memoryUsage = performanceMonitor.getCurrentMemoryUsage();

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('文件统计信息获取失败', {
        requestId,
        duration: `${duration}ms`,
        error: errorMessage
      });

      // 记录性能指标
      performanceMonitor.recordMetric({
        requestId,
        method: 'GET',
        url: '/api/files/stats',
        statusCode: 500,
        responseTime: duration,
        memoryUsage: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
          external: memoryUsage.external
        },
        cpuUsage: 0,
        timestamp: new Date()
      });

      throw error;
    }
  });
}

export default new FileController();
