# Contributing Guide

Thank you for helping shape From the River. This project treats storytelling as a collaborative practice, so every contribution should uphold the highest standards for research quality, transparent sourcing, and community accountability.

## Code of Conduct

By contributing you agree to follow the [Contributor Covenant](https://www.contributor-covenant.org/). We value respectful dialogue, compassion, and safety for our collaborators and the communities reflected in our work.

## Getting Started

1. Fork the repository and create a branch describing your change (for example `feature/add-water-stories`).
2. Install dependencies with `npm install`.
3. Use `npm run dev` to launch the development server.
4. Before opening a pull request, run the automated checks described below.

## Research and Source Governance

Accurate storytelling protects trust with our community. Every contribution that introduces or updates narrative content, data visualizations, or historical claims **must follow these research standards**:

- **Triangulate sources**: cite at least two independent, reputable sources for new factual statements. Primary sources (interviews, archival documents) are strongly encouraged alongside secondary reporting.
- **Document methodology**: briefly describe how information was gathered, including research scope, limitations, and verification steps.
- **Respect community knowledge**: when using oral histories or community-contributed narratives, document consent and attribution expectations.
- **Track changes**: summarize updates in the pull request description, noting any sections or visuals affected.

### Citation Requirements

- Provide inline citations in Markdown content using reference-style links or footnotes that name the source, publication date, and URL (when available).
- For structured data files (JSON, YAML, or TypeScript exports), include a `sources` array or comment block detailing provenance.
- Upload any original research assets (interview transcripts, field notes) to the repository’s `research/` directory or link to an immutable storage location.
- Pull requests must link to a shared document or appendix containing full bibliographic citations when more context is needed.

## Content Review Board

To maintain editorial integrity, all narrative-facing contributions go through a **Content Review Board (CRB)** consisting of:

1. **Historical Research Lead** – verifies accuracy and contextual framing.
2. **Community Liaison** – confirms adherence to consent agreements and cultural sensitivity.
3. **Editorial Steward** – reviews clarity, storytelling voice, and accessibility.

### Review Workflow

- Draft submissions open as pull requests with the label `needs-crb`.
- Each CRB member leaves a review approving or requesting changes before merging.
- The Editorial Steward records the decision and notable feedback in `docs/editorial-log.md`.
- Emergency updates (fact corrections, safety notices) may bypass the full CRB with approval from at least two members, but must be retroactively documented within 48 hours.

## Technical Standards

- **Linting**: run `npm run lint` to ensure code conforms to the shared style guide.
- **Testing**: run `npm test` to execute the Jest suite.
- **Performance**: `npm run lhci` evaluates Lighthouse budgets; address any regressions before requesting review.

Continuous integration runs these checks automatically on pull requests. Please ensure the pipeline remains green.

## Documentation and Transparency

- Update relevant documentation when altering workflows, content strategy, or data structures.
- Include screenshots or screen recordings for visual changes, particularly those affecting accessibility.
- Add entries to `docs/editorial-log.md` after each editorial retrospective or major content launch, summarizing highlights, decisions, and community feedback.

## Quarterly Editorial Retrospectives

The CRB convenes during the first week of January, April, July, and October to review the previous quarter. Retro notes must cover:

- New sections or stories published.
- Feedback received from community partners.
- Action items for accessibility, inclusion, and historical rigor.

Document retrospectives in `docs/editorial-log.md` using the template below:

```markdown
## YYYY-Q# Retrospective (Recorded <date>)

### New Sections and Releases
- _Item_

### Community Feedback
- _Item_

### Follow-up Actions
- _Item_
```

Thank you for stewarding From the River with care.
