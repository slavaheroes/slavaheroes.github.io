# Project: slavaheroes.github.io

## Overview
Personal portfolio and blog site for Vyacheslav Shen (ML Engineer). Built with **Jekyll** and themed as a retro **Windows 95 desktop** UI. Deployed via **GitHub Pages** with CI/CD through GitHub Actions.

## Architecture

### Tech Stack
- **Static Site Generator**: Jekyll 4.3+
- **Styling**: Vanilla CSS with CSS custom properties (light/dark themes)
- **JavaScript**: Vanilla JS (no frameworks)
- **Math Rendering**: KaTeX via CDN
- **Code Highlighting**: Rouge (Jekyll built-in)
- **Deployment**: GitHub Pages via GitHub Actions
- **Local Dev**: Docker + docker-compose, or `bundle exec jekyll serve`

### Directory Structure
```
.
├── _config.yml          # Jekyll configuration
├── _layouts/            # Page templates
│   ├── default.html     # Base shell (window chrome, taskbar)
│   ├── home.html        # About/portfolio page
│   ├── blog.html        # Blog listing with search/filter + post network graph
│   └── post.html        # Individual blog post
├── _includes/           # Reusable HTML partials
│   ├── head.html        # <head> with meta, CSS, KaTeX
│   ├── window-chrome.html # Win95 title bar
│   ├── nav-tabs.html    # About/Blog navigation
│   ├── taskbar.html     # Bottom taskbar with clock
│   ├── badges.html      # Social media badges
│   ├── status-bar.html  # Email + visitor counter
│   └── close-joke.html  # "Close" button joke modal
├── _posts/              # Published blog posts (markdown)
├── _drafts/             # Unpublished draft posts
├── assets/
│   ├── css/main.css     # All styles (Win95 theme)
│   └── js/main.js       # Client-side logic
├── index.html           # Homepage (About page)
├── blog.html            # Blog listing page
├── Gemfile              # Ruby dependencies
├── Dockerfile           # Local dev container
├── docker-compose.yml   # Docker compose for local dev
└── .github/workflows/
    └── deploy.yml       # CI/CD for GitHub Pages
```

## Rules & Conventions

### Blog Posts
- All posts go in `_posts/` with filename format: `YYYY-MM-DD-slug.md`
- Use this front matter template:
  ```yaml
  ---
  title: "Your Post Title"
  date: YYYY-MM-DD
  description: "Short one-line description"
  tags: [Tag One, Tag Two]
  keywords: [Keyword One, Keyword Two]
  featured: true
  ---
  ```
- `tags` drive the multi-select filter chips on `/blog/` (ANY/ALL match modes)
- `keywords` drive the POST NETWORK graph on `/blog/`: two posts sharing a keyword
  get an edge, and more shared keywords = a thicker edge. Reuse existing keywords
  where possible so posts connect (check other posts' front matter first)
- The node color group in the graph comes from a post's **first** tag
- Use standard markdown for content (no Liquid includes for images)
- Images: `![alt text](/assets/img/filename.png)`
- Math: Use `$inline$` or `$$display$$` KaTeX syntax
- Code blocks: Standard fenced code blocks with language

### Drafts
- Unpublished posts go in `_drafts/`
- Same format as posts but won't appear in production builds
- Preview locally with: `bundle exec jekyll serve --drafts`
- ⚠️ Existing drafts predate the tags/keywords scheme (July 2026 restructure):
  before publishing one, replace its old front matter (`tags: [code]`,
  `categories:`) with the current template above

### Blog Listing Internals (`/blog/`)
Three cooperating pieces — keep their contracts intact when editing:
1. **Markup + data** (`_layouts/blog.html`): renders post cards with
   `data-title/data-teaser/data-tags` attributes, tag chips from the union of
   all post tags, the ANY/ALL `.filter-mode` buttons, the collapsible
   `.graph-panel`, and a `<script id="post-graph-data" type="application/json">`
   blob emitted via Liquid `jsonify` (stays in sync with front matter
   automatically — never hardcode graph data)
2. **Search + filter** (`initBlogSearch()` in `assets/js/main.js`): multi-select
   tag Set with exact token matching (split `data-tags` on commas — tags may
   contain spaces, never commas), ANY (`some`) / ALL (`every`) modes, combined
   with substring text search. After every filter pass it dispatches a
   `blog:filter` CustomEvent with `detail.visibleUrls` (a Set of visible card
   hrefs, or `null` when nothing is filtered)
3. **Graph** (`initPostGraph()` in `assets/js/main.js`): parses the JSON blob
   (treat missing `keywords`/`tags` as `[]` — Liquid emits `null`), builds
   edges from pairwise keyword intersection (weight = shared count), lays out
   each connected component with its own seeded Fruchterman–Reingold pass and
   fits it into a horizontal slice of the 640×380 virtual canvas (per-component
   layout is deliberate: a single shared simulation crushes clusters into
   corners). Listens for `blog:filter` to dim filtered-out nodes. Node color =
   `data-slot` from the post's first tag (`GROUP_SLOTS`: projects→1, reviews→2,
   anything else→3 = neutral gray)
- The layout is deterministic (fixed seed `20260706`) — same graph every load.
  Changing posts/keywords changes it; that's expected
- `localStorage` keys: `slava-theme`, `slava-graph-open`, `slava-visitor-count`

### Theme System
- Light/dark themes controlled via CSS custom properties in `assets/css/main.css`
- All colors reference `var(--name)` variables
- Dark theme activated by `[data-theme="dark"]` on `<html>`
- Theme preference persisted in `localStorage` as `slava-theme`

### Style Rules
- **Never use inline styles**. All styling goes through CSS classes in `main.css`
- Keep the Win95 retro desktop aesthetic consistent
- Window chrome elements (bevels, title bars) should use the existing CSS classes

### Content Language
- Posts are in English, Russian, or Kazakh
- No translation is needed — posts are written in their original language

## Build & Deploy

### Local Development
```bash
# With Ruby installed:
bundle install
bundle exec jekyll serve --livereload

# With Docker:
docker compose up
```
Site available at `http://localhost:4000`

### Production
Push to `main` branch → GitHub Actions builds and deploys automatically.

### Manual Build
```bash
bundle exec jekyll build
# Output in _site/
```

## Common Tasks

### Add a new blog post
1. Create `_posts/YYYY-MM-DD-slug.md`
2. Add front matter (see template above)
3. Write content in markdown
4. Commit and push to `main`

### Modify the theme
- Edit `assets/css/main.css`
- Light theme vars in `:root {}`
- Dark theme vars in `[data-theme="dark"] {}`

### Add a new graph color group
Needed only if posts appear whose **first** tag is neither Projects nor Reviews
and the neutral-gray fallback isn't wanted:
1. Add `--graph-c3` to both `:root` and `[data-theme="dark"]` in `main.css`,
   and `[data-slot="3"]` rules next to the existing slot-1/slot-2 ones
2. Map the tag in `GROUP_SLOTS` inside `initPostGraph()` (`assets/js/main.js`)
3. Colors are **validated, not eyeballed**: the current pairs
   (light `#0b46c4`/`#a04d00` on surface `#ffffff`, dark `#3987e5`/`#d9731f` on
   surface `#10142a`) passed a colorblind-safety + contrast validator. Validate
   any new color against both surfaces the same way before shipping (no Node on
   the host — run it inside the dev container, which has Node)

### Add a new social badge
- Edit `_includes/badges.html`
- Add corresponding CSS class in `main.css`
