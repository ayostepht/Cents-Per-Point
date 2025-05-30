// Use relative URL for API calls - this automatically uses the same host as the frontend
// For development: http://localhost:3000 -> API at http://localhost:5000
// For production: http://yourserver.com:3300 -> API at http://yourserver.com:5000
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000'  // Development
  : `http://${window.location.hostname}:5000`;  // Production - same host, port 5000

export default API_URL; 