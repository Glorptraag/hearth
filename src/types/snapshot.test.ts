import { describe, it, expect } from 'vitest';
import { getComplianceStatus, type ComplianceStatus } from './snapshot';

const status = (over: Partial<ComplianceStatus> = {}): ComplianceStatus => ({
  next_report_due: '2026-08-01',
  days_until_due: 52,
  coverage_sufficient: true,
  ...over,
});

describe('getComplianceStatus (heu_status → compliance_status dual-read)', () => {
  it('reads compliance_status from post-rename snapshots', () => {
    const family = { compliance_status: status() };
    expect(getComplianceStatus(family)).toEqual(status());
  });

  it('falls back to heu_status on pre-rename stored snapshots', () => {
    const legacy = {
      compliance_status: undefined as unknown as ComplianceStatus,
      heu_status: status({ days_until_due: 7, coverage_sufficient: false }),
    };
    expect(getComplianceStatus(legacy)).toEqual(
      status({ days_until_due: 7, coverage_sufficient: false }),
    );
  });

  it('prefers compliance_status when both keys are present', () => {
    const family = {
      compliance_status: status({ days_until_due: 10 }),
      heu_status: status({ days_until_due: 99 }),
    };
    expect(getComplianceStatus(family)?.days_until_due).toBe(10);
  });

  it('returns null for missing family or neither key', () => {
    expect(getComplianceStatus(null)).toBeNull();
    expect(getComplianceStatus(undefined)).toBeNull();
    expect(
      getComplianceStatus({ compliance_status: undefined as unknown as ComplianceStatus }),
    ).toBeNull();
  });
});
