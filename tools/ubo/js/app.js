/**
 * Main Application Orchestrator for UBO Calculator
 * Manages reactive state, bilingual localization (EN/ES), modal flows,
 * validation warnings, real-time recalculations, route expansion, and PDF report generation.
 */

import {
  createInitialModel,
  calculateOwnership,
  validateEntityChildren,
  wouldCreateCycle,
  getExistingPersons,
  generateId,
  SPECIAL_CATEGORIES,
  TOLERANCE_MIN,
  TOLERANCE_MAX,
  getCategoryLabel
} from './engine.js';

import { OwnershipCanvas } from './canvas.js';
import { t, getLanguage, setLanguage } from './i18n.js';

class UBOApp {
  constructor() {
    this.model = createInitialModel('ABC Company', 'Auditor de Cumplimiento', 'Análisis de estructura de propiedad para debida diligencia.');
    this.calculatedData = null;
    this.canvas = null;
    this.expandedPersons = new Set();
    this.currentTheme = 'soft'; // 'soft' (default) or 'dark'
    this.currentLang = getLanguage(); // 'es' or 'en'

    this.init();
  }

  init() {
    this.bindGlobalEvents();
    this.initCanvas();
    this.applyLanguage(this.currentLang);
    this.update();

    // Auto-fit initial view after small delay
    setTimeout(() => {
      this.canvas?.fitToView();
    }, 250);
  }

  initCanvas() {
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) return;

    this.canvas = new OwnershipCanvas(canvasContainer, {
      onAddOwner: (parentId) => this.openAddOwnerModal(parentId),
      onEditNode: (nodeId) => this.openEditNodeModal(nodeId),
      onDeleteNode: (nodeId) => this.openDeleteConfirmModal(nodeId),
      onSelectNode: (nodeId) => {
        // Highlight in tree if needed
      }
    });
  }

  bindGlobalEvents() {
    // Language Switcher Buttons (EN / ES) - Header & Print Preview
    document.getElementById('btn-toggle-lang')?.addEventListener('click', () => {
      this.toggleLanguage();
    });
    document.getElementById('btn-toggle-lang-preview')?.addEventListener('click', () => {
      this.toggleLanguage();
    });

    // Area 1 - Case Metadata Edit
    document.getElementById('btn-edit-case-info')?.addEventListener('click', () => {
      this.openCaseInfoModal();
    });

    // Toolbar buttons
    document.getElementById('btn-new-case')?.addEventListener('click', () => {
      this.confirmNewCase();
    });

    document.getElementById('btn-load-demo')?.addEventListener('click', () => {
      this.loadDemoCase();
    });

    document.getElementById('btn-load-demo-special')?.addEventListener('click', () => {
      this.loadSpecialEntityDemoCase();
    });

    document.getElementById('btn-print-report')?.addEventListener('click', () => {
      this.openPrintReportModal();
    });

    document.getElementById('btn-toggle-theme')?.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Close modals on overlay or cancel
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeAllModals();
        }
      });
    });

    document.querySelectorAll('.modal-close-btn, .btn-modal-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeAllModals();
      });
    });

    // Keyboard ESC to close modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'soft' : 'dark';
    document.body.setAttribute('data-theme', this.currentTheme);
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
      themeIcon.textContent = this.currentTheme === 'dark' ? '☀️' : '🌙';
    }
  }

  // --- BILINGUAL (i18n) ENGINE ---

  toggleLanguage() {
    const nextLang = getLanguage() === 'es' ? 'en' : 'es';
    this.applyLanguage(nextLang);
  }

  applyLanguage(lang) {
    setLanguage(lang);
    this.currentLang = lang;
    document.documentElement.lang = lang;

    // Update Language Button Indicators
    const langText = document.getElementById('current-lang-text');
    if (langText) langText.textContent = lang.toUpperCase();

    const previewLangText = document.getElementById('current-lang-preview-text');
    if (previewLangText) previewLangText.textContent = lang.toUpperCase();

    const langBtn = document.getElementById('btn-toggle-lang');
    if (langBtn) langBtn.setAttribute('title', t('lang_toggle_title'));

    const previewLangBtn = document.getElementById('btn-toggle-lang-preview');
    if (previewLangBtn) previewLangBtn.setAttribute('title', t('lang_toggle_title'));

    // Update all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });

    // Update elements with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) el.placeholder = t(key);
    });

    // Update elements with data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) el.title = t(key);
    });

    // Update select dropdowns
    this.updateCategoryDropdowns();

    // Re-render Canvas and Results
    this.update();

    // If print preview modal is open, re-render report immediately
    const printModal = document.getElementById('modal-print-report');
    if (printModal && printModal.classList.contains('modal-active')) {
      this.renderPrintContent();
    }
  }

  updateCategoryDropdowns() {
    const catOptions = [
      { id: 'none', label: t('cat_none') },
      { id: 'financial_institution', label: t('cat_financial_institution') },
      { id: 'government_entity', label: t('cat_government_entity') },
      { id: 'sec_registered', label: t('cat_sec_registered') },
      { id: 'cftc_nfa', label: t('cat_cftc_nfa') },
      { id: 'pcaob_accounting', label: t('cat_pcaob_accounting') },
      { id: 'pooled_vehicle', label: t('cat_pooled_vehicle') }
    ];

    const addCatSelect = document.getElementById('select-business-category');
    if (addCatSelect) {
      const current = addCatSelect.value;
      addCatSelect.innerHTML = catOptions.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
      addCatSelect.value = current || 'none';
    }

    const editCatSelect = document.getElementById('edit-business-category');
    if (editCatSelect) {
      const current = editCatSelect.value;
      editCatSelect.innerHTML = catOptions.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
      editCatSelect.value = current || 'none';
    }
  }

  /**
   * Recalculates everything, renders canvas, and updates UI panes in real-time
   */
  update() {
    this.calculatedData = calculateOwnership(this.model);
    this.renderCaseInfo();
    this.canvas?.render(this.model, this.calculatedData);
    this.renderResults();
  }

  renderCaseInfo() {
    const { companyName, preparedBy, notes, createdAt } = this.model.metadata;
    const nameEl = document.getElementById('case-company-name');
    const preparedEl = document.getElementById('case-prepared-by');
    const notesEl = document.getElementById('case-notes');
    const dateEl = document.getElementById('case-date');

    if (nameEl) nameEl.textContent = companyName;
    if (preparedEl) preparedEl.textContent = preparedBy || t('not_specified');
    if (notesEl) notesEl.textContent = notes || t('default_notes');
    if (dateEl) {
      const d = new Date(createdAt);
      const locale = getLanguage() === 'es' ? 'es-ES' : 'en-US';
      dateEl.textContent = d.toLocaleDateString(locale, {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    }
  }

  renderResults() {
    const { individuals, specialEntities, summary, levelValidations } = this.calculatedData;

    // Summary Metrics
    const indPctEl = document.getElementById('summary-individuals-pct');
    const specialPctEl = document.getElementById('summary-special-pct');
    const pendingPctEl = document.getElementById('summary-pending-pct');
    const totalExpEl = document.getElementById('summary-total-pct');

    if (indPctEl) indPctEl.textContent = `${summary.attributedToIndividuals.toFixed(3).replace(/\.?0+$/, '')}%`;
    if (specialPctEl) specialPctEl.textContent = `${summary.stoppedInSpecialEntities.toFixed(3).replace(/\.?0+$/, '')}%`;
    if (pendingPctEl) pendingPctEl.textContent = `${summary.pendingUnidentified.toFixed(3).replace(/\.?0+$/, '')}%`;
    if (totalExpEl) totalExpEl.textContent = `${summary.totalExplained.toFixed(3).replace(/\.?0+$/, '')}%`;

    // Progress Bar segments
    const barInd = document.getElementById('prog-bar-individuals');
    const barSpec = document.getElementById('prog-bar-special');
    const barPend = document.getElementById('prog-bar-pending');

    if (barInd) barInd.style.width = `${Math.min(100, Math.max(0, summary.attributedToIndividuals))}%`;
    if (barSpec) barSpec.style.width = `${Math.min(100, Math.max(0, summary.stoppedInSpecialEntities))}%`;
    if (barPend) barPend.style.width = `${Math.min(100, Math.max(0, summary.pendingUnidentified))}%`;

    // Validation Status Banner
    const valBanner = document.getElementById('validation-banner');
    if (valBanner) {
      const invalidNodes = Object.entries(levelValidations).filter(([id, val]) => !val.isValid);
      if (invalidNodes.length === 0) {
        valBanner.className = 'validation-banner val-valid';
        valBanner.innerHTML = `
          <div class="val-icon">✅</div>
          <div class="val-text">
            <strong>${t('val_title_valid')}</strong> ${t('val_desc_valid')}
          </div>
        `;
      } else {
        valBanner.className = 'validation-banner val-warning';
        valBanner.innerHTML = `
          <div class="val-icon">⚠️</div>
          <div class="val-text">
            <strong>${t('val_title_warning')} (${invalidNodes.length} ${t('val_out_of_tol')}):</strong>
            ${t('val_desc_warning')}
            <div class="invalid-nodes-list">
              ${invalidNodes.map(([id, val]) => {
                const node = this.model.nodes[id];
                return `<button class="btn-focus-node" data-node-id="${id}">${node?.name || id}: ${t('node_assigned')} ${val.assigned.toFixed(2)}% | ${t('node_pending')} ${val.pending.toFixed(2)}%</button>`;
              }).join(' ')}
            </div>
          </div>
        `;
        valBanner.querySelectorAll('.btn-focus-node').forEach(btn => {
          btn.addEventListener('click', () => {
            const nid = btn.getAttribute('data-node-id');
            if (nid) this.canvas?.focusNode(nid);
          });
        });
      }
    }

    // Individuals List (Beneficial Ownership ranked)
    const indContainer = document.getElementById('individuals-list');
    if (indContainer) {
      if (individuals.length === 0) {
        indContainer.innerHTML = `
          <div class="empty-state">
            <span class="empty-icon">👤</span>
            <p>${t('results_empty_ind')}</p>
            <small>${t('results_empty_ind_sub')}</small>
          </div>
        `;
      } else {
        indContainer.innerHTML = individuals.map((ind, idx) => {
          const isExpanded = this.expandedPersons.has(ind.personId);
          const hasMultipleRoutes = ind.routes.length > 1;

          return `
            <div class="individual-card ${isExpanded ? 'is-expanded' : ''}" data-person-id="${ind.personId}">
              <div class="individual-header" data-toggle="${ind.personId}">
                <div class="ind-rank">#${idx + 1}</div>
                <div class="ind-info">
                  <div class="ind-name">${ind.name}</div>
                  <div class="ind-meta">
                    <span class="ind-badge-type">${t('node_badge_person')}</span>
                    ${hasMultipleRoutes ? `<span class="badge-routes-count">🔗 ${t('results_consolidated_in')} ${ind.routes.length} ${t('results_routes')}</span>` : ''}
                  </div>
                </div>
                <div class="ind-pct-wrapper">
                  <span class="ind-pct-val">${ind.effectivePercentage.toFixed(3).replace(/\.?0+$/, '')}%</span>
                  <span class="accordion-arrow">${isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              ${isExpanded ? `
                <div class="individual-routes-drawer">
                  <div class="routes-title">${t('routes_breakdown_title')}</div>
                  <div class="routes-list">
                    ${ind.routes.map((route, rIdx) => {
                      const formulaSteps = route.path.filter(p => p.type !== 'root').map(p => `${p.directPercentage}%`).join(' × ');
                      return `
                        <div class="route-item">
                          <div class="route-path-row">
                            <span class="route-num">${t('route_num')} ${rIdx + 1}:</span>
                            <span class="route-steps">${route.pathString}</span>
                          </div>
                          <div class="route-calc-row">
                            <span class="route-formula">${formulaSteps} = </span>
                            <span class="route-eff-val">${route.effectivePercentage.toFixed(3).replace(/\.?0+$/, '')}%</span>
                          </div>
                        </div>
                      `;
                    }).join('')}
                    ${hasMultipleRoutes ? `
                      <div class="route-consolidated-total">
                        <span>${t('route_consolidated_total')}</span>
                        <strong>${ind.effectivePercentage.toFixed(3).replace(/\.?0+$/, '')}%</strong>
                      </div>
                    ` : ''}
                  </div>
                </div>
              ` : ''}
            </div>
          `;
        }).join('');

        // Bind expand/collapse events
        indContainer.querySelectorAll('.individual-header').forEach(header => {
          header.addEventListener('click', () => {
            const pid = header.getAttribute('data-toggle');
            if (this.expandedPersons.has(pid)) {
              this.expandedPersons.delete(pid);
            } else {
              this.expandedPersons.add(pid);
            }
            this.renderResults();
          });
        });
      }
    }

    // Special Entities List
    const specContainer = document.getElementById('special-entities-list');
    if (specContainer) {
      if (specialEntities.length === 0) {
        specContainer.innerHTML = `
          <div class="empty-state-mini">
            <span>🛡️ ${t('results_empty_sp')}</span>
          </div>
        `;
      } else {
        specContainer.innerHTML = specialEntities.map(sp => `
          <div class="special-item-card">
            <div class="sp-icon">🛡️</div>
            <div class="sp-info">
              <div class="sp-name">${sp.name}</div>
              <div class="sp-cat">${getCategoryLabel(sp.category) || sp.categoryLabel} • <span class="sp-stopped">${t('node_stopped_branch')}</span></div>
              <div class="sp-path">${sp.pathString}</div>
            </div>
            <div class="sp-pct">${sp.effectivePercentage.toFixed(3).replace(/\.?0+$/, '')}%</div>
          </div>
        `).join('');
      }
    }
  }

  // --- MODAL WORKFLOWS ---

  openAddOwnerModal(parentId) {
    const parentNode = this.model.nodes[parentId];
    if (!parentNode || parentNode.type === 'person' || parentNode.specialCategory) {
      alert(t('node_stopped_branch'));
      return;
    }

    const modal = document.getElementById('modal-add-owner');
    if (!modal) return;

    // Reset parent reference
    document.getElementById('add-owner-parent-id').value = parentId;
    document.getElementById('add-owner-parent-name').textContent = parentNode.name;

    // Reset direct percentage field & compute available
    const validation = validateEntityChildren(this.model.nodes, parentId);
    const suggestedPct = validation.pending > 0 ? validation.pending : 50;
    const pctInput = document.getElementById('add-owner-percentage');
    pctInput.value = suggestedPct > 0 ? Number(suggestedPct.toFixed(4)) : '';

    const pendingNotice = document.getElementById('add-owner-pending-notice');
    if (pendingNotice) {
      pendingNotice.textContent = `${t('node_assigned')} ${parentNode.name}: ${validation.assigned.toFixed(2)}% | ${t('node_pending')}: ${validation.pending.toFixed(2)}%`;
    }

    // Reset text fields explicitly
    const personNameInput = document.getElementById('add-person-name');
    personNameInput.value = '';
    personNameInput.disabled = false;
    personNameInput.readOnly = false;
    personNameInput.placeholder = t('modal_person_name_placeholder');

    const businessNameInput = document.getElementById('add-business-name');
    businessNameInput.value = '';
    businessNameInput.placeholder = t('modal_business_name_placeholder');

    this.updateCategoryDropdowns();
    const specialNotice = document.getElementById('business-special-notice');
    if (specialNotice) specialNotice.style.display = 'none';

    // Step 1: Owner Type (default: persona)
    const typeRadios = modal.querySelectorAll('input[name="owner-type"]');
    typeRadios.forEach(r => r.checked = r.value === 'person');

    // Populate existing persons dropdown
    const existingPersons = getExistingPersons(this.model.nodes);
    const linkContainer = document.getElementById('section-link-existing-person');
    const linkSelect = document.getElementById('select-existing-person');
    const newPersonRadio = document.getElementById('radio-person-new');
    const linkPersonRadio = document.getElementById('radio-person-link');
    const groupSelectExisting = document.getElementById('group-select-existing-person');

    if (existingPersons.length > 0) {
      linkContainer.style.display = 'block';
      linkSelect.innerHTML = `
        <option value="">${t('modal_select_existing_placeholder')}</option>
        ${existingPersons.map(p => `
          <option value="${p.personId}" data-name="${this.escapeXml(p.name)}">
            ${p.name} (${p.instances.length} ${t('node_branches')})
          </option>
        `).join('')}
      `;
      newPersonRadio.checked = true;
      if (groupSelectExisting) groupSelectExisting.style.display = 'none';
      linkSelect.disabled = true;
      linkSelect.value = '';
    } else {
      linkContainer.style.display = 'none';
      newPersonRadio.checked = true;
      if (groupSelectExisting) groupSelectExisting.style.display = 'none';
      linkSelect.disabled = true;
      linkSelect.value = '';
    }

    // Toggle fields based on owner type
    this.updateAddOwnerModalFields();

    // Bind modal internal events
    typeRadios.forEach(r => {
      r.onchange = () => this.updateAddOwnerModalFields();
    });

    if (newPersonRadio && linkPersonRadio) {
      newPersonRadio.onchange = () => {
        personNameInput.disabled = false;
        personNameInput.readOnly = false;
        personNameInput.value = '';
        personNameInput.placeholder = t('modal_person_name_placeholder');
        if (groupSelectExisting) groupSelectExisting.style.display = 'none';
        linkSelect.disabled = true;
        linkSelect.value = '';
        personNameInput.focus();
      };

      linkPersonRadio.onchange = () => {
        if (groupSelectExisting) groupSelectExisting.style.display = 'block';
        linkSelect.disabled = false;
        personNameInput.disabled = false;
        personNameInput.readOnly = true;
        if (linkSelect.value) {
          const opt = linkSelect.options[linkSelect.selectedIndex];
          personNameInput.value = opt.getAttribute('data-name') || '';
        } else {
          personNameInput.value = '';
          personNameInput.placeholder = t('modal_select_existing_placeholder');
        }
        linkSelect.focus();
      };

      linkSelect.onchange = () => {
        if (linkSelect.value) {
          const opt = linkSelect.options[linkSelect.selectedIndex];
          personNameInput.value = opt.getAttribute('data-name') || '';
        } else {
          personNameInput.value = '';
        }
      };
    }

    const categorySelect = document.getElementById('select-business-category');
    if (categorySelect) {
      categorySelect.onchange = () => {
        if (categorySelect.value !== 'none') {
          specialNotice.style.display = 'block';
        } else {
          specialNotice.style.display = 'none';
        }
      };
    }

    // Submit handler
    const form = document.getElementById('form-add-owner');
    form.onsubmit = (e) => {
      e.preventDefault();
      this.handleAddOwnerSubmit();
    };

    modal.classList.add('modal-active');
  }

  updateAddOwnerModalFields() {
    const isPerson = document.querySelector('input[name="owner-type"]:checked')?.value === 'person';
    const personSection = document.getElementById('fields-person-owner');
    const businessSection = document.getElementById('fields-business-owner');
    const personNameInput = document.getElementById('add-person-name');

    if (isPerson) {
      personSection.style.display = 'block';
      businessSection.style.display = 'none';
      const isLinking = document.getElementById('radio-person-link')?.checked;
      if (isLinking) {
        personNameInput.readOnly = true;
      } else {
        personNameInput.disabled = false;
        personNameInput.readOnly = false;
      }
    } else {
      personSection.style.display = 'none';
      businessSection.style.display = 'block';
    }
  }

  handleAddOwnerSubmit() {
    const parentId = document.getElementById('add-owner-parent-id').value;
    const isPerson = document.querySelector('input[name="owner-type"]:checked')?.value === 'person';
    const pctRaw = document.getElementById('add-owner-percentage').value;
    const percentage = parseFloat(pctRaw);

    // Validations
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      alert(getLanguage() === 'es' ? 'Error: El porcentaje de propiedad debe ser un número mayor a 0 y menor o igual a 100%.' : 'Error: Ownership percentage must be a number greater than 0 and less than or equal to 100%.');
      document.getElementById('add-owner-percentage').focus();
      return;
    }

    const nodeId = generateId('node');

    if (isPerson) {
      const isLinking = document.getElementById('radio-person-link')?.checked;
      const linkSelect = document.getElementById('select-existing-person');
      const personNameInput = document.getElementById('add-person-name');
      let name = '';
      let personId = '';

      if (isLinking) {
        if (!linkSelect || !linkSelect.value) {
          alert(getLanguage() === 'es' ? 'Por favor seleccione la persona existente a la que desea vincular.' : 'Please select the existing person you want to link.');
          linkSelect?.focus();
          return;
        }
        personId = linkSelect.value;
        const opt = linkSelect.options[linkSelect.selectedIndex];
        name = opt.getAttribute('data-name') || opt.textContent.trim();
      } else {
        name = personNameInput.value.trim();
        if (!name) {
          alert(getLanguage() === 'es' ? 'Por favor ingrese el nombre del individuo.' : 'Please enter the individual\'s full name.');
          personNameInput.focus();
          return;
        }
        personId = generateId('person');
      }

      this.model.nodes[nodeId] = {
        id: nodeId,
        parentId,
        name,
        type: 'person',
        personId,
        directPercentage: percentage,
        specialCategory: null
      };

    } else {
      // Business
      const name = document.getElementById('add-business-name').value.trim();
      const category = document.getElementById('select-business-category').value;
      const specialCategory = category === 'none' ? null : category;

      if (!name) {
        alert(getLanguage() === 'es' ? 'Por favor ingrese el nombre del negocio.' : 'Please enter the business/entity name.');
        document.getElementById('add-business-name').focus();
        return;
      }

      // Check circular reference prevention
      if (wouldCreateCycle(this.model.nodes, nodeId, parentId)) {
        alert(getLanguage() === 'es' ? 'Error: Una estructura de ownership no puede contener una referencia circular para efectos de este cálculo.' : 'Error: An ownership structure cannot contain a circular reference for this calculation.');
        return;
      }

      this.model.nodes[nodeId] = {
        id: nodeId,
        parentId,
        name,
        type: 'business',
        directPercentage: percentage,
        specialCategory,
        personId: null
      };
    }

    this.closeAllModals();
    this.update();
  }

  openEditNodeModal(nodeId) {
    const node = this.model.nodes[nodeId];
    if (!node) return;

    const modal = document.getElementById('modal-edit-node');
    if (!modal) return;

    document.getElementById('edit-node-id').value = nodeId;
    document.getElementById('edit-node-name').value = node.name;

    const pctGroup = document.getElementById('edit-percentage-group');
    const pctInput = document.getElementById('edit-node-percentage');

    if (node.isRoot) {
      pctGroup.style.display = 'none';
    } else {
      pctGroup.style.display = 'block';
      pctInput.value = node.directPercentage;
    }

    const businessSection = document.getElementById('edit-business-category-group');
    const personSection = document.getElementById('edit-person-linking-group');

    this.updateCategoryDropdowns();

    if (node.type === 'business' && !node.isRoot) {
      businessSection.style.display = 'block';
      personSection.style.display = 'none';

      const catSelect = document.getElementById('edit-business-category');
      catSelect.value = node.specialCategory || 'none';
    } else if (node.type === 'person') {
      businessSection.style.display = 'none';
      personSection.style.display = 'block';

      // Setup unlink/re-link options
      const existingPersons = getExistingPersons(this.model.nodes);
      const reLinkSelect = document.getElementById('edit-relink-person-select');
      const isLinkedAlready = Object.values(this.model.nodes).filter(n => n.type === 'person' && n.personId === node.personId).length > 1;

      document.getElementById('edit-person-current-id').textContent = node.personId;
      document.getElementById('edit-person-status').textContent = isLinkedAlready ? `${t('node_linked_tag')} (${node.personId})` : t('node_badge_person');

      reLinkSelect.innerHTML = `
        <option value="keep">${t('modal_edit_keep_link')}</option>
        <option value="unlink">${t('modal_edit_unlink')}</option>
        ${existingPersons.filter(p => p.personId !== node.personId).map(p => `
          <option value="${p.personId}">${t('modal_edit_relink_to')} ${p.name} [${p.personId}]</option>
        `).join('')}
      `;
    } else {
      businessSection.style.display = 'none';
      personSection.style.display = 'none';
    }

    const form = document.getElementById('form-edit-node');
    form.onsubmit = (e) => {
      e.preventDefault();
      this.handleEditNodeSubmit();
    };

    modal.classList.add('modal-active');
  }

  handleEditNodeSubmit() {
    const nodeId = document.getElementById('edit-node-id').value;
    const node = this.model.nodes[nodeId];
    if (!node) return;

    const name = document.getElementById('edit-node-name').value.trim();
    if (!name) {
      alert(getLanguage() === 'es' ? 'El nombre no puede estar vacío.' : 'Name cannot be empty.');
      return;
    }

    node.name = name;

    if (node.isRoot) {
      this.model.metadata.companyName = name;
    } else {
      const pctVal = parseFloat(document.getElementById('edit-node-percentage').value);
      if (isNaN(pctVal) || pctVal <= 0 || pctVal > 100) {
        alert(getLanguage() === 'es' ? 'El porcentaje debe ser un valor numérico entre 0.01 y 100.' : 'Percentage must be a number between 0.01 and 100.');
        return;
      }
      node.directPercentage = pctVal;

      if (node.type === 'business') {
        const cat = document.getElementById('edit-business-category').value;
        const newCat = cat === 'none' ? null : cat;

        // If turning into special entity, check if it had children
        if (newCat && !node.specialCategory) {
          const children = Object.values(this.model.nodes).filter(n => n.parentId === nodeId);
          if (children.length > 0) {
            const confirmChange = confirm(
              getLanguage() === 'es' 
                ? `Al clasificar a ${node.name} como Entidad Especial, se detendrá la rama y se eliminarán sus ${children.length} sub-propietarios.\n¿Desea continuar?`
                : `Classifying ${node.name} as a Special Entity will stop this branch and delete its ${children.length} sub-owners.\nDo you want to proceed?`
            );
            if (!confirmChange) return;
            // Delete subtree of children
            this.deleteSubtree(nodeId);
          }
        }
        node.specialCategory = newCat;
      } else if (node.type === 'person') {
        const reLinkAction = document.getElementById('edit-relink-person-select').value;
        if (reLinkAction === 'unlink') {
          node.personId = generateId('person');
        } else if (reLinkAction !== 'keep') {
          node.personId = reLinkAction;
          // Synchronize name to match linked persona
          const target = Object.values(this.model.nodes).find(n => n.type === 'person' && n.personId === reLinkAction);
          if (target) {
            node.name = target.name;
          }
        }
      }
    }

    this.closeAllModals();
    this.update();
  }

  openDeleteConfirmModal(nodeId) {
    const node = this.model.nodes[nodeId];
    if (!node || node.isRoot) return;

    const modal = document.getElementById('modal-delete-node');
    if (!modal) return;

    document.getElementById('delete-node-id').value = nodeId;
    document.getElementById('delete-node-name').textContent = node.name;

    const descCount = this.countSubtreeNodes(nodeId);
    const descNotice = document.getElementById('delete-descendants-notice');
    if (descCount > 0) {
      descNotice.style.display = 'block';
      descNotice.textContent = t('modal_delete_descendants_notice', { count: descCount });
    } else {
      descNotice.style.display = 'none';
    }

    const btnConfirm = document.getElementById('btn-confirm-delete');
    btnConfirm.onclick = () => {
      this.deleteNodeAndSubtree(nodeId);
      this.closeAllModals();
      this.update();
    };

    modal.classList.add('modal-active');
  }

  countSubtreeNodes(nodeId) {
    let count = 0;
    const stack = [nodeId];
    while (stack.length > 0) {
      const current = stack.pop();
      const children = Object.values(this.model.nodes).filter(n => n.parentId === current);
      count += children.length;
      children.forEach(c => stack.push(c.id));
    }
    return count;
  }

  deleteSubtree(nodeId) {
    const children = Object.values(this.model.nodes).filter(n => n.parentId === nodeId);
    children.forEach(child => {
      this.deleteSubtree(child.id);
      delete this.model.nodes[child.id];
    });
  }

  deleteNodeAndSubtree(nodeId) {
    this.deleteSubtree(nodeId);
    delete this.model.nodes[nodeId];
  }

  openCaseInfoModal() {
    const modal = document.getElementById('modal-case-info');
    if (!modal) return;

    document.getElementById('case-info-company').value = this.model.metadata.companyName;
    document.getElementById('case-info-prepared').value = this.model.metadata.preparedBy;
    document.getElementById('case-info-notes').value = this.model.metadata.notes;

    const form = document.getElementById('form-case-info');
    form.onsubmit = (e) => {
      e.preventDefault();
      const company = document.getElementById('case-info-company').value.trim();
      const prepared = document.getElementById('case-info-prepared').value.trim();
      const notes = document.getElementById('case-info-notes').value.trim();

      if (!company) {
        alert(getLanguage() === 'es' ? 'El nombre de la compañía es obligatorio.' : 'Target company name is required.');
        return;
      }

      this.model.metadata.companyName = company;
      this.model.metadata.preparedBy = prepared;
      this.model.metadata.notes = notes;

      const rootNode = this.model.nodes[this.model.rootId];
      if (rootNode) rootNode.name = company;

      this.closeAllModals();
      this.update();
    };

    modal.classList.add('modal-active');
  }

  confirmNewCase() {
    const msg = getLanguage() === 'es'
      ? '¿Está seguro de que desea iniciar un nuevo caso?\nToda la información de la sesión actual se restablecerá (sin almacenamiento permanente).'
      : 'Are you sure you want to start a new case?\nAll current session data will be reset (no persistent storage).';

    if (confirm(msg)) {
      this.model = createInitialModel('Target Corporation', '', '');
      this.expandedPersons.clear();
      this.update();
      setTimeout(() => this.canvas?.fitToView(), 100);
    }
  }

  loadDemoCase() {
    const msg = getLanguage() === 'es'
      ? '¿Cargar el caso de prueba multi-nivel (ABC Company con consolidación de Leo Rivera y 5 propietarios)?'
      : 'Load multi-level demo case (ABC Company with Leo Rivera consolidation and 5 owners)?';

    if (!confirm(msg)) return;

    const model = createInitialModel(
      'ABC Company',
      getLanguage() === 'es' ? 'Auditor Senior de Riesgo' : 'Senior Risk Auditor',
      getLanguage() === 'es' ? 'Estructura multi-nivel para validación de consolidación y redondeo.' : 'Multi-level ownership structure for route consolidation and rounding tolerance testing.'
    );

    // Root -> XYZ Corp (50%), RDV Corp (50%)
    model.nodes['xyz'] = {
      id: 'xyz',
      parentId: 'node_root',
      name: 'XYZ Corp',
      type: 'business',
      directPercentage: 50.0,
      specialCategory: null
    };

    model.nodes['rdv'] = {
      id: 'rdv',
      parentId: 'node_root',
      name: 'RDV Corp',
      type: 'business',
      directPercentage: 50.0,
      specialCategory: null
    };

    // Under XYZ Corp: Peter River (75%), DZY (25%)
    model.nodes['peter'] = {
      id: 'peter',
      parentId: 'xyz',
      name: 'Peter River',
      type: 'person',
      personId: 'person_peter',
      directPercentage: 75.0
    };

    model.nodes['dzy'] = {
      id: 'dzy',
      parentId: 'xyz',
      name: 'DZY',
      type: 'business',
      directPercentage: 25.0,
      specialCategory: null
    };

    // Under DZY: Maria Ruiz (50%), Leo Rivera (50%)
    model.nodes['maria'] = {
      id: 'maria',
      parentId: 'dzy',
      name: 'Maria Ruiz',
      type: 'person',
      personId: 'person_maria',
      directPercentage: 50.0
    };

    model.nodes['leo_dzy'] = {
      id: 'leo_dzy',
      parentId: 'dzy',
      name: 'Leo Rivera',
      type: 'person',
      personId: 'person_leo',
      directPercentage: 50.0
    };

    // Under RDV Corp: Jose Perez (33.33%), Luis Castro (33.33%), Leo Rivera (33.33%, linked)
    model.nodes['jose'] = {
      id: 'jose',
      parentId: 'rdv',
      name: 'Jose Perez',
      type: 'person',
      personId: 'person_jose',
      directPercentage: 33.33
    };

    model.nodes['luis'] = {
      id: 'luis',
      parentId: 'rdv',
      name: 'Luis Castro',
      type: 'person',
      personId: 'person_luis',
      directPercentage: 33.33
    };

    model.nodes['leo_rdv'] = {
      id: 'leo_rdv',
      parentId: 'rdv',
      name: 'Leo Rivera',
      type: 'person',
      personId: 'person_leo', // Linked!
      directPercentage: 33.33
    };

    this.model = model;
    this.expandedPersons.clear();
    this.expandedPersons.add('person_leo'); // Expand Leo Rivera by default to show routes
    this.update();
    setTimeout(() => this.canvas?.fitToView(), 150);
  }

  loadSpecialEntityDemoCase() {
    const msg = getLanguage() === 'es'
      ? '¿Cargar caso demostrativo con Entidad Especial (Institución Financiera Regulada y Entidad SEC)?'
      : 'Load demo case with Special Entity (Regulated Financial Institution & SEC Entity)?';

    if (!confirm(msg)) return;

    const model = createInitialModel(
      'Global Holding Ltd.',
      getLanguage() === 'es' ? 'Equipo de Compliance' : 'Compliance Team',
      getLanguage() === 'es' ? 'Caso con sucursales detenidas por excepción de entidad especial.' : 'Ownership structure containing stopped branches due to regulatory special entity exemptions.'
    );

    model.nodes['bank'] = {
      id: 'bank',
      parentId: 'node_root',
      name: 'First Example Bank N.A.',
      type: 'business',
      directPercentage: 40.0,
      specialCategory: 'financial_institution'
    };

    model.nodes['mid_corp'] = {
      id: 'mid_corp',
      parentId: 'node_root',
      name: 'Apex Strategic Investments',
      type: 'business',
      directPercentage: 60.0,
      specialCategory: null
    };

    model.nodes['sec_fund'] = {
      id: 'sec_fund',
      parentId: 'mid_corp',
      name: 'Alpha Horizon Growth Fund (SEC Registered)',
      type: 'business',
      directPercentage: 50.0,
      specialCategory: 'sec_registered'
    };

    model.nodes['founder'] = {
      id: 'founder',
      parentId: 'mid_corp',
      name: 'Elena Rostova',
      type: 'person',
      personId: 'p_elena',
      directPercentage: 50.0
    };

    this.model = model;
    this.expandedPersons.clear();
    this.update();
    setTimeout(() => this.canvas?.fitToView(), 150);
  }

  openPrintReportModal() {
    const modal = document.getElementById('modal-print-report');
    if (!modal) return;

    this.renderPrintContent();

    document.getElementById('btn-execute-print').onclick = () => {
      window.print();
    };

    modal.classList.add('modal-active');
  }

  renderPrintContent() {
    const reportContainer = document.getElementById('print-report-content');
    if (!reportContainer) return;

    const { companyName, preparedBy, notes } = this.model.metadata;
    const { individuals, specialEntities, summary } = this.calculatedData;
    const locale = getLanguage() === 'es' ? 'es-ES' : 'en-US';
    const formattedDate = new Date().toLocaleString(locale, {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    reportContainer.innerHTML = `
      <div class="print-document">
        <!-- Report Header with AML Consultant Logo -->
        <div class="print-header">
          <div class="print-brand-row">
            <div class="print-brand-left">
              <div class="print-logo-container">
                <img src="assets/aml_consultant_logo.png" alt="AML Consultant" class="print-logo-img" />
              </div>
              <div class="print-title-block">
                <h1 class="print-doc-title">${t('print_doc_title')}</h1>
                <div class="print-doc-subtitle">${t('print_doc_subtitle')}</div>
                <div class="print-brand-ref">${t('print_brand_ref')}</div>
              </div>
            </div>
          </div>
          <div class="print-meta-grid">
            <div><strong>${t('print_meta_company')}</strong> ${companyName}</div>
            <div><strong>${t('print_meta_prepared')}</strong> ${preparedBy || t('not_specified')}</div>
            <div><strong>${t('print_meta_date')}</strong> ${formattedDate}</div>
            <div><strong>${t('print_meta_val_status')}</strong> ${summary.allLevelsValid ? t('print_val_valid') : t('print_val_invalid')}</div>
          </div>
          ${notes ? `<div class="print-notes-box"><strong>${t('print_notes_title')}</strong> ${notes}</div>` : ''}
        </div>

        <!-- Executive Summary Cards -->
        <div class="print-summary-grid">
          <div class="print-kpi-card">
            <div class="kpi-label">${t('print_kpi_ind')}</div>
            <div class="kpi-value kpi-individuals">${summary.attributedToIndividuals.toFixed(3).replace(/\.?0+$/, '')}%</div>
          </div>
          <div class="print-kpi-card">
            <div class="kpi-label">${t('print_kpi_special')}</div>
            <div class="kpi-value kpi-special">${summary.stoppedInSpecialEntities.toFixed(3).replace(/\.?0+$/, '')}%</div>
          </div>
          <div class="print-kpi-card">
            <div class="kpi-label">${t('print_kpi_pending')}</div>
            <div class="kpi-value kpi-pending">${summary.pendingUnidentified.toFixed(3).replace(/\.?0+$/, '')}%</div>
          </div>
          <div class="print-kpi-card">
            <div class="kpi-label">${t('print_kpi_total')}</div>
            <div class="kpi-value kpi-total">${summary.totalExplained.toFixed(3).replace(/\.?0+$/, '')}%</div>
          </div>
        </div>

        <!-- Visual Legend -->
        <div class="print-legend">
          <span class="legend-title">${t('print_legend_title')}</span>
          <span class="legend-item"><span class="legend-color legend-root"></span> ${t('print_legend_root')}</span>
          <span class="legend-item"><span class="legend-color legend-business"></span> ${t('print_legend_business')}</span>
          <span class="legend-item"><span class="legend-color legend-person"></span> ${t('print_legend_person')}</span>
          <span class="legend-item"><span class="legend-color legend-special"></span> ${t('print_legend_special')}</span>
        </div>

        <!-- Visual Ownership Tree Diagram (Vector snapshot) -->
        <div class="print-section">
          <h2 class="print-section-title">${t('print_section1_title')}</h2>
          <div class="print-tree-container">
            ${this.generatePrintTreeSVG()}
          </div>
        </div>

        <!-- Consolidated Individuals Table -->
        <div class="print-section print-page-break">
          <h2 class="print-section-title">${t('print_section2_title')}</h2>
          <p class="print-section-desc">${t('print_section2_desc')}</p>
          
          <table class="print-table">
            <thead>
              <tr>
                <th style="width: 50px;">${t('print_th_rank')}</th>
                <th>${t('print_th_name')}</th>
                <th style="width: 140px;">${t('print_th_routes')}</th>
                <th style="width: 160px; text-align: right;">${t('print_th_effective_pct')} ${companyName}</th>
              </tr>
            </thead>
            <tbody>
              ${individuals.length === 0 ? `
                <tr><td colspan="4" style="text-align: center; color: #888;">${t('print_no_individuals')}</td></tr>
              ` : individuals.map((ind, i) => `
                <tr class="print-row-main">
                  <td><strong>${i + 1}</strong></td>
                  <td>
                    <strong>${ind.name}</strong>
                    <div class="print-routes-sub">
                      ${ind.routes.map((r, rIdx) => `
                        <div class="print-route-line">
                          <span>${t('route_num')} ${rIdx + 1}: ${r.pathString}</span>
                          <span class="print-formula-pill">(${r.path.filter(p => p.type !== 'root').map(p => `${p.directPercentage}%`).join(' × ')} = ${r.effectivePercentage.toFixed(3).replace(/\.?0+$/, '')}%)</span>
                        </div>
                      `).join('')}
                    </div>
                  </td>
                  <td>${ind.routes.length} ${t('results_routes')}</td>
                  <td style="text-align: right; font-weight: bold; font-size: 15px; color: #15803d;">
                    ${ind.effectivePercentage.toFixed(3).replace(/\.?0+$/, '')}%
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Special Entities Table -->
        ${specialEntities.length > 0 ? `
          <div class="print-section">
            <h2 class="print-section-title">${t('print_section3_title')}</h2>
            <p class="print-section-desc">${t('print_section3_desc')}</p>
            <table class="print-table">
              <thead>
                <tr>
                  <th>${t('print_th_sp_name')}</th>
                  <th>${t('print_th_sp_category')}</th>
                  <th>${t('print_th_sp_route')}</th>
                  <th style="width: 140px; text-align: right;">${t('print_th_sp_pct')}</th>
                </tr>
              </thead>
              <tbody>
                ${specialEntities.map(sp => `
                  <tr>
                    <td><strong>${sp.name}</strong></td>
                    <td><span class="print-cat-badge">🛡️ ${getCategoryLabel(sp.category) || sp.categoryLabel}</span></td>
                    <td class="print-route-text">${sp.pathString}</td>
                    <td style="text-align: right; font-weight: bold; color: #b45309;">${sp.effectivePercentage.toFixed(3).replace(/\.?0+$/, '')}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- Disclaimer Footer -->
        <div class="print-disclaimer">
          <strong>${t('print_disclaimer_title')}</strong>
          ${t('print_disclaimer_text')}
        </div>
      </div>
    `;
  }

  /**
   * Generates a clean, scaled, self-contained SVG for the printable report
   */
  generatePrintTreeSVG() {
    if (!this.canvas || !this.canvas.layoutNodes || this.canvas.layoutNodes.size === 0) {
      return `<div style="padding: 20px; text-align: center; color: #888;">${t('print_no_individuals')}</div>`;
    }

    const { nodes, rootId } = this.model;
    const layoutNodes = this.canvas.layoutNodes;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    layoutNodes.forEach(item => {
      minX = Math.min(minX, item.x);
      maxX = Math.max(maxX, item.x + item.width);
      minY = Math.min(minY, item.y);
      maxY = Math.max(maxY, item.y + item.height);
    });

    const pad = 40;
    const width = maxX - minX + pad * 2;
    const height = maxY - minY + pad * 2;
    const offsetX = pad - minX;
    const offsetY = pad - minY;

    // SVG elements
    const lines = [];
    const nodeBoxes = [];

    // Connectors
    Object.values(nodes).forEach(node => {
      if (!node.parentId || !layoutNodes.has(node.id) || !layoutNodes.has(node.parentId)) return;

      const pLayout = layoutNodes.get(node.parentId);
      const cLayout = layoutNodes.get(node.id);

      const x1 = pLayout.x + pLayout.width / 2 + offsetX;
      const y1 = pLayout.y + pLayout.height + offsetY;
      const x2 = cLayout.x + cLayout.width / 2 + offsetX;
      const y2 = cLayout.y + offsetY;
      const midY = (y1 + y2) / 2;

      const pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
      lines.push(`
        <path d="${pathD}" fill="none" stroke="#94a3b8" stroke-width="2" />
        <g transform="translate(${(x1 + x2) / 2}, ${midY})">
          <rect x="-32" y="-11" width="64" height="22" rx="11" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
          <text x="0" y="4" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#334155">${node.directPercentage}%</text>
        </g>
      `);
    });

    // Nodes
    Object.values(nodes).forEach(node => {
      const l = layoutNodes.get(node.id);
      if (!l) return;

      const x = l.x + offsetX;
      const y = l.y + offsetY;

      let strokeColor = '#bae6fd';
      let headerBg = '#f0f9ff';
      let titleColor = '#0369a1';
      let typeLabel = t('node_badge_business');

      if (node.isRoot) {
        strokeColor = '#c7d2fe';
        headerBg = '#eef2ff';
        titleColor = '#4338ca';
        typeLabel = t('node_badge_root');
      } else if (node.specialCategory) {
        strokeColor = '#fde68a';
        headerBg = '#fffbeb';
        titleColor = '#b45309';
        typeLabel = t('node_badge_special');
      } else if (node.type === 'person') {
        strokeColor = '#bbf7d0';
        headerBg = '#f0fdf4';
        titleColor = '#15803d';
        typeLabel = t('node_badge_person');
      }

      nodeBoxes.push(`
        <g transform="translate(${x}, ${y})">
          <!-- Card Body -->
          <rect x="0" y="0" width="${l.width}" height="${l.height}" rx="8" fill="#ffffff" stroke="${strokeColor}" stroke-width="1.8" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))"/>
          <!-- Card Header Bar -->
          <path d="M 0 8 Q 0 0 8 0 L ${l.width - 8} 0 Q ${l.width} 0 ${l.width} 8 L ${l.width} 26 L 0 26 Z" fill="${headerBg}" />
          <text x="12" y="18" font-size="10.5" font-weight="bold" fill="${titleColor}">${typeLabel}</text>
          <!-- Node Name -->
          <text x="14" y="50" font-size="12.5" font-weight="bold" fill="#0f172a">${this.escapeXml(node.name)}</text>
          <!-- Direct % or details -->
          <text x="14" y="72" font-size="10.5" fill="#475569">
            ${node.isRoot ? t('node_root_share') : `${t('node_direct_share')} ${node.directPercentage}%`}
          </text>
          ${node.specialCategory ? `
            <text x="14" y="92" font-size="9.5" font-weight="bold" fill="#b45309">🛡️ ${t('node_stopped_branch')}</text>
          ` : ''}
          ${node.type === 'person' ? `
            <text x="14" y="92" font-size="9.5" fill="#15803d">👤 ${t('node_badge_person')}</text>
          ` : ''}
        </g>
      `);
    });

    return `
      <svg viewBox="0 0 ${width} ${height}" style="width: 100%; max-height: 520px; font-family: system-ui, -apple-system, sans-serif;">
        <rect width="100%" height="100%" fill="#fafafa"/>
        <g>${lines.join('')}</g>
        <g>${nodeBoxes.join('')}</g>
      </svg>
    `;
  }

  escapeXml(unsafe) {
    return String(unsafe).replace(/[<>&'"]/g, c => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('modal-active'));
  }
}

// Instantiate on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  window.uboApp = new UBOApp();
});
