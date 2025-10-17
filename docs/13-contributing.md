# Contributing to Vitto

Thank you for your interest in contributing to Vitto! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for everyone. Please be respectful and considerate in all interactions.

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Be patient with questions
- Respect differing viewpoints

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal attacks
- Publishing others' private information
- Other unethical or unprofessional conduct

## Getting Started

### Prerequisites

- Node.js 22+
- PNPM 10.18.3+
- Git
- A code editor (VS Code recommended)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/vitto.git
cd vitto
```

3. Add upstream remote:

```bash
git remote add upstream https://github.com/riipandi/vitto.git
```

## Development Setup

### Install Dependencies

```bash
# Using PNPM (required)
pnpm install
```

### Build the Project

```bash
# Build all packages
pnpm build

# Build specific package
pnpm build --filter=vitto
pnpm build --filter=create-vitto
```

### Development Mode

```bash
# Run dev server for vitto and website
pnpm dev

# Run website only
pnpm start

# Run create-vitto CLI in dev mode
pnpm create-vitto
```

### Link for Local Testing

```bash
# In the vitto directory
cd packages/vitto
pnpm link --global

# In your test project
pnpm link --global vitto
```

## Project Structure

```
vitto/
├── packages/
│   ├── vitto-plugin/       # Main Vitto plugin package
│   │   ├── src/
│   │   │   ├── index.ts    # Main plugin export
│   │   │   ├── render.ts   # Vite plugin implementation
│   │   │   ├── hooks.ts    # Hooks system implementation
│   │   │   └── options.ts  # Options and type definitions
│   │   └── package.json
│   ├── create-vitto/       # CLI tool for scaffolding
│   │   └── src/
├── docs/                   # Documentation markdown files
├── website/                # Documentation website
├── turbo.json              # Turborepo configuration
├── package.json            # Root package.json
└── pnpm-workspace.yaml     # PNPM workspace config
```

## Development Workflow

### 1. Create a Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-number-description
```

### 2. Make Changes

- Write clear, focused commits
- Follow existing code style
- Add tests for new features
- Update documentation

### 3. Test Your Changes

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format checking and fixing
pnpm check
pnpm format
```

### 4. Commit Changes

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <description>

git commit -m "feat: add support for custom filters"
git commit -m "fix: resolve template rendering issue"
git commit -m "docs: update hooks documentation"
git commit -m "test: add tests for dynamic routes"
```

**Commit Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Testing

### Running Tests

```bash
# Type checking (includes tests)
pnpm typecheck

# Type checking for specific package
pnpm typecheck --filter=vitto
```

### Test Coverage

We aim for high test coverage:

- Core functionality: 90%+
- Utilities: 80%+
- Integration: 70%+

## Code Style

### TypeScript

- Use TypeScript for all code
- Add proper type annotations
- Avoid `any` types when possible
- Use interfaces for object shapes

```ts
// Good
interface HookData {
  title: string
  items: string[]
}

function processData(data: HookData): void {
  // Implementation
}

// Avoid
function processData(data: any) {
  // Implementation
}
```

### Formatting and Linting

We use Biome for formatting and linting:

```bash
# Check code
pnpm check

# Lint code
pnpm lint

# Format code
pnpm format
```

### Naming Conventions

- **Files**: `kebab-case.ts`
- **Classes**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase`

```ts
// File: my-component.ts

export const DEFAULT_CONFIG = {
  // constants
}

export interface MyComponentOptions {
  // interface
}

export class MyComponent {
  // class
}

export function createComponent() {
  // function
}
```

### Comments

- Use JSDoc for public APIs
- Write clear inline comments for complex logic
- Explain "why", not "what"

```ts
/**
 * Creates a hook function for data injection.
 *
 * @param name - Hook identifier used in templates
 * @param handler - Function that returns hook data
 * @returns Hook function that can be registered
 *
 * @example
 * ```ts
 * const myHook = defineHooks('myData', async () => {
 *   return await fetchData()
 * })
 * ```
 */
export function defineHooks<T, P>(
  name: string,
  handler: (params?: P) => T | Promise<T>
): HookFunction<T, P> {
  // Implementation
}
```

## Submitting Changes

### Pull Request Guidelines

1. **Title**: Clear and descriptive
   - Good: "feat: add support for custom Vento filters"
   - Bad: "Update code"

2. **Description**: Include:
   - What changes were made
   - Why the changes were necessary
   - Any breaking changes
   - Related issues (use `Closes #123`)

3. **Tests**: All tests must pass
4. **Documentation**: Update docs if needed
5. **Changelog**: Update if making user-facing changes

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] Tests pass locally
- [ ] Type checking passes
- [ ] Code linted and formatted
- [ ] Updated documentation
- [ ] Followed code style guidelines
- [ ] Self-review completed

## Related Issues
Closes #123
```

### Review Process

1. Automated checks must pass (CI/CD)
2. At least one maintainer review required
3. Address review feedback
4. Squash commits if requested
5. Maintainer will merge when ready

## Reporting Issues

### Before Creating an Issue

1. Search existing issues
2. Check documentation
3. Try to reproduce with minimal example

### Creating a Good Issue

**Bug Reports** should include:

- Clear title
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node version, Vitto version)
- Minimal reproduction (CodeSandbox, GitHub repo)

```markdown
**Description**
Clear description of the bug

**To Reproduce**
1. Create file `example.vto`
2. Add content: ...
3. Run `pnpm build`
4. See error

**Expected Behavior**
Should build successfully

**Actual Behavior**
Error: ...

**Environment**
- OS: macOS 14.0
- Node: 22.0.0
- PNPM: 10.18.3
- Vitto: 0.1.0

**Minimal Reproduction**
https://github.com/username/vitto-bug-reproduction
```

**Feature Requests** should include:

- Clear use case
- Proposed solution
- Alternative solutions considered
- Examples of how it would be used

```markdown
**Is your feature request related to a problem?**
I'm frustrated when...

**Proposed Solution**
Add a new option `customFilter` that...

**Alternative Solutions**
Considered using... but it doesn't work because...

**Example Usage**
```ts
vitto({
  customFilter: (value) => value.toUpperCase()
})
```

## Documentation

### Updating Docs

Documentation is in the `docs/` directory:

```
docs/
├── 01-getting-started.md
├── 02-configuration.md
├── 03-templates.md
└── ...
```

### Documentation Style

- Use clear, simple language
- Include code examples
- Add screenshots when helpful
- Link to related sections
- Keep examples minimal and focused

## Release Process

Only maintainers can publish releases.

### Version Bumping

We use [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features (backward compatible)
- **Patch** (0.0.1): Bug fixes

### Publishing Steps

1. **Ensure all checks pass**:
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm check
   ```

2. **Update changelog**:
   ```bash
   # Edit CHANGELOG.md in each package
   # Add release notes under new version
   ```

3. **Update dependencies**:
   ```bash
   pnpm update-deps
   ```

4. **Build all packages**:
   ```bash
   pnpm build
   ```

5. **Dry run publish** (test before actual publish):
   ```bash
   pnpm publish:dry
   ```

6. **Publish to npm**:
   ```bash
   pnpm publish:npm
   ```

7. **Push tags**:
   ```bash
   git push --follow-tags
   ```

8. **Create GitHub release**:
   - Go to GitHub releases
   - Create new release from tag
   - Copy changelog content
   - Publish release

### Release Checklist

- [ ] All checks passing (typecheck, lint)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated for affected packages
- [ ] Dependencies updated
- [ ] All packages built successfully
- [ ] Dry run publish successful
- [ ] Published to npm
- [ ] Git tags pushed
- [ ] GitHub release created
- [ ] Announcement posted (if major/minor)

## Getting Help

### Communication Channels

- **GitHub Discussions**: General questions and discussions
- **GitHub Issues**: Bug reports and feature requests
- **Discord**: Real-time chat (coming soon)

### Asking Questions

When asking for help:

1. Search existing discussions/issues first
2. Provide context and details
3. Include code examples
4. Be patient and respectful

## Recognition

Contributors are recognized in:

- README.md contributors section
- Release notes
- GitHub contributors page
- Annual contributor highlights

### Types of Contributions

All contributions are valued:

- 💻 Code contributions
- 📖 Documentation improvements
- 🐛 Bug reports
- 💡 Feature suggestions
- 🎨 Design improvements
- 🌍 Translations
- 📢 Community support
- 📝 Blog posts and tutorials

Thank you for contributing to Vitto! 🎉

## Additional Resources

### Learning Resources

- [Vento Documentation](https://vento.js.org/)
- [Vite Plugin API](https://vitejs.dev/guide/api-plugin.html)
- [Pagefind Documentation](https://pagefind.app/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Turborepo Documentation](https://turbo.build/repo/docs)

### Related Projects

- [Vite](https://vitejs.dev/) - Build tool
- [Vento](https://vento.js.org/) - Template engine
- [Pagefind](https://pagefind.app/) - Static search
- [Biome](https://biomejs.dev/) - Linter and formatter
- [Turborepo](https://turbo.build/repo) - Monorepo build system

### Useful Commands

```bash
# Development
pnpm dev              # Run dev server for vitto and website
pnpm start            # Run website only
pnpm create-vitto     # Run create-vitto CLI
pnpm build            # Build all packages

# Code Quality
pnpm lint             # Lint all packages
pnpm check            # Check code with Biome
pnpm format           # Format code
pnpm typecheck        # Type check all packages

# Maintenance
pnpm cleanup          # Clean cache and dependencies
pnpm update-deps      # Update dependencies

# Publishing
pnpm publish:dry      # Dry run publish
pnpm publish:npm      # Publish to npm

# Turborepo
turbo run build                    # Build all packages
turbo run dev --filter=vitto       # Dev mode for specific package
turbo run typecheck --filter=vitto # Type check specific package
```

## License

By contributing to Vitto, you agree that your contributions will be licensed under the [MIT License](../LICENSE).

### MIT License Summary

- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ❌ Liability
- ❌ Warranty

Your contributions become part of the Vitto project and are subject to the same license terms.

---

**Questions?** Feel free to ask in [GitHub Discussions](https://github.com/riipandi/vitto/discussions)

**Found a bug?** Please [report it](https://github.com/riipandi/vitto/issues/new)

**Have an idea?** We'd love to hear it! [Start a discussion](https://github.com/riipandi/vitto/discussions/new)
