import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ApplicationPage } from '../pages/ApplicationPage'
import { jobs } from '../data/jobs'

// Mock Supabase storage — upload succeeds by default
vi.mock('../lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  },
}))

function renderApp(id = jobs[0].id) {
  return render(
    <MemoryRouter initialEntries={[`/careers/${id}/apply`]}>
      <Routes>
        <Route path="/careers/:id/apply" element={<ApplicationPage />} />
      </Routes>
    </MemoryRouter>
  )
}

// Find selects by their unique placeholder option text
function getSvSelect() {
  return screen.getByText('Select a character…').closest('select')
}
function getReferralSelect() {
  return screen.getByText('Select one…').closest('select')
}

function fillRequiredFields() {
  fireEvent.change(screen.getByPlaceholderText(/dinesh/i), { target: { value: 'Jane' } })
  fireEvent.change(screen.getByPlaceholderText(/chugtai/i), { target: { value: 'Doe' } })
  fireEvent.change(screen.getByPlaceholderText(/you@example\.com/i), { target: { value: 'jane@example.com' } })
  fireEvent.change(screen.getByPlaceholderText(/\+1/i), { target: { value: '+15550001234' } })
  fireEvent.change(screen.getByPlaceholderText(/tell us why/i), { target: { value: 'I love Proxii' } })
  fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '2026-06-01' } })
  fireEvent.change(getReferralSelect(), { target: { value: 'LinkedIn' } })

  const file = new File(['resume'], 'resume.pdf', { type: 'application/pdf' })
  fireEvent.change(document.querySelector('input[type="file"]'), { target: { files: [file] } })
}

function answerProxiiScreening({ sv = 'Dinesh', iaf = '9.7', nail = 'Yes' } = {}) {
  fireEvent.change(getSvSelect(), { target: { value: sv } })
  fireEvent.change(screen.getByPlaceholderText(/e\.g\. 8\.5/i), { target: { value: iaf } })
  fireEvent.click(screen.getByRole('button', { name: nail }))
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('ApplicationPage — rendering', () => {
  it('renders the form heading with job title', () => {
    renderApp()
    expect(screen.getByText(/apply —/i)).toBeInTheDocument()
  })

  it('renders all four form sections', () => {
    renderApp()
    expect(screen.getByText('Personal information')).toBeInTheDocument()
    expect(screen.getByText('Professional profile')).toBeInTheDocument()
    expect(screen.getByText('Availability')).toBeInTheDocument()
    expect(screen.getByText('The Proxii Screening')).toBeInTheDocument()
  })

  it('redirects for an unknown job id', () => {
    render(
      <MemoryRouter initialEntries={['/careers/bad-id/apply']}>
        <Routes>
          <Route path="/careers/:id/apply" element={<ApplicationPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.queryByText(/apply —/i)).not.toBeInTheDocument()
  })
})

// ─── Silicon Valley character ─────────────────────────────────────────────────

describe('Proxii Screening — Silicon Valley character', () => {
  it('shows no error before any selection', () => {
    renderApp()
    expect(screen.queryByText('Invalid string')).not.toBeInTheDocument()
  })

  it('shows "Invalid string" for Gilfoyle', () => {
    renderApp()
    fireEvent.change(getSvSelect(), { target: { value: 'Gilfoyle' } })
    expect(screen.getByText('Invalid string')).toBeInTheDocument()
  })

  it('shows "Invalid string" for Richard Hendricks', () => {
    renderApp()
    fireEvent.change(getSvSelect(), { target: { value: 'Richard Hendricks' } })
    expect(screen.getByText('Invalid string')).toBeInTheDocument()
  })

  it('shows "Invalid string" for Erlich Bachman', () => {
    renderApp()
    fireEvent.change(getSvSelect(), { target: { value: 'Erlich Bachman' } })
    expect(screen.getByText('Invalid string')).toBeInTheDocument()
  })

  it('clears the error when Dinesh is selected', () => {
    renderApp()
    fireEvent.change(getSvSelect(), { target: { value: 'Erlich Bachman' } })
    expect(screen.getByText('Invalid string')).toBeInTheDocument()
    fireEvent.change(getSvSelect(), { target: { value: 'Dinesh' } })
    expect(screen.queryByText('Invalid string')).not.toBeInTheDocument()
  })

  it('shows no error when Dinesh is selected from the start', () => {
    renderApp()
    fireEvent.change(getSvSelect(), { target: { value: 'Dinesh' } })
    expect(screen.queryByText('Invalid string')).not.toBeInTheDocument()
  })
})

// ─── Indian Air Force rating ──────────────────────────────────────────────────

describe('Proxii Screening — Indian Air Force rating', () => {
  it('shows no error when field is empty', () => {
    renderApp()
    expect(screen.queryByText('Invalid number')).not.toBeInTheDocument()
  })

  it('shows "Invalid number" below 9.55', () => {
    renderApp()
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 8\.5/i), { target: { value: '9.0' } })
    expect(screen.getByText('Invalid number')).toBeInTheDocument()
  })

  it('shows "Invalid number" above 9.87', () => {
    renderApp()
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 8\.5/i), { target: { value: '9.9' } })
    expect(screen.getByText('Invalid number')).toBeInTheDocument()
  })

  it('shows "Invalid number" for 0', () => {
    renderApp()
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 8\.5/i), { target: { value: '0' } })
    expect(screen.getByText('Invalid number')).toBeInTheDocument()
  })

  it('shows "Invalid number" for 10', () => {
    renderApp()
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 8\.5/i), { target: { value: '10' } })
    expect(screen.getByText('Invalid number')).toBeInTheDocument()
  })

  it('accepts the lower boundary 9.55', () => {
    renderApp()
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 8\.5/i), { target: { value: '9.55' } })
    expect(screen.queryByText('Invalid number')).not.toBeInTheDocument()
  })

  it('accepts the upper boundary 9.87', () => {
    renderApp()
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 8\.5/i), { target: { value: '9.87' } })
    expect(screen.queryByText('Invalid number')).not.toBeInTheDocument()
  })

  it('accepts a mid-range value 9.7', () => {
    renderApp()
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 8\.5/i), { target: { value: '9.7' } })
    expect(screen.queryByText('Invalid number')).not.toBeInTheDocument()
  })

  it('clears the error when corrected into range', () => {
    renderApp()
    const input = screen.getByPlaceholderText(/e\.g\. 8\.5/i)
    fireEvent.change(input, { target: { value: '5' } })
    expect(screen.getByText('Invalid number')).toBeInTheDocument()
    fireEvent.change(input, { target: { value: '9.7' } })
    expect(screen.queryByText('Invalid number')).not.toBeInTheDocument()
  })
})

// ─── NailGun ──────────────────────────────────────────────────────────────────

describe('Proxii Screening — Is the farzicle a NailGun?', () => {
  it('shows no error before any selection', () => {
    renderApp()
    expect(screen.queryByText(/reconsider/i)).not.toBeInTheDocument()
  })

  it('shows error when "No" is selected', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'No' }))
    expect(screen.getByText(/reconsider your position on the farzicle/i)).toBeInTheDocument()
  })

  it('clears the error when switching to Yes', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'No' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    expect(screen.queryByText(/reconsider/i)).not.toBeInTheDocument()
  })
})

// ─── Form submission ──────────────────────────────────────────────────────────

describe('ApplicationPage — form submission', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    global.window.scrollTo = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows required errors on empty submit', async () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: /submit application/i }))
    await waitFor(() => {
      expect(screen.getAllByText('Required').length).toBeGreaterThan(0)
    })
  })

  it('does not call fetch when Proxii questions are wrong', async () => {
    renderApp()
    fillRequiredFields()
    answerProxiiScreening({ sv: 'Gilfoyle', iaf: '5', nail: 'No' })
    fireEvent.click(screen.getByRole('button', { name: /submit application/i }))
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  it('calls /api/apply with POST on valid submission', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
    renderApp()
    fillRequiredFields()
    answerProxiiScreening()
    fireEvent.click(screen.getByRole('button', { name: /submit application/i }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/apply',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('shows success screen after valid submission', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
    renderApp()
    fillRequiredFields()
    answerProxiiScreening()
    fireEvent.click(screen.getByRole('button', { name: /submit application/i }))
    await waitFor(() => {
      expect(screen.getByText(/application submitted/i)).toBeInTheDocument()
    })
  })

  it('shows error banner when API returns non-ok response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to save application' }),
    })
    renderApp()
    fillRequiredFields()
    answerProxiiScreening()
    fireEvent.click(screen.getByRole('button', { name: /submit application/i }))
    await waitFor(() => {
      expect(screen.getByText(/failed to save application/i)).toBeInTheDocument()
    })
  })

  it('shows error banner on network failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'))
    renderApp()
    fillRequiredFields()
    answerProxiiScreening()
    fireEvent.click(screen.getByRole('button', { name: /submit application/i }))
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })
})
