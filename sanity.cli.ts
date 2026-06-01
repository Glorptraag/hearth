import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  },
  // Hosted Studio lives at https://hearth.sanity.studio. Pinning the host +
  // appId here makes `sanity deploy` non-interactive (no hostname / app-id
  // prompts). Both are public identifiers, safe to commit.
  studioHost: 'hearth',
  deployment: {
    appId: 'y6v82gt35se4nldm3s2rh6hy',
  },
});
