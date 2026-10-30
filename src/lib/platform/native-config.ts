/**
 * The iOS update gate (docs/hearth-native-ios-plan-v2.md §4). A build below
 * this number shows an update screen instead of calling routes whose contract
 * has moved on. Raise NATIVE_MIN_SUPPORTED_BUILD only after the replacement
 * build is live in the App Store, or every installed copy is locked out.
 */
export function minSupportedBuild(raw = process.env.NATIVE_MIN_SUPPORTED_BUILD): number {
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
