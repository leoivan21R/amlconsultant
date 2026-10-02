/**
 * Canvas Layout and Rendering Engine
 * Handles hierarchical tree positioning, pan & zoom, SVG connectors,
 * and high-fidelity rendering for both interactive screen and print view.
 */

import { SPECIAL_CATEGORIES, validateEntityChildren, getCategoryLabel } from './engine.js';
import { t } from './i18n.js';

export class OwnershipCanvas {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = {
      nodeWidth: 260,
      nodeHeight: 140,
      horizontalSpacing: 48,
      verticalSpacing: 100,
      onAddOwner: options.onAddOwner || (() => {}),
      onEditNode: options.onEditNode || (() => {}),
      onDeleteNode: options.onDeleteNode || (() => {}),
      onSelectNode: options.onSelectNode || (() => {}),
      ...options
    };

    this.model = null;
    this.calculatedData = null;
    this.layoutNodes = new Map(); // id -> { x, y, width, height }
    
    // Viewport transform
    this.panX = 60;
    this.panY = 60;
    this.zoom = 1;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;

    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="canvas-viewport" id="canvas-viewport">
        <svg class="canvas-svg-layer" id="canvas-svg-layer">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--connector-line)" />
            </marker>
            <filter id="badge-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.25"/>
            </filter>
          </defs>
          <g id="svg-connections-group"></g>
        </svg>
        <div class="canvas-nodes-layer" id="canvas-nodes-layer"></div>
      </div>
      <div class="canvas-controls">
        <button class="ctrl-btn" id="btn-zoom-in" data-i18n-title="ctrl_zoom_in" title="${t('ctrl_zoom_in')}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
        <button class="ctrl-btn" id="btn-zoom-out" data-i18n-title="ctrl_zoom_out" title="${t('ctrl_zoom_out')}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
        <button class="ctrl-btn" id="btn-fit-view" data-i18n-title="ctrl_fit_view" title="${t('ctrl_fit_view')}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
        </button>
        <button class="ctrl-btn" id="btn-reset-zoom" data-i18n-title="ctrl_reset_zoom" title="${t('ctrl_reset_zoom')}">
          <span class="zoom-pct-display" id="zoom-indicator">100%</span>
        </button>
      </div>
    `;

    this.viewport = this.container.querySelector('#canvas-viewport');
    this.svgGroup = this.container.querySelector('#svg-connections-group');
    this.nodesLayer = this.container.querySelector('#canvas-nodes-layer');
    this.zoomIndicator = this.container.querySelector('#zoom-indicator');
  }

  bindEvents() {
    // Pan via background drag
    this.container.addEventListener('mousedown', (e) => {
      if (e.target.closest('.node-card') || e.target.closest('.canvas-controls') || e.target.closest('.connection-badge')) {
        return;
      }
      this.isDragging = true;
      this.dragStartX = e.clientX - this.panX;
      this.dragStartY = e.clientY - this.panY;
      this.container.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.panX = e.clientX - this.dragStartX;
      this.panY = e.clientY - this.dragStartY;
      this.applyTransform();
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.container.style.cursor = 'default';
      }
    });

    // Zoom via wheel
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this.container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      const newZoom = Math.min(Math.max(0.25, this.zoom * zoomFactor), 2.5);

      // Zoom towards mouse
      this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
      this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
      this.zoom = newZoom;

      this.applyTransform();
    }, { passive: false });

    // Buttons
    this.container.querySelector('#btn-zoom-in').addEventListener('click', () => {
      this.zoomAtCenter(1.2);
    });
    this.container.querySelector('#btn-zoom-out').addEventListener('click', () => {
      this.zoomAtCenter(0.833);
    });
    this.container.querySelector('#btn-fit-view').addEventListener('click', () => {
      this.fitToView();
    });
    this.container.querySelector('#btn-reset-zoom').addEventListener('click', () => {
      this.zoom = 1;
      this.applyTransform();
    });
  }

  zoomAtCenter(factor) {
    const rect = this.container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const newZoom = Math.min(Math.max(0.25, this.zoom * factor), 2.5);
    this.panX = centerX - (centerX - this.panX) * (newZoom / this.zoom);
    this.panY = centerY - (centerY - this.panY) * (newZoom / this.zoom);
    this.zoom = newZoom;
    this.applyTransform();
  }

  applyTransform() {
    const transformStr = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    this.svgGroup.setAttribute('transform', `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`);
    this.nodesLayer.style.transform = transformStr;
    this.nodesLayer.style.transformOrigin = '0 0';
    if (this.zoomIndicator) {
      this.zoomIndicator.textContent = `${Math.round(this.zoom * 100)}%`;
    }
  }

  /**
   * Calculates tree coordinates using a tidy subtree-width algorithm
   */
  computeTreeLayout() {
    if (!this.model || !this.model.rootId || !this.model.nodes[this.model.rootId]) {
      return;
    }

    const { nodes, rootId } = this.model;
    const { nodeWidth, nodeHeight, horizontalSpacing, verticalSpacing } = this.options;
    this.layoutNodes.clear();

    // Helper: compute subtree width
    const subtreeWidths = new Map();

    const getChildrenOf = (id) => Object.values(nodes).filter(n => n.parentId === id);

    function measureSubtree(nodeId) {
      const children = getChildrenOf(nodeId);
      if (children.length === 0) {
        subtreeWidths.set(nodeId, nodeWidth);
        return nodeWidth;
      }
      let totalWidth = 0;
      children.forEach((child, idx) => {
        if (idx > 0) totalWidth += horizontalSpacing;
        totalWidth += measureSubtree(child.id);
      });
      const width = Math.max(nodeWidth, totalWidth);
      subtreeWidths.set(nodeId, width);
      return width;
    }

    measureSubtree(rootId);

    // Helper: position nodes recursively
    const positionNode = (nodeId, leftX, levelY) => {
      const totalWidth = subtreeWidths.get(nodeId);
      const nodeX = leftX + (totalWidth - nodeWidth) / 2;
      const nodeY = levelY;

      this.layoutNodes.set(nodeId, {
        x: nodeX,
        y: nodeY,
        width: nodeWidth,
        height: nodeHeight
      });

      const children = getChildrenOf(nodeId);
      let currentChildLeft = leftX;
      children.forEach(child => {
        const childWidth = subtreeWidths.get(child.id);
        positionNode(child.id, currentChildLeft, levelY + nodeHeight + verticalSpacing);
        currentChildLeft += childWidth + horizontalSpacing;
      });
    };

    positionNode(rootId, 40, 40);
  }

  /**
   * Render the entire structure
   */
  render(model, calculatedData) {
    this.model = model;
    this.calculatedData = calculatedData;

    this.computeTreeLayout();
    this.renderConnectors();
    this.renderNodes();
    this.applyTransform();
  }

  renderConnectors() {
    if (!this.svgGroup || !this.model) return;
    this.svgGroup.innerHTML = '';

    const { nodes, rootId } = this.model;

    Object.values(nodes).forEach(node => {
      if (!node.parentId || !this.layoutNodes.has(node.id) || !this.layoutNodes.has(node.parentId)) {
        return;
      }

      const parentLayout = this.layoutNodes.get(node.parentId);
      const childLayout = this.layoutNodes.get(node.id);

      const startX = parentLayout.x + parentLayout.width / 2;
      const startY = parentLayout.y + parentLayout.height;
      const endX = childLayout.x + childLayout.width / 2;
      const endY = childLayout.y;

      const midY = (startY + endY) / 2;

      // Smooth Bezier curve path
      const pathD = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

      // SVG path
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', pathD);
      pathEl.setAttribute('class', 'connection-line');
      pathEl.setAttribute('fill', 'none');
      pathEl.setAttribute('stroke', 'var(--connector-line)');
      pathEl.setAttribute('stroke-width', '2.5');
      this.svgGroup.appendChild(pathEl);

      // Percentage pill badge placed at the midpoint of curve
      const labelX = (startX + endX) / 2;
      const labelY = midY;

      const badgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      badgeGroup.setAttribute('class', 'connection-badge-group');
      badgeGroup.setAttribute('transform', `translate(${labelX}, ${labelY})`);

      const pillRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      pillRect.setAttribute('x', '-38');
      pillRect.setAttribute('y', '-12');
      pillRect.setAttribute('width', '76');
      pillRect.setAttribute('height', '24');
      pillRect.setAttribute('rx', '12');
      pillRect.setAttribute('class', 'connection-pill-bg');

      const pillText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      pillText.setAttribute('x', '0');
      pillText.setAttribute('y', '4');
      pillText.setAttribute('text-anchor', 'middle');
      pillText.setAttribute('class', 'connection-pill-text');
      
      const pctFormatted = Number(node.directPercentage).toFixed(2).replace(/\.00$/, '') + '%';
      pillText.textContent = pctFormatted;

      badgeGroup.appendChild(pillRect);
      badgeGroup.appendChild(pillText);
      this.svgGroup.appendChild(badgeGroup);
    });
  }

  renderNodes() {
    if (!this.nodesLayer || !this.model) return;
    this.nodesLayer.innerHTML = '';

    const { nodes, rootId } = this.model;
    const { levelValidations, paths } = this.calculatedData || {};

    Object.values(nodes).forEach(node => {
      const layout = this.layoutNodes.get(node.id);
      if (!layout) return;

      const card = document.createElement('div');
      card.id = `node-${node.id}`;
      card.className = `node-card node-type-${node.type} ${node.isRoot ? 'node-root' : ''} ${node.specialCategory ? 'node-special' : ''}`;
      card.style.left = `${layout.x}px`;
      card.style.top = `${layout.y}px`;
      card.style.width = `${layout.width}px`;

      // Determine node status & badges
      let typeBadge = '';
      let badgeClass = '';
      let icon = '';

      if (node.isRoot) {
        typeBadge = t('node_badge_root');
        badgeClass = 'badge-root';
        icon = '🏢';
      } else if (node.specialCategory) {
        typeBadge = t('node_badge_special');
        badgeClass = 'badge-special';
        icon = '🛡️';
      } else if (node.type === 'business') {
        typeBadge = t('node_badge_business');
        badgeClass = 'badge-business';
        icon = '🏛️';
      } else {
        typeBadge = t('node_badge_person');
        badgeClass = 'badge-person';
        icon = '👤';
      }

      // Compute effective ownership preview for this node
      let effectivePreview = '';
      const matchingPath = paths?.find(p => p.nodeId === node.id);
      if (matchingPath) {
        effectivePreview = `
          <div class="node-metric-row">
            <span class="metric-label">${t('node_effective_root')}</span>
            <span class="metric-val highlight-eff">${matchingPath.effectivePercentage.toFixed(3).replace(/\.?0+$/, '')}%</span>
          </div>
        `;
      } else if (node.isRoot) {
        effectivePreview = `
          <div class="node-metric-row">
            <span class="metric-label">${t('node_root_share')}</span>
            <span class="metric-val highlight-eff">100%</span>
          </div>
        `;
      }

      // Check validation warning if business
      let validationHtml = '';
      if (node.type === 'business' && !node.specialCategory) {
        const val = levelValidations?.[node.id] || validateEntityChildren(nodes, node.id);
        if (!val.isValid && val.childrenCount > 0) {
          validationHtml = `
            <div class="node-warning-badge" title="${val.message}">
              <span class="warn-icon">⚠️</span> ${t('node_assigned')}: ${val.assigned.toFixed(2)}% | ${t('node_pending')}: ${val.pending.toFixed(2)}%
            </div>
          `;
        } else if (val.childrenCount === 0 && !node.isRoot) {
          validationHtml = `
            <div class="node-warning-badge node-empty-warn" title="${t('node_pending_assign')}">
              <span class="warn-icon">⏳</span> ${t('node_pending_assign')}
            </div>
          `;
        } else if (val.isValid) {
          validationHtml = `
            <div class="node-success-badge">
              <span class="check-icon">✓</span> ${t('node_100_assigned')}
            </div>
          `;
        }
      }

      // Category label for special entities
      let specialCategoryHtml = '';
      if (node.specialCategory) {
        const catLabel = getCategoryLabel(node.specialCategory) || node.specialCategory;
        specialCategoryHtml = `
          <div class="special-category-tag" title="${catLabel}">
            <span class="shield-mini">🛡️</span> ${catLabel}
          </div>
          <div class="stopped-branch-notice">
            <span class="stop-dot"></span> ${t('node_stopped_branch')}
          </div>
        `;
      }

      // Linked persona tag
      let linkedPersonaHtml = '';
      if (node.type === 'person') {
        const personId = node.personId || node.id;
        // Count instances
        const count = Object.values(nodes).filter(n => n.type === 'person' && (n.personId || n.id) === personId).length;
        if (count > 1) {
          linkedPersonaHtml = `
            <div class="linked-persona-tag" title="${t('node_linked_tag')} (${count} ${t('node_branches')})">
              <span class="link-icon">🔗</span> ${t('node_linked_tag')} (${count} ${t('node_branches')})
            </div>
          `;
        }
      }

      // Action buttons
      const canAddChild = node.type === 'business' && !node.specialCategory;
      const canDelete = !node.isRoot;

      card.innerHTML = `
        <div class="node-card-header">
          <span class="node-icon">${icon}</span>
          <span class="node-type-pill ${badgeClass}">${typeBadge}</span>
          <div class="node-header-actions">
            <button class="node-action-btn btn-edit" title="${t('node_edit_title')}" data-id="${node.id}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            ${canDelete ? `
              <button class="node-action-btn btn-delete" title="${t('node_delete_title')}" data-id="${node.id}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="node-card-body">
          <div class="node-name" title="${node.name}">${node.name}</div>
          
          <div class="node-pct-box">
            <span class="direct-pct-tag">
              ${node.isRoot ? t('node_badge_root') : `${t('node_direct_share')} <strong>${Number(node.directPercentage).toFixed(2).replace(/\.00$/, '')}%</strong>`}
            </span>
          </div>

          ${effectivePreview}
          ${specialCategoryHtml}
          ${linkedPersonaHtml}
          ${validationHtml}
        </div>

        ${canAddChild ? `
          <div class="node-card-footer">
            <button class="btn-add-owner" data-parent-id="${node.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              ${t('btn_add_owner')}
            </button>
          </div>
        ` : ''}
      `;

      // Event handlers on buttons
      const addBtn = card.querySelector('.btn-add-owner');
      if (addBtn) {
        addBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.options.onAddOwner(node.id);
        });
      }

      const editBtn = card.querySelector('.btn-edit');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.options.onEditNode(node.id);
        });
      }

      const delBtn = card.querySelector('.btn-delete');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.options.onDeleteNode(node.id);
        });
      }

      card.addEventListener('click', () => {
        this.options.onSelectNode(node.id);
      });

      this.nodesLayer.appendChild(card);
    });
  }

  /**
   * Centers and scales the entire tree structure to fit inside container view
   */
  fitToView() {
    if (this.layoutNodes.size === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    this.layoutNodes.forEach(item => {
      minX = Math.min(minX, item.x);
      maxX = Math.max(maxX, item.x + item.width);
      minY = Math.min(minY, item.y);
      maxY = Math.max(maxY, item.y + item.height);
    });

    const padding = 60;
    const treeWidth = maxX - minX + padding * 2;
    const treeHeight = maxY - minY + padding * 2;

    const containerRect = this.container.getBoundingClientRect();
    const availWidth = containerRect.width;
    const availHeight = containerRect.height;

    const scaleX = availWidth / treeWidth;
    const scaleY = availHeight / treeHeight;
    const optimalZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1.2);

    this.zoom = optimalZoom;
    this.panX = (availWidth - (maxX - minX) * this.zoom) / 2 - minX * this.zoom;
    this.panY = Math.max(40, (availHeight - (maxY - minY) * this.zoom) / 2 - minY * this.zoom);

    this.applyTransform();
  }

  /**
   * Focuses and smoothly centers a specific node by its ID
   */
  focusNode(nodeId) {
    const layout = this.layoutNodes.get(nodeId);
    if (!layout) return;

    const containerRect = this.container.getBoundingClientRect();
    this.panX = containerRect.width / 2 - (layout.x + layout.width / 2) * this.zoom;
    this.panY = containerRect.height / 2 - (layout.y + layout.height / 2) * this.zoom;
    this.applyTransform();

    // Pulse animation on the node element
    const el = document.getElementById(`node-${nodeId}`);
    if (el) {
      el.classList.add('node-pulse-highlight');
      setTimeout(() => el.classList.remove('node-pulse-highlight'), 2000);
    }
  }
}
