# Climate Guidance baseline

Inspected main at 5b3b0a5 (7 October 2026). Work branch: feature/counting-carbon.

The repository contains static HTML pages and shared style.css, with Montserrat, teal #17494D, #f9f9f9 background, 1120px content width and a 768px mobile breakpoint. Routing is direct HTML plus directory index pages (warm-nights). Navigation is repeated in pages and uses a mobile checkbox toggle. Footer markup is simple and repeated. Assets live at root and beneath warm-nights/assets.

CNAME points to www.climateguidance.com, consistent with GitHub Pages. No checked-in deployment workflow, server framework, package manager, build, lint, test, environment handling, ecommerce, private storage or analytics integration was found. Contact uses Formspree. SEO uses title/description, sitemap and JSON-LD. Existing image alt text is present; focus conventions are mostly browser defaults.

Baseline: clean clone; HTML/CSS/static assets require no production build. Production configuration, CNAME, DNS and contact settings will remain unchanged. New scientific tools load scripts only on their own routes. The payments backend is an optional separate test-only service; it is not deployable on static GitHub Pages itself.
