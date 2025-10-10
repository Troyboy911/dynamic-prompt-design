# Stellarc Dynamics - Cloudpanel Deployment Guide

## 🚀 Deploying to Cloudpanel on Hostinger VPS

### Prerequisites

1. Cloudpanel installed on your Hostinger VPS
2. A website/domain configured in Cloudpanel
3. SSH access to your VPS (for automated deployment)
4. Node.js 18+ installed on your VPS

---

## Method 1: Manual Deployment (Recommended for First Time)

### Step 1: Build the Application Locally

```bash
# Install dependencies
npm install

# Create production build
npm run build
```

This creates a `dist` folder with your compiled application.

### Step 2: Upload to Cloudpanel

1. **Login to Cloudpanel** at `https://your-vps-ip:8443`
2. **Navigate to your website** in the Sites section
3. **Go to File Manager** or use SFTP
4. **Upload the contents of the `dist` folder** to your website's `htdocs` folder
   - Path typically: `/home/[your-site]/htdocs/`
   - **Important**: Upload the CONTENTS of dist, not the dist folder itself

### Step 3: Configure Nginx (for React Router)

In Cloudpanel:
1. Go to your website settings
2. Navigate to **Vhost** section
3. Add this configuration inside the `location / { }` block:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

4. Click **Save** and **Reload Nginx**

---

## Method 2: Automated Deployment via GitHub Actions

### Step 1: Set Up SSH Access

On your VPS, create a deployment user (or use existing):

```bash
# On your VPS
ssh root@your-vps-ip

# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Generate deployment key pair (on your local machine)
ssh-keygen -t ed25519 -C "github-deployment" -f ~/.ssh/stellarc_deploy

# Copy public key to VPS
# Paste the public key content into authorized_keys on VPS
cat ~/.ssh/stellarc_deploy.pub
# Then on VPS:
echo "PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Step 2: Configure GitHub Secrets

In your GitHub repository, go to **Settings → Secrets and variables → Actions**, add:

- `VPS_HOST`: Your VPS IP address or domain
- `VPS_USERNAME`: SSH username (e.g., `root` or your user)
- `VPS_SSH_KEY`: Private key content (content of `stellarc_deploy` file)
- `VPS_DEPLOY_PATH`: Full path to htdocs (e.g., `/home/stellarc/htdocs`)

### Step 3: Use the Automated Workflow

The GitHub Actions workflow will automatically:
1. Build your application on every push to main
2. Deploy to your VPS via SSH
3. Clean up old files and upload new build

Push to main branch to trigger deployment:

```bash
git add .
git commit -m "Deploy to Cloudpanel"
git push origin main
```

---

## Method 3: Direct SFTP Upload

### Using FileZilla or similar SFTP client:

1. **Host**: Your VPS IP
2. **Username**: Your SSH username
3. **Password**: Your SSH password (or use SSH key)
4. **Port**: 22

**Steps**:
1. Build locally: `npm run build`
2. Connect via SFTP
3. Navigate to `/home/[your-site]/htdocs/`
4. Upload contents of `dist` folder
5. Ensure proper permissions (755 for directories, 644 for files)

---

## Cloudpanel-Specific Configuration

### Environment Variables

If you need environment variables in production:

1. In Cloudpanel, go to your site
2. Navigate to **Settings → Environment Variables**
3. Add your variables:
   ```
   VITE_SUPABASE_URL=https://your-supabase-url
   VITE_SUPABASE_PUBLISHABLE_KEY=your-key
   ```

**Note**: Since this is a static build, environment variables must be set at BUILD time, not runtime.

### SSL Certificate

1. In Cloudpanel, go to your site
2. Navigate to **SSL/TLS**
3. Click **New Let's Encrypt Certificate**
4. Follow the wizard to get free SSL

### Performance Optimization

In Cloudpanel Vhost settings, add caching headers:

```nginx
# Cache static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Gzip compression (if not already enabled)
gzip on;
gzip_vary on;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

---

## Post-Deployment Checklist

- [ ] Application loads at your domain
- [ ] All pages are accessible (test routing)
- [ ] Images and assets load correctly
- [ ] API connections work (Supabase/backend)
- [ ] SSL certificate is active (HTTPS)
- [ ] Mobile responsiveness works
- [ ] Check browser console for errors

---

## Troubleshooting

### Issue: 404 on page refresh

**Solution**: Ensure nginx configuration includes `try_files $uri $uri/ /index.html;`

### Issue: White screen / blank page

**Solution**: 
1. Check browser console for errors
2. Verify all files uploaded correctly
3. Check file permissions (755 for dirs, 644 for files)
4. Ensure base path is correct in vite.config.ts

### Issue: Assets not loading

**Solution**: 
1. Verify asset paths in build
2. Check if assets folder uploaded
3. Ensure correct MIME types in nginx config

### Issue: API calls failing

**Solution**:
1. Check CORS settings on backend
2. Verify environment variables are set correctly
3. Ensure SSL certificate is valid (mixed content issues)

---

## Build Optimization

For smaller build size and faster loading:

```bash
# Build with analysis
npm run build -- --mode production

# Check build size
du -sh dist/
```

### Recommended optimizations:

1. **Enable gzip** in Cloudpanel nginx config
2. **Use CDN** for static assets (optional)
3. **Optimize images** before deployment
4. **Enable browser caching** via nginx headers

---

## Continuous Deployment Tips

1. **Use GitHub Actions** (Method 2) for automated deployment
2. **Test locally** before pushing to main
3. **Create staging environment** on subdomain for testing
4. **Backup before deployment** (Cloudpanel has backup tools)
5. **Monitor logs** in Cloudpanel for errors

---

## Additional Resources

- [Cloudpanel Documentation](https://www.cloudpanel.io/docs/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- [React Router Deployment](https://reactrouter.com/en/main/guides/deployment)

---

## Need Help?

If you encounter issues:
1. Check Cloudpanel logs: **Logs → Error Log**
2. Check nginx logs: `/var/log/nginx/error.log`
3. Verify build was successful: Check `dist` folder locally
4. Test on localhost first: `npm run preview`

## Quick Deploy Script

Save this as `deploy.sh` for quick manual deployment:

```bash
#!/bin/bash

echo "🔨 Building application..."
npm run build

echo "📦 Creating deployment archive..."
cd dist
tar -czf ../deploy.tar.gz .
cd ..

echo "📤 Upload deploy.tar.gz to your VPS"
echo "Then on VPS run:"
echo "cd /home/[your-site]/htdocs"
echo "tar -xzf /path/to/deploy.tar.gz"
echo "✅ Done!"
```

Make it executable: `chmod +x deploy.sh`
