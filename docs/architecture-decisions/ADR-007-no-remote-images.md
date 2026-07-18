# ADR-007: No arbitrary remote images

- Status: accepted
- Blueprint: sections 4.9, 17.3–17.4, 23.8

## Decision

P0 stores an original image URL only as escaped provenance text when extracted. It never requests, proxies, optimizes, or renders it. Event art is local SVG/CSS and domain initials.

## Consequences

This removes browser tracking, arbitrary image fetches, image optimizer SSRF exposure, and unreliable hotlinks from the product path.
