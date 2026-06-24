/**
 * Basic Auth 凭证管理
 */

const AUTH_KEY = 'ab_auth';
const USER_KEY = 'ab_user';

export function getAuth() {
  return localStorage.getItem(AUTH_KEY);
}

export function getUsername() {
  return localStorage.getItem(USER_KEY) || '';
}

export function setAuth(username, password) {
  const token = btoa(`${username}:${password}`);
  localStorage.setItem(AUTH_KEY, token);
  localStorage.setItem(USER_KEY, username);
  return token;
}

export function removeAuth() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn() {
  return !!getAuth();
}
