# slavaheroes.github.io

Personal portfolio and blog built with [Jekyll](https://jekyllrb.com/) and styled as a **retro Windows 95 desktop** with light/dark themes, beveled chrome, a taskbar, and a visitor counter.

## 🚀 Quick Start

### Local Development (Docker)

```bash
docker compose up
```

Open [http://localhost:4000](http://localhost:4000)

### Preview Drafts

```bash
docker compose run --service-ports jekyll bundle exec jekyll serve --host 0.0.0.0 --livereload --drafts
```

## 📝 Writing a Blog Post

1. Create a new file in `_posts/` with the format `YYYY-MM-DD-your-title.md`
2. Add front matter:

```yaml
---
title: "Your Post Title"
date: 2025-01-15
description: "A short description"
tags: [Tag One, Tag Two]
keywords: [Keyword One, Keyword Two]
featured: true
---
```

3. Write your content in markdown
4. Commit and push — GitHub Actions will deploy automatically

### Math Support

Inline math: `$E = mc^2$`

Display math:
```
$$\mathcal{L} = -\frac{1}{N}\sum_{i=1}^{N} \log \frac{\exp(\text{sim}(f_i, v_i)/\tau)}{\sum_{j=1}^{N}\exp(\text{sim}(f_i, v_j)/\tau)}$$
```

## 🏗️ Project Structure

```
├── _config.yml           # Jekyll configuration
├── _layouts/             # Page templates (default, home, blog, post)
├── _includes/            # Reusable partials (window chrome, taskbar, etc.)
├── _posts/               # Published blog posts
├── _drafts/              # Unpublished drafts
├── assets/css/main.css   # Complete Win95 theme
├── assets/js/main.js     # Theme toggle, clock, search, tag filter, post graph
├── index.html            # About page
├── blog.html             # Blog listing page
├── Dockerfile            # Docker config for local dev
├── docker-compose.yml    # Docker Compose for local dev
└── .github/workflows/    # CI/CD pipeline
```

## 🔧 Deployment

This site is automatically deployed to GitHub Pages when you push to `main`.

The GitHub Actions workflow (`.github/workflows/deploy.yml`):
1. Checks out the code
2. Installs Ruby + Bundler
3. Builds the Jekyll site
4. Deploys to GitHub Pages

### GitHub Pages Setup

1. Go to your repo **Settings → Pages**
2. Under **Source**, select **GitHub Actions**
3. Push to `main` and the workflow will handle the rest

## 📄 License

See [LICENSE](LICENSE) file.
