import request from '@/utils/request';

export function getToken() {
  return request({
    url: '/api/qiniu/upload/token',
    method: 'get'
  });
}
