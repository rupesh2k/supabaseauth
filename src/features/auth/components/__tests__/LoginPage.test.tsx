// features/auth/components/__tests__/LoginPage.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { LoginPage } from '../LoginPage';
import { MockAuthAdapter } from '../../adapters/__tests__/MockAuthAdapter';

describe('LoginPage', () => {
  it('should login successfully with valid credentials', async () => {
    const mockAdapter = new MockAuthAdapter();

    render(
      <MemoryRouter>
        <AuthProvider adapter={mockAdapter}>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(passwordInput, {
      target: { value: 'password123' },
    });

    fireEvent.click(loginButton);

    // Wait for login to complete and verify token is set
    await waitFor(async () => {
      const token = await mockAdapter.getAccessToken();
      expect(token).toBe('mock-access-token');
    });
  });

  it('should display error on failed login', async () => {
    const mockAdapter = new MockAuthAdapter();
    mockAdapter.shouldFailLogin = true;

    render(
      <MemoryRouter>
        <AuthProvider adapter={mockAdapter}>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(passwordInput, {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(loginButton);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/mock login failed/i)).toBeInTheDocument();
    });
  });
});
