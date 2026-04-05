import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import * as api from '../api'
import './Leaderboard.css'

export default function Leaderboard() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.recognitions.leaderboard(30).then(setList).catch(() => setList([])).finally(() => setLoading(false))
  }, [])

  return (
    <motion.div className="leaderboard-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1>Recognition leaderboard</h1>
      <p className="leaderboard-page__sub">Top recognized employees</p>
      {loading ? (
        <div className="page-loading">Loading…</div>
      ) : list.length === 0 ? (
        <div className="empty-state">No recognitions yet. Be the first to recognize a colleague!</div>
      ) : (
        <ol className="leaderboard-list">
          {list.map((entry, i) => (
            <motion.li
              key={i}
              className="leaderboard-item card"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <span className={`leaderboard-item__rank leaderboard-item__rank--${i < 3 ? 'top' : ''}`}>
                {i + 1}
              </span>
              <div className="leaderboard-item__main">
                <strong>{entry.name}</strong>
                <span className="leaderboard-item__count">{entry.count} recognition{entry.count !== 1 ? 's' : ''}</span>
              </div>
            </motion.li>
          ))}
        </ol>
      )}
    </motion.div>
  )
}
