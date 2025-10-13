# Contributing to PocketTeller

Thank you for your interest in contributing to PocketTeller (Pocket Banker)! This document provides guidelines and information for contributors.

## 🎯 Ways to Contribute

- 🐛 **Report bugs** and issues
- 💡 **Suggest new features** or improvements
- 📝 **Improve documentation**
- 🧪 **Write or improve tests**
- 🔧 **Submit code fixes** and enhancements
- 🎨 **Improve UI/UX design**
- 🌍 **Add translations** (future feature)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Git
- Code editor (VS Code recommended)
- Supabase account for testing

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/pocketteller.git
   cd pocketteller
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your test credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## 📋 Code Standards

### TypeScript
- Use TypeScript for all new code
- Provide proper type definitions
- Avoid `any` types when possible
- Use interfaces for object types

### React
- Use functional components with hooks
- Follow React best practices
- Use proper dependency arrays in useEffect
- Implement proper error boundaries

### Styling
- Use Tailwind CSS classes
- Follow the design system tokens
- Ensure responsive design
- Test in both light and dark modes

### Code Formatting
- Use Prettier for formatting
- Follow ESLint rules
- Use conventional commit messages
- Write descriptive variable names

## 🧪 Testing Guidelines

### Unit Tests
- Write tests for new components
- Test edge cases and error states
- Mock external dependencies
- Aim for >80% code coverage

### Integration Tests
- Test API endpoints
- Test database interactions
- Test authentication flows
- Test file upload functionality

### E2E Tests
- Test critical user journeys
- Test demo mode functionality
- Test responsive behavior
- Test accessibility features

## 🔒 Security Considerations

### Sensitive Data
- Never commit API keys or secrets
- Use environment variables for config
- Test with non-production data
- Follow data privacy guidelines

### Code Security
- Validate all user inputs
- Use parameterized queries
- Implement proper error handling
- Follow OWASP guidelines

## 📝 Pull Request Process

### Before Submitting
1. **Update from main branch**
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Run quality checks**
   ```bash
   npm run lint
   npm run test
   npm run type-check
   ```

3. **Test your changes**
   - Test in development environment
   - Test demo mode functionality
   - Test responsive design
   - Test accessibility

### Pull Request Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Responsive design tested

## Screenshots (if applicable)
Add screenshots of UI changes.

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No breaking changes
```

### Review Process
1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** in staging environment
4. **Approval** from at least one maintainer
5. **Merge** to main branch

## 🐛 Bug Reports

### Before Reporting
- Check existing issues
- Try the latest version
- Test in demo mode
- Check browser console

### Bug Report Template
```markdown
**Bug Description**
Clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen.

**Actual Behavior**
What actually happens.

**Environment**
- OS: [e.g. macOS 12.0]
- Browser: [e.g. Chrome 91.0]
- App Version: [e.g. 1.0.0]

**Screenshots**
If applicable, add screenshots.

**Additional Context**
Any other relevant information.
```

## 💡 Feature Requests

### Feature Request Template
```markdown
**Feature Description**
Clear description of the proposed feature.

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
What other solutions did you consider?

**Additional Context**
Mockups, references, or examples.
```

## 📚 Documentation

### Areas to Improve
- API documentation
- Component documentation
- Setup guides
- Troubleshooting guides
- Architecture explanations

### Documentation Standards
- Use clear, concise language
- Include code examples
- Add screenshots where helpful
- Keep information up-to-date
- Use proper markdown formatting

## 🏆 Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes
- Project documentation
- Community mentions

## 📞 Getting Help

### Channels
- 💬 **GitHub Discussions** for general questions
- 🐛 **GitHub Issues** for bugs and features
- 📧 **Email** for security issues
- 💻 **Code reviews** for implementation help

### Response Times
- **Issues**: 1-3 business days
- **Pull requests**: 2-5 business days
- **Security issues**: Within 24 hours
- **Documentation**: 1-2 business days

## 📋 Code of Conduct

### Our Standards
- **Be respectful** and inclusive
- **Be collaborative** and helpful
- **Be constructive** in feedback
- **Be patient** with newcomers
- **Be professional** in all interactions

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Political or religious discussions
- Spam or off-topic content
- Doxxing or privacy violations

### Enforcement
- First violation: Warning
- Second violation: Temporary ban
- Third violation: Permanent ban
- Serious violations: Immediate ban

## 🔄 Development Workflow

### Branch Naming
- `feature/description` for new features
- `fix/description` for bug fixes
- `docs/description` for documentation
- `refactor/description` for refactoring
- `test/description` for test improvements

### Commit Messages
Follow conventional commits:
```
type(scope): description

feat(auth): add social login support
fix(ui): resolve mobile navigation issue
docs(api): update endpoint documentation
test(components): add button component tests
```

### Release Process
1. **Version bump** in package.json
2. **Update changelog** with new features
3. **Create release tag** with notes
4. **Deploy to staging** for testing
5. **Deploy to production** after approval

---

Thank you for contributing to PocketTeller! Together, we're building the future of personal finance management. 🚀