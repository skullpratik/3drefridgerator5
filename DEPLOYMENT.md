# Deployment Guide

This project is configured to deploy on both **Vercel** and **Netlify**. Choose your preferred platform below.

## 🚀 Quick Deploy

### Vercel (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/skullpratik/3D-configurator)

### Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/skullpratik/3D-configurator)

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git repository (for automatic deployments)

## 🛠️ Manual Deployment

### For Vercel

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Build and Deploy**:
   ```bash
   npm run build
   vercel --prod
   ```

   Or use the shortcut:
   ```bash
   npm run deploy:vercel
   ```

3. **Configuration**: 
   - The `vercel.json` file is already configured
   - Build output: `dist/`
   - Build command: `npm run build`

### For Netlify

1. **Install Netlify CLI** (if not already installed):
   ```bash
   npm i -g netlify-cli
   ```

2. **Build and Deploy**:
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

   Or use the shortcut:
   ```bash
   npm run deploy:netlify
   ```

3. **Configuration**: 
   - The `netlify.toml` file handles build settings
   - The `public/_redirects` file ensures SPA routing works
   - Build output: `dist/`
   - Build command: `npm run build`

## 🔧 Configuration Files

### Vercel Configuration (`vercel.json`)
- Handles SPA routing with fallback to `index.html`
- Sets up static build process
- Optimized for React applications

### Netlify Configuration (`netlify.toml`)
- Configures build settings and environment
- Sets up caching headers for 3D assets
- Handles SPA redirects
- Optimizes GLB, HDR, and texture files

### Vite Configuration (`vite.config.js`)
- Optimized build settings for production
- Proper asset handling for 3D models
- Compatible with both platforms

## 🎯 Environment Variables

If your project uses environment variables, create them in your deployment platform:

**Vercel**: Project Settings → Environment Variables
**Netlify**: Site Settings → Environment Variables

## 📁 Build Output

The build process creates a `dist/` folder containing:
- Optimized JavaScript and CSS bundles
- Static assets (models, textures, images)
- Compressed 3D files for faster loading

## 🔍 Troubleshooting

### Common Issues:

1. **404 errors on refresh**: 
   - Ensure `_redirects` file exists in `public/` folder for Netlify
   - Verify `vercel.json` routes are configured for Vercel

2. **3D models not loading**:
   - Check that GLB files are in the correct `public/models/` directory
   - Verify texture paths in your components

3. **Build fails**:
   - Ensure Node.js version is 18+
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

## 📊 Performance Tips

- 3D models are automatically optimized with Draco compression
- HDR environment maps are cached for better performance
- Static assets have long-term caching headers

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

---

Choose your preferred platform and follow the steps above. Both platforms offer excellent performance for React + Three.js applications!
