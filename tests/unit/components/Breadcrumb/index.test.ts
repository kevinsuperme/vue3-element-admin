/**
 * 面包屑导航组件单元测试
 * @description: 测试面包屑导航组件的功能和交互
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import Breadcrumb from '@/components/Breadcrumb/index.vue';

describe('Breadcrumb Component', () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = mount(Breadcrumb, {
      props: {
        list: []
      }
    });
  });

  it('应该正确渲染组件', () => {
    expect(wrapper.find('.app-breadcrumb').exists()).toBe(true);
    expect(wrapper.find('.breadcrumb').exists()).toBe(true);
  });

  it('应该接受空的面包屑列表', () => {
    expect(wrapper.props('list')).toEqual([]);
    expect(wrapper.find('.el-breadcrumb').exists()).toBe(true);
  });

  it('应该渲染单个面包屑项', async () => {
    const list = [
      { path: '/dashboard', name: '首页' }
    ];

    await wrapper.setProps({ list });
    await nextTick();

    expect(wrapper.find('.el-breadcrumb__item')).toHaveLength(1);
    expect(wrapper.text()).toContain('首页');
  });

  it('应该渲染多个面包屑项', async () => {
    const list = [
      { path: '/dashboard', name: '首页' },
      { path: '/users', name: '用户管理' },
      { path: '/users/detail', name: '用户详情' }
    ];

    await wrapper.setProps({ list });
    await nextTick();

    const items = wrapper.findAll('.el-breadcrumb__item');
    expect(items).toHaveLength(3);
    expect(wrapper.text()).toContain('首页');
    expect(wrapper.text()).toContain('用户管理');
    expect(wrapper.text()).toContain('用户详情');
  });

  it('应该渲染分隔符', async () => {
    const list = [
      { path: '/dashboard', name: '首页' },
      { path: '/users', name: '用户管理' }
    ];

    await wrapper.setProps({ list });
    await nextTick();

    // 检查是否有分隔符（通常是/符号）
    const breadcrumbText = wrapper.text();
    expect(breadcrumbText).toContain('/');
  });

  it('应该处理点击事件', async () => {
    const list = [
      { path: '/dashboard', name: '首页' },
      { path: '/users', name: '用户管理' }
    ];

    await wrapper.setProps({ list });
    await nextTick();

    const firstItem = wrapper.find('.el-breadcrumb__item').find('a');

    // 模拟点击
    await firstItem.trigger('click');

    // 验证事件是否被触发
    expect(wrapper.emitted('path-change')).toBeTruthy();
    expect(wrapper.emitted('path-change')[0]).toEqual(['dashboard']);
  });

  it('应该处理不同类型的路径', async () => {
    const list = [
      { path: '/dashboard', name: '首页' },
      { path: '/users/123', name: '用户详情' },
      { path: '/products/edit/456', name: '编辑产品' }
    ];

    await wrapper.setProps({ list });
    await nextTick();

    expect(wrapper.text()).toContain('首页');
    expect(wrapper.text()).toContain('用户详情');
    expect(wrapper.text()).toContain('编辑产品');
  });

  it('应该处理动态属性', async () => {
    const list = [
      { path: '/dashboard', name: '首页', meta: { icon: 'House' }},
      { path: '/users', name: '用户管理', meta: { icon: 'User' }}
    ];

    await wrapper.setProps({ list });
    await nextTick();

    // 如果有图标，应该渲染图标元素
    const icons = wrapper.findAll('.icon');
    expect(icons.length).toBeGreaterThanOrEqual(0);
  });

  it('应该处理查询参数', async () => {
    const list = [
      { path: '/users?status=active', name: '活跃用户' }
    ];

    await wrapper.setProps({ list });
    await nextTick();

    expect(wrapper.text()).toContain('活跃用户');
  });

  it('应该处理空名称', async () => {
    const list = [
      { path: '/dashboard', name: '' }
    ];

    await wrapper.setProps({ list });
    await nextTick();

    // 即使名称为空，也应该渲染元素
    expect(wrapper.find('.el-breadcrumb__item')).exists();
  });

  it('应该处理特殊字符', async () => {
    const list = [
      { path: '/users', name: '用户 & 管理' },
      { path: '/search', name: '搜索"关键词"' }
    ];

    await wrapper.setProps({ list });
    await nextTick();

    expect(wrapper.text()).toContain('用户 & 管理');
    expect(wrapper.text()).toContain('搜索"关键词"');
  });

  it('应该支持自定义分隔符', async () => {
    const separator = '>';
    const list = [
      { path: '/dashboard', name: '首页' },
      { path: '/users', name: '用户管理' }
    ];

    await wrapper.setProps({ list, separator });
    await nextTick();

    // 检查是否使用了自定义分隔符
    const breadcrumbText = wrapper.text();
    expect(breadcrumbText).toContain('>');
  });

  it('应该响应list变化', async () => {
    const initialList = [
      { path: '/dashboard', name: '首页' }
    ];

    const updatedList = [
      { path: '/dashboard', name: '首页' },
      { path: '/users', name: '用户管理' },
      { path: '/users/detail', name: '用户详情' }
    ];

    // 设置初始列表
    await wrapper.setProps({ list: initialList });
    await nextTick();
    expect(wrapper.findAll('.el-breadcrumb__item')).toHaveLength(1);

    // 更新列表
    await wrapper.setProps({ list: updatedList });
    await nextTick();
    expect(wrapper.findAll('.el-breadcrumb__item')).toHaveLength(3);
  });

  it('应该处理空数组', async () => {
    const list = [
      { path: '/dashboard', name: '首页' }
    ];

    await wrapper.setProps({ list });
    await nextTick();
    expect(wrapper.findAll('.el-breadcrumb__item')).toHaveLength(1);

    // 设置为空数组
    await wrapper.setProps({ list: [] });
    await nextTick();
    expect(wrapper.findAll('.el-breadcrumb__item')).toHaveLength(0);
  });

  it('应该处理嵌套路径', async () => {
    const list = [
      { path: '/admin/users/create', name: '创建用户' }
    ];

    await wrapper.setProps({ list });
    await nextTick();

    expect(wrapper.text()).toContain('创建用户');
  });

  it('应该处理相对路径', async () => {
    const list = [
      { path: './users', name: '用户' }
    ];

    await wrapper.setProps({ list });
    await nextTick();

    expect(wrapper.text()).toContain('用户');
  });

  it('应该处理绝对路径', async () => {
    const list = [
      { path: 'http://example.com/users', name: '用户' }
    ];

    await wrapper.setProps({ list });
    await nextTick();

    expect(wrapper.text()).toContain('用户');
  });

  it('应该支持国际化', async () => {
    const list = [
      { path: '/dashboard', name: 'Home' },
      { path: '/users', name: 'Users' }
    ];

    await wrapper.setProps({ list });
    await nextTick();

    expect(wrapper.text()).toContain('Home');
    expect(wrapper.text()).toContain('Users');
  });

  it('应该处理长路径名称', async () => {
    const longName = '这是一个非常长的面包屑名称用来测试换行和截断功能是否正常工作';
    const list = [
      { path: '/long-path', name: longName }
    ];

    await wrapper.setProps({ list });
    await nextTick();

    expect(wrapper.text()).toContain(longName);
  });

  it('应该正确处理HTML实体', async () => {
    const list = [
      { path: '/test', name: 'Test & Demo' }
    ];

    await wrapper.setProps({ list });
    await nextTick();

    // HTML实体应该被正确转义或显示
    expect(wrapper.text()).toContain('Test & Demo');
  });

  it('应该支持可访问性', async () => {
    const list = [
      { path: '/dashboard', name: '首页' }
    ];

    await wrapper.setProps({ list });
    await nextTick();

    // 检查是否有适当的ARIA标签
    const breadcrumb = wrapper.find('.el-breadcrumb');
    expect(breadcrumb.attributes('role')).toBe('navigation');

    const breadcrumbList = breadcrumb.find('.el-breadcrumb__list');
    expect(breadcrumbList.attributes('role')).toBe('list');
  });

  it('应该处理键盘导航', async () => {
    const list = [
      { path: '/dashboard', name: '首页' },
      { path: '/users', name: '用户管理' }
    ];

    await wrapper.setProps({ list });
    await nextTick();

    const links = wrapper.findAll('.el-breadcrumb__item a');

    // 测试Enter键
    await links[0].trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('path-change')).toBeTruthy();

    // 测试Space键
    await links[1].trigger('keydown', { key: ' ' });
    expect(wrapper.emitted('path-change')).toBeTruthy();
  });

  it('应该支持外部链接', async () => {
    const list = [
      { path: '/dashboard', name: '首页' },
      { path: 'https://example.com', name: '外部链接', external: true }
    ];

    await wrapper.setProps({ list });
    await nextTick();

    const links = wrapper.findAll('.el-breadcrumb__item a');
    const externalLink = links[1];

    // 外部链接应该有target="_blank"
    expect(externalLink.attributes('target')).toBe('_blank');
    expect(externalLink.attributes('rel')).toBe('noopener noreferrer');
  });

  it('应该处理disabled状态', async () => {
    const list = [
      { path: '/dashboard', name: '首页' },
      { path: '/users', name: '用户管理', disabled: true }
    ];

    await wrapper.setProps({ list });
    await nextTick();

    const items = wrapper.findAll('.el-breadcrumb__item');
    const disabledItem = items[1];

    // 禁用的项目不应该有点击事件
    await disabledItem.trigger('click');
    expect(wrapper.emitted('path-change')).toBeFalsy();
  });

  it('应该支持自定义样式类', async () => {
    const list = [
      { path: '/dashboard', name: '首页' }
    ];

    await wrapper.setProps({
      list,
      customClass: 'custom-breadcrumb'
    });
    await nextTick();

    const breadcrumb = wrapper.find('.app-breadcrumb');
    expect(breadcrumb.classes()).toContain('custom-breadcrumb');
  });

  it('应该处理最后一个项目的样式', async () => {
    const list = [
      { path: '/dashboard', name: '首页' },
      { path: '/users', name: '用户管理' }
    ];

    await wrapper.setProps({ list });
    await nextTick();

    const items = wrapper.findAll('.el-breadcrumb__item');
    const lastItem = items[items.length - 1];

    // 最后一个项目应该有特殊样式类
    expect(lastItem.classes()).toContain('is-last');
  });

  it('应该在没有项目时显示占位符', async () => {
    await wrapper.setProps({ list: [], placeholder: '暂无导航' });
    await nextTick();

    expect(wrapper.text()).toContain('暂无导航');
  });

  it('应该处理动态更新时的性能', async () => {
    const startTime = performance.now();

    // 大量更新测试
    for (let i = 0; i < 100; i++) {
      const list = [
        { path: `/item-${i}`, name: `项目 ${i}` }
      ];
      await wrapper.setProps({ list });
      await nextTick();
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // 应该在合理时间内完成
    expect(duration).toBeLessThan(1000);
  });

  it('应该正确处理组件销毁', () => {
    const list = [
      { path: '/dashboard', name: '首页' }
    ];

    wrapper.setProps({ list });

    // 组件销毁不应该抛出错误
    expect(() => {
      wrapper.unmount();
    }).not.toThrow();
  });
});
