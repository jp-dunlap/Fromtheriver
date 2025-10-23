import React, { createContext, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { TOOLTIP_CONTENT, TooltipTerm } from '../data/tooltipContent';

type TooltipState = { term: TooltipTerm; x: number; y: number } | null;

type TooltipContextValue = {
  showTooltip: (term: TooltipTerm, position: { x: number; y: number }) => void;
  updateTooltip: (position: { x: number; y: number }) => void;
  hideTooltip: () => void;
};

const TooltipContext = createContext<TooltipContextValue | null>(null);

export const TooltipProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const value = useMemo<TooltipContextValue>(() => ({
    showTooltip: (term, position) => setTooltip({ term, ...position }),
    updateTooltip: (position) =>
      setTooltip((current) => (current ? { ...current, ...position } : current)),
    hideTooltip: () => setTooltip(null)
  }), []);

  return (
    <TooltipContext.Provider value={value}>
      {children}
      {createPortal(<TooltipOverlay tooltip={tooltip} />, document.body)}
    </TooltipContext.Provider>
  );
};

const TooltipOverlay: React.FC<{ tooltip: TooltipState }> = ({ tooltip }) => {
  if (!tooltip) {
    return <div id="tooltip-box" />;
  }

  const content = TOOLTIP_CONTENT[tooltip.term];

  return (
    <div
      id="tooltip-box"
      className="is-visible"
      style={{ left: tooltip.x + 15, top: tooltip.y + 15 }}
      role="tooltip"
    >
      <h4>{content.title}</h4>
      <p>{content.text}</p>
    </div>
  );
};

export const useTooltip = () => {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltip must be used within a TooltipProvider');
  }
  return context;
};

interface TooltipTriggerProps {
  term: TooltipTerm;
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export const TooltipTrigger: React.FC<TooltipTriggerProps> = ({
  term,
  children,
  as: Component = 'span',
  className = ''
}) => {
  const { showTooltip, updateTooltip, hideTooltip } = useTooltip();

  return (
    <Component
      className={`tooltip-trigger ${className}`.trim()}
      tabIndex={0}
      onMouseEnter={(event) =>
        showTooltip(term, { x: event.pageX, y: event.pageY })
      }
      onMouseMove={(event) => updateTooltip({ x: event.pageX, y: event.pageY })}
      onMouseLeave={hideTooltip}
      onFocus={(event) =>
        showTooltip(term, {
          x: event.currentTarget.getBoundingClientRect().left + window.scrollX,
          y: event.currentTarget.getBoundingClientRect().top + window.scrollY
        })
      }
      onBlur={hideTooltip}
    >
      {children}
    </Component>
  );
};
