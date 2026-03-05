# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`nv-school-ratings` is a mobile-friendly data visualization website for Nevada school performance data. Built with Next.js + TypeScript, hosted on GitHub Pages as a static export.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Static export to ./out (requires NODE_ENV=production for correct basePath)
npm run lint     # Run ESLint
npx serve out    # Preview production build locally
```

For a production-accurate local preview:
```bash
NODE_ENV=production NEXT_PUBLIC_BASE_PATH=/nv-school-ratings npm run build
```

## Architecture

**Stack**: Next.js 15 (App Router, static export), TypeScript, Tailwind CSS v4, Leaflet via react-leaflet

**Key files**:
- `next.config.ts` — `output: 'export'`, `basePath`/`assetPrefix` for GitHub Pages, `trailingSlash: true`
- `src/types/school.ts` — `School` interface and `FilterState` type
- `public/data/schools.json` — school data
- `src/hooks/useSchools.ts` — client-side data fetch + filter logic; prefixes URL with `NEXT_PUBLIC_BASE_PATH`
- `src/utils/markerColors.ts` — star rating → color mapping; `createMarkerIcon()` using `L.divIcon`
- `.github/workflows/deploy.yml` — CI/CD to GitHub Pages

**Component structure**:
```
src/
  app/
    page.tsx          # Root page: view toggle (map/table) + filter state
    layout.tsx        # HTML shell + metadata
    globals.css       # Tailwind v4 import + Leaflet z-index fix
  components/
    map/
      MapView.tsx     # next/dynamic wrapper (ssr: false) — server-safe shell
      MapInner.tsx    # "use client" — imports leaflet CSS, renders MapContainer
      SchoolMarker.tsx # "use client" — Marker + Popup with L.divIcon
    table/
      TableView.tsx   # Sortable, paginated table (25 rows/page)
    filters/
      FilterControls.tsx # Search input, type pills, star buttons
    StarRating.tsx    # Colored star display component
  hooks/
    useSchools.ts     # Data fetching + filtering hook
  types/
    school.ts         # School, SchoolType, StarRating, FilterState types
  utils/
    markerColors.ts   # Star → color + L.divIcon factory
```

**Critical patterns**:
- Leaflet CSS must be imported in `MapInner.tsx` (not layout/globals) to avoid SSR crash
- Map components use `next/dynamic` with `ssr: false` to prevent server-side Leaflet errors
- `useSchools` prefixes fetch URL with `process.env.NEXT_PUBLIC_BASE_PATH` for GitHub Pages compatibility
- Marker icons use `L.divIcon` (colored circles) — avoids webpack PNG asset resolution issues

**Deployment**: GitHub Actions → `actions/deploy-pages@v4`. Set repo Settings → Pages → Source → "GitHub Actions".
