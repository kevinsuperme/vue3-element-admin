/*
 * @Author: Kevinsuperme iphone.com@live.cn
 * @Date: 2025-10-30 00:00:03
 * @LastEditors: kevinsuperme iphone.com@live.cn
 * @LastEditTime: 2025-10-30 01:50:16
 * @FilePath: \vue3-element-admin\src\directive\permission\permission.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 * @QQ: 1583812938
 * @WX: Superme8169
 */
import { useUserStore } from '@/store/modules/user';

interface PermissionBinding {
  value: string[];
}

function checkPermission(el: HTMLElement, binding: { value: string[] }) {
  const { value } = binding;
  const userStore = useUserStore();
  const roles = userStore.roles;

  if (value && value instanceof Array) {
    if (value.length > 0) {
      const permissionRoles = value;

      const hasPermission = roles.some(role => {
        return permissionRoles.includes(role);
      });

      if (!hasPermission) {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }
    }
  } else {
    throw new Error(`need roles! Like v-permission="['admin','editor']"`);
  }
}

export default {
  mounted(el: HTMLElement, binding: PermissionBinding) {
    checkPermission(el, binding);
  },
  updated(el: HTMLElement, binding: PermissionBinding) {
    checkPermission(el, binding);
  }
};
