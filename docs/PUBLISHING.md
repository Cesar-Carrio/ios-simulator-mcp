# Publishing Guide

> **Status:** This package has NOT been published to npm yet. This guide is for when we're ready to publish.

How to publish `@emcap/ios-simulator-mcp` to npm.

## Before First Publish - Checklist

- [ ] npm account created at [npmjs.com](https://www.npmjs.com)
- [ ] Access to publish to `@emcap` scope (or use your own scope)
- [ ] GitHub repository is public and accessible
- [ ] All changes committed and pushed
- [ ] Package builds successfully (`npm run build`)
- [ ] All documentation reviewed and updated
- [ ] Version number is correct in package.json
- [ ] **Update all README files to remove pre-release warnings**
- [ ] **Update installation sections to make npm the primary method**
- [ ] **Remove or update "Coming Soon" sections**
- [ ] **Update badges to use live npm links**

### Documentation Updates Required Before Publishing

You'll need to update these files to reflect npm availability:

1. **`/README.md`**:
   - Remove "Status: Pre-Release" badge
   - Add live npm version badge
   - Move local installation to "Development" section
   - Make npm/npx the primary installation method

2. **`/docs/QUICKSTART.md`**:
   - Make npm installation the main method
   - Move local installation to "Development" section
   - Remove "Coming Soon" sections

3. **`/mcp-server/README.md`**:
   - Remove "Status: Pre-Release" badge
   - Add live npm version badge
   - Make npm/npx the primary installation method
   - Remove CLI commands disclaimer

4. **This file (`PUBLISHING.md`)**:
   - Remove the "NOT published" warning at the top

## One-Time Setup

### 1. Create npm Account

```bash
npm login
```

Enter your npm username, password, and email.

### 2. Setup GitHub Secrets (for automated publishing)

Go to your GitHub repository:
1. Settings → Secrets and variables → Actions
2. Add new secret: `NPM_TOKEN`
3. Get token from npmjs.com → Access Tokens → Generate New Token
4. Paste token value

### 3. Verify Package Name

The package name `@emcap/ios-simulator-mcp` must be available:

```bash
npm search @emcap/ios-simulator-mcp
```

If taken, update `mcp-server/package.json` with a different name.

## Publishing Manually

### First Release (v1.0.0)

```bash
# 1. Navigate to mcp-server directory
cd mcp-server

# 2. Ensure you're on main branch
git checkout main
git pull origin main

# 3. Install dependencies
npm install

# 4. Build the project
npm run build

# 5. Verify build
ls -la dist/
# Should see: index.js, setup.js, and other .js files

# 6. Test locally
npm pack
# Creates: emcap-ios-simulator-mcp-1.0.0.tgz

# 7. Test installation (optional)
npm install -g ./emcap-ios-simulator-mcp-1.0.0.tgz
ios-simulator-mcp --version
ios-simulator-mcp --help

# 8. Publish to npm
npm publish --access public

# 9. Verify on npm
npm view @emcap/ios-simulator-mcp
```

### Subsequent Releases

```bash
# 1. Update version in package.json
cd mcp-server
npm version patch   # 1.0.0 → 1.0.1
# or
npm version minor   # 1.0.0 → 1.1.0
# or
npm version major   # 1.0.0 → 2.0.0

# 2. This creates a git tag automatically
# Push the tag
git push origin main --tags

# 3. Publish
npm publish --access public
```

## Publishing via GitHub Actions (Automated)

### Option 1: Create GitHub Release

1. Go to GitHub repository
2. Click "Releases" → "Create a new release"
3. Create new tag (e.g., `v1.0.0`)
4. Fill in release notes
5. Click "Publish release"
6. GitHub Actions will automatically publish to npm

### Option 2: Manual Workflow Trigger

1. Go to GitHub repository
2. Actions → "Publish to npm" workflow
3. Click "Run workflow"
4. Enter version (optional)
5. Click "Run workflow"

## Verification

After publishing:

```bash
# Install globally
npm install -g @emcap/ios-simulator-mcp

# Verify installation
ios-simulator-mcp --version
ios-simulator-mcp --help

# Test in a React Native project
cd /path/to/react-native-project
npx @emcap/ios-simulator-mcp --check
```

## Update npm Package Info

After first publish, update package info on npmjs.com:

1. Go to https://www.npmjs.com/package/@emcap/ios-simulator-mcp
2. Click "Edit package details"
3. Add:
   - Homepage: Link to GitHub
   - Repository: Link to GitHub repo
   - Documentation: Link to README
   - Keywords: Ensure they're correct

## Troubleshooting

### "You do not have permission to publish"

**Solution:**
```bash
# Login again
npm logout
npm login

# Or use 2FA
npm publish --otp=123456
```

### "Package name too similar to existing package"

**Solution:** Change the package name in `package.json`:
```json
{
  "name": "@your-scope/ios-simulator-mcp"
}
```

### "Version already exists"

**Solution:** Increment the version:
```bash
npm version patch
npm publish --access public
```

### Build fails before publish

**Solution:**
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## Version Guidelines

Follow [Semantic Versioning](https://semver.org/):

- **Patch** (1.0.0 → 1.0.1): Bug fixes, no breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Major** (1.0.0 → 2.0.0): Breaking changes

## Release Checklist

Before each release:

- [ ] Update CHANGELOG.md with changes
- [ ] Run `npm run build` successfully
- [ ] Test locally with `npm pack`
- [ ] Update version in package.json
- [ ] Commit all changes
- [ ] Create git tag
- [ ] Push to GitHub
- [ ] Create GitHub release
- [ ] Verify npm publish succeeded
- [ ] Test installation: `npm install -g @emcap/ios-simulator-mcp`
- [ ] Announce on social media/Discord/Slack

## Post-Publishing

After successful publish:

1. **Announce the release:**
   - Twitter/X
   - Reddit (r/reactnative, r/cursor)
   - Dev.to blog post
   - Product Hunt (for major releases)

2. **Update documentation:**
   - Main README.md
   - GitHub repository description
   - Any external documentation

3. **Monitor:**
   - npm download stats
   - GitHub issues
   - User feedback

## npm Commands Reference

```bash
# View package info
npm view @emcap/ios-simulator-mcp

# View all versions
npm view @emcap/ios-simulator-mcp versions

# View download stats
npm info @emcap/ios-simulator-mcp

# Unpublish (use with caution!)
npm unpublish @emcap/ios-simulator-mcp@1.0.0

# Deprecate a version
npm deprecate @emcap/ios-simulator-mcp@1.0.0 "Use 1.0.1 instead"
```

## Support

For issues during publishing:
- npm support: https://www.npmjs.com/support
- GitHub Actions: Check workflow logs
- Community: npm Discord, GitHub Discussions

---

**Remember:** Once published to npm, packages are public and permanent. Always test thoroughly before publishing!

