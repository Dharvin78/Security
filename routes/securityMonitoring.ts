
import fs from 'node:fs/promises'
import path from 'node:path'
import { type Request, type Response, type NextFunction } from 'express'

interface SecurityEvent {
  timestamp?: string
  eventType?: string
  level?: string
  message?: string
  statusCode?: number
  method?: string
  path?: string
  requiredRole?: string
}

const logFile = path.join(
  process.cwd(),
  'security-logs',
  'security-events.log'
)

export const getSecurityMonitoring = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let logContent: string

    try {
      logContent = await fs.readFile(logFile, 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return res.json({
          statistics: {
            failedLogins: 0,
            unauthorizedAccess: 0,
            totalEvents: 0
          },
          recentEvents: []
        })
      }
      throw error
    }

    const events: SecurityEvent[] = []

    for (const line of logContent.split('\n')) {
      if (!line.trim()) continue

      try {
        const event = JSON.parse(line) as SecurityEvent

        if (
          event &&
          typeof event === 'object' &&
          typeof event.eventType === 'string'
        ) {
          events.push(event)
        }
      } catch {
        // Ignore incomplete or malformed log entries.
      }
    }

    const failedLogins = events.filter(
      event => event.eventType === 'FAILED_LOGIN'
    ).length

    const unauthorizedAccess = events.filter(
      event => event.eventType === 'UNAUTHORIZED_ACCESS'
    ).length

    const recentEvents = events
      .slice(-50)
      .reverse()
      .map(event => ({
        timestamp: event.timestamp,
        eventType: event.eventType,
        level: event.level,
        message: event.message,
        statusCode: event.statusCode,
        method: event.method,
        path: event.path,
        requiredRole: event.requiredRole
      }))

    return res.json({
      statistics: {
        failedLogins,
        unauthorizedAccess,
        totalEvents: events.length
      },
      recentEvents
    })
  } catch (error) {
    next(error)
  }
}