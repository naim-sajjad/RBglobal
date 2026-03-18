# Deployment Guide for Shared Hosting

This guide will help you deploy your Next.js application to shared hosting that supports static files.

## Prerequisites

- Node.js installed on your local machine
- Access to your shared hosting via FTP/SFTP or cPanel File Manager
- Your Laravel backend API URL configured

## Step 1: Build the Application

1. Open terminal in the project root directory (`saa-s-frontend-build`)

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Update API base URL in `lib/api.ts`:
   - Make sure the `baseURL` points to your production Laravel backend
   - Example: `const baseURL = 'https://yourdomain.com/api/v1';`

4. Build the application:
```bash
npm run build
```

This will create a `out` folder with all static files.

## Step 2: Configure for Shared Hosting

### Update API Configuration

Before building, ensure your API base URL is correct:

1. Open `saa-s-frontend-build/lib/api.ts`
2. Update the `baseURL` to your production API:
```typescript
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://yourdomain.com/api/v1';
```

3. Create a `.env.local` file (optional, for local development):
```
NEXT_PUBLIC_API_URL=https://yourdomain.com/api/v1
```

### CORS Configuration

Make sure your Laravel backend allows requests from your frontend domain:

In `Rb-backend/config/cors.php`:
```php
'allowed_origins' => ['https://yourdomain.com'],
```

## Step 3: Upload Files to Shared Hosting

### Option A: Using FTP/SFTP Client

1. Connect to your shared hosting via FTP/SFTP
2. Navigate to your public HTML directory (usually `public_html` or `www`)
3. Upload all contents from the `out` folder to your hosting directory
4. Make sure `.htaccess` file is uploaded (if using Apache)

### Option B: Using cPanel File Manager

1. Log in to cPanel
2. Open File Manager
3. Navigate to `public_html` (or your domain's root directory)
4. Upload all files from the `out` folder
5. Extract if uploaded as ZIP

## Step 4: Configure .htaccess for Apache

If your shared hosting uses Apache, create/update `.htaccess` in the root directory:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Handle client-side routing
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

## Step 5: Verify Deployment

1. Visit your domain in a browser
2. Check browser console for any errors
3. Test login functionality
4. Verify API calls are working

## Troubleshooting

### Issue: 404 errors on page refresh

**Solution**: Ensure `.htaccess` file is properly configured (see Step 4)

### Issue: API calls failing (CORS errors)

**Solution**: 
1. Check CORS configuration in Laravel backend
2. Verify API base URL in frontend code
3. Check browser console for specific error messages

### Issue: Images not loading

**Solution**: 
- Verify image paths are correct
- Check that images in `public` folder were uploaded
- Ensure file permissions are correct (644 for files, 755 for directories)

### Issue: Routes not working

**Solution**: 
- Static export uses query parameters for dynamic routes
- Driver detail page: `/admin/drivers/view?id=123` instead of `/admin/drivers/123`
- All navigation has been updated to use query parameters

## File Structure After Build

```
out/
├── _next/
│   ├── static/
│   └── ...
├── admin/
│   └── drivers/
│       └── view/
│           └── index.html
├── index.html
├── .htaccess (create this)
└── ... (other static files)
```

## Important Notes

1. **Static Export**: This build uses static export, so:
   - No server-side rendering
   - All routes are pre-rendered
   - Dynamic routes use query parameters

2. **API Backend**: Your Laravel backend must be:
   - Accessible via HTTPS
   - CORS configured properly
   - Running and accessible from your frontend domain

3. **Environment Variables**: 
   - Use `NEXT_PUBLIC_` prefix for client-side variables
   - Update API URLs before building

## Alternative: Using Vercel/Netlify (Recommended)

If shared hosting is problematic, consider using:
- **Vercel**: Free tier, automatic deployments, better Next.js support
- **Netlify**: Free tier, easy deployment, good for static sites
- **Railway/Render**: For full-stack apps with Node.js support

These platforms handle routing and deployment automatically.

