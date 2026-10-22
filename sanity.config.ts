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
  // The Next.js build inlines NEXT_PUBLIC_* vars, but the Sanity CLI bundler
  // (hosted Studio at hearth.sanity.studio) only inlines SANITY_STUDIO_* vars —
  // so the hosted bundle saw an undefined projectId ("Configuration must contain
  // projectId"). Resolve in priority order, with the public project id/dataset as
  // a hardcoded fallback so the hosted deploy always works. These are public
  // (NEXT_PUBLIC_) identifiers, safe to commit — matches scripts/*.ts precedent.
  projectId:
    process.env.SANITY_STUDIO_PROJECT_ID ||
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
    'g5zhwbxg',
  dataset:
    process.env.SANITY_STUDIO_DATASET ||
    process.env.NEXT_PUBLIC_SANITY_DATASET ||
    'production',
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
                    S.listItem()
                      .title('DLOs')
                      .schemaType('discreteLearningObjective')
                      .child(
                        S.list()
                          .title('DLOs')
                          .items([
                            S.listItem()
                              .title('All')
                              .child(S.documentTypeList('discreteLearningObjective').title('DLOs')),
                            S.listItem()
                              .title('Watch-for awaiting confirmation')
                              .child(
                                S.documentList()
                                  .title('Watch-for awaiting confirmation')
                                  .schemaType('discreteLearningObjective')
                                  .filter(
                                    '_type == "discreteLearningObjective" && defined(watchForNext) && !defined(watchForConfirmedAt)'
                                  )
                              ),
                          ])
                      ),
                    S.documentTypeListItem('badge').title('Badges'),
                    S.documentTypeListItem('shelfResource').title('Shelf resources'),
                  ])
              ),

            // ─── Knowledge Notes (Hearth Cycle, build plan §2.2) ──────────
            S.listItem()
              .title('Knowledge notes')
              .schemaType('knowledgeNote')
              .child(
                S.list()
                  .title('Knowledge notes')
                  .items([
                    S.listItem()
                      .title('Craft notes')
                      .child(
                        S.documentList()
                          .title('Craft notes')
                          .schemaType('knowledgeNote')
                          .filter('_type == "knowledgeNote" && kind == "craft"')
                      ),
                    S.listItem()
                      .title('Lesson patterns')
                      .child(
                        S.documentList()
                          .title('Lesson patterns')
                          .schemaType('knowledgeNote')
                          .filter('_type == "knowledgeNote" && kind == "pattern"')
                      ),
                    S.divider(),
                    S.listItem()
                      .title('Awaiting confirmation')
                      .child(
                        S.documentList()
                          .title('Awaiting confirmation')
                          .schemaType('knowledgeNote')
                          .filter('_type == "knowledgeNote" && !defined(confirmedAt)')
                      ),
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
