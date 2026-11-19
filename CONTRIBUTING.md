# Contributing to HJ Atlas / 参与建设

This is a community map, **not** a ranking of people, journals or research topics.

## Three ways to participate

1. **Discuss:** use the topic's discussion panel (GitHub login required) or start a GitHub Discussion. Replies and constructive disagreement are welcome.
2. **Propose:** use the “Research topic / open question proposal” issue template to suggest a branch, paper, conjecture or link between topics.
3. **Correct:** submit a pull request editing `data/atlas.json`, or use the correction issue template.

## Mathematical data standards

A claim should name its *precise hypotheses*, *conclusion*, *source*, and ideally *theorem number / paper version*. Mark conjectures and open questions explicitly. Never infer novelty, priority, mathematical correctness or sharpness from the paper title or journal alone. Separate four dimensions:

- **Correctness:** what exactly was checked, by whom, and against which version?
- **Scope:** assumptions, domain, regularity, boundary conditions and quantifiers.
- **Relationship:** generalization, weakening an assumption, improvement, counterexample, alternate proof, or related problem.
- **Significance:** use optional, anonymous, dimension-specific ordinal judgements and public reasoning; do not conflate with correctness or a single numerical score.

AI-generated entries must be labeled as such in the proposal and manually reviewed before publication. A citation link does not imply independent verification.

## Add a topic

Open `data/atlas.json` in the GitHub web editor, choose a branch in `branches`, and add a unique topic inside its `topics` array:

```json
{
  "id": "new-topic-id",
  "zh": "中文主题名称",
  "en": "English topic name",
  "summary": "研究对象及范围。",
  "refs": ["existing-reference-id"],
  "questions": ["一个待核查的研究问题？"],
  "links": ["existing-topic-id"]
}
```

For a new paper, first add its bibliographic record in `references` with `id, authors, title, year, venue, url, type`; refer to its ID from the topic. Optionally add `formula` with LaTeX (double-escape backslashes in JSON), and `results` only if the theorem's exact assumptions and claims have been checked.

Submit a pull request. An automatic check validates IDs and cross-references. The team will discuss conflicts, not simply delete minority views.

## Governance: initial commitments

- All research areas may be proposed; subject editors are *maintainers*, not arbiters of research value.
- Publish the provenance of corrections and material changes in pull requests.
- Disagreement about mathematical interpretation may be documented in discussions instead of suppressed.
- A small initial group of maintainers approves changes for quality; the governance rules themselves can be amended through public discussions.
- No claim that a paper is “verified” without an explicit, reproducible review record.

## Code of conduct

Critique proofs, assumptions and evidence, not personal attributes. No harassment, personal attacks, doxxing, or knowingly fabricated citations. Moderation should be transparent and proportionate. The project is not a replacement for formal peer review.

## Experimental anonymous ratings

Ratings concern individual **papers** (not authors, institutions, or journals). Each field is optional: **conceptual novelty**, **methodological novelty**, **technical depth**, **systematicity**, and **generality**. Four grades mean:

- **极高 (Very high):** groundbreaking contributions or fundamentally new frameworks in that dimension.
- **高 (High):** substantial new progress beyond prior work.
- **一般 (Moderate):** real original contribution, but primarily incremental work within an established research program. This is **not** a negative judgement.
- **较低 (Low):** limited new content within that dimension, such as relatively direct extensions.

**Not sure** means abstain; it is not scored. Ratings have no aggregate paper score, no percentile and no ranking. Peer review and mathematical correctness must be established separately. Strong disagreement is expected; readers should compare the source articles and can explain the difference in publicly attributable comments. Please avoid coordinated voting, self-ratings and conflicts of interest.

The rating system is in pilot phase. It may be disabled if significant abuse is detected.
