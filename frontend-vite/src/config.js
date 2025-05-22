const API_URL = process.env.NODE_ENV === 'production' 
  ? 'http://api:5000'  // Docker service name
  : 'http://localhost:5000';  // Local development

export default API_URL; 