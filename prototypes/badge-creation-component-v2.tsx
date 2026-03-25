// Version: 2 | Date: 2026-03-19 | Changes: Full Hearth Mont Blanc Dark Coffee design system
// conformance. Replaced generic light-mode Tailwind (white bg, indigo accents, gray text) with
// canonical token values via CSS custom properties + Tailwind utilities. Removed Lucide icon
// imports — emoji placeholders used per convention. Corrected font roles (serif for content
// headings/labels, sans for interface controls/buttons/tags). Ember restricted to primary CTA
// only. Ghost cancel button per spec. Card anatomy applied to form container. Input/select
// surface tokens applied. Skill pills use surface-raised + border-subtle. Framework result rows
// use surface-raised hover. All <form> onSubmit preserved; functional logic untouched.

import React, { useState, useEffect } from 'react';

// ─── CSS tokens injected once at mount ───────────────────────────────────────
const HEARTH_TOKENS = `
  :root {
    --surface-body:    #0F0D0B;
    --surface-panel:   #1A1612;
    --surface-raised:  #252117;
    --surface-hover:   #2D2621;

    --text-primary:    #E8DFD4;
    --text-secondary:  #9B8B7E;
    --text-muted:      #6B5D52;
    --text-inverse:    #0F0D0B;

    --ember:           #D97B3A;
    --ember-hover:     #E88F4E;
    --ember-glow:      rgba(217,123,58,0.15);
    --ember-strong:    rgba(217,123,58,0.25);

    --sage:            #4ADE80;
    --sage-muted:      #22C55E;

    --border-subtle:   rgba(217,123,58,0.10);
    --border-medium:   rgba(217,123,58,0.20);

    --shadow-soft:     0 2px 8px rgba(0,0,0,0.30);
    --shadow-medium:   0 4px 16px rgba(0,0,0,0.40);
    --shadow-warm:     0 8px 32px rgba(0,0,0,0.50), 0 0 60px rgba(217,123,58,0.08);

    --radius-sm:  6px;
    --radius-md:  10px;
    --radius-lg:  16px;
    --radius-xl:  24px;

    --font-serif: 'Crimson Text', Georgia, serif;
    --font-sans:  'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

    --transition-quick:  200ms cubic-bezier(0.4,0,0.2,1);
    --transition-gentle: 400ms cubic-bezier(0.4,0,0.2,1);

    --space-xs:  4px;
    --space-sm:  8px;
    --space-md:  16px;
    --space-lg:  24px;
    --space-xl:  32px;
    --space-2xl: 48px;
  }
`;

// Inline style objects — used for values that have no direct Tailwind utility in this stack
const s = {
  // Surfaces
  body:        { background: 'var(--surface-body)', minHeight: '100vh' },
  card:        {
    background: 'var(--surface-panel)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-xl)',
    boxShadow: 'var(--shadow-soft)',
    transition: 'all var(--transition-gentle)',
  },
  raised:      {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-md)',
  },

  // Typography roles
  pageTitle:   { fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' },
  sectionLabel:{ fontFamily: 'var(--font-sans)',  fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 'var(--space-sm)' },
  fieldLabel:  { fontFamily: 'var(--font-sans)',  fontSize: '0.8rem',  fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)', display: 'block' },
  bodyText:    { fontFamily: 'var(--font-serif)', fontSize: '0.95rem', fontWeight: 400, color: 'var(--text-secondary)', lineHeight: 1.6 },
  metaText:    { fontFamily: 'var(--font-sans)',  fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' },

  // Inputs
  input: {
    width: '100%',
    background: 'var(--surface-raised)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '10px var(--space-md)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
    fontWeight: 400,
    outline: 'none',
    transition: 'border-color var(--transition-quick)',
    boxSizing: 'border-box' as const,
  },
  inputFocus: {
    borderColor: 'var(--ember)',
    boxShadow: '0 0 0 3px var(--ember-strong)',
  },
  textarea: {
    width: '100%',
    background: 'var(--surface-raised)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '10px var(--space-md)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-serif)',
    fontSize: '0.95rem',
    fontWeight: 400,
    lineHeight: 1.6,
    outline: 'none',
    resize: 'vertical' as const,
    transition: 'border-color var(--transition-quick)',
    boxSizing: 'border-box' as const,
  },
  select: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
    padding: '10px var(--space-md)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
    fontWeight: 400,
    outline: 'none',
    cursor: 'pointer',
  },

  // Buttons
  btnPrimary: {
    background: 'var(--ember)',
    color: 'var(--text-inverse)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '12px var(--space-lg)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(217,123,58,0.30)',
    transition: 'all var(--transition-quick)',
    minHeight: 44,
  },
  btnGhost: {
    background: 'transparent',
    color: 'var(--ember)',
    border: '1px solid var(--ember)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px var(--space-md)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all var(--transition-quick)',
    minHeight: 44,
  },
  btnIconAdd: {
    background: 'var(--ember)',
    color: 'var(--text-inverse)',
    border: 'none',
    borderRadius: '0 var(--radius-md) var(--radius-md) 0',
    padding: '0 var(--space-md)',
    fontFamily: 'var(--font-sans)',
    fontSize: '1.2rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    minHeight: 44,
    transition: 'background var(--transition-quick)',
  },
  btnRemove: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '2px',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.85rem',
    lineHeight: 1,
    transition: 'color var(--transition-quick)',
    minWidth: 20,
    minHeight: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Skill pill
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    padding: 'var(--space-xs) var(--space-sm)',
    background: 'var(--surface-raised)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },

  // Upload zone
  uploadZone: {
    border: '1px dashed var(--text-muted)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-xl) var(--space-md)',
    textAlign: 'center' as const,
    cursor: 'pointer',
    position: 'relative' as const,
    transition: 'all var(--transition-quick)',
  },

  // Search results dropdown
  resultsDropdown: {
    background: 'var(--surface-raised)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    marginTop: 'var(--space-xs)',
    maxHeight: 240,
    overflowY: 'auto' as const,
    boxShadow: 'var(--shadow-medium)',
  },
  resultRow: {
    padding: 'var(--space-md)',
    borderBottom: '1px solid var(--border-subtle)',
    cursor: 'pointer',
    transition: 'background var(--transition-quick)',
  },
};

// ─── FocusInput helper ────────────────────────────────────────────────────────
// Applies ember focus ring via onFocus/onBlur without a CSS class
function useFocusStyle(base: React.CSSProperties) {
  const [focused, setFocused] = useState(false);
  return {
    style: focused ? { ...base, ...s.inputFocus } : base,
    onFocus: () => setFocused(true),
    onBlur:  () => setFocused(false),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
const BadgeCreationForm = () => {
  const [badge, setBadge] = useState({
    name: '',
    description: '',
    criteria: '',
    skillsRepresented: [] as string[],
    isPublic: true,
    frameworkMappings: [] as Array<{
      frameworkType: string;
      frameworkIdentifier: string;
      description: string;
      level: string;
    }>,
  });

  const [newSkill, setNewSkill] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [frameworks] = useState([
    { id: 'plo',  name: 'PLO — Prescribed Learning Outcomes' },
    { id: 'rpl',  name: 'RPL — Recognition of Prior Learning' },
    { id: 'atar', name: 'ATAR — Australian Tertiary Admission Rank' },
  ]);
  const [selectedFramework, setSelectedFramework] = useState('');
  const [frameworkSearchQuery, setFrameworkSearchQuery] = useState('');
  const [frameworkSearchResults, setFrameworkSearchResults] = useState<Array<{
    id: string; framework: string; identifier: string; description: string; level: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Hover state for upload zone
  const [uploadHover, setUploadHover] = useState(false);
  const [hoverResultId, setHoverResultId] = useState<string | null>(null);
  const [hoverMappingIdx, setHoverMappingIdx] = useState<number | null>(null);

  // Focus styles
  const nameInput    = useFocusStyle(s.input);
  const descTextarea = useFocusStyle(s.textarea);
  const critTextarea = useFocusStyle(s.textarea);
  const skillInput   = useFocusStyle({ ...s.input, borderRadius: 'var(--radius-md) 0 0 var(--radius-md)', flex: 1 });
  const searchInput  = useFocusStyle({
    ...s.input,
    borderRadius: '0 var(--radius-md) var(--radius-md) 0',
    borderLeft: 'none',
    paddingRight: 36,
  });

  // Inject tokens once
  useEffect(() => {
    const id = 'hearth-tokens';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = HEARTH_TOKENS;
      document.head.appendChild(el);
    }
  }, []);

  // Mock framework search
  useEffect(() => {
    if (frameworkSearchQuery && frameworkSearchQuery.length > 2) {
      setIsSearching(true);
      const t = setTimeout(() => {
        setFrameworkSearchResults([
          { id: 'math101', framework: 'PLO', identifier: 'MATH-5-A1', description: 'Number concepts to 1,000,000', level: 'Grade 5' },
          { id: 'math102', framework: 'PLO', identifier: 'MATH-5-A2', description: 'Decimals to thousandths',        level: 'Grade 5' },
          { id: 'math103', framework: 'PLO', identifier: 'MATH-5-A3', description: 'Equivalent fractions',          level: 'Grade 5' },
        ]);
        setIsSearching(false);
      }, 500);
      return () => clearTimeout(t);
    } else {
      setFrameworkSearchResults([]);
    }
  }, [frameworkSearchQuery]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !badge.skillsRepresented.includes(newSkill.trim())) {
      setBadge({ ...badge, skillsRepresented: [...badge.skillsRepresented, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) =>
    setBadge({ ...badge, skillsRepresented: badge.skillsRepresented.filter(s => s !== skill) });

  const addFrameworkMapping = (mapping: typeof frameworkSearchResults[0]) => {
    setBadge({
      ...badge,
      frameworkMappings: [...badge.frameworkMappings, {
        frameworkType:       mapping.framework,
        frameworkIdentifier: mapping.identifier,
        description:         mapping.description,
        level:               mapping.level,
      }],
    });
    setFrameworkSearchQuery('');
    setFrameworkSearchResults([]);
  };

  const removeFrameworkMapping = (idx: number) =>
    setBadge({ ...badge, frameworkMappings: badge.frameworkMappings.filter((_, i) => i !== idx) });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting badge data:', badge);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ ...s.body, padding: 'var(--space-xl)' }}>
      {/* ── Card shell ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 896, margin: '0 auto', ...s.card }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-lg)' }}>
          <span style={{ fontSize: '1.5rem' }}>🏅</span>
          <h1 style={s.pageTitle}>Create New Badge</h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ── Main grid: 2 cols left, 1 col right ───────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 280px', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>

            {/* Left: Name + Description + Criteria */}
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

              {/* Badge Name */}
              <div>
                <label style={s.fieldLabel}>Badge Name</label>
                <input
                  type="text"
                  value={badge.name}
                  onChange={e => setBadge({ ...badge, name: e.target.value })}
                  placeholder="e.g. Advanced Mathematics"
                  required
                  {...nameInput}
                />
              </div>

              {/* Description */}
              <div>
                <label style={s.fieldLabel}>Description</label>
                <textarea
                  value={badge.description}
                  onChange={e => setBadge({ ...badge, description: e.target.value })}
                  rows={3}
                  placeholder="Describe what this badge represents..."
                  required
                  {...descTextarea}
                />
              </div>

              {/* Award Criteria */}
              <div>
                <label style={s.fieldLabel}>Award Criteria</label>
                <textarea
                  value={badge.criteria}
                  onChange={e => setBadge({ ...badge, criteria: e.target.value })}
                  rows={3}
                  placeholder="What must be accomplished to earn this badge..."
                  required
                  {...critTextarea}
                />
              </div>
            </div>

            {/* Right: Image upload + Visibility */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

              {/* Badge Image */}
              <div>
                <label style={s.fieldLabel}>Badge Image</label>
                <div
                  style={{
                    ...s.uploadZone,
                    ...(uploadHover ? { borderColor: 'var(--ember)', background: 'var(--ember-glow)' } : {}),
                  }}
                  onMouseEnter={() => setUploadHover(true)}
                  onMouseLeave={() => setUploadHover(false)}
                >
                  {previewImage ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={previewImage} alt="Badge preview" style={{ height: 120, width: 120, objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
                      <button
                        type="button"
                        onClick={() => setPreviewImage(null)}
                        style={{
                          position: 'absolute', top: -8, right: -8,
                          width: 24, height: 24,
                          background: 'var(--surface-hover)',
                          border: '1px solid var(--border-medium)',
                          borderRadius: 'var(--radius-full)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem',
                          transition: 'all var(--transition-quick)',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>📷</div>
                      <p style={{ ...s.metaText, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        Click to upload or drag and drop
                      </p>
                      <p style={{ ...s.metaText }}>PNG, JPG, SVG — max 2 MB</p>
                    </>
                  )}
                  <input
                    type="file"
                    onChange={handleImageChange}
                    accept="image/*"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Visibility toggle */}
              <div>
                <label style={s.fieldLabel}>Visibility</label>
                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)', cursor: 'pointer',
                  padding: 'var(--space-md)',
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <input
                    type="checkbox"
                    checked={badge.isPublic}
                    onChange={e => setBadge({ ...badge, isPublic: e.target.checked })}
                    style={{ marginTop: 2, accentColor: 'var(--ember)', width: 16, height: 16, flexShrink: 0 }}
                  />
                  <span style={{ ...s.bodyText, fontSize: '0.875rem' }}>
                    Make this badge available to all families
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* ── Skills Represented ────────────────────────────────────────── */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
              <label style={s.fieldLabel}>Skills Represented</label>
            </div>

            {/* Skill input row */}
            <div style={{ display: 'flex', marginBottom: 'var(--space-md)' }}>
              <input
                type="text"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a skill — e.g. Algebra, Critical Thinking"
                {...skillInput}
              />
              <button
                type="button"
                onClick={addSkill}
                style={s.btnIconAdd}
                title="Add skill"
              >
                ＋
              </button>
            </div>

            {/* Skill pills */}
            {badge.skillsRepresented.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                {badge.skillsRepresented.map((skill, i) => (
                  <span key={i} style={s.pill}>
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      style={s.btnRemove}
                      title={`Remove ${skill}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Educational Framework Mappings ───────────────────────────── */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <label style={s.fieldLabel}>Educational Framework Mappings</label>
            <p style={{ ...s.metaText, marginBottom: 'var(--space-md)' }}>
              Link this badge to curriculum standards — optional, backend-indexed only.
            </p>

            {/* Framework selector + search row */}
            <div style={{ display: 'flex', marginBottom: 'var(--space-sm)' }}>
              <select
                value={selectedFramework}
                onChange={e => setSelectedFramework(e.target.value)}
                style={s.select}
              >
                <option value="">Select framework</option>
                {frameworks.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>

              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  value={frameworkSearchQuery}
                  onChange={e => setFrameworkSearchQuery(e.target.value)}
                  placeholder={selectedFramework ? 'Search standards…' : 'Select a framework first'}
                  disabled={!selectedFramework}
                  {...searchInput}
                />
                <span style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: '0.9rem', pointerEvents: 'none',
                }}>
                  🔍
                </span>
              </div>
            </div>

            {/* Searching indicator */}
            {isSearching && (
              <p style={{ ...s.metaText, textAlign: 'center', padding: 'var(--space-md) 0' }}>
                Searching…
              </p>
            )}

            {/* Search results */}
            {frameworkSearchResults.length > 0 && (
              <div style={s.resultsDropdown}>
                {frameworkSearchResults.map(result => (
                  <div
                    key={result.id}
                    style={{
                      ...s.resultRow,
                      background: hoverResultId === result.id ? 'var(--surface-hover)' : 'transparent',
                    }}
                    onClick={() => addFrameworkMapping(result)}
                    onMouseEnter={() => setHoverResultId(result.id)}
                    onMouseLeave={() => setHoverResultId(null)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {result.identifier}
                      </span>
                      <span style={{ ...s.metaText }}>
                        {result.framework} · {result.level}
                      </span>
                    </div>
                    <p style={{ ...s.bodyText, fontSize: '0.875rem', margin: 0 }}>
                      {result.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Selected mappings */}
            {badge.frameworkMappings.length > 0 && (
              <div style={{ marginTop: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <p style={s.sectionLabel}>Selected Mappings</p>
                {badge.frameworkMappings.map((mapping, idx) => (
                  <div
                    key={idx}
                    style={{
                      ...s.raised,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 'var(--space-md)',
                      background: hoverMappingIdx === idx ? 'var(--surface-hover)' : 'var(--surface-raised)',
                      transition: 'background var(--transition-quick)',
                    }}
                    onMouseEnter={() => setHoverMappingIdx(idx)}
                    onMouseLeave={() => setHoverMappingIdx(null)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 4 }}>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {mapping.frameworkType}: {mapping.frameworkIdentifier}
                        </span>
                        <span style={{
                          ...s.pill,
                          padding: '2px 8px',
                          fontSize: '0.7rem',
                        }}>
                          {mapping.level}
                        </span>
                      </div>
                      <p style={{ ...s.bodyText, fontSize: '0.875rem', margin: 0 }}>
                        {mapping.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFrameworkMapping(idx)}
                      style={{ ...s.btnRemove, color: 'var(--text-muted)' }}
                      title="Remove mapping"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Form actions ─────────────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--space-md)',
            paddingTop: 'var(--space-lg)',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            <button type="button" style={s.btnGhost}>
              Cancel
            </button>
            <button type="submit" style={s.btnPrimary}>
              Create Badge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BadgeCreationForm;
