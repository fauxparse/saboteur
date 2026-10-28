# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

## Mission retention

The `cleanupExpiredMissions` Firebase function runs weekly on Mondays at 03:00 UTC. It deletes:

- Completed missions whose `endsAt` is more than 30 days ago.
- Never-started missions whose Firestore creation time is more than 30 days ago.

Running missions, future missions, and recently completed missions are kept. A month means 30 days. Cleanup removes the entire Firestore mission subtree, including agents, events, questions, answers, responses, and choices, plus quiz vote totals in Realtime Database. Agent images are embedded in the deleted agent documents.

Weekly cleanup can delete an eligible mission up to seven days after it crosses the 30-day threshold.

Install the backend dependencies with Node 22 and the repository's pnpm version:

```sh
mise exec node@22.16.0 pnpm@9.0.4 -- pnpm install --dir functions --frozen-lockfile
mise exec node@22.16.0 pnpm@9.0.4 -- pnpm --dir functions test
```

The backend pins transitive `qs` to 6.16.0 because 6.17.0 failed the deployment environment's minimum-release-age check. Review that override when upgrading dependencies.

`functions/package.json` also sets `engines.pnpm` to 9.0.4 so [Cloud Build uses the same pnpm version](https://cloud.google.com/docs/buildpacks/nodejs#pnpm_package_manager) as local installs.

Deploy only the cleanup function after authenticating the Firebase CLI:

```sh
firebase deploy --only functions:cleanupExpiredMissions --project thesaboteur
```

Scheduled functions require a billing-enabled Firebase project and the Cloud Scheduler API. Deployment creates the scheduler job. See [Firebase's scheduling documentation](https://firebase.google.com/docs/functions/schedule-functions).

Both scheduled jobs live in `functions/index.js` in the default Firebase codebase. The existing `autoEndStaleMissions` job runs every three hours and ends missions and their active quizzes once the mission has been running for six hours. Deploying only `cleanupExpiredMissions` leaves that existing deployment unchanged.

For a one-off cleanup, use `functions/cleanup-cli.js`. It defaults to a dry run and requires administrator credentials, either Application Default Credentials or a short-lived `GOOGLE_OAUTH_ACCESS_TOKEN` environment variable. Do not commit credentials or backups.

```sh
node functions/cleanup-cli.js --project thesaboteur
node functions/cleanup-cli.js --project thesaboteur --apply \
  --backup "$HOME/saboteur-missions-backup.json"
```

The apply command must finish a private backup before deleting anything. Keep that file outside the repository. A mission changed after backup is skipped instead of deleting data absent from the backup.

Backup files contain Firestore REST document fields and Realtime Database vote values. Each file includes `schemaNotes` with restoration instructions. Restoring document fields does not restore original server creation/update timestamps.
