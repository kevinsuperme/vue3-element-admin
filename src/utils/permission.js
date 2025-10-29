import { useUserStore } from '@/store/modules/user';

/**
 * @param {Array} value
 * @returns {Boolean}
 * @example see @/views/permission/directive.vue
 */
export default function checkPermission(value) {
  if (value && value instanceof Array && value.length > 0) {
    try {
      const userStore = useUserStore();
      if (!userStore || !userStore.roles) {
        console.warn('User store not available or roles not loaded');
        return false;
      }
      const roles = userStore.roles;
      const permissionRoles = value;

      const hasPermission = roles.some(role => {
        return permissionRoles.includes(role);
      });

      if (!hasPermission) {
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  } else {
    console.error(`need roles! Like v-permission="['admin','editor']"`);
    return false;
  }
}
