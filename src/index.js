const FIXED = 'fixed';
const ABSOLUTE = 'absolute';

export const PLACEMENTS = {
  TOP_LEFT: 'top-left',
  TOP_CENTER: 'top-center',
  TOP_RIGHT: 'top-right',
  RIGHT_TOP: 'right-top',
  RIGHT_CENTER: 'right-center',
  RIGHT_BOTTOM: 'right-bottom',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_CENTER: 'bottom-center',
  BOTTOM_RIGHT: 'bottom-right',
  LEFT_TOP: 'left-top',
  LEFT_CENTER: 'left-center',
  LEFT_BOTTOM: 'left-bottom',
};

export const BOUND_TARGETS = {
  WINDOW: 'window',
  VIEWPORT: 'viewport',
};

function getViewportWidth() {
  return Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
}

function getViewportHeight() {
  return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
}

function isFixedPosition(el) {
  if (el === window.document.body) {
    return false;
  }

  if (window.getComputedStyle(el).position === FIXED) {
    return true;
  }

  return el.parentNode ? isFixedPosition(el.parentNode) : false;
}

function getScrollTop(el) {
  if (el === document.body || el === document.documentElement) {
    return Math.max(document.documentElement.scrollTop, document.body.scrollTop);
  }

  return el.scrollTop;
}

function getScrollLeft(el) {
  if (el === document.body || el === document.documentElement) {
    return Math.max(document.documentElement.scrollLeft, document.body.scrollLeft);
  }

  return el.scrollLeft;
}

function getOffsetParent(el) {
  const { offsetParent } = el;
  return offsetParent === window.document.body || !offsetParent
    ? window.document.documentElement
    : offsetParent;
}

function getScrollParent(el) {
  const parent = el.parentNode;

  if (!parent) return el;

  if (parent === window.document) {
    if (window.document.body.scrollTop || window.document.body.scrollLeft) {
      return window.document.body;
    }
    return window.document.documentElement;
  }

  const scrolls = ['scroll', 'auto'];

  if (
    scrolls.includes(window.getComputedStyle(parent).overflow)
    || scrolls.includes(window.getComputedStyle(parent)['overflow-x'])
    || scrolls.includes(window.getComputedStyle(parent)['overflow-y'])
  ) {
    return parent;
  }

  return getScrollParent(el.parentNode);
}

function genSettings(options = {}) {
  const settings = {
    boundTarget: BOUND_TARGETS.WINDOW,
    placement: [
      PLACEMENTS.TOP_CENTER,
      PLACEMENTS.BOTTOM_CENTER,
    ],
  };

  if (options.boundTarget && Object.values(BOUND_TARGETS).includes(options.boundTarget)) {
    settings.boundTarget = options.boundTarget;
  }

  if (options.placement) {
    const placement = Array.isArray(options.placement) ? options.placement : [options.placement];

    const placements = Object.values(PLACEMENTS);
    const validPlacements = placement.filter((value) => placements.includes(value));

    if (validPlacements.length) {
      settings.placement = validPlacements;
    }
  }

  return settings;
}

// TODO: refactor
function comparePlacements(a, b, popover = {}) {
  const { width, height } = popover;

  // +1 point if width is enough for popper
  let hasWidthWinner;
  if (width) {
    if (a.maxWidth >= popover.width) {
      a.score++;
      hasWidthWinner = true;
    }
    if (b.maxWidth >= popover.width) {
      b.score++;
      hasWidthWinner = true;
    }
  }

  if (!width || !hasWidthWinner) {
    const diff = a.maxWidth - b.maxWidth;
    if (diff > 0) {
      a.score++;
    } else if (diff < 0) {
      b.score++;
    } else {
      a.score++;
      b.score++;
    }
  }

  // +1 point if height is enough for popper
  let hasHeightWinner;
  if (height) {
    if (a.maxHeight >= popover.height) {
      a.score++;
      hasHeightWinner = true;
    }
    if (b.maxHeight >= popover.height) {
      b.score++;
      hasHeightWinner = true;
    }
  }

  if (!height || !hasHeightWinner) {
    const diff = a.maxHeight - b.maxHeight;
    if (diff > 0) {
      a.score++;
    } else if (diff < 0) {
      b.score++;
    } else {
      a.score++;
      b.score++;
    }
  }
}

function getPlacementMaxHeight(placement, space, referenceBox) {
  const [a, b] = PLACEMENTS.split('_');

  // TOP_LEFT, TOP_CENTER, TOP_RIGHT
  if (a === 'TOP') return space.top;

  // BOTTOM_LEFT, BOTTOM_CENTER, BOTTOM_RIGHT
  if (a === 'BOTTOM') return space.bottom;

  // RIGHT_TOP, LEFT_TOP
  if (b === 'TOP') return referenceBox.height + space.bottom;

  // RIGHT_CENTER, LEFT_CENTER
  if (b === 'CENTER') return referenceBox.height + (Math.min(space.top, space.bottom) * 2);

  // RIGHT_BOTTOM, LEFT_BOTTOM
  if (b === 'BOTTOM') return referenceBox.height + space.top;

  return 0;
}

function getPlacementMaxWidth(placement, space, referenceBox) {
  const [a, b] = PLACEMENTS.split('_');

  // RIGHT_TOP, RIGHT_CENTER, RIGHT_BOTTOM
  if (a === 'RIGHT') return space.right;

  // LEFT_TOP, LEFT_CENTER, LEFT_BOTTOM
  if (a === 'LEFT') return space.left;

  // TOP_LEFT, BOTTOM_LEFT
  if (b === 'LEFT') return referenceBox.width + space.right;

  // TOP_CENTER, BOTTOM_CENTER
  if (b === 'CENTER') return referenceBox.width + (Math.min(space.left, space.right) * 2);

  // TOP_RIGHT, BOTTOM_RIGHT
  if (b === 'RIGHT') return referenceBox.width + space.left;

  return 0;
}

export function getPoint(el, reference, options = {}) {
  if (!(el instanceof HTMLElement)) {
    throw new Error('First argument should be an HTML Element');
  }

  if (!(reference instanceof HTMLElement)) {
    throw new Error('Second argument should be an HTML Element');
  }

  const settings = genSettings(options);

  if (!window) {
    return {
      position: ABSOLUTE,
      top: 0,
      left: 0,
      placement: settings.placement[0],
      referenceWidth: 0,
      referenceHeight: 0,
      maxWidth: 0,
      maxHeight: 0,
    };
  }

  const position = isFixedPosition(reference) ? FIXED : ABSOLUTE;

  const elParent = getOffsetParent(el);
  const elScrollParent = getScrollParent(el);
  const referenceBox = reference.getBoundingClientRect();
  const elParentBox = elParent.getBoundingClientRect();

  let { top, left } = referenceBox;

  if (position !== FIXED) {
    top -= elParentBox.top;
    left -= elParentBox.left;

    if (
      elScrollParent !== window.document.body
      && elScrollParent !== window.document.documentElement
    ) {
      top += getScrollTop(elScrollParent);
      left += getScrollLeft(elScrollParent);
    }
  }

  const referenceScrollParent = getScrollParent(reference);
  const viewportWidth = getViewportWidth();
  const viewportHeight = getViewportHeight();

  // Get space around reference
  const space = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  if (position === FIXED || settings.boundTarget === BOUND_TARGETS.VIEWPORT) {
    space.top = referenceBox.top;
    space.left = referenceBox.left;
    space.right = viewportWidth - (space.left + referenceBox.width);
    space.bottom = viewportHeight - (space.top + referenceBox.height);
  } else {
    space.top = referenceBox.top + getScrollTop(referenceScrollParent);
    space.left = referenceBox.left + getScrollLeft(referenceScrollParent);
    space.right = referenceScrollParent.scrollWidth - (space.left + referenceBox.width);
    space.bottom = referenceScrollParent.scrollHeight - (space.top + referenceBox.height);
  }

  // Calculate max width/height for each placement
  const placements = settings.placement.map((placement) => {
    const maxWidth = getPlacementMaxWidth(placement, space, referenceBox);
    const maxHeight = getPlacementMaxHeight(placement, space, referenceBox);
    return {
      maxWidth,
      maxHeight,
      placement,
      score: 0,
    };
  });

  const popoverSize = settings.popoverSize || el.getBoundingClientRect();

  // Compare placements with each other and fins placements with the biggest score
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      comparePlacements(placements[i], placements[j], popoverSize);
    }
  }
  placements.sort((a, b) => b.score - a.score);

  const { placement, maxWidth, maxHeight } = placements[0];

  // Move placement point from reference top/left angle based on selected placement
  // TODO: refactor
  if (placement !== PLACEMENTS.TOP_LEFT && placement !== PLACEMENTS.LEFT_TOP) {
    switch (placement) {
      case PLACEMENTS.TOP_CENTER:
      case PLACEMENTS.BOTTOM_CENTER:
        left += referenceBox.width / 2;
        break;
      case PLACEMENTS.TOP_RIGHT:
      case PLACEMENTS.BOTTOM_RIGHT:
      case PLACEMENTS.RIGHT_BOTTOM:
      case PLACEMENTS.RIGHT_CENTER:
      case PLACEMENTS.RIGHT_TOP:
        left += referenceBox.width;
        break;
      default:
        break;
    }

    switch (placement) {
      case PLACEMENTS.LEFT_CENTER:
      case PLACEMENTS.RIGHT_CENTER:
        top += referenceBox.height / 2;
        break;
      case PLACEMENTS.BOTTOM_RIGHT:
      case PLACEMENTS.BOTTOM_CENTER:
      case PLACEMENTS.BOTTOM_LEFT:
      case PLACEMENTS.RIGHT_BOTTOM:
      case PLACEMENTS.LEFT_BOTTOM:
        top += referenceBox.height;
        break;
      default:
        break;
    }
  }

  return {
    position,
    placement,
    top,
    left,
    referenceWidth: referenceBox.width,
    referenceHeight: referenceBox.height,
    maxWidth,
    maxHeight,
  };
}

export default {
  PLACEMENTS,
  BOUND_TARGETS,
  getPoint,
};
