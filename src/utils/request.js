import axios from 'axios';
import { useUserStore } from '@/store/modules/user';
import { getToken } from '@/utils/auth';

console.log('import.meta.env=', import.meta.env);

// create an axios instance
const service = axios.create({
  baseURL: import.meta.env.VITE_BASE_API, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 5000 // request timeout
});

// request interceptor
service.interceptors.request.use(
  config => {
    // do something before request is sent

    try {
      const userStore = useUserStore();
      if (userStore && userStore.token) {
        // let each request carry token
        // ['X-Token'] is a custom headers key
        // please modify it according to the actual situation
        config.headers['X-Token'] = getToken();
      }
    } catch (error) {
      console.warn('Failed to get user store for request interceptor:', error);
    }
    return config;
  },
  error => {
    // do something with request error
    console.log(error); // for debug
    return Promise.reject(error);
  }
);

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
  */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
  response => {
    const res = response.data;
    const hasCode = res && typeof res === 'object' && Object.prototype.hasOwnProperty.call(res, 'code');
    const hasSuccess = res && typeof res === 'object' && Object.prototype.hasOwnProperty.call(res, 'success');

    if (hasCode && res.code !== 20000) {
      ElMessage({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000
      });
      if (res.code === 50008 || res.code === 50012 || res.code === 50014) {
        ElMessageBox.confirm('You have been logged out, you can cancel to stay on this page, or log in again', 'Confirm logout', {
          confirmButtonText: 'Re-Login',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }).then(() => {
          try {
            const userStore = useUserStore();
            if (userStore && userStore.resetToken) {
              userStore.resetToken();
            }
          } catch (error) {
            console.error('Failed to reset token:', error);
          }
          location.reload();
        });
      }
      return Promise.reject(new Error(res.message || 'Error'));
    }

    if (hasSuccess && res.success !== true) {
      ElMessage({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000
      });
      return Promise.reject(new Error(res.message || 'Error'));
    }

    return res;
  },
  error => {
    console.log('err' + error); // for debug
    ElMessage({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    });
    return Promise.reject(error);
  }
);

export default service;
