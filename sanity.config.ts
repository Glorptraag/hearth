import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './src/sanity/schemas';

const PKB_LAYERS = [
  { type: 'pedagogySourceExcerpt', title: 'Source Excerpts' },
  { type: 'pedagogyPracticePattern', title: 'Practice Patterns' },
  { type: 'pedagogyObservationalMarker', title: 'Observational Markers' },
  { type: 'pedagogyFacilitationVocabulary', title: 'Facilitation Vocabulary' },
  { type: 'pedagogyContraindication', title: 'Contraindications' },
  { type: 'pedagogyWorkedExample', title: 'Worked Examples' },
];

export default defineConfig({
  name: 'hearth-lms',
  title: 'Hearth LMS',
  // Embedded Studio is mounted at /studio (src/app/studio/[[...tool]]). next-sanity
  // needs this basePath so the Studio router resolves its own links instead of the
  // app's routes — without it the desk navigation bounces back into the site.
  basePath: '/studio',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            // ─── Curriculum ───────────────────────────────────────────────
            S.listItem()
              .title('Curriculum')
              .child(
                S.list()
                  .title('Curriculum')
                  .items([
                    S.documentTypeListItem('pack').title('Packs'),
                    S.documentTypeListItem('module').title('Modules'),
                    S.documentTypeListItem('approach').title('Approaches'),
                    S.documentTypeListItem('activity').title('Activities'),
                    S.documentTypeListItem('project').title('Projects'),
                    S.documentTypeListItem('projectStage').title('Project Stages'),
                    S.documentTypeListItem('pedagogyOverlay').title('Pedagogy Overlays'),
                    S.documentTypeListItem('moduleSkeleton').title('Module Skeletons'),
                  ])
              ),

            // ─── Reference Data ───────────────────────────────────────────
            S.listItem()
              .title('Reference Data')
              .child(
                S.list()
                  .title('Reference Data')
                  .items([
                    S.documentTypeListItem('capabilityThread').title('Capability Threads'),
                    S.documentTypeListItem('badge').title('Badges'),
                  ])
              ),

            S.divider(),

            // ─── Pedagogy Knowledge Base ──────────────────────────────────
            S.listItem()
              .title('Pedagogy Knowledge Base')
              .child(
                S.list()
                  .title('Pedagogy Knowledge Base')
                  .items([
                    S.documentTypeListItem('pedagogicalFramework').title('Frameworks'),
                    S.divider(),
                    ...PKB_LAYERS.map(({ type, title }) =>
                      S.listItem()
                        .title(title)
                        .child(
                          S.list()
                            .title(title)
                            .items([
                              S.listItem()
                                .title('All')
                                .child(S.documentTypeList(type).title(title)),
                              S.listItem()
                                .title('Needs Review (AI-Drafted)')
                                .child(
                                  S.documentList()
                                    .title(`${title} — Needs Review`)
                                    .filter(`_type == $type && suggestedDraft == true && status == "published"`)
                                    .params({ type })
                                ),
                            ])
                        )
                    ),
                  ])
              ),
          ]),
    }),
    visionTool(),
  ],
  schema: { types: schemaTypes },
});
