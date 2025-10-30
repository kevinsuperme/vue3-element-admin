/**
 * @description: permission 工具函数单元测试
 * @author: Kevin Wan
 * @date: 2025-10-30
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
      const { hasRole } = require('@/utils/permission');

      expect(hasRole(mockUser, 'admin')).toBe(true);
      expect(hasRole(mockUser, 'editor')).toBe(true);
      expect(hasRole(mockUser, 'user')).toBe(false);
      expect(hasRole(mockEditor, 'admin')).toBe(false);
      expect(hasRole(mockEditor, 'editor')).toBe(true);
    });

    it('应该检查用户是否具有任意指定角色', () => {
      const { hasAnyRole } = require('@/utils/permission');

      expect(hasAnyRole(mockUser, ['admin', 'superuser'])).toBe(true);
      expect(hasAnyRole(mockUser, ['editor', 'moderator'])).toBe(true);
      expect(hasAnyRole(mockUser, ['user', 'guest'])).toBe(false);
      expect(hasAnyRole(mockGuest, ['admin', 'user', 'guest'])).toBe(true);
    });

    it('应该检查用户是否具有所有指定角色', () => {
      const { hasAllRoles } = require('@/utils/permission');

      expect(hasAllRoles(mockUser, ['admin', 'editor'])).toBe(true);
      expect(hasAllRoles(mockUser, ['admin', 'user'])).toBe(false);
      expect(hasAllRoles(mockEditor, ['editor'])).toBe(true);
      expect(hasAllRoles(mockGuest, ['guest'])).toBe(true);
    });

    it('应该处理空角色列表', () => {
      const { hasAnyRole, hasAllRoles } = require('@/utils/permission');

      expect(hasAnyRole(mockUser, [])).toBe(false);
      expect(hasAllRoles(mockUser, [])).toBe(true);
    });

    it('应该处理undefined用户', () => {
      const { hasRole, hasAnyRole, hasAllRoles } = require('@/utils/permission');

      expect(hasRole(undefined, 'admin')).toBe(false);
      expect(hasAnyRole(undefined, ['admin'])).toBe(false);
      expect(hasAllRoles(undefined, ['admin'])).toBe(false);
    });
  });

  describe('Permission-based Access Control', () => {
    it('应该检查用户是否具有指定权限', () => {
      const { hasPermission } = require('@/utils/permission');

      expect(hasPermission(mockUser, 'user:read')).toBe(true);
      expect(hasPermission(mockUser, 'user:write')).toBe(true);
      expect(hasPermission(mockUser, 'user:delete')).toBe(false);
      expect(hasPermission(mockEditor, 'post:create')).toBe(true);
      expect(hasPermission(mockEditor, 'post:delete')).toBe(false);
    });

    it('应该检查用户是否具有任意指定权限', () => {
      const { hasAnyPermission } = require('@/utils/permission');

      expect(hasAnyPermission(mockUser, ['user:read', 'user:write'])).toBe(true);
      expect(hasAnyPermission(mockUser, ['user:delete', 'admin:manage'])).toBe(false);
      expect(hasAnyPermission(mockEditor, ['post:create', 'post:delete'])).toBe(true);
    });

    it('应该检查用户是否具有所有指定权限', () => {
      const { hasAllPermissions } = require('@/utils/permission');

      expect(hasAllPermissions(mockUser, ['user:read', 'user:write'])).toBe(true);
      expect(hasAllPermissions(mockUser, ['user:read', 'user:delete'])).toBe(false);
      expect(hasAllPermissions(mockEditor, ['post:create', 'user:read'])).toBe(true);
    });

    it('应该处理空权限列表', () => {
      const { hasAnyPermission, hasAllPermissions } = require('@/utils/permission');

      expect(hasAnyPermission(mockUser, [])).toBe(false);
      expect(hasAllPermissions(mockUser, [])).toBe(true);
    });
  });

  describe('Resource-based Permissions', () => {
    it('应该检查用户是否可以访问指定资源', () => {
      const { canAccess } = require('@/utils/permission');

      expect(canAccess(mockUser, 'user', 'read')).toBe(true);
      expect(canAccess(mockUser, 'user', 'write')).toBe(true);
      expect(canAccess(mockUser, 'user', 'delete')).toBe(false);
      expect(canAccess(mockEditor, 'post', 'create')).toBe(true);
      expect(canAccess(mockEditor, 'post', 'delete')).toBe(false);
      expect(canAccess(mockGuest, 'content', 'read')).toBe(true);
      expect(canAccess(mockGuest, 'content', 'write')).toBe(false);
    });

    it('应该检查用户是否可以管理指定资源', () => {
      const { canManage } = require('@/utils/permission');

      expect(canManage(mockUser, 'user')).toBe(true);
      expect(canManage(mockEditor, 'user')).toBe(false);
      expect(canManage(mockGuest, 'content')).toBe(false);
    });

    it('应该支持通配符权限匹配', () => {
      const userWithWildcard = {
        ...mockUser,
        permissions: ['user:*', 'post:*']
      };

      const { hasPermission } = require('@/utils/permission');

      expect(hasPermission(userWithWildcard, 'user:read')).toBe(true);
      expect(hasPermission(userWithWildcard, 'user:write')).toBe(true);
      expect(hasPermission(userWithWildcard, 'user:delete')).toBe(true);
      expect(hasPermission(userWithWildcard, 'post:create')).toBe(true);
      expect(hasPermission(userWithWildcard, 'post:edit')).toBe(true);
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

      const { canAccessRoute } = require('@/utils/permission');

      expect(canAccessRoute(mockUser, '/dashboard', routePermissions)).toBe(true);
      expect(canAccessRoute(mockUser, '/users', routePermissions)).toBe(true);
      expect(canAccessRoute(mockEditor, '/users', routePermissions)).toBe(false);
      expect(canAccessRoute(mockEditor, '/posts', routePermissions)).toBe(true);
      expect(canAccessRoute(mockGuest, '/public', routePermissions)).toBe(true);
    });

    it('应该处理未定义的路由权限', () => {
      const { canAccessRoute } = require('@/utils/permission');
      const routePermissions = {};

      expect(canAccessRoute(mockUser, '/unknown', routePermissions)).toBe(false);
    });

    it('应该允许访问公开路由', () => {
      const { canAccessRoute } = require('@/utils/permission');
      const routePermissions = {
        '/public': [],
        '/login': []
      };

      expect(canAccessRoute(mockGuest, '/public', routePermissions)).toBe(true);
      expect(canAccessRoute(mockGuest, '/login', routePermissions)).toBe(true);
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

      const { filterAccessibleRoutes } = require('@/utils/permission');

      const adminRoutes = filterAccessibleRoutes(mockUser, routes);
      const editorRoutes = filterAccessibleRoutes(mockEditor, routes);
      const guestRoutes = filterAccessibleRoutes(mockGuest, routes);

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

      const { filterMenuByPermission } = require('@/utils/permission');

      const userMenu = filterMenuByPermission(mockUser, menuItems);
      const editorMenu = filterMenuByPermission(mockEditor, menuItems);

      expect(userMenu.map(m => m.id)).toEqual([3, 4]); // 只能访问Posts和Profile
      expect(editorMenu.map(m => m.id)).toEqual([3, 4]); // 只能访问Posts和Profile
    });
  });

  describe('Dynamic Permissions', () => {
    it('应该支持动态权限检查', () => {
      const { checkDynamicPermission } = require('@/utils/permission');

      const resourceOwner = { id: 1, name: 'Owner' };
      const otherUser = { id: 2, name: 'Other User' };

      // 用户只能编辑自己的信息
      expect(checkDynamicPermission(mockUser, 'user:edit', { userId: 1, currentUserId: 1 })).toBe(true);
      expect(checkDynamicPermission(mockUser, 'user:edit', { userId: 2, currentUserId: 1 })).toBe(false);
    });

    it('应该支持基于资源的权限检查', () => {
      const { checkResourcePermission } = require('@/utils/permission');

      const resource = { id: 1, authorId: 1, status: 'published' };

      // 作者可以编辑自己的文章
      expect(checkResourcePermission(mockUser, 'post:edit', resource, 1)).toBe(true);
      // 非作者不能编辑
      expect(checkResourcePermission(mockUser, 'post:edit', resource, 2)).toBe(false);
      // 管理员可以编辑任何文章
      expect(checkResourcePermission(mockUser, 'post:edit', resource, 2, 'admin')).toBe(true);
    });
  });

  describe('Permission Utils', () => {
    it('应该获取用户的所有权限', () => {
      const { getAllPermissions } = require('@/utils/permission');

      const permissions = getAllPermissions(mockUser);
      expect(permissions).toEqual(mockUser.permissions);
    });

    it('应该获取用户的所有角色', () => {
      const { getAllRoles } = require('@/utils/permission');

      const roles = getAllRoles(mockUser);
      expect(roles).toEqual(mockUser.roles);
    });

    it('应该检查用户是否为超级管理员', () => {
      const { isSuperAdmin } = require('@/utils/permission');

      expect(isSuperAdmin({ ...mockUser, roles: ['admin', 'super_admin'] })).toBe(true);
      expect(isSuperAdmin(mockUser)).toBe(false);
      expect(isSuperAdmin(mockGuest)).toBe(false);
    });

    it('应该检查用户是否为管理员', () => {
      const { isAdmin } = require('@/utils/permission');

      expect(isAdmin(mockUser)).toBe(true);
      expect(isAdmin(mockEditor)).toBe(false);
      expect(isAdmin(mockGuest)).toBe(false);
    });
  });
});
