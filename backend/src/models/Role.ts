import mongoose, { Schema, Document, Model } from 'mongoose';

export interface PermissionDocument extends Document {
  _id: string;
  name: string;
  code: string;
  description?: string;
  module: string;
  action: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleDocument extends Document {
  _id: string;
  name: string;
  code: string;
  description?: string;
  permissions: string[];
  menuIds: string[];
  status: 'active' | 'inactive';
  sort: number;
  createdAt: Date;
  updatedAt: Date;

  hasPermission(permissionCode: string): boolean;
  addPermission(permissionId: string): Promise<RoleDocument>;
  removePermission(permissionId: string): Promise<RoleDocument>;
}

export interface PermissionModel extends Model<PermissionDocument> {
  checkPermissionExists(code: string): Promise<boolean>;
  createPermissions(permissions: any[]): Promise<PermissionDocument[]>;
}

export interface RoleModel extends Model<RoleDocument> {
  getRolePermissions(roleId: string): Promise<PermissionDocument[]>;
  getDefaultRole(): Promise<RoleDocument | null>;
  getAdminRole(): Promise<RoleDocument | null>;
  checkRoleCodeExists(code: string, excludeId?: string): Promise<boolean>;
}

// 权限模型
const permissionSchema = new Schema<PermissionDocument>({
  name: {
    type: String,
    required: [true, '权限名称不能为空'],
    trim: true,
    maxLength: [50, '权限名称长度不能超过50个字符']
  },
  code: {
    type: String,
    required: [true, '权限编码不能为空'],
    unique: true,
    trim: true,
    maxLength: [100, '权限编码长度不能超过100个字符']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [200, '权限描述长度不能超过200个字符']
  },
  module: {
    type: String,
    required: [true, '权限模块不能为空'],
    trim: true
  },
  action: {
    type: String,
    required: [true, '权限操作不能为空'],
    trim: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// 角色模型
const roleSchema = new Schema<RoleDocument>({
  name: {
    type: String,
    required: [true, '角色名称不能为空'],
    trim: true,
    maxLength: [50, '角色名称长度不能超过50个字符']
  },
  code: {
    type: String,
    required: [true, '角色编码不能为空'],
    unique: true,
    trim: true,
    maxLength: [50, '角色编码长度不能超过50个字符']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [200, '角色描述长度不能超过200个字符']
  },
  permissions: [{
    type: String,
    ref: 'Permission'
  }],
  menuIds: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  sort: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// 权限索引
permissionSchema.index({ code: 1 });
permissionSchema.index({ module: 1 });
permissionSchema.index({ action: 1 });

// 角色索引
roleSchema.index({ code: 1 });
roleSchema.index({ status: 1 });
roleSchema.index({ sort: 1 });

// 静态方法：检查权限是否存在
permissionSchema.statics.checkPermissionExists = async function(code: string) {
  return this.exists({ code });
};

// 静态方法：批量创建权限
permissionSchema.statics.createPermissions = async function(permissions: any[]) {
  return this.insertMany(permissions, { ordered: false });
};

// 静态方法：获取角色权限列表
roleSchema.statics.getRolePermissions = async function(roleId: string) {
  const role = await this.findById(roleId).populate('permissions');
  return role?.permissions || [];
};

// 静态方法：获取默认角色
roleSchema.statics.getDefaultRole = async function(): Promise<RoleDocument | null> {
  return this.findOne({ code: 'user', status: 'active' });
};

// 静态方法：获取管理员角色
roleSchema.statics.getAdminRole = async function(): Promise<RoleDocument | null> {
  return this.findOne({ code: 'admin', status: 'active' });
};

// 静态方法：检查角色编码是否已存在
roleSchema.statics.checkRoleCodeExists = async function(code: string, excludeId?: string) {
  const query: any = { code };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  return this.exists(query);
};

// 实例方法：检查是否有某个权限
roleSchema.methods.hasPermission = function(permissionCode: string): boolean {
  // 这里需要结合权限模型进行查询，简化版本
  return this.permissions.includes(permissionCode);
};

// 实例方法：添加权限
roleSchema.methods.addPermission = async function(permissionId: string) {
  if (!this.permissions.includes(permissionId)) {
    this.permissions.push(permissionId);
    return this.save();
  }
  return this;
};

// 实例方法：移除权限
roleSchema.methods.removePermission = async function(permissionId: string) {
  this.permissions = this.permissions.filter((id: string) => id !== permissionId);
  return this.save();
};

export const Permission = mongoose.model<PermissionDocument, PermissionModel>('Permission', permissionSchema);
export default mongoose.model<RoleDocument, RoleModel>('Role', roleSchema);
