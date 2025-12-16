# Contributing

Thanks for helping improve Stacks Micro Fund!

## Getting started
- Use Node.js 20+
- Install dependencies: `npm install`
- Run tests: `npm test`
- Type-check Clarity contract: `clarinet check`

## Workflow
1. Fork and create a feature branch off `main`.
2. Make small, focused changes with clear commit messages (Conventional Commit style preferred).
3. Add tests for any contract changes.
4. Run `npm test` and `clarinet check` before opening a PR.
5. Open a pull request describing the change and any security or deployment notes.

## Coding notes
- Keep Clarity functions small and well-documented.
- Preserve admin/authorization checks for `withdraw`.
- Avoid breaking changes to public functions without bumping the changelog.

## Reporting issues
- Use GitHub Issues for bugs/feature requests.
- Include steps to reproduce, expected/actual behavior, and environment details.
