import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import * as api from '../api'
import './NotificationsDropdown.css'
import { useAuth } from '../context/AuthContext'
import { io as ioClient } from 'socket.io-client'

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  function load() {
    api.notifications.unreadCount().then((r) => setUnread(r.count)).catch(() => {})
    if (open) {
      setLoading(true)
      api.notifications.list(15).then(setList).catch(() => setList([])).finally(() => setLoading(false))
    }
  }

  useEffect(() => load(), [open])

  useEffect(() => {
    // Connect to server socket to receive realtime notifications
    if (!user) return undefined
    const host = (window?.location?.hostname) || 'localhost'
    const port = import.meta.env.VITE_API_PORT || 5000
    const url = `${window.location.protocol}//${host}:${port}`
    const socket = ioClient(url, { transports: ['websocket'] })

    socket.on('connect', () => console.debug('[Socket] connected', socket.id))
    socket.on('connect_error', (err) => console.warn('[Socket] connect_error', err))

    // Identify this socket with the current user id so server can join per-user room
    const myId = user.id || user._id
    if (myId) {
      socket.emit('identify', myId)
      console.debug('[Socket] identify sent for user', myId)
    }

    const handler = (data) => {
      try {
        const currentId = user.id || user._id
        if (!data || !data.to) return
        if (String(data.to) !== String(currentId)) return
        const payload = data.payload || data
        setList((l) => [payload, ...l])
        setUnread((u) => u + 1)
      } catch (e) {
        console.warn('Error handling notification socket event', e)
      }
    }

    socket.on('notification', handler)

    return () => {
      socket.off('notification', handler)
      socket.disconnect()
    }
  }, [user])

  async function markRead(id) {
    try {
      await api.notifications.markRead(id)
      setList((l) => l.map((n) => (n._id === id ? { ...n, read: true } : n)))
      setUnread((c) => Math.max(0, c - 1))
    } catch {}
  }

  async function markAllRead() {
    try {
      await api.notifications.markAllRead()
      setList((l) => l.map((n) => ({ ...n, read: true })))
      setUnread(0)
    } catch {}
  }

  return (
    <div className="notif-dropdown">
      <button
        type="button"
        className="notif-dropdown__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <span className="notif-dropdown__icon">🔔</span>
        {unread > 0 && <span className="notif-dropdown__badge">{unread > 99 ? '99+' : unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="notif-dropdown__backdrop" onClick={() => setOpen(false)} />
            <motion.div
              className="notif-dropdown__panel"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <div className="notif-dropdown__head">
                <span>Notifications</span>
                {unread > 0 && (
                  <button type="button" className="notif-dropdown__mark-all" onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
              </div>
              {loading ? (
                <div className="notif-dropdown__loading">Loading…</div>
              ) : list.length === 0 ? (
                <div className="notif-dropdown__empty">No notifications</div>
              ) : (
                <ul className="notif-dropdown__list">
                  {list.map((n) => (
                    <li
                      key={n._id}
                      className={`notif-dropdown__item ${n.read ? '' : 'notif-dropdown__item--unread'}`}
                    >
                      <Link
                        to={n.link || '#'}
                        className="notif-dropdown__item-link"
                        onClick={() => { markRead(n._id); setOpen(false); }}
                      >
                        <strong>{n.title}</strong>
                        {n.body && <span>{n.body}</span>}
                        <em>{new Date(n.createdAt).toLocaleString()}</em>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
