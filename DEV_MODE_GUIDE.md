# Development Mode Guide

## Quick Start Without Firebase/Supabase

If you want to test the application without setting up Firebase or Supabase, you can use **Bypass Mode**.

### How to Enable Bypass Mode

1. **Create a `.env.local` file** (or `.env`) in the root directory
2. **Add this single line:**
   ```bash
   NEXT_PUBLIC_BYPASS_AUTH=true
   ```

3. **That's it!** Start the app:
   ```bash
   pnpm dev
   # or for production build
   pnpm build && pnpm start
   ```

### What Bypass Mode Does

✅ **Automatically logs you in** as a mock user (`dev@thmanyah.com`)
✅ **Skips Firebase** initialization - no Firebase config needed
✅ **Skips Supabase** queries - advertisers page will be empty but won't crash
✅ **Allows admin access** - you can access `/admin/salary-import`
✅ **Salary calculator works** - uses local data, no backend needed

### What Won't Work in Bypass Mode

❌ **Real authentication** - you won't actually sign in with Google
❌ **Advertiser data** - the advertiser management page will be empty
❌ **Database features** - any Supabase-dependent features won't fetch real data

### When to Use Bypass Mode

- **Testing locally** without cloud services
- **Deploying to Vercel** for the first time (add env vars later)
- **Quick demos** or UI development
- **Salary calculator testing** - this feature works fully without any backend

### Deploying to Vercel with Bypass Mode

1. Deploy your code to Vercel
2. In Vercel Dashboard → Your Project → Settings → Environment Variables
3. Add:
   ```
   NEXT_PUBLIC_BYPASS_AUTH=true
   ```
4. Redeploy

Your app will now work without Firebase/Supabase configuration!

### Switching to Production Mode

When you're ready to use real authentication:

1. **Remove or set to false:**
   ```bash
   NEXT_PUBLIC_BYPASS_AUTH=false
   ```

2. **Add Firebase variables:**
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

3. **Add Supabase variables (for advertisers):**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Rebuild and deploy!

---

## Summary

**For quick testing:**
```bash
echo "NEXT_PUBLIC_BYPASS_AUTH=true" > .env.local
pnpm dev
```

**For production:**
Add all Firebase and Supabase environment variables and set `NEXT_PUBLIC_BYPASS_AUTH=false` (or remove it entirely).
