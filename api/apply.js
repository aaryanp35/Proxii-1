import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    jobId, jobTitle,
    firstName, lastName, email, phone,
    linkedin, portfolio, resumeName, resumePath,
    whyProxii, coverLetter,
    availability, referral,
    svCharacter, iafRating, nailgun,
  } = req.body

  if (!firstName || !lastName || !email || !phone || !whyProxii || !availability || !referral || !svCharacter || !iafRating || !nailgun) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const { error } = await supabase.from('applications').insert({
    job_id: jobId,
    job_title: jobTitle,
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    linkedin: linkedin || null,
    portfolio: portfolio || null,
    resume_name: resumeName || null,
    resume_path: resumePath || null,
    why_proxii: whyProxii,
    cover_letter: coverLetter || null,
    availability,
    referral,
    sv_character: svCharacter,
    iaf_rating: parseFloat(iafRating),
    nailgun,
  })

  if (error) {
    console.error('Supabase insert error:', error)
    return res.status(500).json({ error: 'Failed to save application' })
  }

  return res.status(200).json({ success: true })
}
