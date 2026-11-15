
/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { SecurityAnswerService } from '../Services/security-answer.service'
import { UserService } from '../Services/user.service'
import { FormField, email, form, maxLength, minLength, required, submit, validate } from '@angular/forms/signals'
import { Component, inject, signal, ChangeDetectionStrategy, type OnInit } from '@angular/core'
import { SecurityQuestionService } from '../Services/security-question.service'
import { Router, RouterLink } from '@angular/router'
import { library } from '@fortawesome/fontawesome-svg-core'
import { MatSnackBar } from '@angular/material/snack-bar'

import { faExclamationCircle, faUserPlus } from '@fortawesome/free-solid-svg-icons'
import { SnackBarHelperService } from '../Services/snack-bar-helper.service'
import { TranslateService, TranslateModule } from '@ngx-translate/core'
import { type SecurityQuestion } from '../Models/securityQuestion.model'
import { MatButtonModule } from '@angular/material/button'
import { MatOption } from '@angular/material/core'
import { MatSelect } from '@angular/material/select'
import { PasswordStrengthComponent } from '../password-strength/password-strength.component'
import { PasswordStrengthInfoComponent } from '../password-strength-info/password-strength-info.component'
import { MatSlideToggle } from '@angular/material/slide-toggle'

import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule, MatLabel, MatError, MatHint } from '@angular/material/form-field'
import { MatCardModule } from '@angular/material/card'

import { MatIconModule } from '@angular/material/icon'
import { FormsModule } from '@angular/forms'
import { firstValueFrom } from 'rxjs'

library.add(faUserPlus, faExclamationCircle)

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [
    MatCardModule,
    TranslateModule,
    MatFormFieldModule,
    MatLabel,
    MatInputModule,
    FormsModule,
    FormField,
    MatError,
    MatHint,
    MatSlideToggle,
    PasswordStrengthComponent,
    PasswordStrengthInfoComponent,
    MatSelect,
    MatOption,
    MatButtonModule,
    RouterLink,
    MatIconModule
  ]
})
export class RegisterComponent implements OnInit {
  private readonly securityQuestionService = inject(SecurityQuestionService)
  private readonly userService = inject(UserService)
  private readonly securityAnswerService = inject(SecurityAnswerService)
  private readonly router = inject(Router)
  private readonly translateService = inject(TranslateService)
  private readonly snackBar = inject(MatSnackBar)
  private readonly snackBarHelperService = inject(SnackBarHelperService)

  public readonly registerModel = signal({
    email: '',
    password: '',
    repeatPassword: '',
    securityQuestion: 0,
    securityAnswer: ''
  })

  public readonly registerForm = form(this.registerModel, (s) => {
    // Email validation
    required(s.email)
    email(s.email)

    // Password validation: 12-128 characters
    required(s.password)
    minLength(s.password, 12)
    maxLength(s.password, 128)

    // Confirm password validation: 12-128 characters
    required(s.repeatPassword)
    minLength(s.repeatPassword, 12)
    maxLength(s.repeatPassword, 128)

    // Ensure both passwords match
    validate(s.repeatPassword, ({ value, valueOf }) => {
      if (value() && value() !== valueOf(s.password)) {
        return { kind: 'notSame' }
      }
      return undefined
    })

    // Security question validation
    required(s.securityQuestion)
    validate(s.securityQuestion, ({ value }) => {
      if (!value()) {
        return { kind: 'required' }
      }
      return undefined
    })

    // Security answer validation
    required(s.securityAnswer)
  })

  public securityQuestions = signal<SecurityQuestion[]>([])
  public error = signal<string | null>(null)

  ngOnInit (): void {
    this.securityQuestionService.find(null).subscribe({
      next: (securityQuestions: SecurityQuestion[]) => {
        this.securityQuestions.set(securityQuestions ?? [])
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  save () {
    return submit(this.registerForm, async () => {
      const user = {
        email: this.registerModel().email,
        password: this.registerModel().password,
        passwordRepeat: this.registerModel().repeatPassword,
        securityQuestion: this.securityQuestions().find(
          (question) => question.id === this.registerModel().securityQuestion
        ),
        securityAnswer: this.registerModel().securityAnswer
      }

      try {
        const response: any = await firstValueFrom(this.userService.save(user))

        await firstValueFrom(this.securityAnswerService.save({
          UserId: response.id,
          answer: this.registerModel().securityAnswer,
          SecurityQuestionId: this.registerModel().securityQuestion
        }))

        await this.router.navigate(['/login'])
        this.snackBarHelperService.open('CONFIRM_REGISTER')
      } catch (err: any) {
        console.log(err)

        if (err.error?.errors) {
          const error = err.error.errors[0]

          if (error.message) {
            this.error.set(
              error.message[0].toUpperCase() + error.message.slice(1)
            )
          } else {
            this.error.set(error)
          }
        }
      }
    })
  }
}
