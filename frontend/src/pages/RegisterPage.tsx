import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RegisterPage() {
  const { register, error } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true)
    try { await register({ email, password, display_name: displayName }); navigate('/dashboard') } finally { setLoading(false) }
  }

  return <form onSubmit={handleSubmit}>
    <h1>Create account</h1>
    <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display name" required />
    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" required />
    <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password (min 8 chars, 1 number)" minLength={8} required />
    {error && <p>{error}</p>}
    <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
    <p>Have an account? <Link to="/login">Sign in</Link></p>
  </form>
}