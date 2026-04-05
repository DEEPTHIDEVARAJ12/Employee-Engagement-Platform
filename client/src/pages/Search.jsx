import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as api from '../api'
import './Search.css'

export default function Search() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const q = searchParams.get('q') || ''
  const [query, setQuery] = useState(q)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setQuery(q)
    if (q.trim()) {
      setLoading(true)
      api.search.run(q).then(setResults).catch(() => setResults({ surveys: [], announcements: [], users: [] })).finally(() => setLoading(false))
    } else {
      setResults(null)
    }
  }, [q])

  return (
    <motion.div className="search-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1>Search</h1>
      <form
        className="search-page__form"
        onSubmit={(e) => {
          e.preventDefault()
          if (query.trim()) navigate(`/dashboard/search?q=${encodeURIComponent(query.trim())}`)
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search surveys, announcements, people…"
          className="search-page__input"
        />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>
      {loading && <p className="search-page__loading">Searching…</p>}
      {results && !loading && (
        <div className="search-page__results">
          {results.surveys?.length > 0 && (
            <section className="search-page__section">
              <h2>Surveys</h2>
              <ul>
                {results.surveys.map((s) => (
                  <li key={s._id}><Link to={`/dashboard/surveys/${s._id}/edit`}>{s.title}</Link> <span className="search-page__meta">{s.status}</span></li>
                ))}
              </ul>
            </section>
          )}
          {results.announcements?.length > 0 && (
            <section className="search-page__section">
              <h2>Announcements</h2>
              <ul>
                {results.announcements.map((a) => (
                  <li key={a._id}><Link to={`/dashboard/announcements/${a._id}`}>{a.title}</Link></li>
                ))}
              </ul>
            </section>
          )}
          {results.users?.length > 0 && (
            <section className="search-page__section">
              <h2>People</h2>
              <ul>
                {results.users.map((u) => (
                  <li key={u._id}>{u.name} <span className="search-page__meta">{u.email}</span></li>
                ))}
              </ul>
            </section>
          )}
          {(!results.surveys?.length && !results.announcements?.length && !results.users?.length) && (
            <p className="search-page__empty">No results found.</p>
          )}
        </div>
      )}
    </motion.div>
  )
}
