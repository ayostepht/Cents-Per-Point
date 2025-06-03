# Contributing to Cents Per Point

Thank you for your interest in contributing to Cents Per Point! This guide will help you get started with contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project follows a simple code of conduct:
- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Keep discussions relevant to the project

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/)
- Basic knowledge of React, Node.js, and Docker

### First Time Setup

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/Cents-Per-Point.git
   cd Cents-Per-Point
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ayostepht/Cents-Per-Point.git
   ```

3. **Verify your setup**
   ```bash
   docker-compose up
   # Visit http://localhost:3000 to confirm everything works
   ```

## Development Setup

### Local Development Environment

1. **Start development containers**
   ```bash
   # Create development docker-compose file (copy from docker-compose.yml and modify)
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **Development URLs**
   - Frontend: http://localhost:3000 (Vite dev server with hot reload)
   - Backend: http://localhost:5000 (Node.js with nodemon)

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes**
   - Follow the coding standards below
   - Test your changes thoroughly
   - Update documentation if needed

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   # or
   git commit -m "fix: resolve issue with specific component"
   ```

## How to Contribute

### Types of Contributions

- 🐛 **Bug Reports**: Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml)
- 💡 **Feature Requests**: Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml)
- ❓ **Questions**: Use the [question template](.github/ISSUE_TEMPLATE/question.yml)
- 📚 **Documentation**: Improve README, add examples, fix typos
- 🧹 **Code**: Bug fixes, new features, performance improvements

### Good First Issues

Look for issues labeled:
- `good first issue` - Perfect for newcomers
- `help wanted` - Community help needed
- `documentation` - Documentation improvements

## Pull Request Process

### Before Submitting

1. **Update your branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Test your changes**
   ```bash
   # Test with production setup
   docker-compose up --build
   
   # Verify all features work
   # Test on multiple browsers (for frontend changes)
   ```

3. **Check for issues**
   ```bash
   # Check Docker logs for errors
   docker-compose logs
   ```

### Submitting Your PR

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Use the [PR template](.github/PULL_REQUEST_TEMPLATE.md)
   - Link related issues
   - Provide clear description
   - Add screenshots for UI changes

3. **Respond to feedback**
   - Address reviewer comments
   - Make requested changes
   - Update documentation if needed

## Coding Standards

### Frontend (React)

```javascript
// Use functional components with hooks
const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);
  
  // Use descriptive variable names
  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle form submission
  };
  
  return (
    <div className="component-container">
      {/* Use semantic HTML */}
    </div>
  );
};

export default MyComponent;
```

### Backend (Node.js)

```javascript
// Use async/await for asynchronous operations
const getRedemptions = async (req, res) => {
  try {
    const redemptions = await db.all('SELECT * FROM redemptions');
    res.json(redemptions);
  } catch (error) {
    console.error('Error fetching redemptions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Use descriptive function names
const calculateCentsPerPoint = (value, taxes, points) => {
  return ((value - taxes) / points) * 100;
};
```

### General Guidelines

- **Naming**: Use descriptive names for variables, functions, and components
- **Comments**: Add comments for complex logic, not obvious code
- **Error Handling**: Always handle errors gracefully
- **Consistency**: Follow existing code patterns in the project

## Project Structure

```
Cents-Per-Point/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── index.js        # Main server file
│   └── Dockerfile
├── frontend-vite/          # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── constants/      # App constants
│   │   └── config.js       # Configuration
│   └── Dockerfile
├── .github/                # GitHub templates and workflows
├── docker-compose.yml      # Production deployment
└── README.md
```

### Key Files

- `frontend-vite/src/config.js` - API URL configuration
- `backend/src/routes/` - API endpoint definitions
- `frontend-vite/src/constants/sourceOptions.js` - Credit card/program options

## Testing

### Manual Testing Checklist

For any changes, please verify:

#### Frontend Changes
- [ ] All pages load without errors
- [ ] Forms submit correctly
- [ ] Data displays properly
- [ ] Responsive design works on mobile
- [ ] Browser console shows no errors

#### Backend Changes
- [ ] API endpoints return correct data
- [ ] Error handling works properly
- [ ] Database operations complete successfully
- [ ] No server crashes or memory leaks

#### Full Application
- [ ] Can add new redemptions
- [ ] Can edit existing redemptions
- [ ] Can delete redemptions
- [ ] Dashboard shows correct calculations
- [ ] Charts and analytics work

### Testing Commands

```bash
# Start application
docker-compose up

# Check logs for errors
docker-compose logs

# Test API endpoints
curl http://localhost:5000/api/redemptions

# Reset database (for testing)
docker-compose down -v
docker-compose up
```

## Documentation

### When to Update Documentation

- Adding new features
- Changing existing functionality
- Fixing bugs that affect user experience
- Adding new configuration options

### Documentation Types

- **README.md**: User-facing documentation
- **Code comments**: Explain complex logic
- **API documentation**: Endpoint descriptions
- **Setup guides**: Installation and deployment

## Community

### Getting Help

- 📖 **Documentation**: Check the README first
- 🐛 **Issues**: Search existing issues before creating new ones
- 💬 **Discussions**: Use GitHub Discussions for general questions
- 📧 **Direct Contact**: For security issues or private matters

### Communication Guidelines

- **Be specific**: Provide details, error messages, and context
- **Be patient**: Maintainers are volunteers with limited time
- **Be helpful**: Help others when you can
- **Stay on topic**: Keep discussions relevant to the project

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Special thanks in documentation

---

## Quick Reference

### Common Commands

```bash
# Start development
docker-compose -f docker-compose.dev.yml up --build

# Start production
docker-compose up

# View logs
docker-compose logs

# Reset database
docker-compose down -v

# Update from upstream
git fetch upstream && git rebase upstream/main
```

### Commit Message Format

```
type: brief description

Longer description if needed

Fixes #123
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

Thank you for contributing to Cents Per Point! 🎉 