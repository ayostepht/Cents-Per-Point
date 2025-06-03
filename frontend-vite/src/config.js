// API URL configuration
// For development: frontend on 5174, backend on 5001 (avoids Apple Control Center conflict)
// For production/Docker: frontend and backend both use standard ports with backend on 5000

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5001'  // Development - backend on 5001
  : `http://${window.location.hostname}:5000`;  // Production - backend on 5000

export default API_URL; 