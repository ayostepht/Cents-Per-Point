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
  // Any custom port setup
  return window.location.hostname === 'localhost' && 
         !['5174', '3000', '5173'].includes(window.location.port);
};

const getApiUrl = () => {
  // First check for environment variable (passed from Docker compose)
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  
  if (isDevelopment()) {
    // Local development with Vite
    return 'http://localhost:5001';
  } else if (isDockerLocalhost()) {
    // Docker running locally with standard ports
    return 'http://localhost:5000';
  } else if (isCustomDockerSetup()) {
    // Try to detect the backend port from the custom frontend port
    // Convention: If frontend runs on port 3xyz, backend is on 5xyz
    const portMatch = window.location.port.match(/^3(\d{3})$/);
    if (portMatch) {
      return `http://${window.location.hostname}:5${portMatch[1]}`;
    }
    // For other custom setups, check URL params for backend port
    const urlParams = new URLSearchParams(window.location.search);
    const backendPort = urlParams.get('backend_port');
    if (backendPort) {
      return `http://${window.location.hostname}:${backendPort}`;
    }
    // Fallback to default backend port
    return `http://${window.location.hostname}:5000`;
  } else {
    // Default production deployment
    return `http://${window.location.hostname}:5000`;
  }
};

const API_URL = getApiUrl();

console.log('API URL:', API_URL); // Debug log for troubleshooting
console.log('Window location:', window.location.hostname + ':' + window.location.port);

export default API_URL; 