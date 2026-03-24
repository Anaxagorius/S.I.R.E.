# S.I.R.E. — Tech Showcase Poster & Presentation

This directory contains everything needed to produce the S.I.R.E. tech-showcase poster and PowerPoint presentation.

## Files

| File | Description |
|------|-------------|
| `generate_poster.py` | Python 3 script that builds the poster HTML and embeds a QR code |
| `SIRE_Tech_Showcase_Poster.html` | Pre-generated, self-contained HTML poster (ready to open) |
| `generate_pptx.py` | Python 3 script that combines poster content & styling into the PowerPoint template |
| `SIRE_Poster_Presentation.pptx` | Generated PowerPoint presentation (open in PowerPoint or Impress) |

## HTML Poster — Viewing / Printing

1. Open `SIRE_Tech_Showcase_Poster.html` in any modern browser.
2. To produce a **print-ready PDF**: `File → Print → Save as PDF` (set to A1 landscape for best results).
3. The poster is fully self-contained — no internet connection is required after generation (fonts fall back gracefully when offline).

## Regenerating the HTML Poster

```bash
# Install dependencies once
pip install qrcode pillow

# Re-generate the poster
python3 generate_poster.py
```

## PowerPoint Presentation

`SIRE_Poster_Presentation.pptx` merges the poster's three-column layout and colour scheme
(`#e63946` red brand colour) into the `layoutA_fixed_structure.pptx` template.

### Layout

| Column | Contents |
|--------|----------|
| **Left** | Features · Scope · Roles (4 team members) |
| **Centre** | Description · Architecture ERD · 8 Training Scenarios · Application Mockups (6 screens) |
| **Right** | S.I.R.E. Logo · SWOT analysis · Technology Stack · Key Metrics |
| **Header** | Title, course credits (red band) |
| **Footer** | Project/team credits · tech badges (red band) |

### Regenerating the PowerPoint

```bash
# Install dependencies once
pip install python-pptx

# Re-generate the presentation
python3 generate_pptx.py
```

The script reads `../layoutA_fixed_structure.pptx` as the structural template and writes
`SIRE_Poster_Presentation.pptx` in this directory.

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
