import mongoose, { Schema, Document } from 'mongoose';
import { Role } from '../types';

export interface RoleDocument extends Omit<Role, '_id'>, Document {
  _id: string;
}

const roleSchema = new Schema<RoleDocument>({
  name: {
    type: String,
    required: [true, '角色名称不能为空'],
    unique: true,
    trim: true,
    maxlength: [50, '角色名称长度不能超过50个字符']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, '角色描述长度不能超过200个字符']
  },
  permissions: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// 静态方法：获取默认角色
roleSchema.statics.getDefaultRole = async function(): Promise<RoleDocument | null> {
  return this.findOne({ name: 'user', isActive: true });
};

// 静态方法：获取管理员角色
roleSchema.statics.getAdminRole = async function(): Promise<RoleDocument | null> {
  return this.findOne({ name: 'admin', isActive: true });
};

// 实例方法：检查是否有某个权限
roleSchema.methods.hasPermission = function(permission: string): boolean {
  return this.permissions.includes(permission);
};

// 实例方法：添加权限
roleSchema.methods.addPermission = function(permission: string): Promise<RoleDocument> {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
  }
  return this.save();
};

// 实例方法：移除权限
roleSchema.methods.removePermission = function(permission: string): Promise<RoleDocument> {
  this.permissions = this.permissions.filter((p: string) => p !== permission);
  return this.save();
};

// 索引
roleSchema.index({ name: 1 });
roleSchema.index({ isActive: 1 });
roleSchema.index({ permissions: 1 });

export default mongoose.model<RoleDocument>('Role', roleSchema);