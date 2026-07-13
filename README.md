# Vezo legal pages — thevezo.com

Static legal and auth landing pages for the Vezo app.

## Pages

| URL | File |
|-----|------|
| https://thevezo.com/terms.html | Terms of Service |
| https://thevezo.com/privacy.html | Privacy Policy |
| https://thevezo.com/guidelines.html | Community Guidelines |
| https://thevezo.com/auth/confirmed | Email confirmation landing |
| https://thevezo.com/auth/reset-password | Password reset (web) |
| https://thevezo.com/auth/email-changed | Email change confirmation |

## Deploy on Cloudflare Pages

1. Push this repo to GitHub.
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Select **erkhesenkh9-tech/Terms-and-service**.
4. Build settings: **Framework preset = None**, build command empty, **output directory = /** (root).
5. Deploy.
6. **Custom domains** → add **thevezo.com** and **www.thevezo.com** (optional redirect www → apex).

## Supabase redirect URLs

Add these in Supabase → Authentication → URL Configuration:

```
https://thevezo.com/auth/confirmed
https://thevezo.com/auth/reset-password
https://thevezo.com/auth/email-changed
vezo://auth/callback
vezo://**
```

Set **Site URL** to `https://thevezo.com`.

## Vezo app env

In the main app `.env` and EAS production env:

```
EXPO_PUBLIC_SITE_URL=https://thevezo.com
```
