# Eric Remy — EPK Website

Single-page electronic press kit for Eric Remy (tech house DJ / producer).
Built from the Claude Design handoff bundle, implemented as a clean, self-contained
static site.

## Run it

It's plain HTML/CSS/JS — no build step. But serve it over HTTP rather than opening
`index.html` directly, because the live stat counters fetch `stats.json` (which the
`file://` protocol blocks):

```bash
cd eric-remy-epk
python3 -m http.server 8000
# open http://localhost:8000
```

Any static host works for deploy: Netlify, Vercel, GitHub Pages, S3/CloudFront, etc.

## Files

```
index.html      markup (semantic sections, SEO/OG/Twitter meta, JSON-LD MusicGroup)
styles.css      all styling + design tokens + responsive/app-shell rules
app.js          behavior: marquee, scroll-spy, reveal, hero parallax, slideshow,
                Spotify embeds, live count-up
stats.json      data source for the "By the Numbers" counters (edit to update)
images/         photography, logo, hero layers, torn-edge + favicon assets
```

## What changed from the prototype

This is a faithful recreation of the prototype that was handed off, with the
authoring-tool scaffolding removed (as the handoff README instructs) and a few
production touches added:

- **Palette baked in.** The prototype shipped a blood-orange fallback in CSS and
  recolored to acid-green (`#C8FF00`) at runtime via a "Tweaks" layer. Those resolved
  tokens (`--primary #C8FF00`, `--primary-deep #90C700`, `--primary-glow #F6FF2E`) are
  now the real `:root` values; no runtime recolor.
- **Authoring affordances removed.** The on-canvas "Tweaks" panel, the `EDITMODE`
  JSON marker, and the parent-window `postMessage` edit-mode plumbing are all gone.
- **Stray orange unified.** A few hardcoded orange values the runtime tweak never
  touched (hero bottom-glow, two row-hover tints) were moved onto the primary green so
  the theme is fully cohesive.
- **SEO/sharing added.** Open Graph + Twitter card meta, canonical URL, and JSON-LD
  `MusicGroup` structured data with the artist's social profiles.

## Recommended next steps

- **Optimize imagery.** Source photos are large JPEGs/PNGs (`hero-bg.jpg` is ~4.3 MB).
  Generate WebP/AVIF variants with `srcset`, keep the hero eager/priority, and lazy-load
  the booth tiles. (Track cover art already lazy-loads from Spotify's CDN.)
- **Wire real data.** `stats.json` is static — point it at a small serverless function
  that reads the Spotify API if you want the counters truly live. Tour dates and the
  "Tickets" links are hardcoded; connect a CMS / Bandsintown / Songkick when available.
- **Confirm the management contact.** The Contact section lists
  `eric.kidd@taogroup.com` (Tao Group) — verify before going live.
