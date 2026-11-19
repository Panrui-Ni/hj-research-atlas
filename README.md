# HJ Atlas — updated research development map (2026-11-19)

**Deployment**: upload this repository to GitHub Pages. The root `index.html` is self-contained, with 111 indexed works, 18 research tracks, all topic-affiliated paper nodes displayed, and a map locator.

The older `assets/app.js` and `assets/style.css` are kept for archival compatibility only and are **not referenced** by the current standalone homepage. The `data/atlas.json` export shares the same 111-record data model as the homepage (including 18 tracks and verified relations). No `+N more` node truncation remains.

# HJ Atlas

A community-editable index of research papers on Hamilton–Jacobi equations and related areas. It is a **selective literature resource**, not a ranking, review-approval system, or comprehensive bibliography.

**Website:** https://panrui-ni.github.io/hj-research-atlas/

## Editorial rule

Every entry should state **what changes relative to prior work**. Avoid generic claims of novelty, importance, journal prestige, or speculation about the author's intentions.

An entry has:

- **Prior context:** the specific preceding theorem, known bound, established technique, or gap addressed.
- **Actual addition:** the improvement in a theorem's conclusion, assumptions, rate, scope, method, or a counterexample.
- **Scope:** the assumptions, special model, or limitation preventing an overly broad interpretation.
- **arXiv link:** a verifiable identifier linked to the source; **journal** is optional bibliographic metadata, never an evaluation.

For instance, "proves the matching O(ε) upper estimate for convex periodic HJ under the assumptions of the paper" is useful; "a groundbreaking result published in a prestigious journal" is not.

## Content and status

- Eight areas: vanishing discount; contact HJ; periodic and quasiperiodic homogenization; viscosity limits; boundary conditions; coupled systems; stochastic homogenization; MFG and HJ in measure spaces.
- Initial selection: 40 papers; `year` is the initial arXiv posting year (2014–2026, including one foundational paper published in 2016). The index is not restricted to published papers.
- These are **editorial comparison notes, not certified technical reviews**. Improvements, missing predecessors, and wrong attributions should be corrected through GitHub Issues or Pull Requests.
- Publication venues, when present, serve purely to identify the cited paper. The list is not exhaustive for any specified journal.
- Anonymous numerical ratings and automated AI summaries are not enabled in this edition.

## Contribute

- [Suggest a paper, an omission, or a correction](https://github.com/Panrui-Ni/hj-research-atlas/issues/new/choose).
- [Discuss a mathematical issue](https://github.com/Panrui-Ni/hj-research-atlas/discussions) (requires Discussions to be enabled by repository owner).
- Submit a pull request editing `data/atlas.json`. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Repository

- `index.html`: application shell.
- `assets/style.css`, `assets/app.js`: presentation and client-side filtering.
- `data/atlas.json`: the literature and per-paper mathematical comparisons.
- `config.js`: repository links.
- `scripts/validate.py`: schema / arXiv URL validation.

No build framework is needed. GitHub Pages can publish directly from `main` → `/(root)`; see **Settings → Pages → Deploy from a branch**. `.nojekyll` disables Jekyll processing.

## Editing the index

To add a paper, append an object to the `papers` array in `data/atlas.json`:

```json
{
  "id": "stable-unique-id",
  "authors": "A. First; B. Second",
  "title": "The exact preprint title",
  "year": 2026,
  "branch": "periodic",
  "topic": "First-order convex rates",
  "arxiv": "2601.01234",
  "context": "Earlier result or mathematical obstacle, stated specifically.",
  "contribution": "What the new theorem proves beyond that context.",
  "scope": "What assumptions and limitations remain.",
  "journal": "",
  "related": ["another-paper-id"]
}
```

Run `python3 scripts/validate.py` before proposing edits. See the code in `data/atlas.json` for the current list of branches and topics.

**License:** see `LICENSE`. Contributions should be factual paraphrases; do not copy an article's abstract verbatim.
