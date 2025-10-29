import { defineStore } from 'pinia';
import { login as apiLogin, logout as apiLogout, getInfo as apiGetInfo } from '@/api/user';
import { getToken, setToken, removeToken } from '@/utils/auth';
import router, { resetRouter } from '@/router';
import { useTagsViewStore } from './tagsView';
import { usePermissionStore } from './permission';

export interface IUserState {
  token: string;
  userId: string,
  name: string;
  avatar: string;
  introduction: string;
  roles: string[];
}

export interface IUserInfo {
  roles: string[];
  name: string;
  avatar: string;
  introduction: string;
}

const useUserStore = defineStore('user', {
  state: ():IUserState => ({
    token: getToken(),
    userId: '',
    name: '',
    avatar: '',
    introduction: '',
    roles: []
  }),
  getters: {},
  actions: {
    // user login
    login(userInfo: { username: string; password: string }):Promise<void> {
      const { username, password } = userInfo;
      return new Promise((resolve, reject) => {
        apiLogin({ username: username.trim(), password: password }).then(response => {
          const { data } = response;
          this.token = data.token;
          setToken(data.token);
          resolve();
        }).catch(error => {
          reject(error);
        });
      });
    },

    // get user info
    getInfo(): Promise<IUserInfo> {
      return new Promise((resolve, reject) => {
        apiGetInfo(this.token).then(response => {
          const { data } = response;

          if (!data) {
            reject('Verification failed, please Login again.');
          }

          const { roles, name, avatar, introduction } = data;

          // roles must be a non-empty array
          if (!roles || roles.length <= 0) {
            reject('getInfo: roles must be a non-null array!');
          }

          this.roles = roles;
          this.name = name;
          this.avatar = avatar;
          this.introduction = introduction;
          resolve(data);
        }).catch(error => {
          reject(error);
        });
      });
    },

    // user logout
    logout():Promise<void> {
      return new Promise((resolve, reject) => {
        apiLogout(this.token).then(() => {
          this.token = '';
          this.roles = [];
          removeToken();
          resetRouter();

          // reset visited views and cached views
          // to fixed https://github.com/PanJiaChen/vue-element-admin/issues/2485
          try {
            useTagsViewStore().delAllViews();
          } catch (error) {
            console.warn('Failed to clear tags view:', error);
          }

          resolve();
        }).catch(error => {
          reject(error);
        });
      });
    },

    // remove token
    resetToken() {
      this.token = '';
      this.roles = [];
      removeToken();
    },

    // dynamically modify permissions
    async changeRoles(role: string) {
      const token = role + '-token';

      this.token = token;
      setToken(token);

      const infoRes = await this.getInfo();
      const roles = infoRes.roles || [];

      resetRouter();

      // generate accessible routes map based on roles
      try {
        const accessRoutes = await usePermissionStore().generateRoutes(roles);
        // dynamically add accessible routes
        // router.addRoutes(accessRoutes);
        accessRoutes.forEach(item => {
          router.addRoute(item);
        });
      } catch (error) {
        console.error('Failed to generate routes:', error);
        throw error;
      }

      // reset visited views and cached views
      try {
        useTagsViewStore().delAllViews();
      } catch (error) {
        console.warn('Failed to clear tags view:', error);
      }
    }
  }
});

export default useUserStore;
export { useUserStore };
