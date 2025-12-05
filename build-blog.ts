import { marked } from "marked";
import markedFootnote from "marked-footnote";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { createHash } from "crypto";
import { dirname, join } from "path";

const BLOG_DIR = join(import.meta.dirname, "blog");
const ROOT_DIR = import.meta.dirname;

marked.use(markedFootnote());

// Generate cache bust hash from CSS files
function getCacheBust(): string {
  const cssFiles = ["landing.css", "blog.css"];
  const hash = createHash("md5");
  for (const file of cssFiles) {
    hash.update(readFileSync(join(ROOT_DIR, file)));
  }
  return hash.digest("hex").slice(0, 8);
}

const CACHE_BUST = getCacheBust();

interface BlogPost {
  slug: string;
  title: string;
  subline?: string;
  date: string;
  sourcePath: string;
}

const posts: BlogPost[] = [
  {
    slug: "hello-tygor",
    title: "Hello tygor",
    subline: "Type-Safe RPC from Go to TypeScript",
    date: "Draft, planned to publish soon",
    sourcePath: join(import.meta.dirname, "..", "..", "BLOG_01.md"),
  },
];

function blogHeader(depth: number): string {
  const prefix = depth === 1 ? ".." : "../..";
  return `<header class="blog-header">
    <div class="container">
      <div class="blog-brand">
        <a href="/" class="blog-home">
          <img src="${prefix}/tygor-tiger.svg" alt="" class="blog-tiger">
          <img src="${prefix}/tygor-text.svg" alt="tygor" class="blog-logo">
        </a>
        <span class="blog-label">BLOG</span>
      </div>
      <a href="https://github.com/broady/tygor" class="btn-github" title="View on GitHub">
        <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
      </a>
    </div>
  </header>`;
}

function generatePostHTML(post: BlogPost, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title} - tygor</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../landing.css?v=${CACHE_BUST}">
  <link rel="stylesheet" href="../../blog.css?v=${CACHE_BUST}">
</head>
<body>
  ${blogHeader(2)}

  <main class="blog-content">
    <article class="container">
      <time class="post-date">${post.date}</time>
      ${content}
    </article>
  </main>

  <footer>
    <div class="container">
      <p><a href="https://github.com/broady/tygor">GitHub</a> &middot; <a href="https://github.com/broady/tygor/blob/main/LICENSE">MIT License</a></p>
    </div>
  </footer>
</body>
</html>
`;
}

function generateIndexHTML(posts: BlogPost[]): string {
  const postLinks = posts
    .map(
      (p) => `<li>
          <a href="/blog/${p.slug}/">${p.title}</a>
          ${p.subline ? `<span class="post-subline">${p.subline}</span>` : ""}
          <time class="post-date">${p.date}</time>
        </li>`
    )
    .join("\n        ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog - tygor</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../landing.css?v=${CACHE_BUST}">
  <link rel="stylesheet" href="../blog.css?v=${CACHE_BUST}">
</head>
<body>
  ${blogHeader(1)}

  <main class="blog-content blog-index">
    <article class="container">
      <h2 class="blog-index-heading">Latest posts</h2>
      <ul class="blog-list">
        ${postLinks}
      </ul>
    </article>
  </main>

  <footer>
    <div class="container">
      <p><a href="https://github.com/broady/tygor">GitHub</a> &middot; <a href="https://github.com/broady/tygor/blob/main/LICENSE">MIT License</a></p>
    </div>
  </footer>
</body>
</html>
`;
}

// Generate individual posts
for (const post of posts) {
  const markdown = readFileSync(post.sourcePath, "utf-8");
  const content = marked.parse(markdown);
  const html = generatePostHTML(post, content as string);
  const outDir = join(BLOG_DIR, post.slug);

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html);

  console.log(`Built: /blog/${post.slug}/`);
}

// Generate blog index
mkdirSync(BLOG_DIR, { recursive: true });
writeFileSync(join(BLOG_DIR, "index.html"), generateIndexHTML(posts));
console.log("Built: /blog/");

// Update cache bust in main index.html
const indexPath = join(ROOT_DIR, "index.html");
let indexHtml = readFileSync(indexPath, "utf-8");
indexHtml = indexHtml.replace(
  /href="landing\.css(\?v=[a-f0-9]+)?"/,
  `href="landing.css?v=${CACHE_BUST}"`
);
writeFileSync(indexPath, indexHtml);
console.log(`Updated: /index.html (cache bust: ${CACHE_BUST})`);

console.log("Done!");
