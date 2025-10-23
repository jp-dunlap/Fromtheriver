import 'cypress-axe';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      checkAccessibility(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('checkAccessibility', () => {
  cy.injectAxe();
  cy.checkA11y(null, {
    includedImpacts: ['critical', 'serious'],
  });
});
