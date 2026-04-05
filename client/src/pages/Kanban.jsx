import { useEffect, useState } from 'react'
import { kanban as kanbanApi, employees as employeesApi, users as usersApi } from '../api'
import { useAuth } from '../context/AuthContext'
import './Kanban.css'

// Simple Error Boundary to catch render-time errors and show a helpful UI
import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('Kanban render error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="kanban-page">
          <div className="card">
            <h3>Something went wrong</h3>
            <p>The Kanban page encountered an error. Please reload the page.</p>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#c0392b' }}>{String(this.state.error?.message || this.state.error)}</pre>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload</button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// Export wrapped with ErrorBoundary to avoid blank screens on render errors
export default function Kanban() {
  return (
    <ErrorBoundary>
      <KanbanInner />
    </ErrorBoundary>
  )
}

// Helper: resolve workflow column ids (To Do, In Progress, Review, Completed) for a board
function getWorkflowIds(boardParam) {
  const cols = boardParam?.columns || []
  const normalize = (title) => String(title || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const byKey = (key) => {
    const k = normalize(key)
    const col = cols.find((c) => {
      const v = normalize(c.title)
      return v === k || v.includes(k)
    })
    return col ? (col.id || col._id) : null
  }
  return {
    todoId: byKey('todo'),
    inProgressId: byKey('inprogress'),
    reviewId: byKey('review'),
    completedId: byKey('completed'),
  }
}

// CreateTaskModal Component
function CreateTaskModal({ columnId, board, onClose, onCreate, isHR, isAdmin }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [deadline, setDeadline] = useState('')
  const [assignees, setAssignees] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const boardId = board?._id || board?.id

  useEffect(() => {
    if (!isHR && !isAdmin) {
      setError('Only HR or Admin can assign tasks.')
      return
    }
    employeesApi
      .active()
      .then((emps) => setEmployees(Array.isArray(emps) ? emps : []))
      .catch(async (err) => {
        // Fallback for older deployments where /api/employees/active may be unavailable
        // or role checks differ.
        try {
          const allUsers = await usersApi.list()
          const filtered = (Array.isArray(allUsers) ? allUsers : []).filter((u) => {
            const role = String(u.role || '').toLowerCase()
            const status = String(u.status || '').toLowerCase()
            const active = u.isActive !== false
            return role === 'employee' && (status === 'active' || (!u.status && active))
          })
          setEmployees(filtered)
          setError('')
        } catch (fallbackErr) {
          setError(
            fallbackErr.message ||
            err.message ||
            'Failed to load enrolled employees'
          )
        }
      })
  }, [isHR, isAdmin])

  const handleAssigneeToggle = (employeeId) => {
    setAssignees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Task title is required.')
      return
    }

    if (assignees.length === 0) {
      setError('Please assign the task to at least one employee.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const newTask = {
        title: title.trim(),
        description: description.trim(),
        priority,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        columnId,
        boardId,
        assignees,
        tags: [],
      }

      const created = await kanbanApi.createCard(boardId, newTask)
      onCreate(created)
      onClose()
    } catch (err) {
      console.error('Error creating task:', err)
      setError(err.message || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Task</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message" style={{ color: '#e74c3c', marginBottom: '12px' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Task Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} disabled={loading}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div className="form-group">
            <label>Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Assign To Employees * 
              <span style={{ fontSize: '0.85em', color: '#7f8c8d' }}>
                {` (Selected: ${assignees.length})`}
              </span>
            </label>
            <div style={{ 
              border: '1px solid #bdc3c7', 
              borderRadius: '4px', 
              maxHeight: '200px', 
              overflowY: 'auto',
              padding: '8px'
            }}>
              {employees.length === 0 ? (
                <p style={{ color: '#7f8c8d', margin: 0, padding: '8px' }}>No employees available</p>
              ) : (
                employees.map((emp) => (
                  <label
                    key={emp._id || emp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '6px 0',
                      cursor: 'pointer',
                      fontSize: '0.95em',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={assignees.includes(emp._id || emp.id)}
                      onChange={() => handleAssigneeToggle(emp._id || emp.id)}
                      disabled={loading}
                      style={{ marginRight: '8px', cursor: 'pointer' }}
                    />
                    {emp.name}{emp.department ? ` - ${emp.department}` : ''}
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={loading || assignees.length === 0 || !title.trim()}
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  )
}

// TaskModal Component
function TaskModal({ card, board, onClose, onUpdate, onAddComment, onAddAttachment, user, isHR, isAdmin, onMove }) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description)
  const [priority, setPriority] = useState(card.priority)
  const [dueDate, setDueDate] = useState(card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '')
  const [columnId, setColumnId] = useState(card.columnId)
  const [comments, setComments] = useState(card.comments || [])
  const [newComment, setNewComment] = useState('')
  const [attachments, setAttachments] = useState(card.attachments || [])
  const [attachmentName, setAttachmentName] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [submittingAttachment, setSubmittingAttachment] = useState(false)
  const [assignees, setAssignees] = useState(card.assignees || [])
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    if (isHR || isAdmin) {
      employeesApi.active().then(setEmployees).catch(() => setEmployees([]))
    }
  }, [isHR, isAdmin])

  useEffect(() => {
    setTitle(card.title)
    setDescription(card.description)
    setPriority(card.priority)
    setDueDate(card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '')
    setColumnId(card.columnId)
    setComments(card.comments || [])
    setAttachments(card.attachments || [])
    setAssignees(card.assignees || [])
  }, [card])

  const userId = user?.id || user?._id
  const boardId = board?._id || board?.id
  
  const normalizeCol = (title) => String(title || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const handleAddComment = async () => {
    if (!newComment.trim()) return
    setSubmittingComment(true)
    try {
      const created = await onAddComment(card.id, newComment.trim())
      if (created) setComments((prev) => [...prev, created])
    } catch (err) {
      console.error('Error adding comment:', err)
      alert(err.message || 'Failed to add comment')
    } finally {
      setSubmittingComment(false)
    }
    setNewComment('')
  }

  const handleAddAttachment = async () => {
    if (!attachmentName.trim() || !attachmentUrl.trim()) return
    setSubmittingAttachment(true)
    try {
      const created = await onAddAttachment(card.id, attachmentName.trim(), attachmentUrl.trim())
      if (created) setAttachments((prev) => [...prev, created])
      setAttachmentName('')
      setAttachmentUrl('')
    } catch (err) {
      console.error('Error adding attachment:', err)
      alert(err.message || 'Failed to add attachment')
    } finally {
      setSubmittingAttachment(false)
    }
  }

  const handleSave = () => {
    const updates = {
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      columnId,
      assignees: isHR || isAdmin ? assignees : card.assignees,
    }
    onUpdate({ ...card, ...updates })
  }

  const canEditFields = isHR || isAdmin
  const canCommentAttach = canEditFields || assignees.includes(userId)

  const handleSubmitForReview = async () => {
    try {
      // Find Review column
      const reviewCol = (board.columns || []).find(c => /review/i.test(String(c.title || '')))
      if (!reviewCol) {
        alert('Review column not found on this board')
        return
      }
      const colId = reviewCol.id || reviewCol._id
      const moved = await kanbanApi.moveCard(boardId, card.id, { columnId: colId })
      // Notify parent to update local state
      if (onMove) onMove(moved)
      onClose()
    } catch (err) {
      console.error('Error submitting for review:', err)
      alert(err.message || 'Failed to submit for review')
    }
  }

  const handleHRDecision = async (decision) => {
    try {
      const columns = board.columns || []
      const reviewCol = columns.find((c) => /review/i.test(String(c.title || '')))
      const inProgressCol = columns.find((c) => /inprogress/i.test(String(c.title || '').replace(/\s+/g, '')))
      const completedCol = columns.find((c) => /completed/i.test(String(c.title || '')))
      const target =
        decision === 'approve' ? (completedCol?.id || completedCol?._id) : (inProgressCol?.id || inProgressCol?._id)
      const current = reviewCol?.id || reviewCol?._id
      if (!target || !current || columnId !== current) {
        alert('HR can approve/reject only tasks in Review.')
        return
      }
      const moved = await kanbanApi.moveCard(boardId, card.id, { columnId: target })
      if (onMove) onMove(moved)
      onClose()
    } catch (err) {
      console.error('Error applying HR decision:', err)
      alert(err.message || 'Failed to update review decision')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Task Details</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEditFields}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEditFields}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} disabled={!canEditFields}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>

          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={!canEditFields}
            />
          </div>

          {isAdmin && (
            <div className="form-group">
              <label>Status (Admin Override)</label>
              <select value={columnId} onChange={(e) => setColumnId(e.target.value)}>
                {board.columns.map((col) => {
                  const colId = col.id || col._id
                  return <option key={colId} value={colId}>{col.title}</option>
                })}
              </select>
            </div>
          )}

          {(isHR || isAdmin) && (
            <div className="form-group">
              <label>Assign To</label>
              <select
                multiple
                value={assignees}
                onChange={(e) => setAssignees(Array.from(e.target.selectedOptions, option => option.value))}
              >
                {employees.map(emp => (
                  <option key={emp._id || emp.id} value={emp._id || emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="comments-section">
            <h4>Comments ({comments.length})</h4>
            <div className="comments-list">
              {comments.map(comment => (
                <div key={comment.id} className="comment">
                  <strong>{comment.userName}</strong>
                  <p>{comment.text}</p>
                  <small>{new Date(comment.createdAt).toLocaleString()}</small>
                </div>
              ))}
            </div>
            {canCommentAttach && (
              <div className="comment-form">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                />
                <button onClick={handleAddComment} className="btn btn-sm btn-primary" disabled={submittingComment}>
                  {submittingComment ? 'Adding...' : 'Add Comment'}
                </button>
              </div>
            )}
          </div>

          <div className="comments-section">
            <h4>Attachments ({attachments.length})</h4>
            <div className="comments-list">
              {attachments.map((a) => (
                <div key={a.id} className="comment">
                  <strong>{a.fileName}</strong>
                  <p>
                    <a href={a.fileUrl} target="_blank" rel="noreferrer">Open file</a>
                  </p>
                </div>
              ))}
            </div>
            {canCommentAttach && (
              <div className="comment-form">
                <input
                  type="text"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  placeholder="File name"
                />
                <input
                  type="url"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://..."
                />
                <button onClick={handleAddAttachment} className="btn btn-sm btn-primary" disabled={submittingAttachment}>
                  {submittingAttachment ? 'Adding...' : 'Add Attachment'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {/* Employee: show Submit for Review if assigned and not already in Review */}
          {!isHR && !isAdmin && assignees.includes(userId) && (() => {
            const reviewCol = (board.columns || []).find(c => /review/i.test(String(c.title || '')))
            const reviewId = reviewCol ? (reviewCol.id || reviewCol._id) : null
            if (reviewId && (columnId !== reviewId)) {
              return (
                <button className="btn btn-warning" onClick={handleSubmitForReview} style={{ marginRight: 8 }}>
                  Submit for Review
                </button>
              )
            }
            return null
          })()}
          {isHR && !isAdmin && (() => {
            const reviewCol = (board.columns || []).find((c) => /review/i.test(String(c.title || '')))
            const reviewId = reviewCol ? (reviewCol.id || reviewCol._id) : null
            if (reviewId && columnId === reviewId) {
              return (
                <>
                  <button className="btn btn-secondary" onClick={() => handleHRDecision('reject')}>
                    Reject
                  </button>
                  <button className="btn btn-primary" onClick={() => handleHRDecision('approve')}>
                    Approve
                  </button>
                </>
              )
            }
            return null
          })()}
          {canEditFields && <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>}
        </div>
      </div>
    </div>
  )
}

// Card Component
function Card({ card, onDragStart, onEdit, onDelete, isHR, isAdmin, canDrag }) {
  const getPriorityColor = (priority) => {
    const colors = { Low: '#2ecc71', Medium: '#f39c12', High: '#e74c3c', Urgent: '#c0392b' }
    return colors[priority] || '#3498db'
  }

  return (
    <div
      className="kanban-card"
      draggable={!!canDrag}
      onDragStart={(e) => onDragStart(e, card.id)}
      style={{ borderLeft: `4px solid ${getPriorityColor(card.priority)}` }}
    >
      <div className="kanban-card-top">
        <h5>{card.title}</h5>
        <div className="kanban-card-actions">
          <button className="icon-btn" onClick={() => onEdit(card)} title="Edit">✏️</button>
          {(isHR || isAdmin) && (
            <button className="icon-btn delete" onClick={() => onDelete(card.id)} title="Delete">🗑️</button>
          )}
        </div>
      </div>

      <div className="kanban-card-meta">
        <span className="priority-badge" style={{ backgroundColor: getPriorityColor(card.priority) }}>
          {card.priority}
        </span>
        {card.dueDate && (
          <span className="due-date">
            📅 {new Date(card.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {card.description && (
        <p className="kanban-card-desc">{card.description.substring(0, 100)}</p>
      )}

      {card.assignees && card.assignees.length > 0 && (
        <div className="kanban-card-assignees">
          👥 {(card.assigneeNames && card.assigneeNames.length > 0)
            ? card.assigneeNames.join(', ')
            : `${card.assignees.length} assigned`}
        </div>
      )}

      {card.comments && card.comments.length > 0 && (
        <div className="kanban-card-comments">
          💬 {card.comments.length}
        </div>
      )}
    </div>
  )
}

function KanbanInner() {
  const [board, setBoard] = useState(null)
  const [boardsList, setBoardsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState({})
  const [selectedCard, setSelectedCard] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createTaskColumnId, setCreateTaskColumnId] = useState(null)
  const { user, isAdmin, isHR, isEmployee } = useAuth()
  const [draggedCard, setDraggedCard] = useState(null)
  const [report, setReport] = useState(null)

  const userId = user?.id || user?._id
  const boardId = board?._id || board?.id

  useEffect(() => {
    let mounted = true
    
    async function loadBoard() {
      try {
        // Load board with columns
        const b = await kanbanApi.getBoard()
        if (!mounted) return
        
        // Normalize board structure: ensure columns have 'id' property and cards object
        const normalizedBoard = {
          ...b,
          columns: (b.columns || []).map(col => ({
            ...col,
            id: col._id || col.id, // Ensure 'id' property exists
          })),
          cards: {},
        }

        // Fetch tasks for this board
        console.log('[Kanban] Board loaded, now fetching tasks...')
        const tasksResponse = await kanbanApi.getAllTasks(b._id || b.id)
        console.log('[Kanban] Tasks fetched:', tasksResponse?.tasks?.length || 0)

        if (tasksResponse?.tasks && Array.isArray(tasksResponse.tasks)) {
          tasksResponse.tasks.forEach(task => {
            normalizedBoard.cards[task._id] = {
              id: task._id,
              title: task.title,
              description: task.description,
              priority: task.priority,
              columnId: task.columnId?._id || task.columnId,
              assignees: (task.assignees || []).map(a => a._id || a),
              assigneeNames: (task.assignees || []).map((a) => a?.name).filter(Boolean),
              comments: task.comments || [],
              attachments: task.attachments || [],
              dueDate: task.deadline || task.dueDate,
              createdAt: task.createdAt,
              createdBy: task.createdBy,
            }
          })
          console.log('[Kanban] Tasks converted to cards:', Object.keys(normalizedBoard.cards).length)
        }
        
        setBoard(normalizedBoard)
        setError('')
        setLoading(false)
      } catch (err) {
        if (!mounted) return
        console.error('[Kanban] Error loading board:', err)
        setError(err.message || 'Failed to load board')
        setLoading(false)
      }
    }
    
    loadBoard()
    // also load available boards for switcher
    kanbanApi.listBoards().then((bs) => {
      if (!mounted) return
      setBoardsList(Array.isArray(bs) ? bs : [])
    }).catch(() => {})
    return () => { mounted = false }
  }, [])

  const handleSwitchBoard = async (boardId) => {
    if (!boardId) return
    setLoading(true)
    try {
      const b = await kanbanApi.getBoardById(boardId)
      const normalizedBoard = {
        ...b,
        columns: (b.columns || []).map(col => ({ ...col, id: col._id || col.id })),
        cards: {},
      }
      const tasksResponse = await kanbanApi.getAllTasks(b._id || b.id)
      if (tasksResponse?.tasks && Array.isArray(tasksResponse.tasks)) {
        tasksResponse.tasks.forEach(task => {
          normalizedBoard.cards[task._id] = {
            id: task._id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            columnId: task.columnId?._id || task.columnId,
            assignees: (task.assignees || []).map(a => a._id || a),
            assigneeNames: (task.assignees || []).map((a) => a?.name).filter(Boolean),
            comments: task.comments || [],
            attachments: task.attachments || [],
            dueDate: task.deadline || task.dueDate,
            createdAt: task.createdAt,
            createdBy: task.createdBy,
          }
        })
      }
      setBoard(normalizedBoard)
      setError('')
    } catch (err) {
      console.error('[Kanban] Switch board error:', err)
      setError(err.message || 'Failed to switch board')
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (e, cardId) => {
    setDraggedCard(cardId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e, columnId) => {
    setDragOver({ ...dragOver, [columnId]: true })
  }

  const handleDragLeave = (e, columnId) => {
    if (e.target.className.includes('kanban-column')) {
      setDragOver({ ...dragOver, [columnId]: false })
    }
  }

  const handleDrop = async (e, columnId) => {
    e.preventDefault()
    setDragOver({ ...dragOver, [columnId]: false })

    if (!draggedCard || !board) return

    const card = Object.values(board.cards).find(c => c.id === draggedCard)
    if (!card) return

    // Check permissions
    if (isEmployee && !(card.assignees || []).includes(userId)) {
      alert('You can only move your assigned tasks')
      return
    }

    const { todoId, inProgressId, reviewId, completedId } = getWorkflowIds(board)
    const fromId = card.columnId
    const toId = columnId

    if (isEmployee) {
      const allowed =
        (fromId === todoId && toId === inProgressId) ||
        (fromId === inProgressId && toId === reviewId)
      if (!allowed) {
        alert('Employees can only move tasks from To Do → In Progress → Review.')
        return
      }
    }

    if (isHR) {
      const allowed = fromId === reviewId && (toId === completedId || toId === inProgressId)
      if (!allowed) {
        alert('HR can only move tasks from Review to Completed (approve) or In Progress (reject).')
        return
      }
    }

    const updated = { ...card, columnId }
    try {
      await kanbanApi.moveCard(boardId, draggedCard, { columnId })
      setBoard({ ...board, cards: { ...board.cards, [draggedCard]: updated } })
    } catch (err) {
      console.error('Error moving card:', err)
      alert(err.message || 'Failed to move task')
    }
    setDraggedCard(null)
  }

  const handleAddCard = (columnId) => {
    if (!isHR && !isAdmin) {
      alert('Only HR or Admin can create tasks')
      return
    }
    if (!columnId) {
      alert('Column not found. Please refresh and try again.')
      return
    }

    // Ensure board has a valid Mongo ObjectId before opening create modal
    const boardId = board?._id || board?.id
    const objectIdRegex = /^[0-9a-fA-F]{24}$/
    if (!boardId || !objectIdRegex.test(boardId)) {
      console.error('[Kanban] Invalid boardId when adding task:', boardId)
      alert('Cannot create task: board ID is invalid or not yet saved. Refresh the page or create a board first.')
      return
    }

    setCreateTaskColumnId(columnId)
    setShowCreateModal(true)
  }

  const handleEditCard = (card) => {
    setSelectedCard(card)
    setShowModal(true)
  }

  const handleCreateTask = (createdCard) => {
    // Normalize the created task to card format
    const normalizedCard = {
      id: createdCard._id || createdCard.id,
      title: createdCard.title,
      description: createdCard.description,
      priority: createdCard.priority,
      columnId: createdCard.columnId?._id || createdCard.columnId,
      assignees: (createdCard.assignees || []).map(a => a._id || a),
      assigneeNames: (createdCard.assignees || []).map((a) => a?.name).filter(Boolean),
      comments: createdCard.comments || [],
      attachments: createdCard.attachments || [],
      dueDate: createdCard.deadline || createdCard.dueDate,
      createdAt: createdCard.createdAt,
      createdBy: createdCard.createdBy,
    }
    
    setBoard({
      ...board,
      cards: { ...board.cards, [normalizedCard.id]: normalizedCard }
    })
  }

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Delete this task?')) return

    try {
      await kanbanApi.deleteCard(boardId, cardId)
      const newCards = { ...board.cards }
      delete newCards[cardId]
      setBoard({ ...board, cards: newCards })
    } catch (err) {
      console.error('Error deleting card:', err)
      alert(err.message || 'Failed to delete task')
    }
  }

  const handleUpdateTask = async (updatedCard) => {
    try {
      // Normalize the ID
      const cardId = updatedCard.id || updatedCard._id
      const updates = {
        title: updatedCard.title,
        description: updatedCard.description,
        priority: updatedCard.priority,
        deadline: updatedCard.dueDate,
        columnId: updatedCard.columnId,
        assignees: updatedCard.assignees,
      }
      
      await kanbanApi.updateCard(boardId, cardId, updates)
      
      // Normalize updated card
      const normalizedCard = {
        ...updatedCard,
        id: cardId,
      }
      
      setBoard({
        ...board,
        cards: { ...board.cards, [cardId]: normalizedCard }
      })
      setShowModal(false)
    } catch (err) {
      console.error('Error updating card:', err)
      alert(err.message || 'Failed to update task')
    }
  }

    // Handle task moved (from modal submit for review)
    const handleMoveTask = (movedTask) => {
      const cardId = movedTask._id || movedTask.id
      const normalizedCard = {
        id: cardId,
        title: movedTask.title,
        description: movedTask.description,
        priority: movedTask.priority,
        columnId: movedTask.columnId?._id || movedTask.columnId,
        assignees: (movedTask.assignees || []).map(a => a._id || a),
        assigneeNames: (movedTask.assignees || []).map((a) => a?.name).filter(Boolean),
        comments: movedTask.comments || [],
        attachments: movedTask.attachments || [],
        dueDate: movedTask.deadline || movedTask.dueDate,
        createdAt: movedTask.createdAt,
        createdBy: movedTask.createdBy,
      }
      setBoard({
        ...board,
        cards: { ...board.cards, [cardId]: normalizedCard }
      })
      setShowModal(false)
    }

  const handleAddComment = async (cardId, text) => {
    const created = await kanbanApi.addComment(boardId, cardId, { text })
    setBoard((prev) => {
      const nextCards = { ...prev.cards }
      const existing = nextCards[cardId]
      if (!existing) return prev
      nextCards[cardId] = {
        ...existing,
        comments: [...(existing.comments || []), created],
      }
      return { ...prev, cards: nextCards }
    })
    setSelectedCard((prev) => {
      if (!prev || prev.id !== cardId) return prev
      return { ...prev, comments: [...(prev.comments || []), created] }
    })
    return created
  }

  const handleAddAttachment = async (cardId, fileName, fileUrl) => {
    const created = await kanbanApi.addAttachment(boardId, cardId, { fileName, fileUrl })
    setBoard((prev) => {
      const nextCards = { ...prev.cards }
      const existing = nextCards[cardId]
      if (!existing) return prev
      nextCards[cardId] = {
        ...existing,
        attachments: [...(existing.attachments || []), created],
      }
      return { ...prev, cards: nextCards }
    })
    setSelectedCard((prev) => {
      if (!prev || prev.id !== cardId) return prev
      return { ...prev, attachments: [...(prev.attachments || []), created] }
    })
    return created
  }

  const handleGenerateReport = async () => {
    try {
      const data = await kanbanApi.generateReport(boardId)
      setReport(data)
    } catch (err) {
      console.error('Error generating report:', err)
      alert(err.message || 'Failed to generate report')
    }
  }

  const handleArchiveCompleted = async () => {
    try {
      await kanbanApi.archiveCompleted(boardId)
      const refreshed = await kanbanApi.getBoard()
      setBoard(refreshed)
    } catch (err) {
      console.error('Error archiving completed tasks:', err)
      alert(err.message || 'Failed to archive completed tasks')
    }
  }

  const handleCreateBoard = async () => {
    const title = window.prompt('Enter a title for the new board')
    if (!title || !title.trim()) return
    try {
      const created = await kanbanApi.createBoard({ title: title.trim(), description: '' })
      // server returns populated board
      const b = created.board || created
      if (!b) {
        alert('Board created but response was unexpected')
        return
      }
      // Normalize columns and set board
      const normalizedBoard = {
        ...b,
        columns: (b.columns || []).map((c) => ({ ...c, id: c._id || c.id })),
        cards: {},
      }
      // Fetch tasks for new board
      try {
        const tasksResponse = await kanbanApi.getAllTasks(b._id || b.id)
        if (tasksResponse?.tasks && Array.isArray(tasksResponse.tasks)) {
          tasksResponse.tasks.forEach((task) => {
            normalizedBoard.cards[task._id] = {
              id: task._id,
              title: task.title,
              description: task.description,
              priority: task.priority,
              columnId: task.columnId?._id || task.columnId,
              assignees: (task.assignees || []).map((a) => a._id || a),
              assigneeNames: (task.assignees || []).map((a) => a?.name).filter(Boolean),
              comments: task.comments || [],
              attachments: task.attachments || [],
              dueDate: task.deadline || task.dueDate,
              createdAt: task.createdAt,
              createdBy: task.createdBy,
            }
          })
        }
      } catch (e) {
        console.warn('Failed to load tasks for new board', e)
      }

      setBoard(normalizedBoard)
      setError('')
      setLoading(false)
    } catch (err) {
      console.error('Create board error:', err)
      alert(err.message || 'Failed to create board')
    }
  }

  if (loading) return <div className="kanban-page"><p>Loading board...</p></div>
  if (error) return <div className="kanban-page"><p>{error}</p></div>
  if (!board) return <div className="kanban-page"><p>No board selected</p></div>

  return (
    <div className="kanban-page">
      <div className="kanban-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0 }}>{board.title || board.name}</h1>
          <select
            value={board?._id || board?.id || ''}
            onChange={(e) => handleSwitchBoard(e.target.value)}
            style={{ padding: '6px 8px', borderRadius: 6 }}
          >
            <option value="">Select board</option>
            {(boardsList || []).map((b) => (
              <option key={b._id || b.id} value={b._id || b.id}>{b.title || b.name}</option>
            ))}
          </select>
        </div>
        {isAdmin && (
          <div className="kanban-column-footer">
            <button className="btn btn-sm btn-primary" onClick={handleCreateBoard} style={{ marginRight: 8 }}>
              + Create Board
            </button>
            <button className="btn btn-sm btn-secondary" onClick={handleGenerateReport}>
              Generate Report
            </button>
            <button className="btn btn-sm btn-secondary" onClick={handleArchiveCompleted}>
              Archive Completed
            </button>
          </div>
        )}
        <div className="kanban-legend">
          <span>🟢 Low</span>
          <span>🟡 Medium</span>
          <span>🔴 High</span>
          <span>⚫ Urgent</span>
        </div>
      </div>

      {showModal && selectedCard && (
        <TaskModal
          card={selectedCard}
          board={board}
          onClose={() => setShowModal(false)}
          onUpdate={handleUpdateTask}
          onMove={handleMoveTask}
          onAddComment={handleAddComment}
          onAddAttachment={handleAddAttachment}
          user={user}
          isHR={isHR}
          isAdmin={isAdmin}
        />
      )}

      {showCreateModal && (
        <CreateTaskModal
          columnId={createTaskColumnId}
          board={board}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTask}
          isHR={isHR}
          isAdmin={isAdmin}
        />
      )}

      {report && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>Board Report</h3>
          <p>Total tasks: {report.taskStats?.total ?? report.totalCards ?? 0}</p>
          <p>Overdue: {report.taskStats?.overdue ?? report.overdueTasks?.length ?? 0}</p>
          <p>Completed: {report.taskStats?.completed ?? report.completedTasks?.length ?? 0}</p>
          <p>In progress: {report.taskStats?.pending ?? report.inProgressTasks?.length ?? 0}</p>
        </div>
      )}

      <div className="kanban-board">
        {board.columns && board.columns.map((column) => {
          const columnKey = column.id || column._id
          const columnCards = Object.values(board.cards).filter(
            (card) => (card.columnId === columnKey || card.columnId?._id === columnKey) && !card.archived
          )

          const visibleCards = columnCards.filter(card => {
            if (isAdmin || isHR) return true
            return card.visibility === 'public' || (card.assignees || []).includes(userId)
          })

          return (
            <div
              key={columnKey}
              className={`kanban-column ${dragOver[columnKey] ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, columnKey)}
              onDragLeave={(e) => handleDragLeave(e, columnKey)}
              onDrop={(e) => handleDrop(e, columnKey)}
            >
              <div className="kanban-column-header">
                <h3>{column.title}</h3>
                <span className="task-count">{visibleCards.length}</span>
              </div>

              <div className="kanban-column-body">
                {visibleCards.map(card => (
                  <Card
                    key={card.id}
                    card={card}
                    onDragStart={handleDragStart}
                    onEdit={handleEditCard}
                    onDelete={handleDeleteCard}
                    isHR={isHR}
                    isAdmin={isAdmin}
                    canDrag={isAdmin || (isHR && card.columnId === (getWorkflowIds(board).reviewId || '')) || (isEmployee && (card.assignees || []).includes(userId))}
                  />
                ))}
              </div>

              {(isAdmin || isHR) && (
                <div className="kanban-column-footer">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleAddCard(columnKey)}
                    disabled={isHR && !isAdmin && !!getWorkflowIds(board).todoId && columnKey !== getWorkflowIds(board).todoId}
                  >
                    + Add Task
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
