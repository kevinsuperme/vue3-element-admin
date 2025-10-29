import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import AuthService from '../services/AuthService';
import { User } from '../models';
import { ApiResponse, PaginatedResponse, LoginRequest, RegisterRequest, ChangePasswordRequest, UpdateUserRequest, QueryOptions } from '../types';
import { errorHandler, asyncHandler } from '../middleware/errorHandler';

export class AuthController {
  // 用户注册
  static register = asyncHandler(async (req: Request, res: Response) => {
    const userData: RegisterRequest = req.body;
    const result = await AuthService.register(userData);

    const response: ApiResponse = {
      success: true,
      message: '注册成功',
      data: {
        user: result.user,
        tokens: result.tokens,
      },
      timestamp: new Date(),
    };

    res.status(201).json(response);
  });

  // 用户登录
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { username, password }: LoginRequest = req.body;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    const result = await AuthService.login(username, password, ip, userAgent);

    const response: ApiResponse = {
      success: true,
      message: '登录成功',
      data: {
        user: result.user,
        tokens: result.tokens,
      },
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });

  // 刷新令牌
  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: '刷新令牌不能为空',
        timestamp: new Date(),
      });
      return;
    }

    const tokens = await AuthService.refreshToken(refreshToken);

    const response: ApiResponse = {
      success: true,
      message: '令牌刷新成功',
      data: tokens,
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });

  // 获取当前用户信息
  static getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const user = await AuthService.getUserInfo(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
        timestamp: new Date(),
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: '获取用户信息成功',
      data: user,
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });

  // 更新当前用户信息
  static updateCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const updateData: UpdateUserRequest = req.body;

    const user = await AuthService.updateUser(userId, updateData);

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
        timestamp: new Date(),
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: '更新用户信息成功',
      data: user,
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });

  // 修改密码
  static changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const passwordData: ChangePasswordRequest = req.body;

    await AuthService.changePassword(userId, passwordData);

    const response: ApiResponse = {
      success: true,
      message: '密码修改成功',
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });

  // 用户退出登录
  static logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    // 这里可以实现令牌黑名单等功能
    // 目前只是返回成功消息

    const response: ApiResponse = {
      success: true,
      message: '退出登录成功',
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });
}

export class UserController {
  // 获取用户列表
  static getUsers = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      search = '',
      isActive,
    } = req.query;

    const query: any = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortObj: any = {};
    sortObj[sort as string] = order === 'desc' ? -1 : 1;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .select('-password'),
      User.countDocuments(query),
    ]);

    const response: PaginatedResponse = {
      success: true,
      message: '获取用户列表成功',
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });

  // 获取单个用户
  static getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
        timestamp: new Date(),
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: '获取用户成功',
      data: user,
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });

  // 创建用户
  static createUser = asyncHandler(async (req: Request, res: Response) => {
    const userData = req.body;
    const user = new User(userData);
    await user.save();

    const response: ApiResponse = {
      success: true,
      message: '创建用户成功',
      data: user,
      timestamp: new Date(),
    };

    res.status(201).json(response);
  });

  // 更新用户
  static updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData: UpdateUserRequest = req.body;

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
        timestamp: new Date(),
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: '更新用户成功',
      data: user,
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });

  // 删除用户
  static deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
        timestamp: new Date(),
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: '删除用户成功',
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });

  // 重置用户密码
  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { password } = req.body;

    await AuthService.resetPassword(id, password);

    const response: ApiResponse = {
      success: true,
      message: '重置密码成功',
      timestamp: new Date(),
    };

    res.status(200).json(response);
  });
}

export default {
  AuthController,
  UserController,
};