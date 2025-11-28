/**
 * 通用类型定义
 */

// 分页请求参数
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 查询选项
export interface QueryOptions extends PaginationParams {
  keyword?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  category?: string;
  [key: string]: any;
}

// 文件上传类型
export interface FileUploadRequest {
  file: File;
  category?: string;
  description?: string;
}

export interface FileUploadResponse {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

// 通用键值对
export interface KeyValuePair {
  key: string;
  value: any;
  label?: string;
}

// 树形结构
export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  parentId?: string;
  level?: number;
  order?: number;
  [key: string]: any;
}

// 菜单项
export interface MenuItem extends TreeNode {
  path?: string;
  component?: string;
  icon?: string;
  hidden?: boolean;
  meta?: {
    title: string;
    icon?: string;
    roles?: string[];
    permissions?: string[];
    keepAlive?: boolean;
    affix?: boolean;
    noCache?: boolean;
    breadcrumb?: boolean;
    activeMenu?: string;
  };
}

// 表格列定义
export interface TableColumn {
  prop: string;
  label: string;
  width?: string | number;
  minWidth?: string | number;
  fixed?: boolean | 'left' | 'right';
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  formatter?: (row: any, column: any, cellValue: any) => string;
  renderHeader?: (params: any) => VNode;
}

// 表单验证规则
export interface FormRule {
  required?: boolean;
  message?: string;
  trigger?: string | string[];
  min?: number;
  max?: number;
  len?: number;
  pattern?: RegExp;
  validator?: (rule: any, value: any, callback: Function) => void;
  type?: 'string' | 'number' | 'boolean' | 'method' | 'regexp' | 'integer' | 'float' | 'array' | 'object' | 'enum' | 'date' | 'url' | 'hex' | 'email';
}

export interface FormRules {
  [key: string]: FormRule | FormRule[];
}
import type { VNode } from 'vue';
