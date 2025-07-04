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

const isCustomDockerSetup = () => {
  // Custom Docker setup with non-standard ports (like 3300:3000, 3333:3000)
  return window.location.port === '3300' || window.location.port === '3333' ||
         (window.location.hostname !== 'localhost' && window.location.port === '3000');
};

const getApiUrl = () => {
  // Debug logging
  console.log('VITE_API_URL from env:', import.meta.env.VITE_API_URL);
  console.log('NODE_ENV:', import.meta.env.NODE_ENV);
  console.log('MODE:', import.meta.env.MODE);
  console.log('All env vars:', import.meta.env);
  
  // If VITE_API_URL is explicitly set, use it (highest priority)
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:5000') {
    console.log('Using explicit VITE_API_URL:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // Check if we're running in a Docker environment (not localhost)
  const isDockerEnvironment = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  
  if (isDockerEnvironment) {
    // In Docker, automatically construct API URL using current hostname and default backend port
    console.log('Detected Docker environment, using automatic API URL construction');
    return `http://${window.location.hostname}:5000`;
  }
  
  if (import.meta.env.MODE === 'production') {
    console.log('Using production localhost fallback');
    return 'http://localhost:5000';
  }
  
  // For local development, use 5001
  console.log('Using development fallback');
  return `http://${window.location.hostname}:5001`;
};

const API_URL = getApiUrl();

console.log('API URL:', API_URL); // Debug log for troubleshooting
console.log('Window location:', window.location.hostname + ':' + window.location.port);

export const API_BASE_URL = API_URL;
export default API_URL; 