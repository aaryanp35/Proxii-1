import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CareersPage } from '../pages/CareersPage'
import { jobs } from '../data/jobs'

function renderCareers() {
  return render(
    <MemoryRouter initialEntries={['/careers']}>
      <CareersPage />
    </MemoryRouter>
  )
}

describe('CareersPage', () => {
  it('renders the hero heading', () => {
    renderCareers()
    expect(screen.getByText(/build the future/i)).toBeInTheDocument()
  })

  it('shows the open role count badge in hero', () => {
    renderCareers()
    expect(screen.getByText(/open role/i)).toBeInTheDocument()
  })

  it('renders all jobs by default', () => {
    renderCareers()
    jobs.forEach(job => {
      expect(screen.getByText(job.title)).toBeInTheDocument()
    })
  })

  it('shows positions found count in listing header', () => {
    renderCareers()
    expect(screen.getByText(/positions? found/i)).toBeInTheDocument()
  })

  it('filters to zero results when search has no match', () => {
    renderCareers()
    fireEvent.change(screen.getByPlaceholderText(/search roles/i), {
      target: { value: 'zzznomatch' },
    })
    expect(screen.getByText(/no roles match/i)).toBeInTheDocument()
  })

  it('restores results when search is cleared', () => {
    renderCareers()
    const input = screen.getByPlaceholderText(/search roles/i)
    fireEvent.change(input, { target: { value: 'zzznomatch' } })
    expect(screen.getByText(/no roles match/i)).toBeInTheDocument()
    fireEvent.change(input, { target: { value: '' } })
    jobs.forEach(job => expect(screen.getByText(job.title)).toBeInTheDocument())
  })

  it('filters by job title search (partial match)', () => {
    renderCareers()
    fireEvent.change(screen.getByPlaceholderText(/search roles/i), {
      target: { value: 'Software' },
    })
    expect(screen.queryByText(/no roles match/i)).not.toBeInTheDocument()
    expect(screen.getByText(jobs[0].title)).toBeInTheDocument()
  })

  it('shows clear filters button only when a filter is active', () => {
    renderCareers()
    expect(screen.queryByText(/clear filters/i)).not.toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText(/search roles/i), {
      target: { value: 'anything' },
    })
    expect(screen.getByText(/clear filters/i)).toBeInTheDocument()
  })

  it('clears all filters when clear button is clicked', () => {
    renderCareers()
    fireEvent.change(screen.getByPlaceholderText(/search roles/i), {
      target: { value: 'zzznomatch' },
    })
    fireEvent.click(screen.getByText(/clear filters/i))
    expect(screen.queryByText(/no roles match/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/clear filters/i)).not.toBeInTheDocument()
  })

  it('renders job cards with location and duration metadata', () => {
    renderCareers()
    expect(screen.getAllByText(jobs[0].location).length).toBeGreaterThan(0)
    expect(screen.getAllByText(jobs[0].duration).length).toBeGreaterThan(0)
  })

  it('each job card links to the correct detail page', () => {
    renderCareers()
    const link = screen.getByRole('link', { name: /view role/i })
    expect(link).toHaveAttribute('href', `/careers/${jobs[0].id}`)
  })

  it('nav contains a link to the dashboard', () => {
    renderCareers()
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
  })

  it('100% remote stat is shown in the hero', () => {
    renderCareers()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getAllByText(/remote/i).length).toBeGreaterThan(0)
  })
})
