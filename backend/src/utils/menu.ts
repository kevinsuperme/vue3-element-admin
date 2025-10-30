interface MenuItem {
  _id: string;
  name: string;
  code: string;
  path?: string;
  component?: string;
  icon?: string;
  sort: number;
  parentId?: string | null;
  type: string;
  children?: MenuItem[];
}

/**
 * 构建菜单树形结构
 * @param menus 菜单列表
 * @returns 树形结构的菜单
 */
export function buildMenuTree(menus: MenuItem[]): MenuItem[] {
  if (!Array.isArray(menus)) {
    return [];
  }

  // 创建ID到菜单项的映射
  const menuMap = new Map<string, MenuItem>();

  // 先处理所有菜单项，添加到映射中
  menus.forEach(menu => {
    menuMap.set(menu._id, { ...menu, children: [] });
  });

  // 构建树形结构
  const tree: MenuItem[] = [];

  menus.forEach(menu => {
    const menuItem = menuMap.get(menu._id)!;

    if (menu.parentId && menu.parentId !== null && menuMap.has(menu.parentId)) {
      // 如果有父节点，添加到父节点的children中
      const parent = menuMap.get(menu.parentId)!;
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(menuItem);
      // 按sort排序
      parent.children.sort((a, b) => a.sort - b.sort);
    } else {
      // 如果没有父节点，作为根节点
      tree.push(menuItem);
    }
  });

  // 根节点按sort排序
  tree.sort((a, b) => a.sort - b.sort);

  return tree;
}
