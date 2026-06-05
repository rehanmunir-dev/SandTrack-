import { logActivity } from '../services/activityService.js'

export function activityLogger(req, res, next) {
  const originalJson = res.json

  res.json = function (data) {
    res.json = originalJson
    const response = res.json(data)

    // Only log successful mutating methods (2xx status codes)
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user && req.activityLog) {
      const actorId = req.user.id
      const actorRole = req.user.role
      const { action, entityType, getEntityId, metadata } = req.activityLog
      
      // Resolve entity ID from parsed response or parameters
      let resolvedEntityId = null
      if (typeof getEntityId === 'function') {
        try {
          resolvedEntityId = getEntityId(data)
        } catch (e) {
          console.error('Error resolving entity ID from response data:', e)
        }
      } else if (req.params.id) {
        resolvedEntityId = parseInt(req.params.id, 10) || null
      }

      // Execute logging in background without blocking response
      logActivity(actorId, actorRole, action, entityType, resolvedEntityId, metadata || {})
        .catch(err => console.error('Activity logging middleware error:', err))
    }

    return response
  }

  next()
}
