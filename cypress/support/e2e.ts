import 'cypress-axe';

Cypress.Commands.add('prepareAccessibility', () => {
  cy.injectAxe();
});

declare global {
  namespace Cypress {
    interface Chainable {
      prepareAccessibility(): Chainable<void>;
    }
  }
}

export {};
