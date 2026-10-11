import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PedagogyAttribution, type PedagogyAttributionSource } from './PedagogyAttribution';

afterEach(cleanup);

function source(overrides: Partial<PedagogyAttributionSource>): PedagogyAttributionSource {
  return {
    id: 'src-1',
    layer: 'source_excerpt',
    pedagogyKey: 'charlotte_mason',
    metadata: {},
    ...overrides,
  };
}

function expandAndRender(sources: PedagogyAttributionSource[], frameworkTitle?: string) {
  render(<PedagogyAttribution sources={sources} frameworkTitle={frameworkTitle} />);
  fireEvent.click(screen.getByRole('button', { name: /Grounded in/ }));
}

describe('PedagogyAttribution', () => {
  it('renders nothing when sources is empty', () => {
    const { container } = render(<PedagogyAttribution sources={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when sources is undefined', () => {
    const { container } = render(<PedagogyAttribution />);
    expect(container).toBeEmptyDOMElement();
  });

  it('expand toggle reveals cards', () => {
    render(
      <PedagogyAttribution
        sources={[source({ layer: 'source_excerpt', metadata: { text: 'Education is an atmosphere.' } })]}
      />,
    );
    // Collapsed content stays mounted for the grid-rows expand animation but is
    // hidden from assistive tech (and from Tab, via visibility: hidden in CSS).
    const quote = screen.getByText(/Education is an atmosphere/);
    expect(quote.closest('.hearth-expand-content')).toHaveAttribute('aria-hidden', 'true');

    fireEvent.click(screen.getByRole('button', { name: /Grounded in/ }));
    expect(quote.closest('.hearth-expand-content')).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByRole('button', { name: /Grounded in/ })).toHaveAttribute('aria-expanded', 'true');
  });

  describe('worked_example', () => {
    it('renders scenarioPreview and activityType when present', () => {
      expandAndRender([
        source({
          layer: 'worked_example',
          metadata: { scenarioPreview: 'A child sorts pebbles by size on the back step.', activityType: 'nature_walk' },
        }),
      ]);
      expect(screen.getByText(/A child sorts pebbles by size/)).toBeInTheDocument();
      expect(screen.getByText('nature_walk')).toBeInTheDocument();
    });

    it('falls back to the generic humanised-layer card when scenarioPreview is missing', () => {
      expandAndRender([source({ layer: 'worked_example', metadata: {} })]);
      expect(screen.getByText('worked example')).toBeInTheDocument();
    });
  });

  describe('observational_marker', () => {
    it('renders markerName, whatItIndicates, and up to 2 markersToLookFor lines', () => {
      expandAndRender([
        source({
          layer: 'observational_marker',
          metadata: {
            markerName: 'Restlessness after 20 minutes',
            whatItIndicates: 'Attention span limit reached for this age',
            markersToLookFor: ['fidgeting', 'wandering gaze', 'off-task chatter'],
          },
        }),
      ]);
      expect(screen.getByText('Restlessness after 20 minutes')).toBeInTheDocument();
      expect(screen.getByText(/Attention span limit reached/)).toBeInTheDocument();
      expect(screen.getByText(/Look for: fidgeting/)).toBeInTheDocument();
      expect(screen.getByText(/Look for: wandering gaze/)).toBeInTheDocument();
      expect(screen.queryByText(/Look for: off-task chatter/)).toBeNull();
    });

    it('falls back to the generic humanised-layer card when markerName is missing', () => {
      expandAndRender([source({ layer: 'observational_marker', metadata: {} })]);
      expect(screen.getByText('observational marker')).toBeInTheDocument();
    });
  });

  describe('contraindication', () => {
    it('renders warnedAgainst', () => {
      expandAndRender([
        source({ layer: 'contraindication', metadata: { warnedAgainst: 'Avoid worksheets before age 6.' } }),
      ]);
      expect(screen.getByText('Avoid worksheets before age 6.')).toBeInTheDocument();
    });

    it('falls back to the generic humanised-layer card when warnedAgainst is missing', () => {
      expandAndRender([source({ layer: 'contraindication', metadata: {} })]);
      expect(screen.getByText('contraindication')).toBeInTheDocument();
    });
  });

  describe('facilitation_vocabulary', () => {
    it('renders verbSample joined with middle dots', () => {
      expandAndRender([
        source({ layer: 'facilitation_vocabulary', metadata: { verbSample: ['notice', 'wonder', 'narrate'] } }),
      ]);
      expect(screen.getByText('notice · wonder · narrate')).toBeInTheDocument();
    });

    it('falls back to the generic humanised-layer card when verbSample is empty', () => {
      expandAndRender([source({ layer: 'facilitation_vocabulary', metadata: { verbSample: [] } })]);
      expect(screen.getByText('facilitation vocabulary')).toBeInTheDocument();
    });
  });

  it('falls back to the generic humanised-layer card for an unknown layer', () => {
    expandAndRender([source({ layer: 'some_future_layer', metadata: { anything: 'here' } })]);
    expect(screen.getByText('some future layer')).toBeInTheDocument();
  });

  describe('framework label', () => {
    it('appears when the source pedagogyKey title differs from frameworkTitle', () => {
      expandAndRender(
        [
          source({
            layer: 'worked_example',
            pedagogyKey: 'montessori',
            metadata: { scenarioPreview: 'A child works with the pink tower.' },
          }),
        ],
        'Charlotte Mason',
      );
      expect(screen.getByText('Montessori')).toBeInTheDocument();
    });

    it('is absent when the source pedagogyKey title matches frameworkTitle', () => {
      expandAndRender(
        [
          source({
            layer: 'worked_example',
            pedagogyKey: 'charlotte_mason',
            metadata: { scenarioPreview: 'A child narrates the story back.' },
          }),
        ],
        'Charlotte Mason',
      );
      expect(screen.queryByText('Charlotte Mason')).toBeNull();
    });
  });
});
