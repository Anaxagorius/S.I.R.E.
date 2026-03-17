# S.I.R.E. — Tech Showcase Poster

This directory contains everything needed to produce the S.I.R.E. tech-showcase poster.

## Files

| File | Description |
|------|-------------|
| `generate_poster.py` | Python 3 script that builds the poster HTML and embeds a QR code |
| `SIRE_Tech_Showcase_Poster.html` | Pre-generated, self-contained poster (ready to open) |

## Viewing / Printing

1. Open `SIRE_Tech_Showcase_Poster.html` in any modern browser.
2. To produce a **print-ready PDF**: `File → Print → Save as PDF` (set to A1 landscape for best results).
3. The poster is fully self-contained — no internet connection is required after generation (fonts fall back gracefully when offline).

## Regenerating

If you update project details, re-run the generator:

```bash
# Install dependencies once
pip install qrcode pillow

# Re-generate the poster
python3 generate_poster.py
```

The script will overwrite `SIRE_Tech_Showcase_Poster.html` in this directory.

## Poster Contents

- **Header** — S.I.R.E. branding, full project title, course/instructor credits, QR code
- **About** — Project purpose and key performance targets
- **Stats** — Scenarios, trainees, latency, team size, timeline, code volume
- **Team** — All four team members with names, roles, and responsibilities
- **Technology Stack** — Frontend, Backend, Real-Time, and DevOps layers
- **Architecture Diagram** — Visual overview of the system components
- **Instructor & Trainee Features** — Side-by-side capability lists
- **Sample Timeline** — Fire Emergency scenario escalation (5 events)
- **8 Training Scenarios** — All scenario types with icons and descriptions
- **Architecture Decision Highlights** — Key technical choices and rationale
- **Footer** — Team credits and technology badges
