# Deployment Guide

This guide covers free deployment options for your MTG Commander League website.

## Overview of Free Options

| Platform | Free Tier | Best For |
|----------|-----------|----------|
| **Vercel** | 100GB bandwidth/month | Easiest, best DX |
| **Netlify** | 100GB bandwidth/month | Simple, great CI/CD |
| **Firebase Hosting** | 10GB storage, 360MB/day | All-in-one with Firebase |
| **Cloudflare Pages** | Unlimited bandwidth | High traffic sites |

## Option 1: Vercel (Recommended)

Vercel is the easiest option and offers excellent performance.

### Prerequisites
- GitHub account
- Push your code to GitHub

### Steps

1. **Prepare your project**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository
   - Vercel will auto-detect Nuxt

3. **Add Environment Variables**
   - In project settings, go to "Environment Variables"
   - Add all variables from your `.env` file:
     - `FIREBASE_API_KEY`
     - `FIREBASE_AUTH_DOMAIN`
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_STORAGE_BUCKET`
     - `FIREBASE_MESSAGING_SENDER_ID`
     - `FIREBASE_APP_ID`

4. **Deploy**
   - Click "Deploy"
   - Your site will be live at `your-project.vercel.app`

### Custom Domain (Free)
- Go to project settings > Domains
- Add your custom domain
- Follow DNS configuration instructions

### Automatic Deployments
- Every push to `main` branch automatically deploys
- Pull requests get preview URLs

## Option 2: Netlify

Similar to Vercel, great alternative.

### Steps

1. **Build command setup**

   Create `netlify.toml`:
   ```toml
   [build]
     command = "npm run generate"
     publish = ".output/public"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy**
   - Go to [netlify.com](https://netlify.com)
   - Sign in with GitHub
   - Click "New site from Git"
   - Choose your repository
   - Build command: `npm run generate`
   - Publish directory: `.output/public`

3. **Add Environment Variables**
   - Site settings > Environment variables
   - Add all Firebase variables

## Option 3: Firebase Hosting

Keep everything in Firebase ecosystem.

### Steps

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting**
   ```bash
   firebase init hosting
   ```

   Select:
   - Use an existing project
   - Public directory: `.output/public`
   - Configure as single-page app: Yes
   - Set up automatic builds: No

4. **Create `firebase.json`**
   ```json
   {
     "hosting": {
       "public": ".output/public",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

5. **Build and Deploy**
   ```bash
   npm run generate
   firebase deploy --only hosting
   ```

6. **Your site is live!**
   - URL: `your-project.web.app`
   - Custom domain: Firebase Console > Hosting > Add custom domain

## Option 4: Cloudflare Pages

Best for high traffic, unlimited bandwidth.

### Steps

1. **Prepare your repository**
   - Push code to GitHub/GitLab

2. **Deploy**
   - Go to [pages.cloudflare.com](https://pages.cloudflare.com)
   - Sign in
   - Click "Create a project"
   - Connect your Git repository
   - Build settings:
     - Build command: `npm run generate`
     - Build output directory: `.output/public`

3. **Add Environment Variables**
   - Project > Settings > Environment Variables
   - Add all Firebase variables

## Cost Monitoring

### Firebase Usage Limits (Free Tier)

**Firestore:**
- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day
- 1 GB storage

**Authentication:**
- Unlimited (yes, really!)

**Hosting:**
- 10 GB storage
- 360 MB/day transfer

### Staying Within Free Limits

For a small league (10-20 players):
- **Typical daily usage**: ~500 reads, ~50 writes
- **Well within free tier**
- Can support 50-100 active users easily

### Tips to Minimize Costs

1. **Cache data client-side**
   ```typescript
   // Cache leaderboard for 5 minutes
   const cachedData = useState('leaderboard', () => null)
   ```

2. **Use Firestore efficiently**
   - Query only what you need
   - Use `limit()` on queries
   - Avoid real-time listeners for static data

3. **Implement pagination**
   ```typescript
   // Only load 10 decks at a time
   const decks = await getDocuments('decks', [limit(10)])
   ```

4. **Monitor usage**
   - Firebase Console > Usage and billing
   - Set up budget alerts

## Custom Domain Setup

### Vercel
1. Buy domain from any registrar (Namecheap, Google Domains, etc.)
2. Vercel settings > Domains
3. Add domain and follow DNS instructions

### Netlify
1. Netlify > Domain settings
2. Add custom domain
3. Update DNS records

### Firebase
1. Firebase Console > Hosting
2. Add custom domain
3. Verify ownership
4. Update DNS records

### Cloudflare
1. Add domain to Cloudflare
2. Cloudflare Pages > Custom domains
3. Add domain (DNS handled automatically)

## SSL Certificates

All platforms provide **free SSL certificates** automatically!
- Vercel: Automatic via Let's Encrypt
- Netlify: Automatic via Let's Encrypt
- Firebase: Automatic
- Cloudflare: Automatic

## CI/CD Setup

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run generate
      # Add deployment steps here
```

## Performance Optimization

1. **Enable caching**
   - Vercel/Netlify handle this automatically

2. **Optimize images**
   - Use WebP format
   - Compress images before upload

3. **Code splitting**
   - Nuxt handles this automatically

4. **CDN**
   - All platforms use global CDNs

## Monitoring

### Free Monitoring Tools

1. **Firebase Console**
   - Track database usage
   - Monitor authentication

2. **Vercel Analytics** (Free tier available)
   - Page views
   - Performance metrics

3. **Google Analytics**
   - Add to `nuxt.config.ts`

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules .nuxt
npm install
npm run build
```

### Environment Variables Not Working
- Make sure they're prefixed correctly in Nuxt config
- Restart the deployment after adding variables
- Check for typos in variable names

### Firebase Connection Issues
- Verify all environment variables are set
- Check Firebase project settings
- Ensure Firestore and Auth are enabled

## Scaling Beyond Free Tier

If you outgrow free tier:

**Firebase Blaze (Pay-as-you-go)**
- Still free up to limits
- Only pay for overages
- ~$25/month for small league

**Vercel Pro ($20/month)**
- More bandwidth
- Better performance
- Team features

## Recommended Setup

For most leagues:
1. **Hosting**: Vercel (easiest)
2. **Database**: Firebase (generous free tier)
3. **Domain**: Namecheap (~$10/year)

**Total cost**: ~$10/year for domain only!

---

Need help? Check the main [README.md](./README.md) or create an issue on GitHub.
