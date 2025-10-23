import React, { useState } from 'react';

interface AccordionItemProps {
  title: string;
  level?: 'xl' | '2xl';
  children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, level = 'xl', children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="accordion-item">
      <button
        type="button"
        className={`accordion-trigger font-serif text-white ${
          level === '2xl' ? 'text-2xl' : 'text-xl'
        }`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        <span>{title}</span>
        <svg className="accordion-icon w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`accordion-panel ${isOpen ? 'open' : 'hidden'}`}>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

export default AccordionItem;
