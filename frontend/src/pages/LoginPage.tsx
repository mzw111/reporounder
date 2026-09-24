import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { login, error } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true)
    try { await login({ email, password }); navigate('/dashboard') } finally { setLoading(false) }
  }

  return <form onSubmit={handleSubmit}>
    <h1>Sign in</h1>
    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" required />
    <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" required />
    {error && <p>{error}</p>}
    <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
    <p>No account? <Link to="/register">Register</Link></p>
  </form>
}