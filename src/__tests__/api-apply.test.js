import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase before importing the handler
const mockInsert = vi.fn()
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({ insert: mockInsert }),
  }),
}))

const { default: handler } = await import('../../api/apply.js')

function makeReq(body = {}, method = 'POST') {
  return { method, body }
}

function makeRes() {
  const res = {
    _status: 200,
    _body: null,
    status(code) { this._status = code; return this },
    json(body) { this._body = body; return this },
  }
  return res
}

const validBody = {
  jobId: 'swe-intern-2026',
  jobTitle: 'Software Development Intern',
  firstName: 'Dinesh',
  lastName: 'Chugtai',
  email: 'dinesh@piedpiper.com',
  phone: '+15550001234',
  whyProxii: 'I want to work here.',
  availability: '2026-06-01',
  referral: 'LinkedIn',
  svCharacter: 'Dinesh',
  iafRating: '9.7',
  nailgun: 'Yes',
}

describe('POST /api/apply', () => {
  beforeEach(() => {
    mockInsert.mockReset()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  })

  it('returns 405 for non-POST requests', async () => {
    const res = makeRes()
    await handler(makeReq({}, 'GET'), res)
    expect(res._status).toBe(405)
    expect(res._body.error).toMatch(/method not allowed/i)
  })

  it('returns 400 when required fields are missing', async () => {
    const res = makeRes()
    await handler(makeReq({ firstName: 'Only' }), res)
    expect(res._status).toBe(400)
    expect(res._body.error).toMatch(/missing required fields/i)
  })

  it('returns 400 when email is missing', async () => {
    const res = makeRes()
    const { email, ...body } = validBody
    await handler(makeReq(body), res)
    expect(res._status).toBe(400)
  })

  it('returns 400 when phone is missing', async () => {
    const res = makeRes()
    const { phone, ...body } = validBody
    await handler(makeReq(body), res)
    expect(res._status).toBe(400)
  })

  it('calls supabase insert with correct shape on valid request', async () => {
    mockInsert.mockResolvedValueOnce({ error: null })
    const res = makeRes()
    await handler(makeReq(validBody), res)

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'Dinesh',
        last_name: 'Chugtai',
        email: 'dinesh@piedpiper.com',
        job_id: 'swe-intern-2026',
        iaf_rating: 9.7,
      })
    )
  })

  it('returns 200 success on valid request', async () => {
    mockInsert.mockResolvedValueOnce({ error: null })
    const res = makeRes()
    await handler(makeReq(validBody), res)
    expect(res._status).toBe(200)
    expect(res._body.success).toBe(true)
  })

  it('returns 500 when supabase insert fails', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'db error' } })
    const res = makeRes()
    await handler(makeReq(validBody), res)
    expect(res._status).toBe(500)
    expect(res._body.error).toMatch(/failed to save/i)
  })

  it('stores null for optional fields when omitted', async () => {
    mockInsert.mockResolvedValueOnce({ error: null })
    const res = makeRes()
    await handler(makeReq(validBody), res)

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedin: null,
        portfolio: null,
        resume_name: null,
        resume_path: null,
        cover_letter: null,
      })
    )
  })

  it('parses iafRating as a float', async () => {
    mockInsert.mockResolvedValueOnce({ error: null })
    const res = makeRes()
    await handler(makeReq({ ...validBody, iafRating: '9.75' }), res)

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ iaf_rating: 9.75 })
    )
  })
})
