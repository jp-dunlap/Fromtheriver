describe('Accessibility regression', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('loads the home page without critical axe violations', () => {
    cy.contains('h1', /From The River|Desde el Río|من النهر/).should('be.visible');
    cy.prepareAccessibility();
    cy.checkA11y(undefined, {
      includedImpacts: ['critical', 'serious'],
    });
  });
});
