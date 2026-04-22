import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { JobDetailPage } from '../pages/JobDetailPage'
import { CareersPage } from '../pages/CareersPage'
import { jobs } from '../data/jobs'

function renderDetail(id) {
  return render(
    <MemoryRouter initialEntries={[`/careers/${id}`]}>
      <Routes>
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/careers/:id" element={<JobDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('JobDetailPage', () => {
  const job = jobs[0]

  it('renders the job title', () => {
    renderDetail(job.id)
    expect(screen.getByRole('heading', { name: job.title })).toBeInTheDocument()
  })

  it('renders the department', () => {
    renderDetail(job.id)
    expect(screen.getAllByText(job.department).length).toBeGreaterThan(0)
  })

  it('renders location and duration chips', () => {
    renderDetail(job.id)
    expect(screen.getAllByText(job.location).length).toBeGreaterThan(0)
    expect(screen.getAllByText(job.duration).length).toBeGreaterThan(0)
  })

  it('renders the about section', () => {
    renderDetail(job.id)
    expect(screen.getByText(/about the role/i)).toBeInTheDocument()
    expect(screen.getByText(job.about)).toBeInTheDocument()
  })

  it('renders all responsibilities', () => {
    renderDetail(job.id)
    job.responsibilities.forEach(r => {
      expect(screen.getByText(r)).toBeInTheDocument()
    })
  })

  it('renders all requirements', () => {
    renderDetail(job.id)
    job.requirements.forEach(r => {
      expect(screen.getByText(r)).toBeInTheDocument()
    })
  })

  it('renders nice-to-have section', () => {
    renderDetail(job.id)
    expect(screen.getByText(/nice to have/i)).toBeInTheDocument()
  })

  it('apply button links to the application page', () => {
    renderDetail(job.id)
    const applyLink = screen.getByRole('link', { name: /apply now/i })
    expect(applyLink).toHaveAttribute('href', `/careers/${job.id}/apply`)
  })

  it('back link points to /careers', () => {
    renderDetail(job.id)
    const backLink = screen.getByRole('link', { name: /all open roles/i })
    expect(backLink).toHaveAttribute('href', '/careers')
  })

  it('sidebar shows correct metadata', () => {
    renderDetail(job.id)
    expect(screen.getAllByText(job.type).length).toBeGreaterThan(0)
  })

  it('redirects to /careers for an unknown job id', () => {
    renderDetail('does-not-exist')
    expect(screen.queryByText(/about the role/i)).not.toBeInTheDocument()
  })
})
