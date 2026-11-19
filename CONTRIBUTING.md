# Contributing to HJ Atlas

The purpose of this index is to clarify **mathematical increments**, not to grade papers or reproduce authors' abstracts.

## Easy way to contribute

Open a GitHub Issue from the repository's **Issues → New issue** page. Provide the arXiv URL and one or two sentences about an exact claim or missing predecessor. You do not need to learn Git to suggest a correction.

For direct edits, modify `data/atlas.json` and submit a Pull Request.

## Standards for an entry

1. **Verify the source.** The arXiv URL must open the actual intended paper. Check title, authors, and year against the source. An unverified journal name should be left blank.
2. **Identify the predecessor.** State which earlier theorem, rate, class of Hamiltonians, proof method, or counterexample the paper improves or contrasts with. Cite or link the predecessor if possible.
3. **State the mathematical change precisely.** Examples: "extends from quadratic to general uniformly convex Hamiltonians with C³ regularity"; "proves optimal O(ε) rather than the prior O(ε^(1/3)) bound"; "provides a nonconvergence counterexample".
4. **Record scope.** Specify convexity, regularity, dimensionality, stochastic assumptions, monotonicity, boundedness, or model restrictions relevant to the result.
5. **No prestige or personality judgments.** Journal name is metadata. Do not use "breakthrough", "seminal", "minor", "trivial", "low tier", "landmark" or similar value-loaded adjectives in mathematical comparisons.
6. **Keep it brief.** One sentence per field is generally enough. Use mathematical notation in readable plain text, e.g., `O(ε)`, `λ→0`, or `H_pp>0`.
7. **Allow disagreement.** If a contribution's priority or relationship to earlier work is contested, open a discussion and identify the disputed theorem. Record the uncertainty instead of forcing a consensus.
8. **Follow respectful, professional academic conduct.** Critique assumptions, statements, methods, and proofs, not individual mathematicians.

## Scope

Vanishing discount; contact HJ; weak KAM; homogenization; boundary problems; coupled systems; mean field games; HJ equations on probability measures. Branches may be expanded through community proposals.

A work need not be published in any named journal to be eligible. Conversely, publication in a prominent journal does not make it automatically more important or prioritized in this index.

## Review process

Editors check references, wording, data schema, and mathematical relationships. Inclusion does not imply independent verification of every proof. Corrections and discussions remain open.
