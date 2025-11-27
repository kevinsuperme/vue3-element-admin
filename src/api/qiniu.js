import request from '@/utils/request.ts';

export function getToken() {
  return request({
    url: '/api/qiniu/upload/token',
    method: 'get'
  });
}
