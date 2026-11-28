import { API_URL } from './config';
import { getToken } from './storage';

async function request(method, path, body) {
  const token = await getToken();

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error('Cannot reach the server. Check your internet and Wi-Fi.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = res.status;
    throw error;
  }
  return data;
}

export const apiGet = (path) => request('GET', path);
export const apiPost = (path, body) => request('POST', path, body);
export const apiPut = (path, body) => request('PUT', path, body);
export const apiDelete = (path) => request('DELETE', path);
export async function apiUpload(path, fileUri) {
  const token = await getToken();

  const ext = (fileUri.split('.').pop() || 'jpg').toLowerCase().split('?')[0];
  const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('image', { uri: fileUri, name: `photo.${ext}`, type });

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}${path}`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    // Do NOT set Content-Type, the boundary is added automatically

    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch (e) {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(data); // { url: '/uploads/...' }
      else {
        console.log('UPLOAD STATUS:', xhr.status, xhr.responseText);
        reject(new Error(data.message || `Photo upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => {
      console.log('UPLOAD NETWORK ERROR (xhr)');
      reject(new Error('Photo upload failed. Check your Wi-Fi and server.'));
    };
    xhr.timeout = 30000;
    xhr.ontimeout = () => reject(new Error('Photo upload timed out'));

    xhr.send(formData);
  });
}