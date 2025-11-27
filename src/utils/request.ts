/*
 * @Author: kevinsuperme iphone.com@live.cn
 * @Date: 2025-10-30 03:24:27
 * @LastEditors: kevinsuperme iphone.com@live.cn
 * @LastEditTime: 2025-11-28 01:17:38
 * @FilePath: \vue3-element-admin\src\utils\request.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getToken, removeToken } from '@/utils/auth';

const service = axios.create({
  baseURL: import.meta.env.VITE_BASE_API || '/',
  timeout: 60000
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 添加认证token
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.log('Request Error:', error);
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
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
        ElMessageBox.confirm('您已登出，请重新登录', '确认登出', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          removeToken();
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
    console.log('Response Error:', error);
    let message = error.message || '请求失败';

    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '请求参数错误';
          break;
        case 401:
          message = '未授权，请重新登录';
          removeToken();
          location.reload();
          break;
        case 403:
          message = '权限不足';
          break;
        case 404:
          message = '请求的资源不存在';
          break;
        case 500:
          message = '服务器内部错误';
          break;
        default:
          message = `请求失败: ${error.response.status}`;
      }
    }

    ElMessage({
      message: error.response?.data?.message || message,
      type: 'error',
      duration: 5 * 1000
    });
    return Promise.reject(error);
  }
);

export default service;
