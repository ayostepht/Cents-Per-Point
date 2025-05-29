// For browser-based requests, always use localhost since browsers can't resolve Docker service names
// The backend will be accessible on the host machine's localhost:5000
const API_URL = 'http://localhost:5000';

export default API_URL; 