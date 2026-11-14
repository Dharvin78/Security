import * as winston from 'winston'
import * as fs from 'fs'
import * as path from 'path'

// Directory for security event logs
const logDirectory = path.join(process.cwd(), 'security-logs')

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true })
}

// Dedicated security logger
const securityLogger = winston.createLogger({
  level: 'info',

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),

  transports: [
    new winston.transports.File({
      filename: path.join(logDirectory, 'security-events.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5
    })
  ]
})
export default securityLogger
