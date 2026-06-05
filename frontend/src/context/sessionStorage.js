const SESSION_KEY = 'sandtrack.session.v1'
const USER_DIRECTORY_KEY = 'sandtrack.userDirectory.v1'

export function loadSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (_error) {
    return null
  }
}

export function saveSession(session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY)
}

export function loadUserDirectory() {
  try {
    const raw = window.localStorage.getItem(USER_DIRECTORY_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (_error) {
    return null
  }
}

export function saveUserDirectory(users) {
  window.localStorage.setItem(USER_DIRECTORY_KEY, JSON.stringify(users))
}
