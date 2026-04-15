/**
 * Keyboard accessibility utilities for WCAG 2.1 compliance
 */

/** Creates keyboard handler for button activation (Enter/Space keys) */
export function createButtonKeydownHandler(
  callback: (event: KeyboardEvent) => void
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      callback(event);
    }
  };
}

/** Opens DevExtreme context menu with keyboard/mouse support and focus management */
export function openContextMenu(
  event: MouseEvent | KeyboardEvent,
  options: {
    onMenuOpen?: (element: HTMLElement) => void;
    setupCloseHandler?: (triggerElement: HTMLElement) => void;
  } = {}
): void {
  const cellElement = (event.target as HTMLElement).closest('td');
  if (!cellElement) return;

  event.stopPropagation();
  event.preventDefault();

  let clientX: number;
  let clientY: number;

  if (event instanceof MouseEvent) {
    clientX = event.clientX;
    clientY = event.clientY;
  } else {
    const buttonRect = (event.target as HTMLElement).getBoundingClientRect();
    clientX = buttonRect.left + buttonRect.width / 2;
    clientY = buttonRect.top + buttonRect.height;
  }

  const syntheticEvent = new MouseEvent('dxcontextmenu', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX,
    clientY,
    button: 2,
  });

  cellElement.dispatchEvent(syntheticEvent);

  const targetElement = event.target as HTMLElement;
  if (targetElement) {
    targetElement.setAttribute('aria-expanded', 'true');

    if (options.onMenuOpen) {
      options.onMenuOpen(targetElement);
    }

    // Fix for Windows Narrator: ensure menu is properly focusable and ARIA attributes are set
    setTimeout(() => {
      fixDevExtremeMenuForScreenReaders();
    }, 50);

    if (options.setupCloseHandler) {
      setTimeout(() => {
        options.setupCloseHandler(targetElement);
      }, 100);
    }
  }
}

/**
 * Fixes DevExtreme context menus for screen readers like Windows Narrator
 * Ensures proper ARIA attributes and focus management so arrow keys work for submenus
 */
function fixDevExtremeMenuForScreenReaders(): void {
  const menu = document.querySelector('.dx-context-menu');
  if (!menu) return;

  // Ensure the menu has proper ARIA role
  if (!menu.hasAttribute('role')) {
    menu.setAttribute('role', 'menu');
  }

  // Find all menu items with submenus and ensure they have proper ARIA attributes
  const menuItems = menu.querySelectorAll('.dx-menu-item');
  menuItems.forEach((item) => {
    // Check if this item has a submenu indicator (popout arrow)
    const hasSubmenuIndicator = item.querySelector('.dx-menu-item-popout');
    if (hasSubmenuIndicator) {
      item.setAttribute('aria-haspopup', 'true');
      item.setAttribute('aria-expanded', 'false');
    }

    // Ensure menu items have proper role
    if (!item.hasAttribute('role')) {
      item.setAttribute('role', 'menuitem');
    }
  });

  // Watch for submenu state changes to update aria-expanded
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'class'
      ) {
        const target = mutation.target as HTMLElement;
        if (target.classList.contains('dx-menu-item')) {
          const hasSubmenuIndicator = target.querySelector(
            '.dx-menu-item-popout'
          );
          if (hasSubmenuIndicator) {
            // Check if submenu is visible
            const submenu = document.querySelector(
              `.dx-submenu[style*="visibility: visible"]`
            );
            if (submenu && target.classList.contains('dx-state-focused')) {
              target.setAttribute('aria-expanded', 'true');
            } else if (target.getAttribute('aria-haspopup') === 'true') {
              target.setAttribute('aria-expanded', 'false');
            }
          }
        }
      }
    });
  });

  // Observe the menu for class changes
  observer.observe(menu, {
    attributes: true,
    attributeFilter: ['class'],
    subtree: true,
  });

  // Focus the menu container to enable keyboard navigation
  const focusableElement =
    menu.querySelector('[tabindex="0"]') || (menu as HTMLElement);
  if (focusableElement instanceof HTMLElement) {
    focusableElement.focus();
  }

  // Clean up observer when menu closes
  setTimeout(() => {
    const checkMenuClosed = () => {
      if (
        !document.querySelector('.dx-context-menu') ||
        document
          .querySelector('.dx-context-menu')
          ?.classList.contains('dx-state-invisible')
      ) {
        observer.disconnect();
      } else {
        setTimeout(checkMenuClosed, 100);
      }
    };
    checkMenuClosed();
  }, 100);
}

/** Restores focus to trigger element when menu closes or Escape is pressed */
export function setupMenuFocusRestoration(
  triggerElement: HTMLElement
): () => void {
  let cleaned = false;

  const returnFocus = () => {
    if (triggerElement && !cleaned) {
      triggerElement.setAttribute('aria-expanded', 'false');
      triggerElement.focus();
      cleaned = true;
    }
  };

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setTimeout(() => {
        returnFocus();
        document.removeEventListener('keydown', handleEscape);
      }, 100);
    }
  };

  document.addEventListener('keydown', handleEscape);

  const checkClosed = () => {
    const menu = document.querySelector('.dx-context-menu');
    if (!menu || menu.classList.contains('dx-state-invisible')) {
      returnFocus();
      document.removeEventListener('keydown', handleEscape);
    } else if (!cleaned) {
      setTimeout(checkClosed, 100);
    }
  };
  checkClosed();

  return () => {
    cleaned = true;
    document.removeEventListener('keydown', handleEscape);
  };
}

/** Sets up keyboard handlers and focus restoration for context menu by trigger ID */
export function setupContextMenuAccessibility(triggerId: string): () => void {
  let escapeHandlerCleaned = false;

  const focusTriggerElement = () => {
    const triggerElement = document.getElementById(triggerId);
    if (triggerElement) {
      triggerElement.setAttribute('aria-expanded', 'false');
      triggerElement.focus();

      if (document.activeElement !== triggerElement) {
        const focusableChild = triggerElement.querySelector(
          '[tabindex]'
        ) as HTMLElement;
        if (focusableChild) {
          focusableChild.focus();
        }
      }
    }
  };

  const cleanupEscapeHandler = () => {
    if (!escapeHandlerCleaned) {
      document.removeEventListener('keydown', handleEscape, true);
      escapeHandlerCleaned = true;
    }
  };

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      const contextMenu = document.querySelector('.dx-context-menu');
      if (
        contextMenu &&
        !contextMenu.classList.contains('dx-state-invisible')
      ) {
        e.stopPropagation();
        requestAnimationFrame(() => {
          setTimeout(() => {
            focusTriggerElement();
            cleanupEscapeHandler();
          }, 200);
        });
      }
    }
  };

  document.addEventListener('keydown', handleEscape, true);

  const contextMenuElement = document.querySelector('.dx-context-menu');
  if (contextMenuElement) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if ((node as Element).classList?.contains('dx-context-menu')) {
            requestAnimationFrame(() => {
              setTimeout(() => {
                focusTriggerElement();
              }, 50);
            });
            cleanupEscapeHandler();
            observer.disconnect();
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  return cleanupEscapeHandler;
}
