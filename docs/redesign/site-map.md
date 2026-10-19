# Proposed route map: local development only

| Area | Route |
|---|---|
| Personal research / author homepage | `/` and `/index.html` |
| Research overview | `/research/` |
| Arctic & Sea Ice | `/research/arctic-sea-ice/` |
| Urban Climate, excluding Bergen-specific projects for now | `/research/urban-climate/` |
| Climate Processes & Models | `/research/climate-processes-models/` |
| Climate Information & Decision Support | `/research/decision-support/` |
| Tools gallery | `/climate-tools/` |
| Flagship author project | `/counting-carbon/` |
| Selected publications + research-record links | `/publications/` |
| Media, public explanation, speaking & teaching | `/media/` |
| Career / biography | `/about.html` |
| Consulting, with timescales, application examples and FAQ | `/services.html` |
| Contact and existing Formspree form | `/contact.html` |
| Existing converted tools | `/climate-tools/{reisa,pasvik,marine-heatwaves,snow-forecasts,gsi}/` |
| Existing warm-night explorer | `/warm-nights/` |
| Existing book tools | `/counting-carbon/{carbon-management,claim-checker,carbon-time-machine}/` |
| Direct paperback request and test checkout | `/counting-carbon/paperback/` |
| Existing delivery page | `/counting-carbon/downloads/` |
| Existing data/method notes | `/climate-tools/migration-notes.html` |
| Preserved legacy paths | `/data-viz.html`, `/case-studies.html`, `/interactive-parks.html`, `/services(3).html` |

The brand links to Home. Top-level navigation prioritises Home, Research, Climate Tools, Counting Carbon, Publications, Media & Speaking, Consulting, About and Contact. The brand also links to Home. Consulting has a visible tab, while research and writing continue to lead the homepage.

No route redirects are deployed. Data Viz renders the full gallery with a canonical link to `/climate-tools/`; other legacy URLs retain relevant content and onward links. A future redirect decision is recorded in the audit rather than applied to production.
