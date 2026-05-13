// Pure helpers that compose the three-layer content model at runtime.
// Spec: docs/hearth-runtime-methodology-integration-brief-v1.md §1, §2.4.
// No I/O, no LLM calls — fed pre-fetched module + family-profile data.

import type {
  EvidencePriority,
  FamilyPedagogicalProfile,
  MethodologyOverlay,
  ModuleWithBundles,
  PedagogyLensBundle,
} from './lens-bundle-types';

export function hasAnySubstantiveField(o: MethodologyOverlay): boolean {
  return Boolean(
    (o.loggerPromptHint && o.loggerPromptHint.trim()) ||
      (o.prepHint && o.prepHint.trim()) ||
      (o.observationCue && o.observationCue.trim()) ||
      (o.evidenceTagBias && o.evidenceTagBias.length > 0),
  );
}

export function getActivePedagogyBundle(
  module: ModuleWithBundles | null | undefined,
  profile: FamilyPedagogicalProfile | null | undefined,
): PedagogyLensBundle | null {
  if (!module?.pedagogyLensBundles?.length) return null;
  if (!profile?.pedagogyKey) return null;
  return (
    module.pedagogyLensBundles.find((b) => b.pedagogyKey === profile.pedagogyKey) ?? null
  );
}

export function getActiveOverlays(
  module: ModuleWithBundles | null | undefined,
  profile: FamilyPedagogicalProfile | null | undefined,
): MethodologyOverlay[] {
  if (!profile?.practices?.length) return [];
  if (!module?.methodologyOverlays?.length) return [];

  return profile.practices
    .map((practiceKey) =>
      module.methodologyOverlays!.find((o) => o.practiceKey === practiceKey),
    )
    .filter((o): o is MethodologyOverlay => Boolean(o))
    .filter(hasAnySubstantiveField);
}

// Composite thread weighting per runtime brief §2.4.
// Pedagogy weight is taken from evidencePriorities; each active overlay whose
// evidenceTagBias includes the thread contributes 0.3 * priorityFactor where
// priorityFactor = (5 - priorityIndex) / 5 across at most 5 practices.
export function getCompositeWeight(
  threadKey: string,
  pedagogyBundle: PedagogyLensBundle | null,
  activeOverlays: MethodologyOverlay[],
  practicePriorities: string[],
): number {
  const pedagogyWeight =
    pedagogyBundle?.evidencePriorities?.find((p) => p.threadKey === threadKey)?.weight ?? 0;

  const methodologyContribution = activeOverlays.reduce((sum, overlay) => {
    if (!overlay.evidenceTagBias?.includes(threadKey)) return sum;
    const priorityIndex = practicePriorities.indexOf(overlay.practiceKey);
    if (priorityIndex < 0) return sum;
    const priorityFactor = (5 - priorityIndex) / 5;
    return sum + 0.3 * priorityFactor;
  }, 0);

  return pedagogyWeight + methodologyContribution;
}

// Convenience: union of all thread keys touched by either layer.
export function getThreadKeysForComposite(
  pedagogyBundle: PedagogyLensBundle | null,
  activeOverlays: MethodologyOverlay[],
): string[] {
  const set = new Set<string>();
  pedagogyBundle?.evidencePriorities?.forEach((p: EvidencePriority) => set.add(p.threadKey));
  activeOverlays.forEach((o) => o.evidenceTagBias?.forEach((k) => set.add(k)));
  return Array.from(set);
}
