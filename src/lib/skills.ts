import type { Skill } from "./storage";

export const BUILTIN_SKILLS: Skill[] = [
  {
    id: "builtin-web-app",
    name: "Web App Builder",
    description: "Build complete browser apps that can run in the preview.",
    instructions: `You are an expert web app builder. Produce a polished, working, multi-file implementation using the FILE protocol described in your system prompt (one fenced code block per file, path in the info string). Prefer a real component structure (index.html + styles + script, or React via ESM) over a single giant file. Use accessible semantic HTML, refined spacing, and production-quality interaction. No external assets that require auth.`,
    builtin: true,
    installed: true,
    createdAt: 0,
  },
  {
    id: "builtin-prd",
    name: "PRD Writer",
    description: "Write clear, structured product requirement documents.",
    instructions: `You write Product Requirement Documents. Structure: Problem, Users, Goals, Non-goals, User stories, Functional requirements, Non-functional requirements, Success metrics, Risks. Be concise and specific.`,
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-seo",
    name: "SEO Auditor",
    description: "Analyze pages and suggest SEO improvements.",
    instructions: `You are an SEO expert. Analyze the given page/topic. Return: Title tag (< 60 chars), Meta description (< 160 chars), Primary keyword, Related keywords, H1 recommendation, Content gaps, Schema.org JSON-LD, and 3 improvement priorities.`,
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-debug-py",
    name: "Debug Engineer",
    description: "Find root causes across frontend, backend, Python, and APIs.",
    instructions: `You are a senior debugging engineer. When given code, screenshots, logs, or an error, identify the likely root cause, explain it briefly, provide the smallest safe fix, and suggest a focused verification step. Cover edge cases without guessing.`,
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-excel",
    name: "Data Analyst",
    description: "Analyze spreadsheets, CSVs, and datasets.",
    instructions: `You are a data analyst. When given data or a data question, provide: a summary of the data, key insights, suggested visualizations, and formulas or SQL to answer the question. Use markdown tables.`,
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-fullstack",
    name: "Full-Stack Programmer",
    description: "Plan and write real multi-file apps, APIs, schemas, and deployment steps.",
    instructions: `You are a senior full-stack programmer. Design and implement frontend, backend, APIs, auth, databases, deployment files, tests, scripts, and architecture as separate real files (never one giant blob unless the user explicitly wants a single HTML snippet). For stacks that cannot run in a browser preview (servers, databases), still write every file completely and note what the user needs to run locally or deploy.`,
    builtin: true,
    installed: true,
    createdAt: 0,
  },
  {
    id: "builtin-ui-craft",
    name: "UI Craft",
    description: "Human-feeling product design instead of generic AI layouts.",
    instructions: `You are a product designer with strong taste. Avoid generic AI aesthetics, purple gradients, filler feature cards, and stock marketing copy. Make interfaces feel deliberate, usable, and human-made. Prioritize hierarchy, spacing, contrast, and real workflows over decoration.`,
    builtin: true,
    installed: true,
    createdAt: 0,
  },
  {
    id: "builtin-skill-maker",
    name: "Skill Maker",
    description: "Generate reusable instruction packs for future conversations.",
    instructions: `You create precise reusable skills. When asked to create a skill, return: Name, one-line Description, and Instructions. Instructions should be specific, operational, and short enough to reuse as a system prompt. Avoid vague traits and include exact output rules when needed.`,
    builtin: true,
    installed: true,
    createdAt: 0,
  },
  {
    id: "builtin-vercel",
    name: "Vercel Shipper",
    description: "Prepare projects for GitHub and Vercel deployment.",
    instructions: `You are a deployment engineer for Vercel and GitHub Actions. When deployment is requested, include required files, environment variables, build commands, routing config, and a concise checklist. Keep secrets out of source code.`,
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-code-review",
    name: "Code Reviewer",
    description: "Review code for correctness, security, and maintainability.",
    instructions: `You are a rigorous code reviewer. Prioritize correctness, security, data loss risks, accessibility, performance, and maintainability. Return findings by severity, then a compact patch or corrected snippet. Do not nitpick style unless it affects clarity or behavior.`,
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-ecommerce-store",
    name: "E-Commerce Store",
    description: "Product catalogs, carts, and checkout flows.",
    instructions: "Build product listing, product detail, cart, and checkout pages with real state (cart persisted via the db helper). Include quantity controls, subtotal/tax/total math, and empty-cart/empty-search states. For real payments, write Stripe Checkout/webhook server code separately and flag it as deploy-only.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-blog-cms",
    name: "Blog / CMS",
    description: "Article listing, detail pages, and a simple content model.",
    instructions: "Build a blog with a post list, tags/categories, a detail page with reading time, and a simple content schema (title, slug, date, body, cover image). Store posts via the db helper in preview; note a real CMS/DB swap for production.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-auth-accounts",
    name: "Auth & Accounts",
    description: "Sign-up, login, sessions, and protected routes.",
    instructions: "Build sign-up/login forms with validation and a mock session (stored via db/localStorage) for the preview. Separately write real auth server code (e.g. Auth.js, Lucia, or a provider like Clerk/Supabase Auth) using env vars, and clearly mark it deploy-only.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-payments-stripe",
    name: "Payments (Stripe)",
    description: "Checkout, pricing, and subscription billing UI.",
    instructions: "Build pricing tables, a checkout UI, and a receipt/confirmation state. Write real Stripe integration code (Checkout Sessions, webhooks) as server files needing STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET; never fabricate a working payment in the preview \u2014 simulate success/failure states instead.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-admin-dashboard",
    name: "Admin Dashboard",
    description: "Data tables, filters, and CRUD admin views.",
    instructions: "Build an admin panel with a sortable/filterable data table, row actions (edit/delete/create), and a detail/edit drawer or page. Wire CRUD against the db helper so it's fully functional in preview.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-analytics-charts",
    name: "Analytics & Charts",
    description: "Dashboards with real charting, not static images.",
    instructions: "Build dashboards using real chart components (bar/line/pie) driven by actual data in state or the db helper, with a date-range control and clear empty/loading states. Prefer lightweight canvas/SVG charting over heavy libraries.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-realtime-chat",
    name: "Real-Time Chat",
    description: "Chat UI with message history and typing state.",
    instructions: "Build a chat interface (message list, composer, avatars, timestamps) with messages persisted via the db helper so history survives reload. Note that true real-time (WebSockets) needs a real server; simulate live updates with local state in preview.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-social-feed",
    name: "Social Feed",
    description: "Posts, likes, comments, and a feed layout.",
    instructions: "Build a scrollable feed of posts with like/comment counts and a composer, all backed by the db helper. Include optimistic UI updates in preview.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-booking-scheduling",
    name: "Booking & Scheduling",
    description: "Calendars, time slots, and appointment flows.",
    instructions: "Build a booking flow: date/time slot picker, availability display, and confirmation step, storing bookings via the db helper. Handle double-booking and past-date edge cases.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-kanban-board",
    name: "Kanban Board",
    description: "Drag-and-drop project/task boards.",
    instructions: "Build a Kanban board with draggable cards across columns (native HTML5 drag events, no heavy library needed), persisting board state via the db helper. Include add/edit/delete card and column actions.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-calendar-view",
    name: "Calendar View",
    description: "Month/week calendar grids with events.",
    instructions: "Build a month or week calendar grid showing events per day, with an add/edit event modal. Persist events via the db helper and handle month navigation correctly.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-notifications-center",
    name: "Notifications Center",
    description: "In-app notification lists and toasts.",
    instructions: "Build a notification bell/dropdown with a read/unread state and a full notifications page, backed by the db helper. Include a lightweight toast system for real-time-feeling feedback.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-email-templates",
    name: "Email Templates",
    description: "Transactional and marketing email HTML.",
    instructions: "Write email-safe HTML (table-based layout, inline styles, no external CSS) for transactional emails (welcome, receipt, reset-password) and note that real sending needs a provider (Resend, SendGrid, Postmark) configured via an API key env var.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-onboarding-flow",
    name: "Onboarding Flow",
    description: "Multi-step signup/setup wizards.",
    instructions: "Build a multi-step onboarding wizard with a progress indicator, per-step validation, and a summary/confirm step, persisting partial progress in state so back/forward doesn't lose data.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-pricing-tables",
    name: "Pricing Tables",
    description: "Plan comparison and tier selection UI.",
    instructions: "Build a pricing page with 2-4 tiers, a feature comparison table, and a monthly/annual toggle that recalculates prices live. Highlight the recommended tier clearly.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-saas-billing",
    name: "SaaS Billing",
    description: "Usage-based and subscription billing screens.",
    instructions: "Build billing/account screens: current plan, usage meter, invoice history, and upgrade/downgrade flow, using mock data via the db helper. Note real billing needs a provider (Stripe Billing) wired server-side.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-multi-step-forms",
    name: "Multi-Step Forms",
    description: "Wizards with validation across steps.",
    instructions: "Build forms split into logical steps with a progress bar, inline validation per field, and a way to go back without losing entered data. Show a clear final review step before submit.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-form-validation",
    name: "Form Validation",
    description: "Robust client-side validation patterns.",
    instructions: "Add real-time validation with clear, specific error messages (not just 'invalid'), correct input types/attributes, and accessible error association (aria-describedby). Validate on blur and again on submit.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-search-and-filter",
    name: "Search & Filter",
    description: "Fast client-side search, filters, and sorting.",
    instructions: "Build a search box with debounced filtering, faceted filters (checkboxes/ranges), and sort controls, all operating on in-memory data instantly. Show result counts and a clear 'no results' state.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-infinite-scroll",
    name: "Infinite Scroll",
    description: "Paginated feeds that load more on scroll.",
    instructions: "Implement infinite scroll or 'load more' pagination using IntersectionObserver, with a loading indicator and a graceful end-of-list state. Avoid re-fetching already-loaded pages.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-drag-and-drop",
    name: "Drag & Drop",
    description: "Reorderable lists, uploads, and sortable grids.",
    instructions: "Implement drag-and-drop reordering with native HTML5 drag events or pointer events, clear visual drop indicators, and keyboard-accessible fallback controls (move up/down buttons).",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-file-upload-ui",
    name: "File Upload UI",
    description: "Drop zones, previews, and progress states.",
    instructions: "Build a drag-and-drop file drop zone with file-type/size validation, image thumbnail previews, and per-file progress/remove controls. Note real storage needs a provider (S3, Vercel Blob, Supabase Storage) server-side.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-image-gallery",
    name: "Image Gallery",
    description: "Grids, lightboxes, and masonry layouts.",
    instructions: "Build an image grid with a lightbox/modal viewer (keyboard arrow navigation, close on escape/backdrop click) and lazy-loaded thumbnails.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-media-player",
    name: "Video/Audio Player",
    description: "Custom playback controls.",
    instructions: "Build a custom video/audio player UI over the native <video>/<audio> element: play/pause, seek bar, volume, and time display, all keyboard accessible.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-markdown-editor",
    name: "Markdown Editor",
    description: "Live-preview text editing.",
    instructions: "Build a split-pane markdown editor with a live-rendered preview, basic toolbar (bold/italic/link/list), and safe rendering (no raw HTML injection).",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-rich-text-editor",
    name: "Rich Text Editor",
    description: "WYSIWYG editing with contentEditable.",
    instructions: "Build a lightweight WYSIWYG editor using contentEditable and document.execCommand-free formatting (manual DOM manipulation or a small state model), with a clear toolbar and sanitized output.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-maps-geolocation",
    name: "Maps & Geolocation",
    description: "Location pickers and map displays.",
    instructions: "Build a location-aware UI (address input, a static or lightweight map render, distance/ETA display) using the browser's Geolocation API where relevant. Note real map tiles need a provider key (Mapbox/Google Maps) as an env var.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-weather-integration",
    name: "Weather Widgets",
    description: "Weather displays fed by public APIs.",
    instructions: "Build a weather widget UI (current conditions, forecast cards) with mock data by default, and note the real fetch would call a public weather API using an API key env var if the user wants live data.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-canvas-games",
    name: "Simple Canvas Games",
    description: "2D games using the Canvas API.",
    instructions: "Build small 2D games (e.g. snake, breakout, platformer) using the HTML5 Canvas API with a game loop via requestAnimationFrame, keyboard/touch controls, and a score/game-over state.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-pwa-offline",
    name: "PWA & Offline Support",
    description: "Installable, offline-capable web apps.",
    instructions: "Add a web app manifest, appropriate meta tags, and explain the service worker strategy needed for offline support (note: service workers need real hosting to register properly, not this preview iframe).",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-i18n-localization",
    name: "i18n & Localization",
    description: "Multi-language UI support.",
    instructions: "Structure UI text through a simple translation dictionary/lookup function rather than hardcoded strings, support at least two locales, and handle basic RTL layout considerations when relevant.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-accessibility-a11y",
    name: "Accessibility (a11y)",
    description: "Keyboard nav, ARIA, and screen-reader support.",
    instructions: "Ensure semantic HTML, visible focus states, correct ARIA roles/labels only where native semantics fall short, sufficient color contrast, and full keyboard operability for every interactive element.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-theming-dark-mode",
    name: "Theming & Dark Mode",
    description: "Consistent light/dark theme switching.",
    instructions: "Implement a theme toggle using CSS custom properties (not hardcoded colors scattered through components), persist the choice, and respect prefers-color-scheme as the default.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-micro-interactions",
    name: "Animation & Micro-interactions",
    description: "Purposeful motion, not decoration.",
    instructions: "Add subtle transitions/animations (hover, press, enter/exit) using CSS transitions or the Web Animations API. Keep durations short (120-250ms), respect prefers-reduced-motion, and never animate purely for show.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-performance-optimization",
    name: "Performance Optimization",
    description: "Faster loads and smoother interactions.",
    instructions: "Identify and fix obvious performance issues: unnecessary re-renders, unoptimized images, large blocking scripts, layout thrash. Explain the specific change and why it helps.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-security-hardening",
    name: "Security Hardening",
    description: "Common web vulnerability prevention.",
    instructions: "Review and fix for XSS (never inject raw HTML from user input), CSRF on state-changing requests, insecure direct object references, and secrets accidentally exposed client-side. Explain each fix briefly.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-rest-api-design",
    name: "REST API Design",
    description: "Clean, consistent HTTP API contracts.",
    instructions: "Design REST endpoints with correct HTTP verbs/status codes, consistent JSON response shapes, pagination, and clear error responses. Write matching server route files for the target host.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-graphql-api",
    name: "GraphQL API",
    description: "Schema-first API design.",
    instructions: "Design a GraphQL schema (types, queries, mutations) with clear naming and pagination (cursor-based where relevant), plus example resolver code for the target server runtime.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-database-schema-design",
    name: "Database Schema Design",
    description: "Normalized, indexed relational schemas.",
    instructions: "Design a normalized relational schema (tables, keys, foreign keys, indexes) matching the app's actual data needs, as SQL or an ORM schema file (Prisma/Drizzle), with brief notes on why each index exists.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-automated-testing",
    name: "Automated Testing",
    description: "Unit and end-to-end test coverage.",
    instructions: "Write focused unit tests for core logic and a couple of end-to-end scenarios for critical user flows, using a common framework (Vitest/Jest, Playwright) appropriate to the stack.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-cicd-pipelines",
    name: "CI/CD Pipelines",
    description: "GitHub Actions and deployment automation.",
    instructions: "Write a GitHub Actions workflow (lint, test, build, deploy) appropriate to the project's stack and target host (Vercel), keeping secrets referenced via GitHub Actions secrets, never hardcoded.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-error-monitoring",
    name: "Error Monitoring & Logging",
    description: "Structured logging and error boundaries.",
    instructions: "Add error boundaries around risky UI sections, structured console logging with context (not bare console.log), and note where a real monitoring service (Sentry) would plug in via an env-var DSN.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-cookie-consent-gdpr",
    name: "Cookie Consent & GDPR",
    description: "Consent banners and privacy basics.",
    instructions: "Build a cookie consent banner (accept/reject/customize) that actually gates non-essential scripts behind consent, plus a basic privacy policy page structure.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-landing-page",
    name: "Marketing Landing Page",
    description: "Conversion-focused single pages.",
    instructions: "Build a landing page with a clear hero, specific (not generic) value props, social proof section, and one strong call-to-action repeated appropriately. Avoid stock-feeling filler copy.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-portfolio-site",
    name: "Portfolio Site",
    description: "Personal/creative work showcases.",
    instructions: "Build a portfolio with a project grid, individual project detail pages/sections, and an about/contact section, prioritizing the work itself over decoration.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-docs-site",
    name: "Documentation Site",
    description: "Structured technical docs with navigation.",
    instructions: "Build a docs layout with a sidebar nav, breadcrumbs, in-page table of contents, and code-block styling with a copy button. Structure content hierarchically.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-changelog-generator",
    name: "Changelog Generator",
    description: "Structured release notes.",
    instructions: "Write or format a changelog grouped by version and category (Added/Changed/Fixed/Removed), following Keep a Changelog conventions, from the changes described.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-cli-tool-builder",
    name: "CLI Tool Builder",
    description: "Command-line utilities and scripts.",
    instructions: "Write a CLI tool (Node.js or the requested language) with clear argument parsing, --help output, sensible exit codes, and no silent failures.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-browser-extension",
    name: "Browser Extension",
    description: "Chrome/Firefox extension scaffolding.",
    instructions: "Write a manifest.json (v3) plus background/content/popup scripts for a browser extension, using the minimum permissions the feature actually needs, with a brief note on loading it unpacked for testing.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-webhooks-integration",
    name: "Webhooks Integration",
    description: "Receiving and verifying external events.",
    instructions: "Write a webhook receiver endpoint that verifies the sender's signature (never trust an unverified webhook), handles idempotency, and responds quickly while queuing heavier work.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-push-notifications",
    name: "Push Notifications",
    description: "Web push and in-app alerts.",
    instructions: "Build the permission-request UI and notification display logic; explain that real web push needs a service worker and a push service (VAPID keys) which can't run inside this preview iframe.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-qr-code-tools",
    name: "QR Code Tools",
    description: "Generating and displaying QR codes.",
    instructions: "Generate QR codes client-side (canvas-based, no external service call needed) for the given data, with adjustable size and a download button.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-pdf-generation",
    name: "PDF Generation",
    description: "Client-side document/report generation.",
    instructions: "Generate PDFs client-side (e.g. via a lightweight library loaded from CDN) from structured data, with correct pagination and print-appropriate styling.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-data-export",
    name: "Data Export (CSV/Excel)",
    description: "Exporting tables to spreadsheet formats.",
    instructions: "Add export-to-CSV (and Excel where asked) for any data table shown, correctly escaping commas/quotes, with a sensible filename including the date.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-voice-speech-ui",
    name: "Voice & Speech UI",
    description: "Speech recognition and synthesis.",
    instructions: "Build UI using the Web Speech API (SpeechRecognition for input, SpeechSynthesis for output) with clear listening/speaking states and a graceful fallback when unsupported.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-chatbot-widget",
    name: "Chatbot Widget",
    description: "Embeddable support/chat widgets.",
    instructions: "Build a floating chat widget (launcher button, expandable panel, message list, composer) suitable for embedding, with mock responses via the db helper unless real AI wiring is requested.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-subscription-membership",
    name: "Subscription/Membership Site",
    description: "Gated content behind a paywall.",
    instructions: "Build a membership site with public/gated content states, a clear upgrade prompt on locked content, and mock entitlement checks via the db/session helper.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-job-board",
    name: "Job Board",
    description: "Listings, applications, and filters.",
    instructions: "Build a job board with filterable listings, a detail page, and an application form, storing everything via the db helper.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-forum-community",
    name: "Forum / Community Board",
    description: "Threads, replies, and voting.",
    instructions: "Build a forum with threads, nested or flat replies, and upvote/downvote counts, persisted via the db helper, with clear sort options (new/top).",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-wiki-knowledge-base",
    name: "Wiki / Knowledge Base",
    description: "Structured, searchable articles.",
    instructions: "Build a wiki with a category tree, article pages, and a search box that filters by title/content, structured for easy navigation between related articles.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-survey-poll-builder",
    name: "Survey & Poll Builder",
    description: "Custom forms with response collection.",
    instructions: "Build a survey/poll builder (add/reorder questions of a few types) and a response-taking view, storing responses via the db helper and showing an aggregate results view.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-feature-flags",
    name: "Feature Flags",
    description: "Toggleable features without redeploys.",
    instructions: "Implement a simple feature-flag system (a config object or the db helper) that gates UI/behavior per flag, with a small admin toggle UI for testing different states.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-design-system",
    name: "Design System / Component Library",
    description: "Consistent, reusable UI primitives.",
    instructions: "Build a small set of consistent, reusable components (button, input, card, badge) with clear variants/sizes defined once and reused everywhere, instead of one-off styled elements per page.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-three-d-canvas",
    name: "3D & WebGL Basics",
    description: "Lightweight three.js scenes.",
    instructions: "Build simple 3D scenes/visualizations using three.js loaded from CDN (basic geometry, lighting, camera controls), keeping the scene graph small and performant.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-data-viz-d3",
    name: "Data Visualization (D3)",
    description: "Custom, non-templated charts.",
    instructions: "Build custom data visualizations with D3 (scales, axes, transitions) when a standard chart library isn't expressive enough for the requested visualization.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-marketplace-platform",
    name: "Marketplace / Two-Sided Platform",
    description: "Buyers, sellers, and listings.",
    instructions: "Build a two-sided marketplace structure: seller listing management, buyer browse/search, and a simple transaction/order record, all via the db helper for preview.",
    builtin: true,
    installed: false,
    createdAt: 0,
  },
];

// ---------------------------------------------------------------------------
// Agent protocol
//
// The model is asked to answer in three phases so the UI can show live,
// Claude-style status instead of a blank spinner:
//
//   1. `### Plan` — a short bullet list of what it's about to build.
//   2. One fenced code block per file, written as:
//        ```tsx src/App.tsx
//        ...file contents...
//        ```
//      (language tag, then a space, then the file path, on the same line
//      that opens the fence). Any number of files, any stack.
//   3. A closing note (optional) — how to run / what was built.
//
// A single ```html fenced block with no path is still supported for quick
// one-file sites, for backward compatibility with existing projects.
// ---------------------------------------------------------------------------

export const CORE_SYSTEM_PROMPT = `You are JagX Dev — an elite AI development agent built on NVIDIA models. You help users design, program, debug, and ship real software, and you work like a senior engineer pairing with the user, not a text completion engine.

Before anything else: if the request is genuinely ambiguous in a way that would change the architecture (which auth, what the data model looks like, what pages/roles exist, a specific visual style), ask up to 3 short, concrete questions instead of guessing, and wait for the user's answer before writing files. Don't ask about things you can just decide well (pick a sensible modern default and say so in the Plan) — only ask when the answer would meaningfully change what you build, or the user's request is too thin to act on safely.

Once you have enough to build, always answer in this order:
1. Start with a section titled exactly "### Plan". For anything beyond a one-line tweak — and always for a new app, a clone of a real product, or anything with more than a couple of files — this must be a real design pass, not a summary written after the fact: decide the page/route structure, the data model, and the key components *before* you write any file, then list 3-6 short bullets reflecting those decisions. Keep each bullet under 15 words. Only skip the Plan for genuinely trivial one-line edits to an existing file.
2. Then write the actual files. Every file goes in its own fenced code block, and the opening fence MUST include the language and the file path separated by a space, e.g.:
   \`\`\`tsx src/App.tsx
   ...
   \`\`\`
   \`\`\`css src/styles.css
   ...
   \`\`\`
   Use real, sensible file paths (src/, components/, api/, etc). Write complete file contents, not diffs or "// rest unchanged" placeholders.
3. If — and only if — the whole build is a single static page, you may instead use one \`\`\`html block with no path; the preview will render it directly.
4. After the files, add a short "### Done" note: one or two sentences on what you built, plus a "### Environment Variables" list if the build needs any (see below). Skip both for tiny tweaks.

Runtime constraints — this workspace has NO bundler, NO npm install, and NO Node server. Files are executed directly in the browser:
- React/TSX/JSX files run as in-browser Babel-transpiled scripts, NOT ES modules. NEVER use \`import\`/\`export\` in these files (including \`import { createRoot } from "react-dom/client"\`, \`export default function App()\`, etc.) — a single leftover import/export line makes the ENTIRE file fail to run and the preview goes blank with nothing rendered. Instead, define components as plain global functions/consts (e.g. \`function App() { ... }\`, \`function TodoItem({ item }) { ... }\`). React and ReactDOM are already loaded globally.
- NEVER call \`createRoot\`/\`ReactDOM.render\`/\`.render(<App/>)\` yourself. The runtime finds whichever top-level component is named \`App\` (or \`Main\`) and mounts it automatically. Just define that component and stop — writing your own mount code is redundant and a common source of bugs here.
- Any error is now shown as a visible overlay in the preview instead of a blank screen — if you see one reported back to you, it names the exact file and line; fix that specific problem rather than rewriting everything.
- A global \`db\` object is always available for client-side persistence, backed by localStorage so data survives reloads: \`db.read(collection)\` returns an array (creating it empty on first use), \`db.write(collection, array)\` saves it, \`db.uid()\` makes a short id. Use this for any app that needs to "save" data in the live preview (todos, notes, carts, posts) — it makes CRUD actually work end-to-end in preview, not just look like it does.

Building full-stack apps (the user wants something that works "for real", not just a mockup):
- Design it like a real product: real data model, real validation, real empty/loading/error states. Wire all CRUD directly against the \`db\` helper (or component state for pure UI, never fake/hardcoded lists pretending to be live data) so it's genuinely interactive in preview today.
- If the user's request implies a real backend/database/auth for production (not just the preview), ALSO write the real server-side files for their target host — e.g. Vercel serverless functions (\`api/todos.ts\` exporting \`export default async function handler(req, res) {...}\` for Node runtime, or \`export async function GET(request) {...}\` returning a \`Response\` for Edge runtime), a schema file, and a real DB client (e.g. \`@vercel/postgres\`, \`drizzle-orm\`, \`prisma\`, or a Supabase/PlanetScale/Neon client) reading connection info from \`process.env\`. These files won't run inside this browser preview (there's no server here) — say so plainly.
- Whenever you introduce a real env var (DATABASE_URL, AUTH_SECRET, STRIPE_SECRET_KEY, any API key), end with a "### Environment Variables" section listing each \`KEY_NAME\` — what it's for, and whether it's server-only (never exposed to the browser) or safe to expose on the client (must be prefixed the way the target framework expects, e.g. \`VITE_\`/\`NEXT_PUBLIC_\`). Never invent a fake value — tell the user to get their own from the relevant provider and put it in Settings → Environment Variables here (tracked locally) plus their host's dashboard and a git-ignored \`.env.local\` for local dev. Never put real secrets in code you write.

Rules:
- Be concise in prose. Do not narrate obvious steps. Let the plan and files speak.
- Prefer multiple small, well-named files over one giant file, the way a real project is structured.
- Never use TODO placeholders or omit logic you were asked for.
- When a Skill is active below, follow its instructions faithfully in addition to these rules.`;

export type SystemPromptOptions = {
  /** If false, skip the "ask before building" instruction — the agent will
   * always take its best guess and build immediately. */
  askBeforeBuilding?: boolean;
  /** Env var KEY NAMES (never values) already tracked for this project, so
   * the agent knows what's configured and doesn't ask for or redefine them. */
  envVarKeys?: string[];
};

export function buildSystemPrompt(installedSkills: Skill[], options: SystemPromptOptions = {}): string {
  let prompt = CORE_SYSTEM_PROMPT;

  if (options.askBeforeBuilding === false) {
    prompt = prompt.replace(
      /Before anything else:.*?request is too thin to act on safely\.\n\n/s,
      "",
    );
  }

  if (options.envVarKeys && options.envVarKeys.length > 0) {
    prompt += `\n\n---\n# Already configured for this project\nThese environment variable names are already tracked (values are not shared with you): ${options.envVarKeys.join(", ")}. Reference them by name in code via process.env; don't ask the user to re-provide them or invent new names for the same purpose.`;
  }

  const active = installedSkills.filter((s) => s.installed);
  if (active.length === 0) return prompt;
  const skillBlock = active
    .map((s) => `## Skill: ${s.name}\n${s.instructions}`)
    .join("\n\n");
  return `${prompt}\n\n---\n# Installed Skills\n\n${skillBlock}`;
}

export type GeneratedFile = {
  path: string;
  lang: string;
  content: string;
};

/** Legacy/simple case: one bare ```html block with no path. */
export function extractHtmlBlock(text: string): string | null {
  const match = text.match(/```html\s*\n([\s\S]*?)```/i);
  return match ? match[1].trim() : null;
}

const FENCE_WITH_PATH = /```([a-zA-Z0-9_+-]+)[ \t]+([^\s`]+\.[a-zA-Z0-9]+)\s*\n([\s\S]*?)```/g;

/** Full multi-file extraction: every ```lang path/to/file fenced block. */
export function extractFiles(text: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(FENCE_WITH_PATH);
  while ((m = re.exec(text)) !== null) {
    const [, lang, path, content] = m;
    if (seen.has(path)) {
      // last write wins if the model repeats a path (e.g. during a revision)
      const idx = files.findIndex((f) => f.path === path);
      if (idx >= 0) files[idx] = { path, lang, content: content.trim() };
      continue;
    }
    seen.add(path);
    files.push({ path, lang, content: content.trim() });
  }
  return files;
}

/** Pull out the "### Plan" bullets so the UI can show them as live status. */
export function extractPlan(text: string): string[] {
  const match = text.match(/###\s*Plan\s*\n([\s\S]*?)(?=\n```|\n###|$)/i);
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((l) => l.replace(/^[\s*-]+/, "").trim())
    .filter(Boolean);
}

/** Pull out the closing "### Done" note, if present. */
export function extractDoneNote(text: string): string | null {
  const match = text.match(/###\s*Done\s*\n([\s\S]*)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Full extraction with legacy fallback: prefers real `path` fenced files, and
 * if the model instead used the single bare ```html block (still allowed for
 * trivial one-page sites), synthesizes an `index.html` file from it so every
 * downstream consumer (preview, file tree, storage) only has one shape to
 * deal with.
 */
export function extractGeneratedFiles(text: string): GeneratedFile[] {
  const files = extractFiles(text);
  if (files.length > 0) return files;
  const html = extractHtmlBlock(text);
  if (html) return [{ path: "index.html", lang: "html", content: html }];
  return [];
}

/** Strip the Plan/Done markers and file fences out of a response, leaving
 * only free-form prose (questions, caveats, non-file explanations). */
export function stripStructuredMarkup(text: string): string {
  let out = text;
  out = out.replace(/###\s*Plan\s*\n[\s\S]*?(?=\n```|\n###|$)/i, "");
  out = out.replace(new RegExp(FENCE_WITH_PATH), "");
  out = out.replace(/```html\s*\n[\s\S]*?```/i, "");
  out = out.replace(/###\s*Done\s*\n[\s\S]*$/i, "");
  return out.trim();
}

const REACT_EXT = /\.(tsx|jsx)$/i;
const CSS_EXT = /\.css$/i;

/** Tiny localStorage-backed "database" injected into every preview so CRUD
 * apps (todos, notes, carts...) actually persist data across reloads instead
 * of just looking interactive. Namespaced per browser tab's origin+path via
 * localStorage already being iframe/document-scoped. */
const DB_RUNTIME_SCRIPT = `
<script>
window.db = (function () {
  function read(collection) {
    try {
      const raw = window.localStorage.getItem("jagx_db_" + collection);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function write(collection, arr) {
    try { window.localStorage.setItem("jagx_db_" + collection, JSON.stringify(arr)); } catch (e) {}
    return arr;
  }
  function uid() {
    return Math.random().toString(36).slice(2, 10);
  }
  return { read: read, write: write, uid: uid };
})();
</script>`;

/** Surfaces any error as a readable overlay instead of a silent blank
 * preview — this is the single most important fix for "nothing shows up":
 * every failure is now visible and points at the actual problem. */
const ERROR_OVERLAY_SCRIPT = `
<script>
window.__jagxShowError = function (title, detail) {
  var el = document.getElementById("__jagx_error__");
  if (!el) {
    el = document.createElement("div");
    el.id = "__jagx_error__";
    el.style.cssText = "position:fixed;inset:0;background:#1a0d0d;color:#ff9b9b;font:12px/1.6 ui-monospace,Menlo,Consolas,monospace;padding:20px;white-space:pre-wrap;overflow:auto;z-index:2147483647;";
    document.body.appendChild(el);
  }
  el.textContent = title + (detail ? ("\\n\\n" + detail) : "");
  try {
    window.parent.postMessage({ source: "jagx-preview", type: "error", title: title, detail: detail || "" }, "*");
  } catch (e) {}
};
window.addEventListener("error", function (e) {
  window.__jagxShowError("Runtime error", (e.error && e.error.stack) || e.message);
});
window.addEventListener("unhandledrejection", function (e) {
  window.__jagxShowError("Unhandled promise rejection", (e.reason && e.reason.stack) || String(e.reason));
});
</script>`;

/** Aliases the React hooks/mount functions as bare globals too, so code
 * that forgets the `React.`/`ReactDOM.` prefix (a common habit from
 * ES-module-era training data) still works instead of throwing
 * "createRoot is not defined". */
const REACT_GLOBALS_SCRIPT = `
<script>
window.useState = React.useState; window.useEffect = React.useEffect;
window.useRef = React.useRef; window.useMemo = React.useMemo;
window.useCallback = React.useCallback; window.useContext = React.useContext;
window.createContext = React.createContext; window.Fragment = React.Fragment;
window.createRoot = ReactDOM.createRoot;
</script>`;

/**
 * Manually transpiles and evaluates every React/TS file in dependency-safe
 * order, in true global scope (via indirect eval, so declarations are
 * visible to files that run after it — same sharing model as separate
 * classic <script> tags). Any transform or runtime error is caught per-file
 * and shown in the error overlay instead of failing silently.
 *
 * Also strips stray import/export statements before transforming — the
 * system prompt tells the model not to use them (there's no bundler here),
 * but this is a safety net for when a model writes them out of habit.
 */
function reactBootstrapScript(files: GeneratedFile[]): string {
  const payload = JSON.stringify(files.map((f) => ({ path: f.path, content: f.content })));
  return `
<script>
(function () {
  function sanitize(code) {
    code = code.replace(/import\\s*(?:[\\w*{}\\s,]+)\\s*from\\s*['"][^'"]+['"];?/g, "");
    code = code.replace(/^[ \\t]*import\\s+['"][^'"]+['"];?[ \\t]*$/gm, "");
    code = code.replace(/^[ \\t]*export\\s+default\\s+/gm, "");
    code = code.replace(/^[ \\t]*export\\s+(?=(function|const|class|let|var)\\b)/gm, "");
    code = code.replace(/^[ \\t]*export\\s*\\{[^}]*\\};?[ \\t]*$/gm, "");
    return code;
  }
  var files = ${payload};
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    try {
      var out = Babel.transform(sanitize(f.content), {
        presets: [["react", { runtime: "classic" }], ["typescript", { isTSX: true, allExtensions: true }]],
        filename: f.path,
      }).code;
      (0, eval)(out);
    } catch (err) {
      window.__jagxShowError("Error in " + f.path, (err && err.stack) || String(err));
      return;
    }
  }
  try {
    var Entry = typeof App !== "undefined" ? App : (typeof Main !== "undefined" ? Main : null);
    if (Entry) {
      var rootEl = document.getElementById("root") || document.getElementById("app") || document.body;
      ReactDOM.createRoot(rootEl).render(React.createElement(Entry));
    } else {
      window.__jagxShowError(
        "Nothing to render",
        "No component named App or Main was found. Define one at the top level and it mounts automatically."
      );
    }
  } catch (err) {
    window.__jagxShowError("Mount error", (err && err.stack) || String(err));
  }
})();
</script>`;
}

/**
 * Assemble a single runnable HTML document from a multi-file project so it
 * can be dropped straight into a sandboxed iframe — no bundler, no backend.
 *
 * - If the files include an index.html, use it as the shell and inline any
 *   local <link rel="stylesheet"> / <script src> files referenced from it.
 * - Otherwise, if there's a React entry (tsx/jsx), build a shell that loads
 *   React + ReactDOM + Babel standalone from a CDN, transpiles every
 *   tsx/jsx file in-browser, and mounts the app — a lightweight
 *   WebContainer-style trick with zero build step.
 * - Otherwise, fall back to concatenating any plain .css/.js files under a
 *   minimal HTML shell.
 */
function orderReactFiles(reactFiles: GeneratedFile[]): GeneratedFile[] {
  const entry =
    reactFiles.find((f) => /(^|\/)(app|main|index)\.(t|j)sx$/i.test(f.path)) ??
    reactFiles[reactFiles.length - 1];
  const others = reactFiles.filter((f) => f !== entry);
  return [...others, entry];
}

export function buildPreviewDocument(files: GeneratedFile[]): string | null {
  if (files.length === 0) return null;

  const byPath = new Map(files.map((f) => [f.path.replace(/^\.?\//, ""), f]));
  const indexHtml = byPath.get("index.html") ?? files.find((f) => /index\.html$/i.test(f.path));
  const runtimeHead = `${ERROR_OVERLAY_SCRIPT}${DB_RUNTIME_SCRIPT}`;

  if (indexHtml) {
    let html = indexHtml.content;
    const referenced: GeneratedFile[] = [];

    html = html.replace(
      /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*>/gi,
      (whole, href) => {
        const file = byPath.get(href.replace(/^\.?\//, ""));
        return file ? `<style>\n${file.content}\n</style>` : whole;
      },
    );
    html = html.replace(/<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/gi, (whole, src) => {
      const file = byPath.get(src.replace(/^\.?\//, ""));
      if (!file) return whole; // leave external/CDN scripts alone
      if (REACT_EXT.test(file.path)) {
        referenced.push(file);
        return ""; // folded into the single bootstrap script below instead
      }
      return `<script>\n${file.content}\n</script>`;
    });

    // Mount any React files even if the model forgot to <script src> them.
    const allReact = files.filter((f) => REACT_EXT.test(f.path));
    const unreferenced = allReact.filter((f) => !referenced.includes(f));
    const reactFiles = orderReactFiles([...referenced, ...unreferenced]);

    let tail = "";
    if (reactFiles.length > 0) {
      tail =
        `<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>` +
        `<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>` +
        `<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>` +
        REACT_GLOBALS_SCRIPT +
        reactBootstrapScript(reactFiles);
    }

    html = /<head[^>]*>/i.test(html)
      ? html.replace(/<head[^>]*>/i, (m) => `${m}${runtimeHead}`)
      : runtimeHead + html;
    html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${tail}</body>`) : html + tail;
    return html;
  }

  const reactFiles = orderReactFiles(files.filter((f) => REACT_EXT.test(f.path)));
  if (reactFiles.length > 0) {
    const cssFiles = files.filter((f) => CSS_EXT.test(f.path));
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Preview</title>
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
${runtimeHead}
${REACT_GLOBALS_SCRIPT}
<style>
  html,body,#root{height:100%;margin:0;}
  body{font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;}
  ${cssFiles.map((f) => f.content).join("\n")}
</style>
</head>
<body>
<div id="root"></div>
${reactBootstrapScript(reactFiles)}
</body>
</html>`;
  }

  const cssFiles = files.filter((f) => CSS_EXT.test(f.path));
  const jsFiles = files.filter((f) => /\.js$/i.test(f.path));
  if (cssFiles.length || jsFiles.length) {
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8" />${runtimeHead}<style>${cssFiles.map((f) => f.content).join("\n")}</style></head>
<body>
<div id="app"></div>
<script>
try {
${jsFiles.map((f) => f.content).join("\n;\n")}
} catch (err) {
  window.__jagxShowError("Runtime error", (err && err.stack) || String(err));
}
</script>
</body></html>`;
  }

  return null;
}
