import Cookies from 'js-cookie';

const TokenKey = 'vue_admin_token';

export function getToken() {
  return Cookies.get(TokenKey);
}

export function setToken(token: string) {
  return Cookies.set(TokenKey, token, {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false, // 前端需要读取
    sameSite: 'strict',
    expires: 7 // 7天过期
  });
}

export function removeToken() {
  return Cookies.remove(TokenKey, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
}
