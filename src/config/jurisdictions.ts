export type ReportTier = 'cd_level' | 'learning_area';

export interface JurisdictionConfig {
  id: string;
  label: string;
  abbreviation: string;
  regulatoryBody: string;
  regulatoryBodyShort: string;
  registrationLabel: string;
  registrationHint: string;
  reportTier: ReportTier;
  reportScreenTitle: string;
  reportDescription: string;
  reviewTerminology: string;
  reviewDateLabel: string;
  compulsoryAgeRange: { startAge: number; startMonth: number; endAge: number };
  yearLevelCutoffMonth: number;
  curriculumFramework: string;
  requiresRegistrationNumber: boolean;
  externalLinks: {
    registrationUrl: string;
    reportingGuideUrl: string;
  };
}

export const JURISDICTIONS: Record<string, JurisdictionConfig> = {
  QLD: {
    id: 'QLD',
    label: 'Queensland',
    abbreviation: 'QLD',
    regulatoryBody: 'Home Education Unit',
    regulatoryBodyShort: 'HEU',
    registrationLabel: 'HEU Registration Number',
    registrationHint: 'e.g. HEU-2025-XXXXX',
    reportTier: 'cd_level',
    reportScreenTitle: 'HEU Compliance Report',
    reportDescription: 'Curriculum coverage, work samples, and gap analysis for your annual HEU submission.',
    reviewTerminology: 'audit',
    reviewDateLabel: 'Next Audit Date',
    compulsoryAgeRange: { startAge: 5, startMonth: 6, endAge: 17 },
    yearLevelCutoffMonth: 6,
    curriculumFramework: 'Australian Curriculum V9',
    requiresRegistrationNumber: true,
    externalLinks: {
      registrationUrl: 'https://education.qld.gov.au/schools-educators/other-education/home-education',
      reportingGuideUrl: 'https://education.qld.gov.au/schools-educators/other-education/home-education/reporting',
    },
  },

  NSW: {
    id: 'NSW',
    label: 'New South Wales',
    abbreviation: 'NSW',
    regulatoryBody: 'Department of Education',
    regulatoryBodyShort: 'DoE',
    registrationLabel: 'Registration Number',
    registrationHint: 'Your home schooling registration number',
    reportTier: 'learning_area',
    reportScreenTitle: 'Learning Report',
    reportDescription: 'Evidence of learning across all key learning areas to support your registration.',
    reviewTerminology: 'renewal',
    reviewDateLabel: 'Next Renewal Date',
    compulsoryAgeRange: { startAge: 6, startMonth: 1, endAge: 17 },
    yearLevelCutoffMonth: 7,
    curriculumFramework: 'NESA Syllabuses',
    requiresRegistrationNumber: true,
    externalLinks: {
      registrationUrl: 'https://www.nsw.gov.au/education-and-training/home-schooling',
      reportingGuideUrl: 'https://www.nsw.gov.au/education-and-training/home-schooling/registration-guidelines',
    },
  },

  VIC: {
    id: 'VIC',
    label: 'Victoria',
    abbreviation: 'VIC',
    regulatoryBody: 'Victorian Registration and Qualifications Authority',
    regulatoryBodyShort: 'VRQA',
    registrationLabel: 'Registration Number',
    registrationHint: 'Your VRQA home education registration number',
    reportTier: 'learning_area',
    reportScreenTitle: 'Learning Report',
    reportDescription: 'Your learning journey across the eight key learning areas.',
    reviewTerminology: 'review',
    reviewDateLabel: 'Next Review Date',
    compulsoryAgeRange: { startAge: 5, startMonth: 1, endAge: 17 },
    yearLevelCutoffMonth: 4,
    curriculumFramework: 'Flexible',
    requiresRegistrationNumber: true,
    externalLinks: {
      registrationUrl: 'https://www2.vrqa.vic.gov.au/register-home-educate',
      reportingGuideUrl: 'https://www2.vrqa.vic.gov.au/register-home-educate',
    },
  },

  SA: {
    id: 'SA',
    label: 'South Australia',
    abbreviation: 'SA',
    regulatoryBody: 'Department for Education',
    regulatoryBodyShort: 'DfE',
    registrationLabel: 'Registration Number',
    registrationHint: 'Your home education registration number',
    reportTier: 'cd_level',
    reportScreenTitle: 'Learning Report',
    reportDescription: 'Curriculum coverage and evidence of learning for your annual reporting.',
    reviewTerminology: 'review',
    reviewDateLabel: 'Next Review Date',
    compulsoryAgeRange: { startAge: 6, startMonth: 1, endAge: 17 },
    yearLevelCutoffMonth: 5,
    curriculumFramework: 'Australian Curriculum V9',
    requiresRegistrationNumber: true,
    externalLinks: {
      registrationUrl: 'https://www.sa.gov.au/topics/education-and-learning/home-education',
      reportingGuideUrl: 'https://www.sa.gov.au/topics/education-and-learning/home-education',
    },
  },

  WA: {
    id: 'WA',
    label: 'Western Australia',
    abbreviation: 'WA',
    regulatoryBody: 'Department of Education',
    regulatoryBodyShort: 'DoE',
    registrationLabel: 'Registration Number',
    registrationHint: 'Your home education registration number',
    reportTier: 'learning_area',
    reportScreenTitle: 'Learning Report',
    reportDescription: 'Evidence of learning aligned with curriculum areas to support your registration.',
    reviewTerminology: 'review',
    reviewDateLabel: 'Next Review Date',
    compulsoryAgeRange: { startAge: 5, startMonth: 6, endAge: 17 },
    yearLevelCutoffMonth: 6,
    curriculumFramework: 'WA Curriculum',
    requiresRegistrationNumber: true,
    externalLinks: {
      registrationUrl: 'https://www.education.wa.edu.au/home-education',
      reportingGuideUrl: 'https://www.education.wa.edu.au/home-education',
    },
  },

  TAS: {
    id: 'TAS',
    label: 'Tasmania',
    abbreviation: 'TAS',
    regulatoryBody: 'Office of the Education Registrar',
    regulatoryBodyShort: 'OER',
    registrationLabel: 'Registration Number',
    registrationHint: 'Your home education registration number',
    reportTier: 'learning_area',
    reportScreenTitle: 'Learning Report',
    reportDescription: 'Your Home Education Summary showing learning across all areas.',
    reviewTerminology: 'evaluation',
    reviewDateLabel: 'Next Evaluation Date',
    compulsoryAgeRange: { startAge: 5, startMonth: 1, endAge: 17 },
    yearLevelCutoffMonth: 1,
    curriculumFramework: 'Flexible',
    requiresRegistrationNumber: true,
    externalLinks: {
      registrationUrl: 'https://oer.tas.gov.au/home-education/',
      reportingGuideUrl: 'https://oer.tas.gov.au/home-education/',
    },
  },

  NT: {
    id: 'NT',
    label: 'Northern Territory',
    abbreviation: 'NT',
    regulatoryBody: 'Department of Education',
    regulatoryBodyShort: 'DoE',
    registrationLabel: 'Approval Number',
    registrationHint: 'Your home education approval number',
    reportTier: 'cd_level',
    reportScreenTitle: 'Learning Report',
    reportDescription: 'Curriculum coverage and evidence aligned with Australian Curriculum requirements.',
    reviewTerminology: 'renewal',
    reviewDateLabel: 'Next Renewal Date',
    compulsoryAgeRange: { startAge: 6, startMonth: 1, endAge: 17 },
    yearLevelCutoffMonth: 6,
    curriculumFramework: 'Australian Curriculum V9',
    requiresRegistrationNumber: true,
    externalLinks: {
      registrationUrl: 'https://nt.gov.au/learning/primary-and-secondary-students/home-education',
      reportingGuideUrl: 'https://nt.gov.au/learning/primary-and-secondary-students/home-education',
    },
  },

  ACT: {
    id: 'ACT',
    label: 'Australian Capital Territory',
    abbreviation: 'ACT',
    regulatoryBody: 'Education Directorate',
    regulatoryBodyShort: 'EDU',
    registrationLabel: 'Registration Number',
    registrationHint: 'Your home education registration number',
    reportTier: 'learning_area',
    reportScreenTitle: 'Learning Report',
    reportDescription: 'Evidence of learning across key learning areas.',
    reviewTerminology: 'review',
    reviewDateLabel: 'Next Review Date',
    compulsoryAgeRange: { startAge: 6, startMonth: 1, endAge: 17 },
    yearLevelCutoffMonth: 4,
    curriculumFramework: 'Flexible',
    requiresRegistrationNumber: true,
    externalLinks: {
      registrationUrl: 'https://www.education.act.gov.au',
      reportingGuideUrl: 'https://www.education.act.gov.au',
    },
  },
};

export function getJurisdiction(stateId: string | null): JurisdictionConfig {
  if (!stateId) return JURISDICTIONS.QLD;
  return JURISDICTIONS[stateId] ?? JURISDICTIONS.QLD;
}
