# thevezo.com

The Vezo marketing site and legal pages. Static HTML — no build step, no
dependencies, no framework. What is in this repo is what gets served.

## Pages

| URL | File |
|-----|------|
| https://thevezo.com/ | `index.html` — marketing site |
| https://thevezo.com/terms | `terms.html` |
| https://thevezo.com/privacy | `privacy.html` |
| https://thevezo.com/guidelines | `guidelines.html` |
| https://thevezo.com/support | `support.html` |
| https://thevezo.com/auth/confirmed | Email confirmation landing |
| https://thevezo.com/auth/reset-password | Password reset (web) |
| https://thevezo.com/auth/email-changed | Email change confirmation |

Cloudflare Pages serves extensionless URLs and 307s `/terms.html` → `/terms`,
so both forms work. `/terms` is the canonical one and the only form linked from
this site. The App Store listing points at the `.html` forms; those keep
redirecting, so nothing there needs changing.

## Structure

```
index.html            marketing site
terms|privacy|guidelines|support.html
assets/css/site.css   the whole design system, one file
assets/js/site.js     nav, scroll reveals, parallax — progressive enhancement
assets/font/          Space Grotesk (self-hosted variable woff2)
assets/img/           device screens, icons, OG image
auth/                 sign-in landings (Supabase redirect targets)
robots.txt sitemap.xml
```

There is no templating, so the header and footer markup is repeated in each
page. All styling comes from `site.css`, so a design change is one file; only
nav or footer *structure* changes need touching each page.

### Design tokens

`site.css` opens with the palette. The gradient is the app's own logo gradient,
copied verbatim from `sf-pulse/src/theme/index.ts` — keep them in sync:

```
#FF826F → #E58EA8 → #AA91CF → #718DE9 → #7A5E9F
```

Typeface is Space Grotesk, the same one the app uses, self-hosted so the site
does not depend on a third-party font CDN before first paint.

### Device screenshots

`assets/img/phone-*.webp` are real screens from the shipped app, lifted from
the App Store listing and cropped to the device with a rounded alpha mask. They
are not mockups and no app UI has been redrawn. If the app's UI changes, replace
them from the current App Store screenshots rather than editing them.

## The sign-in handoff on `/`

`index.html` opens with a script that checks for a Supabase auth result in the
URL and hands it back to the app over `vezo://`. This is load-bearing: Supabase
falls back to the project's Site URL (this page) whenever the redirect it was
given is not allow-listed, so a Google sign-in can land here. A page that just
renders would throw the result away and leave the member signed out.

The detection runs in `<head>`; the actual jump happens in the script directly
below the handoff card in the body. That split is deliberate — navigating to an
external scheme stops the HTML parser where it stands, so jumping from `<head>`
leaves the document with no `<body>`, and anyone without the app installed gets
a blank page instead of the fallback button.

`auth/callback.html` does the same job at the allow-listed URL.

## Deploy

Cloudflare Pages, connected to `erkhesenkh9-tech/Terms-and-service`:

- Framework preset: **None**
- Build command: *(empty)*
- Output directory: **/** (root)

Pushing to `main` deploys. Custom domains: `thevezo.com`, `www.thevezo.com`.

## Supabase redirect URLs

In Supabase → Authentication → URL Configuration:

```
https://thevezo.com/auth/confirmed
https://thevezo.com/auth/reset-password
https://thevezo.com/auth/email-changed
vezo://auth/callback
vezo://**
```

Site URL: `https://thevezo.com`

## Vezo app env

In the app `.env` and EAS production env:

```
EXPO_PUBLIC_SITE_URL=https://thevezo.com
```

## Known gap

`sf-pulse/public/` holds files that belong on this domain but are **not**
deployed here, and are currently 404 in production:

- `.well-known/apple-app-site-association` and `.well-known/assetlinks.json` —
  without these, shared links open the website instead of the app
- `event.html` and `post.html` — the landing pages those shared links point at

They were never copied into this repo. Moving them here is what turns deep
linking on; see `sf-pulse/public/.well-known/README.md`.
