/**
 * SAMPLE DLO → regulatory-framework mappings (WS-5 transposer plumbing).
 *
 * This is a 2–3 row SCAFFOLD payload, NOT the authored mapping set. The full
 * `ac-v9-qld` mapping (staged by observed pilot coverage, then the full 171)
 * is a separately gated, human-led content task (plan items P-3 / P-2). Until
 * those rows are authored, `ac-v9-qld` has zero real mappings and the report
 * coverage path stays in fallback mode — zero parent-visible change.
 *
 * Keys are the deterministic DLO ids written by `scripts/seed-dlos.ts`
 * (`dlo.{threadId}.{tier}`). Codes are illustrative but shape-valid; every code
 * is linted against AC9_CODE_PATTERN by the seed script before any write.
 */

export type RegulatoryMappingSeed = {
  frameworkKey: string;
  frameworkVersion: string;
  codes: string[];
  reportTier: 'cd_level' | 'learning_area' | 'standard' | 'outcome';
  contribution: 'primary' | 'partial' | 'incidental';
  evidenceWeight: number;
};

export type DloRegulatoryMappingSeed = {
  /** Deterministic DLO id — `dlo.{threadId}.{tier}` (see scripts/seed-dlos.ts). */
  dloId: string;
  mappings: RegulatoryMappingSeed[];
};

export const DLO_REGULATORY_MAPPINGS: DloRegulatoryMappingSeed[] = [
  {
    dloId: 'dlo.L3.developing',
    mappings: [
      {
        frameworkKey: 'ac-v9-qld',
        frameworkVersion: '9.0',
        codes: ['AC9E2LY05'],
        reportTier: 'cd_level',
        contribution: 'primary',
        evidenceWeight: 1.0,
      },
    ],
  },
  {
    dloId: 'dlo.L5.developing',
    mappings: [
      {
        frameworkKey: 'ac-v9-qld',
        frameworkVersion: '9.0',
        codes: ['AC9E3LY06'],
        reportTier: 'cd_level',
        contribution: 'partial',
        evidenceWeight: 0.6,
      },
    ],
  },
  {
    dloId: 'dlo.M1.demonstrating',
    mappings: [
      {
        frameworkKey: 'ac-v9-qld',
        frameworkVersion: '9.0',
        codes: ['AC9M3N01'],
        reportTier: 'cd_level',
        contribution: 'primary',
        evidenceWeight: 1.0,
      },
    ],
  },
];
