# jack.direct

Personal blog by Jack Klimov — engineering leadership, distributed systems, Rust, and AI. Built with [Astro](https://astro.build/), styled with [Tailwind CSS](https://tailwindcss.com/).

> Based on [astro-erudite](https://github.com/jktrn/astro-erudite) by [@jktrn](https://github.com/jktrn), heavily customized.

## Quick Start

```bash
npm install
just dev
```

Open [localhost:1234](http://localhost:1234).

## Stack

- **Framework**: [Astro](https://astro.build/) with static output, deployed to Cloudflare Pages
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) components
- **Content**: [MDX](https://mdxjs.com/) with content collections, Zod validation
- **Code blocks**: [Expressive Code](https://expressive-code.com/) (line numbers, collapsible sections, dual themes)
- **Search**: [FlexSearch](https://github.com/nicmord/FlexSearch) (client-side, cached in localStorage)
- **Math**: KaTeX via remark-math / rehype-katex
- **Fonts**: [Geist](https://vercel.com/font) sans + mono

## Commands

All commands are available via [`just`](https://github.com/casey/just):

```bash
just              # list available commands
just dev          # start dev server (port 1234)
just build        # type-check + build
just preview      # preview production build (port 4321)
just check        # run astro type checker
just format       # format code with prettier
just test         # run e2e tests (playwright)
just new "Title"  # create a new blog post
```

See the `justfile` for the full list and options.

## Creating Posts

```bash
# New draft post
just new "Your Post Title"

# With tags and featured flag
just new "Your Post Title" --featured --tags rust,programming

# Subpost (part of a series)
just new "Box and Rc" --subpost-of note-about-smart-pointers-in-rust
```

This creates a `.mdx` file in `src/content/blog/` with frontmatter and an image directory in `public/content/images/YYYY/MM/`.

### Frontmatter

```yaml
---
title: "Your Post Title"
description: "One-line summary for SEO and cards"
date: 2026-04-01
image: /content/images/2026/04/your-post-title.png
authors:
  - jack-klimov
tags:
  - distributed-systems
draft: true       # hidden from listings until removed
featured: false   # shown in homepage featured grid (max 4)
---
```

### Content structure

```
src/content/blog/
  cap-theorem-for-developers.mdx          # standalone post
  note-about-smart-pointers-in-rust.mdx   # parent post
  note-about-smart-pointers-in-rust/
    box-and-rc.mdx                         # subpost (order via `order` field)
    arc-and-mutex.mdx                      # subpost
```

- **Ordering** is by `date` in frontmatter, not filename.
- **Subposts** live in a directory named after the parent slug. Use the `order` field to control sequence within a series.
- **Slugs** = filenames (without extension). Keep them URL-friendly.

## Environment Variables

```env
# Analytics (optional)
PUBLIC_GOOGLE_ANALYTICS_ID=
PUBLIC_UMAMI_WEBSITE_ID=
```

## Configuration

Edit `src/consts.ts` for site metadata, navigation, and social links. Edit `src/styles/global.css` for the color palette and fonts.

## License

[MIT](LICENSE)
