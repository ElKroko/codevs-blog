# CODEVS Knowledge Base - Production Deployment Guide

## Overview
This guide covers deploying the CODEVS Knowledge Base system to production using:
- **WordPress Backend**: cms.kroko.cl
- **Astro Frontend**: codevs.kroko.cl

## Prerequisites
- cPanel hosting account with Node.js support
- Domain access to kroko.cl
- SSL certificates for both subdomains

## 1. WordPress Setup (cms.kroko.cl)

### 1.1 Install WordPress
1. Create subdomain `cms.kroko.cl` in cPanel
2. Install WordPress via cPanel's WordPress installer
3. Complete WordPress setup wizard

### 1.2 Configure WordPress
1. Upload and activate the Knowledge Base Manager plugin
2. Add the CORS configuration to `functions.php`:
   ```php
   // Copy content from wordpress-cors-config.php
   ```

### 1.3 Import Content
1. Import your existing knowledge base posts
2. Verify both custom post types and regular posts with 'knowledge-base' category

### 1.4 Test WordPress API
```bash
curl https://cms.kroko.cl/wp-json/wp/v2/posts
curl https://cms.kroko.cl/wp-json/wp/v2/knowledge-base
```

## 2. Astro Frontend Setup (codevs.kroko.cl)

### 2.1 Build for Production
```bash
# In your local project
npm install
npm run build
```

### 2.2 cPanel Node.js Application
1. Go to cPanel → Node.js App
2. Create new application:
   - **Node.js Version**: 18.x or higher
   - **Application Mode**: Production
   - **Application Root**: public_html (or subdomain folder)
   - **Application URL**: codevs.kroko.cl
   - **Application Startup File**: Not needed (static files)

### 2.3 Upload Files
1. Upload the entire `dist/` folder contents to the application root
2. The folder structure should be:
   ```
   public_html/
   ├── _astro/
   ├── images/
   ├── index.html
   ├── posts/
   └── ...other generated files
   ```

### 2.4 Configure Environment Variables
In cPanel Node.js App environment variables:
```
WP_DOMAIN=https://cms.kroko.cl
WP_API_URL=https://cms.kroko.cl/wp-json/wp/v2
SITE_URL=https://codevs.kroko.cl
```

## 3. SSL Certificates

### 3.1 Enable SSL for both domains
1. In cPanel → SSL/TLS
2. Enable SSL for:
   - cms.kroko.cl
   - codevs.kroko.cl

### 3.2 Force HTTPS redirects
Add to `.htaccess` in both domain roots:
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

## 4. Testing

### 4.1 WordPress API Tests
```bash
# Test posts endpoint
curl https://cms.kroko.cl/wp-json/wp/v2/posts

# Test knowledge base endpoint
curl https://cms.kroko.cl/wp-json/wp/v2/knowledge-base

# Test CORS (from browser console on codevs.kroko.cl)
fetch('https://cms.kroko.cl/wp-json/wp/v2/posts')
```

### 4.2 Astro Frontend Tests
1. Visit https://codevs.kroko.cl
2. Check knowledge base section loads
3. Test individual post pages
4. Test search functionality

### 4.3 Run Test Scripts
```bash
# Local testing before deployment
node test-dual-sources.js
node test-final-verification.js
node deploy-production.js
```

## 5. Troubleshooting

### Common Issues

#### CORS Errors
- Verify CORS configuration in WordPress functions.php
- Check browser console for specific CORS error messages
- Test API endpoints directly with curl

#### 404 Errors on Astro Routes
- Ensure all files from dist/ folder are uploaded
- Check cPanel file manager for correct file structure
- Verify .htaccess files for proper routing

#### API Connection Failures
- Test WordPress API endpoints directly
- Check environment variables in cPanel
- Verify SSL certificates are working

#### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## 6. Maintenance

### Regular Tasks
1. **WordPress Updates**: Keep WordPress, themes, and plugins updated
2. **Content Backup**: Regular backups of both WordPress and uploaded files
3. **SSL Renewal**: Monitor SSL certificate expiration
4. **Performance Monitoring**: Check site speed and API response times

### Content Updates
1. Add new posts via WordPress admin at cms.kroko.cl
2. Posts will automatically appear on codevs.kroko.cl
3. No need to rebuild Astro site for content updates

## 7. Monitoring and Analytics

### Set Up Monitoring
1. Google Analytics on codevs.kroko.cl
2. WordPress analytics plugins on cms.kroko.cl
3. Uptime monitoring for both domains

### Performance Optimization
1. Use caching plugins in WordPress
2. Optimize images before upload
3. Monitor API response times
4. Consider CDN for static assets

---

## Quick Command Reference

```bash
# Build and test locally
npm run build
npm run preview

# Test API connections
curl https://cms.kroko.cl/wp-json/wp/v2/posts
curl https://cms.kroko.cl/wp-json/wp/v2/knowledge-base

# Deploy verification
node deploy-production.js
```

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review cPanel error logs
3. Test individual components (WordPress API, Astro routes)
4. Verify all configuration files match production settings
