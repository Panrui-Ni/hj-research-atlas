# Hamilton–Jacobi Research Atlas · HJ Atlas

An **open, living research map** for Hamilton–Jacobi equations and adjacent topics: vanishing discount, contact Hamilton–Jacobi, weak KAM, homogenization, systems, stochastic control and mean field games.

> **Current status: working MVP / experimental seed data, not a complete or verified literature survey.** Papers are real starting references, but summaries and question prompts require community checking. In particular, a displayed question is **not** a verified unsolved problem.

## 1. Preview immediately

Run locally with Python (no npm, database or build process required):

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/` in your browser. You can also open the separate self-contained `HJ_Atlas_preview.html` file supplied with the release, without a web server.

## 2. Publish on GitHub Pages

1. Create a **public** repository, for example `hj-research-atlas` (under your own account or a community organization).
2. Upload **all files from this folder**, including `.github/workflows/deploy.yml`, to the repository's `main` branch. If you use the GitHub web upload, ensure the `.github` directory is included; alternatively use `git`.
3. In **Settings → Pages**, select **Build and deployment → GitHub Actions**.
4. The workflow validates `data/atlas.json` and deploys the website. For `OWNER/hj-research-atlas`, the URL is typically `https://OWNER.github.io/hj-research-atlas/`.
5. In `config.js` set `repository: "OWNER/hj-research-atlas"`. Commit this change. Proposal buttons now open the correct repository's GitHub issue editor.

The repository needs GitHub Actions enabled and a public Pages-capable setup. GitHub's deployment is not immediate; check the **Actions** tab for errors or status.

## 3. Enable public comments and replies (giscus)

This stage requires a repository to exist; therefore the sample deliberately **does not pretend comments work before you connect one**.

1. In **Settings → General → Features**, enable **Discussions**.
2. In the Discussions settings create a category, for example **Node Comments**. Choose **Announcements** type if you want only maintainers/giscus to create new top-level discussions in that category while everyone can comment and reply. You may also create an unrestricted **Research Proposals** category for everyone to start discussions.
3. Install the official [giscus GitHub App](https://github.com/apps/giscus) for that repository.
4. Open [giscus.app](https://giscus.app/zh-CN) and select your repository and **Node Comments** category. Copy the values `data-repo-id` and `data-category-id` from the generated script.
5. Edit `config.js`:

```js
window.HJ_ATLAS_CONFIG = {
  repository: "OWNER/hj-research-atlas",
  giscus: {
    repoId: "YOUR_REPO_ID",
    category: "Node Comments",
    categoryId: "YOUR_CATEGORY_ID"
  }
};
```

6. Commit. Open a research node. Its discussion panel will now load giscus, with a **stable discussion key based on the node ID**, not the displayed URL. Commenting requires the visitor to sign in with GitHub and authorize giscus. Comments and replies persist in GitHub Discussions.

Do **not** change node IDs after comments exist without a migration plan; those IDs bind a node to its discussion thread.

For formal directions or broad community proposals, use the Discussions tab separately, rather than trying to force every debate into a single theorem's comment thread.

## 4. How community contributions work

- **Comments / threaded replies:** per-node giscus / GitHub Discussions.
- **New branches and theorems:** GitHub issue form → discussion → pull request updating `data/atlas.json`.
- **Errors and challenges:** correction issue template, public review and edit history.
- **Automatic content check:** `scripts/validate.py` runs on pull requests and before deployment.
- **Open governance:** see [CONTRIBUTING.md](CONTRIBUTING.md). No ranking of research significance; disagreements remain visible.

## 5. Project structure

```text
index.html                 Homepage / topic view
assets/style.css           Visual design / responsive styles
assets/app.js              Tree, navigation, search and discussions
data/atlas.json            Editable atlas data: branches / topics / papers
config.js                  Repository and giscus configuration
.github/workflows/deploy.yml  GitHub Pages CI/CD
.github/ISSUE_TEMPLATE/    Public proposal / correction forms
scripts/validate.py        Dataset integrity validator
CONTRIBUTING.md            Open contribution + governance principles
```

## 6. Current limitations and next stage

This first release supports categories, cross-links, searched nodes, papers, question prompts and comments once connected. It does **not** yet have actual formal review certificates, per-theorem assumptions in a normalized schema, arXiv auto-import, permissions beyond GitHub, dedicated user accounts, automatic semantic extraction, or truly automatic live updates. These should be built only if there is community demand, and with clear error/review labels.

A topic may belong in multiple fields: the JSON currently stores a single primary branch plus related links; a future schema can support typed many-to-many connections (generalizes, improves, counterexample, applies-to, etc.).

## Reference documentation

- [GitHub Pages documentation](https://docs.github.com/en/pages/quickstart)
- [GitHub Discussions documentation](https://docs.github.com/en/discussions/quickstart)
- [giscus](https://github.com/giscus/giscus)

## License

Website code: [MIT](LICENSE). Original community-contributed data/text: proposed **CC BY 4.0** (with attribution); contributions should be original summaries and references, not copies of copyrighted abstracts. Confirm the project's long-term data license with contributors before scaling.

## 7. Anonymous paper ratings (experimental, opt-in)

The updated site includes a **five-dimension, four-level** anonymous rating interface on each paper card. Each dimension is optional; there is no overall rank. "一般" explicitly means a genuine but relatively conventional research contribution, **not** a poor-quality paper. See `ratings-worker/README.md` for setup and privacy limits.

- Without a rating backend, visitors can **save a draft only in their own browser**, clearly labeled; the site does not claim a vote was collected.
- To enable live shared results, deploy the optional Cloudflare Worker + D1 backend and set the `ratings` fields in `config.js`.
- Publicly show distributions only with at least five responses per dimension. Responses are not peer-review verification and are vulnerable to some strategic voting.
- The API uses a browser-specific pseudonymous token, server-side Turnstile verification, and a rate limit keyed with a rotating daily IP hash. It **cannot guarantee one vote per human**.
- GitHub comments and replies remain attributable to their GitHub accounts, independent of the anonymous voting service.

**Suggested launch sequence:** publish the knowledge map and comments first; invite a few mathematicians to check content and discuss the rating rubric; then enable anonymous live ratings after verifying the service and documenting its limitations.
