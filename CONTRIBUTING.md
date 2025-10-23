# Contributing Guidelines

Thank you for your interest in contributing to From The River. This document outlines how we steward research, writing, and community collaboration for the project.

## Governance and Content Oversight

- **Editorial Stewardship Council** – The council is composed of maintainers representing research, community, and product. The council reviews substantial content changes, approves new sections, and triages sensitive topics. Council membership and meeting notes are tracked in [`docs/editorial-log.md`](docs/editorial-log.md).
- **Weekly Content Review** – Pull requests that introduce or modify copy, media, or data must request review from at least one council member before merge. Reviews focus on factual grounding, respectful representation, and alignment with community goals.
- **Community Feedback Loop** – Issues tagged `community-feedback` are surfaced during the weekly review. Contributors proposing changes based on community feedback should reference the originating issue or discussion thread in the pull request body.

## Research Standards

- **Source Transparency** – Cite every factual claim with primary sources where possible. Acceptable citations include academic publications, archival materials, reputable journalism, and official statements from community organizations.
- **Citation Requirements** – Use inline markdown footnotes (`[^1]`) or reference lists under a `## Sources` heading. Provide sufficient detail for others to verify the information (author, publication, date, and link when available).
- **Verification** – Cross-check facts across at least two independent sources when available. Document verification notes in the pull request description or link to collaborative research documents.
- **Original Media** – For photos, graphics, or audiovisual content, include licensing information and consent records in the pull request body or a linked document. Default to Creative Commons or community-owned assets.

## Structured Content Authoring

- Prefer editing structured data files (e.g., YAML, JSON) instead of hard-coding copy inside components. The Netlify CMS configuration under [`public/admin/`](public/admin/) enables contributors to edit key datasets with built-in validation and automatic Git commit history.
- When adding new structured collections, extend the CMS configuration and ensure the generated commits include descriptive messages.

## Development Workflow

1. **Set Up** – Install dependencies with `npm install` and run the development server with `npm run dev`.
2. **Testing** – Run `npm run lint` for static analysis and `npm run test:unit` for Jest unit tests. End-to-end accessibility and visual tests can be executed with `npm run test` when relevant.
3. **Performance Budgets** – Ensure changes pass the Lighthouse CI workflow (`npm run build` followed by `npx lhci autorun`). When budgets fail, include remediation notes in the pull request.
4. **Pull Requests** – Provide a clear summary, list of research sources, and screenshots when updating visual content. Tag relevant maintainers or council members for review.

## Community Standards

- Treat contributors and community members with respect. Follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Violations should be reported privately to the maintainers via the contact information in the repository README.
- Prioritize accessibility, multilingual support, and inclusive representation in all updates.

By contributing, you agree to uphold these standards and participate in the collaborative stewardship of the project.
