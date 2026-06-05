import { describe, it, expect } from 'vitest';
import { computeTargetDimensions } from './compress-image';

describe('computeTargetDimensions', () => {
  it('leaves images at or below the max edge untouched', () => {
    expect(computeTargetDimensions(1600, 1200, 1920)).toEqual({ width: 1600, height: 1200 });
    expect(computeTargetDimensions(1920, 1080, 1920)).toEqual({ width: 1920, height: 1080 });
  });

  it('scales a landscape image by its width', () => {
    expect(computeTargetDimensions(3840, 2160, 1920)).toEqual({ width: 1920, height: 1080 });
  });

  it('scales a portrait image by its height', () => {
    expect(computeTargetDimensions(2160, 3840, 1920)).toEqual({ width: 1080, height: 1920 });
  });

  it('scales a square image to the max edge', () => {
    expect(computeTargetDimensions(4000, 4000, 1920)).toEqual({ width: 1920, height: 1920 });
  });

  it('rounds fractional dimensions to whole pixels', () => {
    // 4032×3024 (typical iPhone) → longest 4032, scale 1920/4032
    expect(computeTargetDimensions(4032, 3024, 1920)).toEqual({ width: 1920, height: 1440 });
  });
});
