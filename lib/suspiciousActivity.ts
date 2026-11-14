import securityLogger from './securityLogger'

const FAILED_LOGIN_THRESHOLD = 5
const TIME_WINDOW_MS = 5 * 60 * 1000

const failedLoginAttempts = new Map<string, number[]>()

export function detectSuspiciousLogin (ipAddress: string): void {
  const now = Date.now()

  const previousAttempts = failedLoginAttempts.get(ipAddress) ?? []

  // Keep only attempts made within the last five minutes.
  const recentAttempts = previousAttempts.filter(
    timestamp => now - timestamp < TIME_WINDOW_MS
  )

  recentAttempts.push(now)

  // Generate one alert when the threshold is reached.
  if (recentAttempts.length === FAILED_LOGIN_THRESHOLD) {
    securityLogger.warn('Suspicious login activity detected', {
      eventType: 'SUSPICIOUS_ACTIVITY',
      alertType: 'MULTIPLE_FAILED_LOGINS',
      severity: 'HIGH',
      ipAddress,
      failedAttempts: recentAttempts.length,
      timeWindowMinutes: 5,
      timestamp: new Date(now).toISOString(),
      message: 'Five failed login attempts detected from the same IP address within five minutes.'
    })
  }

  failedLoginAttempts.set(ipAddress, recentAttempts)
}
