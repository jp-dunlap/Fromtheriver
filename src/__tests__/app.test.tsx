import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../App';

describe('App', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders key scene headings for orientation', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/The Roots/i)).toBeInTheDocument();
      expect(screen.getByText(/The Resistance/i)).toBeInTheDocument();
      expect(screen.getByText(/The Culture/i)).toBeInTheDocument();
      expect(screen.getByText(/The Action/i)).toBeInTheDocument();
    });
  });
});
