import { ChangeDetectorRef, Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient, HttpHeaders } from '@angular/common/http'

interface SecurityEvent {
  timestamp?: string
  eventType?: string
  level?: string
  message?: string
  statusCode?: number
  method?: string
  path?: string
  requiredRole?: string
  alertType?: string
  severity?: string
  failedAttempts?: number
  timeWindowMinutes?: number
}

interface SecurityMonitoringResponse {
  statistics: {
    failedLogins: number
    unauthorizedAccess: number
    suspiciousActivity: number
    totalEvents: number
  }
  recentEvents: SecurityEvent[]
}

@Component({
  selector: 'app-security-monitoring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './security-monitoring.component.html',
  styleUrls: ['./security-monitoring.component.scss']
})
export class SecurityMonitoringComponent implements OnInit {
  statistics = {
    failedLogins: 0,
    unauthorizedAccess: 0,
    suspiciousActivity: 0,
    totalEvents: 0
  }

  recentEvents: SecurityEvent[] = []
  loading = true
  errorMessage = ''

  constructor (private readonly http: HttpClient, private readonly cdr: ChangeDetectorRef) {}

  ngOnInit (): void {
    this.loadSecurityEvents()
  }

  loadSecurityEvents (): void {
    this.loading = true
    this.errorMessage = ''

    const token = localStorage.getItem('token')

    if (!token) {
      this.errorMessage = 'Authentication required.'
      this.loading = false
      return
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    })

    
    this.http.get<SecurityMonitoringResponse>(
        '/api/security-monitoring',
        { headers }
        ).subscribe({
        next: (response) => {
            this.statistics = response.statistics
            this.recentEvents = response.recentEvents
            this.loading = false
            this.cdr.detectChanges()
        },
        error: () => {
            this.errorMessage = 'Unable to retrieve security monitoring data.'
            this.loading = false
            this.cdr.detectChanges()
        }
    })
  }
}
