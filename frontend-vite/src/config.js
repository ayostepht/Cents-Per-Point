// API URL configuration
// For development: frontend on 5174, backend on 5001 (avoids Apple Control Center conflict)
// For production/Docker: frontend and backend both use standard ports with backend on 5000

const isDevelopment = () => {
  // Development is when running on localhost:5174 (Vite dev server)
  return window.location.hostname === 'localhost' && window.location.port === '5174';
};

const isDockerLocalhost = () => {
  // Docker running locally on localhost:3000 or localhost:5173
  return window.location.hostname === 'localhost' && (window.location.port === '3000' || window.location.port === '5173');
};

const getApiUrl = () => {
  if (isDevelopment()) {
    // Local development with Vite
    return 'http://localhost:5001';
  } else if (isDockerLocalhost()) {
    // Docker running locally
    return 'http://localhost:5000';
  } else {
    // Production deployment or other Docker scenarios
    return `http://${window.location.hostname}:5000`;
  }
};

const API_URL = getApiUrl();

console.log('API URL:', API_URL); // Debug log for troubleshooting

export default API_URL; 