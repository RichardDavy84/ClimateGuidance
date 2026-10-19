# Website launch and rollback

Launch date: 19 October 2026.

## Preserved previous live version

- Repository: https://github.com/RichardDavy84/ClimateGuidance
- Archive branch: https://github.com/RichardDavy84/ClimateGuidance/tree/archive/pre-profile-redesign-2026-10-19
- Exact previous production commit: `68c6fdfdc012c6e53961ca6dfc9031f0c43b115b`
- Local full-history Git bundle: `../website-archives/climateguidance-before-profile-redesign-2026-10-19.bundle` (relative to this checkout).
- Local source ZIP: `../website-archives/climateguidance-before-profile-redesign-2026-10-19.zip`.

The remote archive was created at the previous live commit before deployment. The local bundle was verified with `git bundle verify`.

## Restore the previous design

Create a new rollback branch from the current `main`. Restore its tracked file tree from the archive branch, commit that restoration, and merge it to `main`. This preserves the launch and subsequent history and triggers the normal GitHub Pages workflow. Review any changes made since launch before restoring the whole tree. The archive also permits restoring individual pages or assets.

Example commands in a fresh repository checkout:

```sh
git fetch origin
git switch -c restore-previous-design origin/main
git restore --source=origin/archive/pre-profile-redesign-2026-10-19 --staged --worktree -- .
git commit -m "Restore website design from before 19 October 2026 launch"
git push -u origin restore-previous-design
```

Open and merge a pull request targeting `main`. Wait for the **Publish Climate Guidance** workflow to succeed and check https://www.climateguidance.com/.

The archive preserves website source and configuration. Stripe, Make, Dropbox and Formspree account state is maintained separately. This design launch retains the existing digital checkout and delivery configuration.

## Launch commerce state

The existing €9.99 PDF + EPUB checkout and Amazon paperback link remain available. After the website launch, the owner separately approved activation of direct paperback sales. The live €19.99 checkout and manual fulfilment procedure are recorded in `paperback-live.md`. Reverting the website does not deactivate a Stripe payment link; manage that separately in Stripe if required. The sandbox setup remains recorded in `paperback-checkout.md`.
