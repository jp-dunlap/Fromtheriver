/// <reference types="cypress" />

describe('From The River accessibility', () => {
  beforeEach(() => {
    cy.visit('/?lng=en');
  });

  it('meets baseline accessibility requirements', () => {
    cy.checkAccessibility();
  });

  it('supports skip link navigation to main content', () => {
    cy.get('.skip-link').focus().type('{enter}');
    cy.focused().should('have.attr', 'id', 'main-content');
  });

  it('keeps toolkit modal accessible', () => {
    cy.get('[data-cy="open-toolkit-modal"]').click();
    cy.get('div[role="dialog"]').should('be.visible');
    cy.get('button[aria-label="Close modal"]').should('have.focus');
    cy.checkAccessibility();
    cy.get('button[aria-label="Close modal"]').click();
  });
});
