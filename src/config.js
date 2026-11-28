import Constants from 'expo-constants';

const BACKEND_PORT = 5000;

function getApiUrl() {
  // In development, Expo knows your PC's IP (the same one your phone uses to load the app)
  const hostUri = Constants.expoConfig?.hostUri; // example: "192.168.1.5:8081"

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:${BACKEND_PORT}/api`;
  }

  // Fallback for a built APK (production). Replace with your deployed backend URL later.
  return 'https://your-deployed-backend.com/api';
}

export const API_URL = getApiUrl();

// Server address without /api, used for images
export const BASE_URL = API_URL.replace(/\/api$/, '');

// Turns "/uploads/abc.png" into a full URL the phone can load
export const imageUrl = (path) =>
  !path ? null : path.startsWith('http') ? path : `${BASE_URL}${path}`;