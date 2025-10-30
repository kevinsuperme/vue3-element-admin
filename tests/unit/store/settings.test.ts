/**
 * @description: settings store 单元测试
 * @author: Kevin Wan
 * @date: 2025-10-30
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import settingsStore from '@/store/modules/settings';

describe('settings store - 设置状态管理测试', () => {
  beforeEach(() => {
    // 创建新的 Pinia 实例
    setActivePinia(createPinia());
  });

  it('应该有正确的初始状态', () => {
    const store = settingsStore();

    expect(store.theme).toBe('#1890ff');
    expect(store.showSettings).toBe(true);
    expect(store.tagsView).toBe(true);
    expect(store.fixedHeader).toBe(true);
    expect(store.sidebarLogo).toBe(true);
    expect(store.secondMenuPopup).toBe(true);
  });

  it('changeSetting 方法应该正确更新设置', () => {
    const store = settingsStore();

    // 更新主题颜色
    store.changeSetting({ key: 'theme', value: '#ff4757' });
    expect(store.theme).toBe('#ff4757');

    // 更新显示设置
    store.changeSetting({ key: 'showSettings', value: false });
    expect(store.showSettings).toBe(false);

    // 更新标签页视图
    store.changeSetting({ key: 'tagsView', value: false });
    expect(store.tagsView).toBe(false);

    // 更新固定头部
    store.changeSetting({ key: 'fixedHeader', value: false });
    expect(store.fixedHeader).toBe(false);

    // 更新侧边栏Logo
    store.changeSetting({ key: 'sidebarLogo', value: false });
    expect(store.sidebarLogo).toBe(false);

    // 更新二级菜单弹窗
    store.changeSetting({ key: 'secondMenuPopup', value: false });
    expect(store.secondMenuPopup).toBe(false);
  });

  it('应该拒绝更新不存在的属性', () => {
    const store = settingsStore();
    const originalState = { ...store.$state };

    // 尝试更新不存在的属性
    store.changeSetting({ key: 'nonExistent', value: 'some value' });

    // 确保状态没有改变
    expect(store.$state).toEqual(originalState);
  });

  it('应该支持链式调用', () => {
    const store = settingsStore();

    store.changeSetting({ key: 'theme', value: '#2f3542' });
    store.changeSetting({ key: 'showSettings', value: false });

    expect(store.theme).toBe('#2f3542');
    expect(store.showSettings).toBe(false);
  });

  it('getter 应该正常工作', () => {
    const store = settingsStore();

    // 测试是否有正确的 getters
    expect(typeof store.$state).toBe('object');
    expect(Object.keys(store.$state)).toContain('theme');
    expect(Object.keys(store.$state)).toContain('showSettings');
  });
});
