import { t } from './i18n.js';

export const SPECIAL_CATEGORIES = {
  FINANCIAL_INSTITUTION: {
    id: 'financial_institution',
    label: 'Institución financiera regulada',
    description: 'Entidad bancaria o crediticia sujeta a supervisión prudencial.'
  },
  GOVERNMENT_ENTITY: {
    id: 'government_entity',
    label: 'Entidad gubernamental',
    description: 'Entidad estatal, municipal, soberana o pública.'
  },
  SEC_REGISTERED: {
    id: 'sec_registered',
    label: 'Entidad registrada ante la SEC',
    description: 'Emisor público o entidad regulada por la SEC.'
  },
  CFTC_NFA: {
    id: 'cftc_nfa',
    label: 'Entidad registrada ante la CFTC / NFA',
    description: 'Operador o intermediario registrado ante la CFTC / NFA.'
  },
  PCAOB_ACCOUNTING: {
    id: 'pcaob_accounting',
    label: 'Firma de contabilidad pública registrada ante PCAOB',
    description: 'Firma auditora inscrita y supervisada por la PCAOB.'
  },
  POOLED_VEHICLE: {
    id: 'pooled_vehicle',
    label: 'Pooled Investment Vehicle',
    description: 'Vehículo de inversión colectiva o fondo regulado.'
  }
};

export function getCategoryLabel(catId) {
  if (!catId) return '';
  return t('cat_' + catId);
}

export const TOLERANCE_MIN = 99.99;
export const TOLERANCE_MAX = 100.01;

/**
 * Creates a unique identifier
 */
export function generateId(prefix = 'node') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Creates a fresh ownership model
 */
export function createInitialModel(companyName = 'ABC Company', preparedBy = '', notes = '') {
  const rootId = 'node_root';
  return {
    metadata: {
      companyName: companyName.trim() || 'Compañía Principal',
      preparedBy: preparedBy.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    },
    rootId,
    nodes: {
      [rootId]: {
        id: rootId,
        parentId: null,
        name: companyName.trim() || 'Compañía Principal',
        type: 'business', // root acts as top-level business
        isRoot: true,
        directPercentage: 100.0,
        specialCategory: null,
        personId: null
      }
    }
  };
}

/**
 * Checks if adding or setting an ancestor would create a circular reference
 */
export function wouldCreateCycle(nodes, targetNodeId, potentialParentId) {
  if (targetNodeId === potentialParentId) return true;
  let currentId = potentialParentId;
  const visited = new Set();
  while (currentId) {
    if (visited.has(currentId)) return true;
    visited.add(currentId);
    if (currentId === targetNodeId) return true;
    const parentNode = nodes[currentId];
    currentId = parentNode ? parentNode.parentId : null;
  }
  return false;
}

/**
 * Retrieves children of a given node
 */
export function getChildren(nodes, parentId) {
  return Object.values(nodes).filter(n => n.parentId === parentId);
}

/**
 * Validates the direct children percentage sum of an entity
 */
export function validateEntityChildren(nodes, parentId) {
  const parent = nodes[parentId];
  if (!parent || parent.type === 'person' || parent.specialCategory) {
    return {
      isValid: true,
      sum: 0,
      status: 'not_applicable',
      childrenCount: 0,
      assigned: 0,
      pending: 0
    };
  }

  const children = getChildren(nodes, parentId);
  if (children.length === 0) {
    return {
      isValid: false,
      sum: 0,
      status: 'empty',
      childrenCount: 0,
      assigned: 0,
      pending: 100.0,
      message: 'Los porcentajes de propiedad de esta entidad no suman 100%.'
    };
  }

  const sum = children.reduce((acc, c) => acc + (Number(c.directPercentage) || 0), 0);
  // Round to 4 decimal places for comparison
  const roundedSum = Math.round(sum * 10000) / 10000;

  const isComplete = roundedSum >= TOLERANCE_MIN && roundedSum <= TOLERANCE_MAX;
  const pending = Math.max(0, 100 - roundedSum);
  const exceeded = Math.max(0, roundedSum - 100);

  return {
    isValid: isComplete,
    sum: roundedSum,
    status: isComplete ? 'complete' : (roundedSum < TOLERANCE_MIN ? 'under' : 'over'),
    childrenCount: children.length,
    assigned: roundedSum,
    pending: roundedSum < TOLERANCE_MIN ? pending : 0,
    exceeded: roundedSum > TOLERANCE_MAX ? exceeded : 0,
    message: isComplete ? 'Completo por tolerancia de redondeo' : 'Los porcentajes de propiedad de esta entidad no suman 100%.'
  };
}

/**
 * Traverses the model and computes all ownership paths and effective percentages.
 * Decoupled, fully deterministic, arbitrary-depth traversal.
 */
export function calculateOwnership(model) {
  const { nodes, rootId } = model;
  const root = nodes[rootId];
  if (!root) {
    return {
      individuals: [],
      specialEntities: [],
      levelValidations: {},
      summary: {
        attributedToIndividuals: 0,
        stoppedInSpecialEntities: 0,
        pendingUnidentified: 100,
        totalExplained: 0,
        allLevelsValid: false
      },
      paths: []
    };
  }

  const allPaths = [];
  const levelValidations = {};
  let totalPendingOwnership = 0;
  let allLevelsValid = true;

  // Track validation for all business nodes that are not special entities
  Object.values(nodes).forEach(node => {
    if (node.type === 'business' && !node.specialCategory) {
      const val = validateEntityChildren(nodes, node.id);
      levelValidations[node.id] = val;
      if (!val.isValid) {
        allLevelsValid = false;
      }
    }
  });

  // Recursive path exploration
  function traverse(currentNode, currentPath, effectiveMultiplier) {
    // effectiveMultiplier is in [0, 1]
    const children = getChildren(nodes, currentNode.id);

    // If node is a special entity, path stops
    if (currentNode.specialCategory) {
      allPaths.push({
        type: 'special_entity',
        nodeId: currentNode.id,
        name: currentNode.name,
        category: currentNode.specialCategory,
        categoryLabel: getCategoryLabel(currentNode.specialCategory) || currentNode.specialCategory,
        path: [...currentPath],
        effectivePercentage: effectiveMultiplier * 100
      });
      return;
    }

    // If node is a person, leaf reached
    if (currentNode.type === 'person') {
      allPaths.push({
        type: 'person',
        nodeId: currentNode.id,
        personId: currentNode.personId || currentNode.id,
        name: currentNode.name,
        path: [...currentPath],
        effectivePercentage: effectiveMultiplier * 100
      });
      return;
    }

    // Node is a business (not special)
    if (children.length === 0) {
      // Entire ownership of this node is unallocated / pending
      totalPendingOwnership += (effectiveMultiplier * 100);
      return;
    }

    // Calculate sum of direct percentages of children
    const directSum = children.reduce((acc, c) => acc + (Number(c.directPercentage) || 0), 0);

    // If direct children sum < 99.99%, the difference is pending ownership
    if (directSum < TOLERANCE_MIN) {
      const unassignedFraction = Math.max(0, (100 - directSum) / 100);
      const pendingEffective = effectiveMultiplier * unassignedFraction * 100;
      totalPendingOwnership += pendingEffective;
    }

    // Recurse to children
    children.forEach(child => {
      const childFraction = (Number(child.directPercentage) || 0) / 100;
      const childEffectiveMultiplier = effectiveMultiplier * childFraction;

      const pathStep = {
        nodeId: child.id,
        name: child.name,
        type: child.type,
        directPercentage: Number(child.directPercentage) || 0,
        specialCategory: child.specialCategory || null
      };

      traverse(child, [...currentPath, pathStep], childEffectiveMultiplier);
    });
  }

  // Start from root
  const rootStep = {
    nodeId: root.id,
    name: root.name,
    type: 'root',
    directPercentage: 100.0,
    specialCategory: null
  };

  traverse(root, [rootStep], 1.0);

  // Group and consolidate individuals by personId
  const individualsMap = new Map();

  allPaths.filter(p => p.type === 'person').forEach(p => {
    const key = p.personId;
    if (!individualsMap.has(key)) {
      individualsMap.set(key, {
        personId: key,
        name: p.name,
        effectivePercentage: 0,
        routes: []
      });
    }

    const individual = individualsMap.get(key);
    individual.effectivePercentage += p.effectivePercentage;
    individual.routes.push({
      nodeId: p.nodeId,
      path: p.path,
      effectivePercentage: p.effectivePercentage,
      pathString: p.path.map(step => step.name).join(' → ')
    });
  });

  // Convert to array and sort strictly descending by effective percentage
  const individuals = Array.from(individualsMap.values()).map(ind => {
    // Sort individual's routes descending
    ind.routes.sort((a, b) => b.effectivePercentage - a.effectivePercentage);
    return ind;
  }).sort((a, b) => b.effectivePercentage - a.effectivePercentage);

  // Group special entities
  const specialEntities = allPaths.filter(p => p.type === 'special_entity').map(sp => ({
    nodeId: sp.nodeId,
    name: sp.name,
    category: sp.category,
    categoryLabel: sp.categoryLabel,
    effectivePercentage: sp.effectivePercentage,
    pathString: sp.path.map(step => step.name).join(' → ')
  })).sort((a, b) => b.effectivePercentage - a.effectivePercentage);

  // Totals
  const attributedToIndividuals = individuals.reduce((acc, ind) => acc + ind.effectivePercentage, 0);
  const stoppedInSpecialEntities = specialEntities.reduce((acc, sp) => acc + sp.effectivePercentage, 0);
  
  // Total explained = individuals + special entities
  const totalExplained = attributedToIndividuals + stoppedInSpecialEntities;

  // Adjust pending if floating point issues occur: 100 - totalExplained
  // If totalExplained is close to 100 within tolerance, pending is ~0
  let pendingUnidentified = totalPendingOwnership;
  if (Math.abs((totalExplained + pendingUnidentified) - 100) > 0.0001) {
    pendingUnidentified = Math.max(0, 100 - totalExplained);
  }

  return {
    individuals,
    specialEntities,
    levelValidations,
    summary: {
      attributedToIndividuals,
      stoppedInSpecialEntities,
      pendingUnidentified,
      totalExplained,
      allLevelsValid
    },
    paths: allPaths
  };
}

/**
 * Returns a list of all unique existing persons in the model
 * for the "Vincular a persona existente" feature.
 */
export function getExistingPersons(nodes) {
  const map = new Map();
  Object.values(nodes).forEach(n => {
    if (n.type === 'person') {
      const personId = n.personId || n.id;
      if (!map.has(personId)) {
        map.set(personId, {
          personId,
          name: n.name,
          instances: []
        });
      }
      map.get(personId).instances.push(n);
    }
  });
  return Array.from(map.values());
}
