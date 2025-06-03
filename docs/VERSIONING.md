# Versioning Strategy

This project follows [Semantic Versioning](https://semver.org/) (SemVer) for releases.

## Version Format

Versions are formatted as `MAJOR.MINOR.PATCH` (e.g., `0.1.0`)

- **MAJOR**: Incremented for incompatible API changes or major feature overhauls
- **MINOR**: Incremented for backwards-compatible functionality additions
- **PATCH**: Incremented for backwards-compatible bug fixes

## Current Version

**v0.1.0** - First public release

## Release Process

### 1. Update Version Numbers

Update the version in both package.json files:
- `backend/package.json`
- `frontend-vite/package.json`

### 2. Update Docker Compose

Update `docker-compose.yml` to reference the new version:
```yaml
services:
  backend:
    image: stephtanner1/cpp-backend:X.Y.Z
  frontend:
    image: stephtanner1/cpp-frontend:X.Y.Z
```

### 3. Create and Push Git Tag

```bash
# Create a new tag
git tag -a vX.Y.Z -m "Release version X.Y.Z"

# Push the tag to trigger CI/CD
git push origin vX.Y.Z
```

### 4. Automated Build Process

When a version tag (e.g., `v0.1.0`) is pushed:
1. GitHub Actions automatically builds Docker images
2. Images are tagged with both the version number and `latest`
3. Images are pushed to Docker Hub

## Available Tags

### Docker Hub Tags
- `stephtanner1/cpp-backend:latest` - Latest stable release
- `stephtanner1/cpp-backend:beta` - Beta/development builds
- `stephtanner1/cpp-backend:X.Y.Z` - Specific version releases

- `stephtanner1/cpp-frontend:latest` - Latest stable release  
- `stephtanner1/cpp-frontend:beta` - Beta/development builds
- `stephtanner1/cpp-frontend:X.Y.Z` - Specific version releases

### Git Tags
- `vX.Y.Z` - Release tags (e.g., `v0.1.0`)

## Branch Strategy

- `main` - Stable releases, builds `latest` Docker tags
- `beta` - Pre-release testing, builds `beta` Docker tags
- Feature branches - Development work

## Release Notes

Release notes are maintained in GitHub Releases, accessible at:
https://github.com/[username]/Cost%20Per%20Point/releases

## Example Release Workflow

```bash
# 1. Update versions in package.json files
# 2. Commit changes
git add .
git commit -m "Bump version to 0.2.0"

# 3. Create and push tag
git tag -a v0.2.0 -m "Release version 0.2.0"
git push origin main
git push origin v0.2.0

# 4. Update docker-compose.yml for production
# 5. Create GitHub Release with release notes
```

## Version History

- **v0.1.0** (2024) - First public release
  - Core CPP tracking functionality
  - Dashboard with analytics
  - Docker deployment support
  - Responsive web interface 