import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse, FileInfo } from '../types';
import { asyncHandler } from '../middleware';
import config from '../config';

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
    const name = path.basename(file.originalname, ext);
    const uniqueName = `${uuidv4()}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: any) => {
  if (config.upload.allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// Multer配置
const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxSize,
  },
  fileFilter,
});

export class FileController {
  // 单文件上传
  uploadSingle = [
    upload.single('file'),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '未上传文件',
          timestamp: new Date(),
        });
      }

      const fileInfo: FileInfo = {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        url: `/uploads/${req.file.filename}`,
        uploadedAt: new Date(),
        uploadedBy: (req as any).user?.username,
      };

      const response: ApiResponse = {
        success: true,
        message: '文件上传成功',
        data: fileInfo,
        timestamp: new Date(),
      };

      res.json(response);
    }),
  ];

  // 多文件上传
  uploadMultiple = [
    upload.array('files', 10),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({
          success: false,
          message: '未上传文件',
          timestamp: new Date(),
        });
      }

      const files = (req.files as Express.Multer.File[]).map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        url: `/uploads/${file.filename}`,
        uploadedAt: new Date(),
        uploadedBy: (req as any).user?.username,
      }));

      const response: ApiResponse = {
        success: true,
        message: '文件上传成功',
        data: files,
        timestamp: new Date(),
      };

      res.json(response);
    }),
  ];

  // 获取文件列表
  getFiles = asyncHandler(async (req: Request, res: Response) => {
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
          pages: 0,
        },
      },
      timestamp: new Date(),
    };

    res.json(response);
  });

  // 下载文件
  downloadFile = asyncHandler(async (req: Request, res: Response) => {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在',
        timestamp: new Date(),
      });
    }

    res.download(filePath, filename);
  });

  // 删除文件
  deleteFile = asyncHandler(async (req: Request, res: Response) => {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在',
        timestamp: new Date(),
      });
    }

    fs.unlinkSync(filePath);

    const response: ApiResponse = {
      success: true,
      message: '文件删除成功',
      timestamp: new Date(),
    };

    res.json(response);
  });

  // 批量删除文件
  deleteFiles = asyncHandler(async (req: Request, res: Response) => {
    const { filenames } = req.body;

    if (!Array.isArray(filenames) || filenames.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的文件名列表',
        timestamp: new Date(),
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

    const response: ApiResponse = {
      success: true,
      message: '批量删除文件完成',
      data: results,
      timestamp: new Date(),
    };

    res.json(response);
  });

  // 获取文件统计信息
  getFileStats = asyncHandler(async (req: Request, res: Response) => {
    // 这里应该统计文件信息，暂时返回模拟数据
    const response: ApiResponse = {
      success: true,
      message: '获取文件统计信息成功',
      data: {
        totalFiles: 0,
        totalSize: 0,
        fileTypes: {},
        recentUploads: [],
      },
      timestamp: new Date(),
    };

    res.json(response);
  });
}

export default new FileController();