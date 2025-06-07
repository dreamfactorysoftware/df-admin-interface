'use client';

import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Portal Component Props Interface
 */
export interface PortalProps {
  /** 
   * Content to render in the portal
   */
  children: React.ReactNode;
  
  /**
   * Target container element or selector
   * @default 'body'
   */
  container?: Element | string;
  
  /**
   * Whether the portal should be enabled
   * @default true
   */
  enabled?: boolean;
  
  /**
   * CSS class name to apply to the portal container
   */
  className?: string;
  
  /**
   * Inline styles to apply to the portal container
   */
  style?: React.CSSProperties;
  
  /**
   * Key for the portal (useful for React reconciliation)
   */
  key?: string;
}

/**
 * Portal Component
 * 
 * A React portal component that renders children into a DOM node outside 
 * of the parent component's DOM hierarchy. This is essential for proper
 * modal overlay rendering with correct z-index management, particularly
 * for global loading overlays, modals, tooltips, and dropdowns.
 * 
 * Built on React's createPortal API, this component provides a safe,
 * SSR-compatible way to render content outside the normal component tree
 * while maintaining React's event handling and component lifecycle.
 * 
 * Features:
 * - Server-side rendering (SSR) compatibility with Next.js
 * - Automatic portal container management
 * - CSS class and style support for portal containers
 * - Conditional rendering with enabled prop
 * - Custom container targeting via selector or element
 * - Proper cleanup and lifecycle management
 * 
 * @example
 * // Basic usage
 * <Portal>
 *   <div className="modal-overlay">
 *     <div className="modal-content">Modal content</div>
 *   </div>
 * </Portal>
 * 
 * @example
 * // Custom container with styling
 * <Portal 
 *   container="#modal-root" 
 *   className="portal-container"
 *   style={{ zIndex: 9999 }}
 * >
 *   <GlobalLoader />
 * </Portal>
 * 
 * @example
 * // Conditional portal
 * <Portal enabled={showModal}>
 *   <ModalContent />
 * </Portal>
 */
export function Portal({
  children,
  container = 'body',
  enabled = true,
  className,
  style,
  key,
}: PortalProps) {
  const [mounted, setMounted] = React.useState(false);
  const [portalContainer, setPortalContainer] = React.useState<Element | null>(null);

  React.useEffect(() => {
    // Ensure we're in the browser environment
    if (typeof window === 'undefined') return;

    let targetContainer: Element | null = null;

    // Resolve container reference
    if (typeof container === 'string') {
      if (container === 'body') {
        targetContainer = document.body;
      } else {
        targetContainer = document.querySelector(container);
      }
    } else {
      targetContainer = container;
    }

    // Create container if it doesn't exist and we have a selector
    if (!targetContainer && typeof container === 'string' && container !== 'body') {
      console.warn(`Portal container "${container}" not found. Using document.body as fallback.`);
      targetContainer = document.body;
    }

    // Ensure we have a valid container
    if (!targetContainer) {
      console.warn('Portal: Invalid container provided. Using document.body as fallback.');
      targetContainer = document.body;
    }

    setPortalContainer(targetContainer);
    setMounted(true);

    // Cleanup function
    return () => {
      setMounted(false);
      setPortalContainer(null);
    };
  }, [container]);

  // Don't render anything during SSR or if disabled
  if (!mounted || !enabled || !portalContainer) {
    return null;
  }

  // Create portal content with optional wrapper
  const portalContent = React.useMemo(() => {
    if (className || style) {
      return (
        <div className={className} style={style}>
          {children}
        </div>
      );
    }
    return children;
  }, [children, className, style]);

  // Create the portal
  return createPortal(portalContent, portalContainer, key);
}

/**
 * PortalProvider Component
 * 
 * A provider component that ensures a portal root element exists in the DOM.
 * This is useful for applications that want to guarantee a specific container
 * for all portals, especially in Next.js applications.
 * 
 * @example
 * // In your root layout or _app.tsx
 * <PortalProvider>
 *   <App />
 * </PortalProvider>
 */
export interface PortalProviderProps {
  children: React.ReactNode;
  /** ID for the portal root element */
  portalId?: string;
}

export function PortalProvider({ 
  children, 
  portalId = 'portal-root' 
}: PortalProviderProps) {
  React.useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Check if portal root already exists
    let portalRoot = document.getElementById(portalId);
    
    if (!portalRoot) {
      // Create portal root element
      portalRoot = document.createElement('div');
      portalRoot.id = portalId;
      portalRoot.setAttribute('data-portal-root', 'true');
      
      // Add to document body
      document.body.appendChild(portalRoot);
    }

    // Cleanup function (though this rarely runs)
    return () => {
      const existingPortalRoot = document.getElementById(portalId);
      if (existingPortalRoot && existingPortalRoot.getAttribute('data-portal-root') === 'true') {
        // Only remove if we created it and it's empty
        if (existingPortalRoot.children.length === 0) {
          document.body.removeChild(existingPortalRoot);
        }
      }
    };
  }, [portalId]);

  return <>{children}</>;
}

/**
 * Hook for creating a portal with automatic container management
 * 
 * @param containerId - ID of the container element
 * @returns Portal container element and mounted state
 */
export function usePortal(containerId = 'portal-root') {
  const [mounted, setMounted] = React.useState(false);
  const [container, setContainer] = React.useState<Element | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    let portalContainer = document.getElementById(containerId);
    
    if (!portalContainer) {
      portalContainer = document.createElement('div');
      portalContainer.id = containerId;
      portalContainer.setAttribute('data-portal', 'true');
      document.body.appendChild(portalContainer);
    }

    setContainer(portalContainer);
    setMounted(true);

    return () => {
      setMounted(false);
      // Don't remove container here as other portals might be using it
    };
  }, [containerId]);

  return { container, mounted };
}

/**
 * Higher-order component for creating portal-based components
 */
export function withPortal<P extends object>(
  Component: React.ComponentType<P>,
  portalProps?: Partial<PortalProps>
) {
  const PortalWrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <Portal {...portalProps}>
      <Component {...props} ref={ref} />
    </Portal>
  ));

  PortalWrappedComponent.displayName = `withPortal(${Component.displayName || Component.name})`;

  return PortalWrappedComponent;
}

// Export types for external usage
export type { PortalProps, PortalProviderProps };

// Default export for convenience
export default Portal;