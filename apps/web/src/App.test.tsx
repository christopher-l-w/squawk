import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './auth/AuthProvider'
import App from './App'

describe('App', () => {
  it('sends request and shows response when fetch succeeds', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(async () => {
      return new Response('{"ok":true}', {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>,
    )

    await user.clear(screen.getByPlaceholderText(/api\.example\.com/))
    await user.type(
      screen.getByPlaceholderText(/api\.example\.com/),
      'https://api.example.com/v1',
    )
    await user.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      expect(screen.getByText('200')).toBeInTheDocument()
    })
    expect(screen.getByText(/"ok":\s*true/)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalled()

    vi.unstubAllGlobals()
  })
})
