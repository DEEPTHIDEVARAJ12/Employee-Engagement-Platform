const getToken = () => localStorage.getItem('worksphere_token')

async function parseApiResponse(res) {
  const contentType = (res.headers.get('content-type') || '').toLowerCase()
  if (contentType.includes('application/json')) {
    return await res.json().catch(() => ({}))
  }

  const text = await res.text().catch(() => '')
  if (!text) return {}

  if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
    return {
      message: 'API returned HTML instead of JSON. Set VITE_API_BASE_URL or configure the /api proxy.',
    }
  }

  return { message: text }
}

export async function api(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`/api${path}`, { ...options, headers })
  const data = await parseApiResponse(res)
  if (!res.ok) throw new Error(data.message || res.statusText || 'Request failed')
  return data
}

export const auth = {
  me: () => api('/rbac/auth/me'),
  login: (body) => api('/rbac/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => api('/rbac/auth/register', { method: 'POST', body: JSON.stringify(body) }),
}

export const users = {
  list: () => api('/rbac/users').then((data) => data.users || []),
  peers: () => api('/rbac/users/peers'),
  profile: () => api('/rbac/auth/me').then((data) => data.user || data),
  updateProfile: (body) =>
    api('/rbac/users/profile', { method: 'PATCH', body: JSON.stringify(body) }).then((data) => data.user || data),
  get: (id) => api(`/rbac/users/${id}`).then((data) => data.user || data),
}

export const employees = {
  active: () => api('/employees/active').then((data) => data.employees || []),
}

export const announcements = {
  list: () => api('/announcements'),
  get: (id) => api(`/announcements/${id}`),
  create: (body) => api('/announcements', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => api(`/announcements/${id}`, { method: 'DELETE' }),
}

export const rewards = {
  list: () => api('/rewards'),
  listAdmin: () => api('/rewards/admin'),
  create: (body) => api('/rewards', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/rewards/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => api(`/rewards/${id}`, { method: 'DELETE' }),
}

export const analytics = {
  get: () => api('/analytics'),
}

export const notifications = {
  list: (limit) => api(`/notifications${limit != null ? `?limit=${limit}` : ''}`),
  unreadCount: () => api('/notifications/unread-count'),
  markRead: (id) => api(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => api('/notifications/read-all', { method: 'PATCH' }),
}

export const pulse = {
  getMine: () => api('/pulse/mine'),
  submit: (body) => api('/pulse', { method: 'POST', body: JSON.stringify(body) }),
  getAnalytics: (days) => api(`/pulse/analytics${days != null ? `?days=${days}` : ''}`),
}

export const feedback = {
  submit: (body) => api('/feedback', { method: 'POST', body: JSON.stringify(body) }),
  list: (status) => api(`/feedback${status ? `?status=${status}` : ''}`),
  updateStatus: (id, status) => api(`/feedback/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
}

export const events = {
  list: (from, to) => api(`/events${from || to ? `?${new URLSearchParams({ ...(from && { from }), ...(to && { to }) }).toString()}` : ''}`),
  create: (body) => api('/events', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => api(`/events/${id}`, { method: 'DELETE' }),
}

export const comments = {
  list: (announcementId) => api(`/comments/announcement/${announcementId}`),
  add: (announcementId, text) => api(`/comments/announcement/${announcementId}`, { method: 'POST', body: JSON.stringify({ text }) }),
  delete: (id) => api(`/comments/${id}`, { method: 'DELETE' }),
}

export const search = {
  run: (q, type) => api(`/search?q=${encodeURIComponent(q || '')}&type=${type || 'all'}`),
}

export async function downloadExport(path, filename) {
  const token = getToken()
  const res = await fetch(`/api${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!res.ok) throw new Error('Export failed')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'export.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export const exportApi = {
  surveyResponses: (surveyId) => downloadExport(`/export/survey-responses/${surveyId}`),
  recognitions: () => downloadExport('/export/recognitions', 'recognitions.csv'),
}

export const dashboard = {
  summary: () => api('/dashboard/summary'),
}

export const recognitions = {
  list: (type = 'received') => api(`/recognitions?type=${type}`),
  listAll: () => api('/recognitions/all'),
  leaderboard: (limit) => api(`/recognitions/leaderboard${limit != null ? `?limit=${limit}` : ''}`),
  create: (body) => api('/recognitions', { method: 'POST', body: JSON.stringify(body) }),
}

export const surveys = {
  list: () => api('/surveys'),
  get: (id) => api(`/surveys/${id}`),
  getTemplates: () => api('/surveys/templates'),
  createFromTemplate: (templateId, title) => api('/surveys/from-template', { method: 'POST', body: JSON.stringify({ templateId, title }) }),
  getAnalytics: (id) => api(`/surveys/${id}/analytics`),
  create: (body) => api('/surveys', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/surveys/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => api(`/surveys/${id}`, { method: 'DELETE' }),
  getResponses: (id) => api(`/surveys/${id}/responses`),
  submitResponse: (id, answers) => api(`/surveys/${id}/responses`, { method: 'POST', body: JSON.stringify({ answers }) }),
}

// Kanban API - Full integration with RBAC backend endpoints
const DEFAULT_KANBAN = {
  _id: 'default-board',
  title: 'My Board',
  description: 'Default engagement board',
  columns: [
    { _id: 'col-todo', title: 'To Do', order: 1, color: '#e74c3c' },
    { _id: 'col-inprogress', title: 'In Progress', order: 2, color: '#f39c12' },
    { _id: 'col-review', title: 'Review', order: 3, color: '#3498db' },
    { _id: 'col-done', title: 'Completed', order: 4, color: '#2ecc71' },
  ],
  members: [],
  archived: false,
  isActive: true,
  tasks: [],
  createdAt: new Date().toISOString(),
}

export const kanban = {
  normalizeBoardId(boardId) {
    const id = typeof boardId === 'object' ? boardId?._id || boardId?.id : boardId
    const objectIdRegex = /^[0-9a-fA-F]{24}$/
    if (!id || !objectIdRegex.test(String(id))) {
      throw new Error('Invalid board id')
    }
    return String(id)
  },

  // Get default board (first from list, or create one)
  async getBoard() {
    const response = await api('/rbac/boards')
    // Server may return either an array of boards or an object with a "boards" property.
    const boards = Array.isArray(response) ? response : (response.boards || [])

    if (!boards || boards.length === 0) {
      throw new Error('No accessible boards found for this user.')
    }

    // Return first board with full details including tasks
    const boardId = boards[0]._id || boards[0].id
    const boardResponse = await api(`/rbac/boards/${boardId}`)
    return (boardResponse && (boardResponse.board || boardResponse))
  },

  async getBoardById(boardId) {
    const id = typeof boardId === 'object' ? boardId?._id || boardId?.id : boardId
    if (!id) throw new Error('Invalid board id')
    const boardResponse = await api(`/rbac/boards/${id}`)
    return (boardResponse && (boardResponse.board || boardResponse))
  },

  async listBoards() {
    const response = await api('/rbac/boards')
    // Normalize either array or object response
    return Array.isArray(response) ? response : (response.boards || [])
  },

  // Fetch all tasks for a board (including filtering for employees)
  async getAllTasks(boardId) {
    const id = this.normalizeBoardId(boardId)
    return await api(`/rbac/boards/${id}/tasks`)
  },

  // Create a new board
  async createBoard(boardData) {
    return await api('/rbac/boards', {
      method: 'POST',
      body: JSON.stringify(boardData)
    }).then(res => res.board || res)
  },

  // Update a board
  async updateBoard(boardId, updates) {
    const id = this.normalizeBoardId(boardId)
    return await api(`/rbac/boards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }).then(res => res.board || res)
  },

  // Move a task to another column
  async moveCard(boardId, taskId, body) {
    const id = this.normalizeBoardId(boardId)
    return await api(`/rbac/boards/${id}/tasks/${taskId}/move`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }).then(res => res.task || res)
  },

  // Create a new task (card)
  async createCard(boardId, taskData) {
    const id = this.normalizeBoardId(boardId)
    return await api(`/rbac/boards/${id}/tasks`, {
      method: 'POST',
      body: JSON.stringify(taskData)
    }).then(res => res.task || res)
  },

  // Update a task (card)
  async updateCard(boardId, taskId, updates) {
    const id = this.normalizeBoardId(boardId)
    return await api(`/rbac/boards/${id}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }).then(res => res.task || res)
  },

  // Delete a task (card)
  async deleteCard(boardId, taskId) {
    const id = this.normalizeBoardId(boardId)
    return await api(`/rbac/boards/${id}/tasks/${taskId}`, {
      method: 'DELETE'
    })
  },

  // Add comment to task
  async addComment(boardId, taskId, commentData) {
    const id = this.normalizeBoardId(boardId)
    return await api(`/rbac/boards/${id}/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData)
    }).then(res => res.comment || res)
  },

  // Delete comment
  async deleteComment(boardId, taskId, commentId) {
    const id = this.normalizeBoardId(boardId)
    return await api(`/rbac/boards/${id}/tasks/${taskId}/comments/${commentId}`, {
      method: 'DELETE'
    })
  },

  // Add attachment to task
  async addAttachment(boardId, taskId, attachmentData) {
    const id = this.normalizeBoardId(boardId)
    return await api(`/rbac/boards/${id}/tasks/${taskId}/attachments`, {
      method: 'POST',
      body: JSON.stringify(attachmentData)
    }).then(res => res.attachment || res)
  },

  // Generate report
  async generateReport(boardId) {
    const id = this.normalizeBoardId(boardId)
    return await api(`/rbac/boards/${id}/report`).then(res => res.report || res)
  },

  // Archive completed tasks
  async archiveCompleted(boardId) {
    const id = this.normalizeBoardId(boardId)
    return await api(`/rbac/boards/${id}/tasks/archive-completed`, {
      method: 'POST'
    })
  },
}
