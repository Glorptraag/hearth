import { describe, it, expect } from 'vitest';
import { toResolvableDocs, resolveConfirmIds, LAYER_PREFIXES } from './resolve-id';
import type { CompiledDoc } from '../corpus/types';

function doc(id: string, suggestedDraft: boolean): CompiledDoc {
  const [type] = id.split('.', 1);
  return { _id: id, _type: type, suggestedDraft, status: 'published' };
}

describe('toResolvableDocs', () => {
  it('derives layer, framework short, short id, and qualified id', () => {
    const docs = toResolvableDocs([doc('pedagogySourceExcerpt.cm.001', true)]);
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({
      layerDir: 'source-excerpts',
      shortId: 'cm.001',
      frameworkShort: 'cm',
      qualifiedId: 'se:cm.001',
    });
  });

  it('handles the facilitation-vocabulary singleton (no dot in id)', () => {
    const docs = toResolvableDocs([doc('pedagogyFacilitationVocabulary.montessori', true)]);
    expect(docs[0]).toMatchObject({
      layerDir: 'facilitation-vocabulary',
      shortId: 'montessori',
      frameworkShort: 'montessori',
      qualifiedId: 'fv:montessori',
    });
  });

  it('every layer has a distinct prefix', () => {
    const prefixes = Object.values(LAYER_PREFIXES);
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });
});

describe('resolveConfirmIds', () => {
  // Reproduces the real montessori collision: .004 exists as a
  // worked-example, an observational-marker, and a contraindication.
  const montessoriCollision = toResolvableDocs([
    doc('pedagogyWorkedExample.montessori.004', true),
    doc('pedagogyObservationalMarker.montessori.004', true),
    doc('pedagogyContraindication.montessori.004', true),
    doc('pedagogyWorkedExample.montessori.007', true), // unique — WE only
    doc('pedagogySourceExcerpt.cm.021', true),
    doc('pedagogySourceExcerpt.cm.001', false), // already confirmed
  ]);

  it('resolves an unqualified id that is unique across layers', () => {
    const { resolved, errors } = resolveConfirmIds(['montessori.007'], montessoriCollision);
    expect(errors).toEqual([]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].entry.qualifiedId).toBe('we:montessori.007');
  });

  it('resolves a plain framework id (cm.021)', () => {
    const { resolved, errors } = resolveConfirmIds(['cm.021'], montessoriCollision);
    expect(errors).toEqual([]);
    expect(resolved[0].entry.qualifiedId).toBe('se:cm.021');
  });

  it('rejects an unqualified id that is ambiguous across layers', () => {
    const { resolved, errors } = resolveConfirmIds(['montessori.004'], montessoriCollision);
    expect(resolved).toEqual([]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/ambiguous across 3 layers/);
    expect(errors[0]).toMatch(/we:montessori\.004/);
    expect(errors[0]).toMatch(/om:montessori\.004/);
    expect(errors[0]).toMatch(/ci:montessori\.004/);
  });

  it('resolves a layer-qualified id even when the short id is ambiguous', () => {
    const { resolved, errors } = resolveConfirmIds(['om:montessori.004'], montessoriCollision);
    expect(errors).toEqual([]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].entry.qualifiedId).toBe('om:montessori.004');
  });

  it('rejects an unknown layer prefix', () => {
    const { errors } = resolveConfirmIds(['xx:montessori.004'], montessoriCollision);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/unknown layer prefix "xx"/);
  });

  it('rejects an id that does not exist', () => {
    const { errors } = resolveConfirmIds(['cm.999'], montessoriCollision);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/unknown id/);
  });

  it('rejects a qualified id that does not exist in that layer', () => {
    const { errors } = resolveConfirmIds(['se:montessori.004'], montessoriCollision);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/no vault entry found/);
  });

  it('rejects an already-confirmed id', () => {
    const { resolved, errors } = resolveConfirmIds(['cm.001'], montessoriCollision);
    expect(resolved).toEqual([]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/already confirmed/);
  });

  it('rejects an empty token', () => {
    const { errors } = resolveConfirmIds([''], montessoriCollision);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/empty id/);
  });

  it('collects every error across multiple bad tokens in one pass', () => {
    const { errors } = resolveConfirmIds(['cm.999', 'montessori.004', 'cm.001'], montessoriCollision);
    expect(errors).toHaveLength(3);
  });

  it('resolves multiple valid ids together', () => {
    const { resolved, errors } = resolveConfirmIds(
      ['cm.021', 'we:montessori.004', 'om:montessori.004'],
      montessoriCollision
    );
    expect(errors).toEqual([]);
    expect(resolved).toHaveLength(3);
  });
});
