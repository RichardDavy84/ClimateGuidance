# Design and editorial strategy

## Identity and progression

Richard Davy is the primary identity. Climate Guidance remains the website name. A restrained masthead, cream paper, charcoal ink, serif display typography and small terracotta accents replace corporate banners and sales packages. Typography is system-based; no new font, animation or framework dependency is required.

The homepage moves from the person and current scientific position to a physical/quantitative approach, four research themes, Counting Carbon, usable tools, selected publications, verified communication and finally independent advisory work. Each area offers a useful onward route rather than repeating a sales CTA.

Scientific figures are shown without aesthetic recolouring and with credits and links. The Apatity figure is never described as Bergen. The boundary-layer graphic is explicitly conceptual, not measured data. Tool screenshots are local captures of retained interfaces.

## Content architecture

`content/profile.json`, `research.json`, `publications.json`, `projects.json`, `media.json`, `teaching.json`, `tools.json`, `services.json`, `book.json` and `assets.json` are the editable records. `source-records.json` and `sources.md` provide factual provenance. `scripts/render-profile.mjs` turns them into static HTML during local preview/build. Publication filtering uses local HTML and a small script, not a third-party scraper. Unverified media records are filtered out before rendering.

Existing calculation modules, scientific inputs, Stripe configuration/checkout code, paid-file delivery, Formspree destination, DNS and production workflow settings are retained. The development build only changes presentation and static-page build support.

## Research findings

Institutional NERSC/Bjerknes profiles, NVA, the institutional CV, publisher/DOI records and author/project pages support the research narrative. NPR/WBUR and Climate Hour provide actual interviews. Bjerknes supplies an actual public video, while the Polar Academy and ESA SAGE programmes substantiate teaching/talks. Scientific American is research coverage, not an interview. Unknown teaching dates, membership wording and other gaps are listed separately.

## Four visitor reviews

| Visitor | Route and evidence | Assessment |
|---|---|---|
| Journalist | Name/position above the fold; topic-specific Research and Media pages; direct Contact and media enquiry route | Can identify expertise, hear prior interviews and enquire without encountering sales copy. |
| Publisher | Prominent author identity and Counting Carbon module; methods, sample pages, free companions and scientific record | Book sits within a coherent research career; existing independent formats remain one route rather than the entire identity. |
| Scientific colleague | Explicit first/co-author labels, full author details, DOI links, project leadership distinctions and auditable sources | No citation counters, submitted-as-funded claims or institutional endorsement. |
| Advisory client | Visible Consulting tab, low homepage advisory module and clear contact reason | Availability discoverable without consultancy packages dominating the profile. |

## Deferred

Bergen-specific material is excluded at Richard’s request, while the broader urban-climate theme remains. This is a review draft and has not been merged, pushed or deployed.

## Owner review changes, 19 October 2026

The owner requested a visible Consulting tab, a Home link, Climate Tools naming, positive prose without U+2014 punctuation, and research summaries focused on the science. Consulting now restores planning timescales, application examples and seven FAQs. Good Summer Index is written in full throughout its page, chart, legend and cards, with authorship credited to Richard. The original tool URL and scientific data remain in place. A separate direct paperback option leads to a €19.99 Europe-inclusive Stripe sandbox checkout. Its live activation is reserved for a later launch.
