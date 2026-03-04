import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './TableCreation.css';

/* ─── CONSTANTS ─── */
const COLUMN_TYPES = [
  { value: 'text',    label: 'Text',    icon: 'fa-font',       cls: 'type-text'    },
  { value: 'number',  label: 'Number',  icon: 'fa-hashtag',    cls: 'type-number'  },
  { value: 'date',    label: 'Date',    icon: 'fa-calendar',   cls: 'type-date'    },
  { value: 'select',  label: 'Select',  icon: 'fa-circle-dot', cls: 'type-select'  },
  { value: 'boolean', label: 'Boolean', icon: 'fa-toggle-on',  cls: 'type-boolean' },
];

const CROP_TYPES = ['Squash', 'Cacao', 'Banana', 'Rice', 'Corn', 'Vegetable', 'Fruit', 'Other'];

const EXISTING_TABLES = [
  { id: 'TBL-001', name: 'Squash Harvest Log',     cols: 7, crop: 'Squash',    created: 'Feb 28, 2026' },
  { id: 'TBL-002', name: 'Cacao Batch Tracker',    cols: 9, crop: 'Cacao',     created: 'Feb 20, 2026' },
  { id: 'TBL-003', name: 'Monthly Yield Summary',  cols: 5, crop: 'All Crops', created: 'Jan 15, 2026' },
];

const PLACEHOLDER_DATA = {
  text:    'Sample text...',
  number:  '0',
  date:    'Jan 01, 2026',
  select:  '— Select —',
  boolean: 'Yes / No',
};

let nextId = 1;
const mkId = () => `col-${nextId++}`;

const DEFAULT_COLS = [
  { id: mkId(), name: 'ID',            type: 'number', required: true,  unique: true,  primaryKey: true  },
  { id: mkId(), name: 'Date Recorded', type: 'date',   required: true,  unique: false, primaryKey: false },
  { id: mkId(), name: 'Encoder',       type: 'text',   required: true,  unique: false, primaryKey: false },
];

/* ─── HELPERS ─── */
function typeInfo(val) {
  return COLUMN_TYPES.find(t => t.value === val) || COLUMN_TYPES[0];
}

/* ─── SUB-COMPONENTS ─── */
function ToggleRow({ label, desc, defaultOn = false }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="tc-toggle-row">
      <div className="tc-toggle-info">
        <div className="tc-toggle-label">{label}</div>
        <div className="tc-toggle-desc">{desc}</div>
      </div>
      <label className="tc-toggle">
        <input type="checkbox" checked={on} onChange={e => setOn(e.target.checked)} />
        <div className="tc-toggle-track" />
      </label>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function TableCreation() {
  const [tableName,     setTableName]     = useState('');
  const [tableDesc,     setTableDesc]     = useState('');
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [columns,       setColumns]       = useState(DEFAULT_COLS);
  const [activeTab,     setActiveTab]     = useState('build');   // 'build' | 'existing'
  const [showColModal,  setShowColModal]  = useState(false);
  const [editingCol,    setEditingCol]    = useState(null);
  const [tableSearch,   setTableSearch]   = useState('');

  /* Column modal state */
  const [colName,     setColName]     = useState('');
  const [colType,     setColType]     = useState('text');
  const [colRequired, setColRequired] = useState(false);
  const [colUnique,   setColUnique]   = useState(false);

  /* ── Crop toggles ── */
  const toggleCrop = (c) =>
    setSelectedCrops(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  /* ── Column modal helpers ── */
  const openAddCol = () => {
    setEditingCol(null);
    setColName('');
    setColType('text');
    setColRequired(false);
    setColUnique(false);
    setShowColModal(true);
  };

  const openEditCol = (col) => {
    setEditingCol(col);
    setColName(col.name);
    setColType(col.type);
    setColRequired(col.required);
    setColUnique(col.unique);
    setShowColModal(true);
  };

  const saveCol = () => {
    if (!colName.trim()) return;
    if (editingCol) {
      setColumns(prev =>
        prev.map(c => c.id === editingCol.id
          ? { ...c, name: colName, type: colType, required: colRequired, unique: colUnique }
          : c
        )
      );
    } else {
      setColumns(prev => [...prev, {
        id: mkId(), name: colName, type: colType,
        required: colRequired, unique: colUnique, primaryKey: false,
      }]);
    }
    setShowColModal(false);
  };

  const deleteCol = (id) => setColumns(prev => prev.filter(c => c.id !== id));

  /* ── Filtered existing tables ── */
  const filteredTables = EXISTING_TABLES.filter(t =>
    t.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
    t.id.toLowerCase().includes(tableSearch.toLowerCase()) ||
    t.crop.toLowerCase().includes(tableSearch.toLowerCase())
  );

  /* ── Render ── */
  return (
    <div className="tc-root">

      {/* ── HEADER ── */}
      <header className="tc-header">
        <div className="tc-header-left">
          <div className="tc-header-avatar">
            <i className="fa-solid fa-table-list" />
          </div>
          <div>
            <div className="tc-greeting-label">Table Creation</div>
            <h1 className="tc-title">Design Data Tables</h1>
            <div className="tc-subtitle">
              Define structure, columns, and crop context for new harvest tables
            </div>
          </div>
        </div>
        <div className="tc-header-right">
          <button className="tc-header-btn-ghost">
            <i className="fa-solid fa-clock-rotate-left" /> History
          </button>
          <button className="tc-header-btn-primary">
            <i className="fa-solid fa-circle-plus" /> New Table
          </button>
        </div>
      </header>

      {/* ── TABS ── */}
      <div className="tc-tab-bar">
        {[
          { key: 'build',    label: 'Table Builder',   icon: 'fa-hammer'      },
          { key: 'existing', label: 'Existing Tables',  icon: 'fa-layer-group' },
        ].map(t => (
          <button
            key={t.key}
            className={`tc-tab${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            <i className={`fa-solid ${t.icon}`} />
            {t.label}
            {t.key === 'existing' && (
              <span className="tc-tab-count">{EXISTING_TABLES.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── BUILDER TAB ── */}
      {activeTab === 'build' && (
        <>
          <div className="tc-section-label">Table Configuration</div>
          <div className="tc-layout">

            {/* ── LEFT COL ── */}
            <div className="tc-left-col">

              {/* Table Info */}
              <div className="tc-panel">
                <div className="tc-panel-header">
                  <span className="tc-panel-title">Table Info</span>
                  <span className="tc-panel-tag">Required</span>
                </div>
                <div className="tc-form-group">
                  <label className="tc-label">Table Name</label>
                  <input
                    className="tc-input"
                    placeholder="e.g. Squash Harvest Q1 2026"
                    value={tableName}
                    onChange={e => setTableName(e.target.value)}
                  />
                </div>
                <div className="tc-form-group" style={{ marginBottom: 0 }}>
                  <label className="tc-label">Description</label>
                  <textarea
                    className="tc-textarea"
                    placeholder="Brief description of what this table tracks..."
                    value={tableDesc}
                    onChange={e => setTableDesc(e.target.value)}
                  />
                </div>
              </div>

              {/* Crop Context */}
              <div className="tc-panel">
                <div className="tc-panel-header">
                  <span className="tc-panel-title">Crop Context</span>
                  <span className="tc-panel-tag">Optional</span>
                </div>
                <label className="tc-label" style={{ marginBottom: 8 }}>
                  Select applicable crop types
                </label>
                <div className="tc-chip-group">
                  {CROP_TYPES.map(c => (
                    <button
                      key={c}
                      className={`tc-chip${selectedCrops.includes(c) ? ' active' : ''}`}
                      onClick={() => toggleCrop(c)}
                    >
                      {selectedCrops.includes(c) && (
                        <i className="fa-solid fa-check" style={{ fontSize: '0.6rem' }} />
                      )}
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="tc-panel">
                <div className="tc-panel-header">
                  <span className="tc-panel-title">Settings</span>
                </div>
                <ToggleRow
                  label="Auto-timestamp"
                  desc="Add created_at & updated_at columns automatically"
                />
                <div className="tc-divider" style={{ margin: '0.75rem 0' }} />
                <ToggleRow
                  label="Require Approval"
                  desc="Entries need admin approval before publishing"
                  defaultOn
                />
                <div className="tc-divider" style={{ margin: '0.75rem 0' }} />
                <ToggleRow
                  label="Allow Attachments"
                  desc="Encoders can attach files to each row"
                />
                <div className="tc-divider" style={{ margin: '0.75rem 0' }} />
                <div className="tc-form-group" style={{ marginBottom: 0 }}>
                  <label className="tc-label">Visibility</label>
                  <select className="tc-select">
                    <option>All Encoders</option>
                    <option>Admin Only</option>
                    <option>Assigned Group</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div>
                <button
                  className="tc-btn-primary"
                  disabled={!tableName.trim() || columns.length === 0}
                >
                  <i className="fa-solid fa-circle-check" /> Create Table
                </button>
                <button className="tc-btn-secondary">
                  <i className="fa-solid fa-floppy-disk" /> Save as Draft
                </button>
              </div>
            </div>

            {/* ── RIGHT COL ── */}
            <div className="tc-right-col">

              {/* Column Builder */}
              <div className="tc-panel">
                <div className="tc-panel-header">
                  <span className="tc-panel-title">Column Builder</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {columns.length} column{columns.length !== 1 ? 's' : ''}
                    </span>
                    <span className="tc-panel-tag">Drag to reorder</span>
                  </div>
                </div>

                <div className="tc-tip">
                  <i className="fa-solid fa-circle-info" />
                  <span>
                    The <strong>ID</strong>, <strong>Date Recorded</strong>, and{' '}
                    <strong>Encoder</strong> columns are added by default. You can add more below.
                  </span>
                </div>

                <div className="tc-col-list">
                  {columns.map(col => {
                    const ti = typeInfo(col.type);
                    return (
                      <div
                        key={col.id}
                        className={`tc-col-item${col.primaryKey ? ' primary-col' : ''}`}
                      >
                        <span className="tc-col-drag">
                          <i className="fa-solid fa-grip-vertical" />
                        </span>
                        <div className={`tc-col-icon ${ti.cls}`}>
                          <i className={`fa-solid ${ti.icon}`} />
                        </div>
                        <div className="tc-col-info">
                          <div className="tc-col-name">{col.name}</div>
                          <div className="tc-col-type">{ti.label}</div>
                        </div>
                        <div className="tc-col-badges">
                          {col.primaryKey && <span className="tc-col-badge pk">PK</span>}
                          {col.required   && <span className="tc-col-badge req">Req</span>}
                          {col.unique     && <span className="tc-col-badge uniq">Uniq</span>}
                        </div>
                        <div className="tc-col-actions">
                          <button
                            className="tc-col-action-btn edit"
                            onClick={() => openEditCol(col)}
                            title="Edit column"
                          >
                            <i className="fa-solid fa-pen" />
                          </button>
                          {!col.primaryKey && (
                            <button
                              className="tc-col-action-btn delete"
                              onClick={() => deleteCol(col.id)}
                              title="Remove column"
                            >
                              <i className="fa-solid fa-trash" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button className="tc-add-col-btn" onClick={openAddCol}>
                  <i className="fa-solid fa-plus" /> Add Column
                </button>
              </div>

              {/* Live Preview */}
              <div className="tc-panel">
                <div className="tc-panel-header">
                  <span className="tc-panel-title">Table Preview</span>
                  <span className="tc-panel-tag">Live</span>
                </div>

                {columns.length === 0 ? (
                  <div className="tc-empty-preview">
                    <i className="fa-solid fa-table" />
                    No columns yet
                    <p>Add columns above to see a preview</p>
                  </div>
                ) : (
                  <>
                    <div className="tc-summary">
                      {tableName && (
                        <span className="tc-summary-chip active">
                          <i className="fa-solid fa-table-list" /> {tableName}
                        </span>
                      )}
                      {selectedCrops.slice(0, 3).map(c => (
                        <span key={c} className="tc-summary-chip active">
                          <i className="fa-solid fa-seedling" /> {c}
                        </span>
                      ))}
                      {selectedCrops.length > 3 && (
                        <span className="tc-summary-chip">+{selectedCrops.length - 3} more</span>
                      )}
                      <span className="tc-summary-chip">
                        <i className="fa-solid fa-columns" /> {columns.length} cols
                      </span>
                    </div>

                    <div className="tc-preview-wrap">
                      <table className="tc-preview-table">
                        <thead>
                          <tr>
                            {columns.map(col => {
                              const ti = typeInfo(col.type);
                              return (
                                <th key={col.id}>
                                  <div className="tc-th-inner">
                                    <i
                                      className={`fa-solid ${ti.icon} ${ti.cls}-color`}
                                      style={{ fontSize: '0.7rem' }}
                                    />
                                    {col.name}
                                    {col.primaryKey && (
                                      <span className="tc-col-badge pk" style={{ fontSize: '0.52rem' }}>
                                        PK
                                      </span>
                                    )}
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {[1, 2, 3].map(i => (
                            <tr key={i}>
                              {columns.map(col => (
                                <td key={col.id}>{PLACEHOLDER_DATA[col.type]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="tc-preview-hint">
                      Showing 3 placeholder rows · actual data will appear after creation
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── EXISTING TABLES TAB ── */}
      {activeTab === 'existing' && (
        <>
          <div className="tc-section-label">Existing Tables</div>
          <div className="tc-panel">
            <div className="tc-panel-header">
              <span className="tc-panel-title">All Created Tables</span>
              <div className="tc-search-wrap">
                <i className="fa-solid fa-magnifying-glass" />
                <input
                  className="tc-search-input"
                  placeholder="Search tables..."
                  value={tableSearch}
                  onChange={e => setTableSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="tc-table-list">
              {filteredTables.length === 0 ? (
                <div className="tc-empty-preview" style={{ padding: '2rem 1rem' }}>
                  <i className="fa-solid fa-magnifying-glass" />
                  No tables match your search
                </div>
              ) : (
                filteredTables.map(t => (
                  <div key={t.id} className="tc-table-item">
                    <div className="tc-table-icon">
                      <i className="fa-solid fa-table" />
                    </div>
                    <div className="tc-table-info">
                      <div className="tc-table-name">{t.name}</div>
                      <div className="tc-table-meta">
                        {t.id} · {t.cols} columns · Created {t.created}
                      </div>
                    </div>
                    <span className="tc-table-crop-tag">{t.crop}</span>
                    <span className="tc-table-badge">Active</span>
                    <div className="tc-table-actions">
                      <button className="tc-table-edit-btn">Edit</button>
                      <button className="tc-table-more-btn">
                        <i className="fa-solid fa-ellipsis" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ── ADD / EDIT COLUMN MODAL ── */}
      {showColModal && createPortal(
        <div
          className="tc-modal-overlay"
          onClick={e => e.target === e.currentTarget && setShowColModal(false)}
        >
          <div className="tc-modal">
            <div className="tc-modal-header">
              <div>
                <div className="tc-modal-title">
                  {editingCol ? 'Edit Column' : 'Add New Column'}
                </div>
                <div className="tc-modal-sub">
                  Define the column name, type, and constraints
                </div>
              </div>
              <button className="tc-modal-close" onClick={() => setShowColModal(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Column Name */}
            <div className="tc-form-group">
              <label className="tc-modal-label">Column Name</label>
              <input
                className="tc-input"
                placeholder="e.g. Batch Weight, Unit Count..."
                value={colName}
                onChange={e => setColName(e.target.value)}
              />
            </div>

            {/* Data Type */}
            <div className="tc-form-group">
              <label className="tc-modal-label">Data Type</label>
              <div className="tc-type-grid">
                {COLUMN_TYPES.map(t => (
                  <button
                    key={t.value}
                    className={`tc-type-btn${colType === t.value ? ` active ${t.cls}` : ''}`}
                    onClick={() => setColType(t.value)}
                  >
                    <i className={`fa-solid ${t.icon}`} style={{ fontSize: '1rem' }} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="tc-modal-divider" />

            {/* Constraints */}
            <div className="tc-constraints-wrap">
              <span className="tc-constraints-label">Constraints</span>

              <div className="tc-toggle-row">
                <div className="tc-toggle-info">
                  <div className="tc-toggle-label">Required</div>
                  <div className="tc-toggle-desc">Field cannot be left empty</div>
                </div>
                <label className="tc-toggle">
                  <input
                    type="checkbox"
                    checked={colRequired}
                    onChange={e => setColRequired(e.target.checked)}
                  />
                  <div className="tc-toggle-track" />
                </label>
              </div>

              <div className="tc-divider" style={{ margin: '8px 0' }} />

              <div className="tc-toggle-row">
                <div className="tc-toggle-info">
                  <div className="tc-toggle-label">Unique</div>
                  <div className="tc-toggle-desc">No duplicate values allowed</div>
                </div>
                <label className="tc-toggle">
                  <input
                    type="checkbox"
                    checked={colUnique}
                    onChange={e => setColUnique(e.target.checked)}
                  />
                  <div className="tc-toggle-track" />
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="tc-modal-actions">
              <button className="tc-modal-btn cancel" onClick={() => setShowColModal(false)}>
                Cancel
              </button>
              <button
                className="tc-modal-btn save"
                onClick={saveCol}
                disabled={!colName.trim()}
              >
                <i className={`fa-solid ${editingCol ? 'fa-floppy-disk' : 'fa-plus'}`} />
                {editingCol ? 'Save Changes' : 'Add Column'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}