/**
 * @description: permission 工具函数单元测试
 * @author: Kevin Wan
 * @date: 2025-10-30
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as permission from '@/utils/permission';

describe('Permission Utils - 权限工具函数测试', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    roles: ['admin', 'editor'],
    permissions: ['user:read', 'user:write', 'post:create', 'post:delete']
  };

  const mockEditor = {
    id: 2,
    name: 'Editor User',
    roles: ['editor'],
    permissions: ['post:create', 'post:edit', 'user:read']
  };

  const mockGuest = {
    id: 3,
    name: 'Guest User',
    roles: ['guest'],
    permissions: ['content:read']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Role-based Permissions', () => {
    it('应该检查用户是否具有指定角色', () => {
      expect(permission.hasRole(mockUser, 'admin')).toBe(true);
      expect(permission.hasRole(mockUser, 'editor')).toBe(true);
      expect(permission.hasRole(mockUser, 'user')).toBe(false);
      expect(permission.hasRole(mockEditor, 'admin')).toBe(false);
      expect(permission.hasRole(mockEditor, 'editor')).toBe(true);
    });

    it('应该检查用户是否具有任意指定角色', () => {
      expect(permission.hasAnyRole(mockUser, ['admin', 'superuser'])).toBe(true);
      expect(permission.hasAnyRole(mockUser, ['editor', 'moderator'])).toBe(true);
      expect(permission.hasAnyRole(mockUser, ['user', 'guest'])).toBe(false);
      expect(permission.hasAnyRole(mockGuest, ['admin', 'user', 'guest'])).toBe(true);
    });

    it('应该检查用户是否具有所有指定角色', () => {
      expect(permission.hasAllRoles(mockUser, ['admin', 'editor'])).toBe(true);
      expect(permission.hasAllRoles(mockUser, ['admin', 'user'])).toBe(false);
      expect(permission.hasAllRoles(mockEditor, ['editor'])).toBe(true);
      expect(permission.hasAllRoles(mockGuest, ['guest'])).toBe(true);
    });

    it('应该处理空角色列表', () => {
      expect(permission.hasAnyRole(mockUser, [])).toBe(false);
      expect(permission.hasAllRoles(mockUser, [])).toBe(true);
    });

    it('应该处理undefined用户', () => {
      expect(permission.hasRole(undefined, 'admin')).toBe(false);
      expect(permission.hasAnyRole(undefined, ['admin'])).toBe(false);
      expect(permission.hasAllRoles(undefined, ['admin'])).toBe(false);
    });
  });

  describe('Permission-based Access Control', () => {
    it('应该检查用户是否具有指定权限', () => {
      expect(permission.hasPermission(mockUser, 'user:read')).toBe(true);
      expect(permission.hasPermission(mockUser, 'user:write')).toBe(true);
      expect(permission.hasPermission(mockUser, 'user:delete')).toBe(false);
      expect(permission.hasPermission(mockEditor, 'post:create')).toBe(true);
      expect(permission.hasPermission(mockEditor, 'post:delete')).toBe(false);
    });

    it('应该检查用户是否具有任意指定权限', () => {
      expect(permission.hasAnyPermission(mockUser, ['user:read', 'user:write'])).toBe(true);
      expect(permission.hasAnyPermission(mockUser, ['user:delete', 'admin:manage'])).toBe(false);
      expect(permission.hasAnyPermission(mockEditor, ['post:create', 'post:delete'])).toBe(true);
    });

    it('应该检查用户是否具有所有指定权限', () => {
      expect(permission.hasAllPermissions(mockUser, ['user:read', 'user:write'])).toBe(true);
      expect(permission.hasAllPermissions(mockUser, ['user:read', 'user:delete'])).toBe(false);
      expect(permission.hasAllPermissions(mockEditor, ['post:create', 'user:read'])).toBe(true);
    });

    it('应该处理空权限列表', () => {
      expect(permission.hasAnyPermission(mockUser, [])).toBe(false);
      expect(permission.hasAllPermissions(mockUser, [])).toBe(true);
    });
  });

  describe('Resource-based Permissions', () => {
    it('应该检查用户是否可以访问指定资源', () => {
      expect(permission.canAccess(mockUser, 'user', 'read')).toBe(true);
      expect(permission.canAccess(mockUser, 'user', 'write')).toBe(true);
      expect(permission.canAccess(mockUser, 'user', 'delete')).toBe(false);
      expect(permission.canAccess(mockEditor, 'post', 'create')).toBe(true);
      expect(permission.canAccess(mockEditor, 'post', 'delete')).toBe(false);
      expect(permission.canAccess(mockGuest, 'content', 'read')).toBe(true);
      expect(permission.canAccess(mockGuest, 'content', 'write')).toBe(false);
    });

    it('应该检查用户是否可以管理指定资源', () => {
      expect(permission.canManage(mockUser, 'user')).toBe(true);
      expect(permission.canManage(mockEditor, 'user')).toBe(false);
      expect(permission.canManage(mockGuest, 'content')).toBe(false);
    });

    it('应该支持通配符权限匹配', () => {
      const userWithWildcard = {
        ...mockUser,
        permissions: ['user:*', 'post:*']
      };

      expect(permission.hasPermission(userWithWildcard, 'user:read')).toBe(true);
      expect(permission.hasPermission(userWithWildcard, 'user:write')).toBe(true);
      expect(permission.hasPermission(userWithWildcard, 'user:delete')).toBe(true);
      expect(permission.hasPermission(userWithWildcard, 'post:create')).toBe(true);
      expect(permission.hasPermission(userWithWildcard, 'post:edit')).toBe(true);
    });
  });

  describe('Route Access Control', () => {
    it('应该检查用户是否可以访问指定路由', () => {
      const routePermissions = {
        '/dashboard': ['admin', 'editor'],
        '/users': ['admin'],
        '/posts': ['editor', 'admin'],
        '/profile': ['user', 'admin', 'editor'],
        '/public': []
      };

      expect(permission.canAccessRoute(mockUser, '/dashboard', routePermissions)).toBe(true);
      expect(permission.canAccessRoute(mockUser, '/users', routePermissions)).toBe(true);
      expect(permission.canAccessRoute(mockEditor, '/users', routePermissions)).toBe(false);
      expect(permission.canAccessRoute(mockEditor, '/posts', routePermissions)).toBe(true);
      expect(permission.canAccessRoute(mockGuest, '/public', routePermissions)).toBe(true);
    });

    it('应该处理未定义的路由权限', () => {
      const routePermissions = {};
      expect(permission.canAccessRoute(mockUser, '/unknown', routePermissions)).toBe(false);
    });

    it('应该允许访问公开路由', () => {
      const routePermissions = {
        '/public': [],
        '/login': []
      };
      expect(permission.canAccessRoute(mockGuest, '/public', routePermissions)).toBe(true);
      expect(permission.canAccessRoute(mockGuest, '/login', routePermissions)).toBe(true);
    });
  });

  describe('Permission Filtering', () => {
    it('应该过滤用户可访问的路由', () => {
      const routes = [
        { path: '/dashboard', roles: ['admin', 'editor'] },
        { path: '/users', roles: ['admin'] },
        { path: '/posts', roles: ['editor'] },
        { path: '/profile', roles: ['user'] },
        { path: '/public', roles: [] }
      ];

      const adminRoutes = permission.filterAccessibleRoutes(mockUser, routes);
      const editorRoutes = permission.filterAccessibleRoutes(mockEditor, routes);
      const guestRoutes = permission.filterAccessibleRoutes(mockGuest, routes);

      expect(adminRoutes.map(r => r.path)).toEqual(
        expect.arrayContaining(['/dashboard', '/users', '/posts', '/profile', '/public'])
      );
      expect(editorRoutes.map(r => r.path)).toEqual(
        expect.arrayContaining(['/dashboard', '/posts', '/profile', '/public'])
      );
      expect(guestRoutes.map(r => r.path)).toEqual(['/public']);
    });

    it('应该根据权限过滤菜单项', () => {
      const menuItems = [
        { id: 1, title: 'Dashboard', permission: 'dashboard:view' },
        { id: 2, title: 'Users', permission: 'user:manage' },
        { id: 3, title: 'Posts', permission: 'post:create' },
        { id: 4, title: 'Profile', permission: null }
      ];

      const userMenu = permission.filterMenuByPermission(mockUser, menuItems);
      const editorMenu = permission.filterMenuByPermission(mockEditor, menuItems);

      expect(userMenu.map(m => m.id)).toEqual([3, 4]); // 只能访问Posts和Profile
      expect(editorMenu.map(m => m.id)).toEqual([3, 4]); // 只能访问Posts和Profile
    });
  });

  describe('Dynamic Permissions', () => {
    it('应该支持动态权限检查', () => {
      const resourceOwner = { id: 1, name: 'Owner' };

      expect(permission.checkDynamicPermission(mockUser, 'user:edit', { userId: 1, currentUserId: 1 })).toBe(true);
      expect(permission.checkDynamicPermission(mockUser, 'user:edit', { userId: 2, currentUserId: 1 })).toBe(false);
    });

    it('应该支持基于资源的权限检查', () => {
      const resource = { id: 1, authorId: 1, status: 'published' };

      expect(permission.checkResourcePermission(mockUser, 'post:edit', resource, 1)).toBe(true);
      expect(permission.checkResourcePermission(mockUser, 'post:edit', resource, 2)).toBe(false);
      expect(permission.checkResourcePermission(mockUser, 'post:edit', resource, 2, 'admin')).toBe(true);
    });
  });

  describe('Permission Utils', () => {
    it('应该获取用户的所有权限', () => {
      const permissions = permission.getAllPermissions(mockUser);
      expect(permissions).toEqual(mockUser.permissions);
    });

    it('应该获取用户的所有角色', () => {
      const roles = permission.getAllRoles(mockUser);
      expect(roles).toEqual(mockUser.roles);
    });

    it('应该检查用户是否为超级管理员', () => {
      expect(permission.isSuperAdmin({ ...mockUser, roles: ['admin', 'super_admin'] })).toBe(true);
      expect(permission.isSuperAdmin(mockUser)).toBe(false);
      expect(permission.isSuperAdmin(mockGuest)).toBe(false);
    });

    it('应该检查用户是否为管理员', () => {
      expect(permission.isAdmin(mockUser)).toBe(true);
      expect(permission.isAdmin(mockEditor)).toBe(false);
      expect(permission.isAdmin(mockGuest)).toBe(false);
    });
  });
});
