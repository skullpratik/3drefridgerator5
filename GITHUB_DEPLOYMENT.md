# 🚀 GitHub Deployment Guide

This guide shows you how to set up automatic deployment to Vercel and Netlify using GitHub Actions. Every time you push to the `main` branch, your 3D configurator will automatically build and deploy.

## 📋 Prerequisites

1. Your code should be pushed to a GitHub repository
2. GitHub repository should be public or you have GitHub Actions enabled
3. Accounts on Vercel and/or Netlify

## 🔧 Setup Instructions

### Option 1: Deploy to Vercel via GitHub

#### Step 1: Get Vercel Credentials
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to Settings → Tokens
3. Create a new token and copy it (this is your `VERCEL_TOKEN`)

#### Step 2: Create Vercel Project
1. Import your GitHub repository in Vercel dashboard
2. Note the **Project ID** and **Org ID** from project settings

#### Step 3: Add GitHub Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
```
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_org_id_here
VERCEL_PROJECT_ID=your_project_id_here
```

#### Step 4: Push to GitHub
The GitHub Action will automatically deploy on every push to `main` branch!

---

### Option 2: Deploy to Netlify via GitHub

#### Step 1: Get Netlify Credentials
1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Go to User Settings → Applications → Personal Access Tokens
3. Generate a new token (this is your `NETLIFY_AUTH_TOKEN`)

#### Step 2: Create Netlify Site
1. Create a new site from your GitHub repository
2. Note the **Site ID** from Site Settings → General

#### Step 3: Add GitHub Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
```
NETLIFY_AUTH_TOKEN=your_netlify_token_here
NETLIFY_SITE_ID=your_site_id_here
```

#### Step 4: Push to GitHub
The GitHub Action will automatically deploy on every push to `main` branch!

---

## 🎯 Alternative: Platform Native GitHub Integration

### Vercel Native Integration (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically:
   - Detect it's a Vite project
   - Set build command to `npm run build`
   - Set output directory to `dist`
   - Deploy on every push to main

### Netlify Native Integration
1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click "New site from Git"
3. Choose GitHub and select your repository
4. Netlify will use the `netlify.toml` configuration automatically
5. Deploys on every push to main

---

## 📁 File Structure

Your repository now includes:
```
.github/
├── workflows/
│   ├── vercel.yml      # Vercel deployment workflow
│   └── netlify.yml     # Netlify deployment workflow
├── vercel.json         # Vercel configuration
├── netlify.toml        # Netlify configuration
└── DEPLOYMENT.md       # This guide
```

## 🔍 Workflow Features

### ✅ What the GitHub Actions do:
- **Trigger**: Runs on every push to `main` branch and pull requests
- **Node.js Setup**: Uses Node.js 18 with npm caching
- **Dependencies**: Installs packages with `npm ci` for faster, reliable builds
- **Build**: Runs `npm run build` to create optimized production build
- **Deploy**: Automatically deploys to your chosen platform(s)

### ⚡ Performance Optimizations:
- **Caching**: Node modules are cached between builds
- **Parallel Jobs**: Can run both Vercel and Netlify deployments simultaneously
- **Fast Installs**: Uses `npm ci` for production builds

## 🚨 Troubleshooting

### Common Issues:

1. **"Error: No token provided"**
   - Check that you've added all required secrets in GitHub repository settings
   - Ensure secret names match exactly (case-sensitive)

2. **"Build failed"**
   - Check the Actions tab in your GitHub repository for detailed error logs
   - Ensure your `package.json` has the correct build script

3. **"Cannot find vercel.json"**
   - Ensure the `vercel.json` file is in the root of your repository
   - Check that file is committed to git

4. **"Netlify site not found"**
   - Verify your `NETLIFY_SITE_ID` is correct
   - Make sure the site exists in your Netlify dashboard

### Debug Steps:
1. Check the **Actions** tab in your GitHub repository
2. Click on the failed workflow to see detailed logs
3. Verify all secrets are properly set
4. Ensure your `main` branch has the latest configuration files

## 🎉 Success!

Once set up correctly, you'll see:
- ✅ Green checkmarks in your GitHub commits
- 🚀 Automatic deployments on every push
- 📱 Live URLs in the Actions output
- 🔄 Preview deployments for pull requests

## 🔗 Useful Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel GitHub Integration](https://vercel.com/docs/concepts/git)
- [Netlify GitHub Integration](https://docs.netlify.com/configure-builds/repo-permissions-linking/)

---

Choose your preferred method above and enjoy automatic deployments! 🎯
