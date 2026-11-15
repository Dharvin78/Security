
/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import '@angular/compiler'
import { TranslateModule } from '@ngx-translate/core'
import { UserService } from '../Services/user.service'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { type ComponentFixture, TestBed } from '@angular/core/testing'
import { ChangePasswordComponent } from './change-password.component'

import { MatButtonModule } from '@angular/material/button'
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatCardModule } from '@angular/material/card'
import { of, throwError } from 'rxjs'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'

describe('ChangePasswordComponent', () => {
  let component: ChangePasswordComponent
  let fixture: ComponentFixture<ChangePasswordComponent>
  let userService: any

  const validPassword = 'NewPassword123!'

  const setModel = (values: {
    currentPassword?: string
    newPassword?: string
    repeatNewPassword?: string
  }) => {
    component.changePasswordModel.update((model) => ({
      ...model,
      ...values
    }))
  }

  const submitForm = async () => {
    const form = (fixture.nativeElement as HTMLElement)
      .querySelector('#password-form') as HTMLFormElement

    form.dispatchEvent(new Event('submit', {
      bubbles: true,
      cancelable: true
    }))

    await fixture.whenStable()
    fixture.detectChanges()
  }

  const errorMessagesInField = (index: number) =>
    Array.from(
      (fixture.nativeElement.querySelectorAll('mat-form-field')[index] as HTMLElement)
        .querySelectorAll('mat-error')
    ).map((error: any) => error.textContent.trim())

  beforeEach(async () => {
    userService = {
      changePassword: vi.fn().mockName('UserService.changePassword')
    }

    userService.changePassword.mockReturnValue(of({}))

    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        ChangePasswordComponent
      ],
      providers: [
        { provide: UserService, useValue: userService },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents()
  })

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangePasswordComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    localStorage.removeItem('email')
    vi.restoreAllMocks()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should require the current password', () => {
    setModel({ currentPassword: '' })

    expect(
      component.changePasswordForm.currentPassword().valid()
    ).toBe(false)

    setModel({ currentPassword: 'pass' })

    expect(
      component.changePasswordForm.currentPassword().valid()
    ).toBe(true)
  })

  it('should reject a new password shorter than 12 characters', () => {
    setModel({ newPassword: 'a'.repeat(11) })

    expect(
      component.changePasswordForm.newPassword().valid()
    ).toBe(false)

    expect(
      component.changePasswordForm.newPassword().getError('minLength')
    ).toBeDefined()
  })

  it('should accept a new password containing exactly 12 characters', () => {
    setModel({ newPassword: 'a'.repeat(12) })

    expect(
      component.changePasswordForm.newPassword().valid()
    ).toBe(true)
  })

  it('should accept a new password containing exactly 128 characters', () => {
    setModel({ newPassword: 'a'.repeat(128) })

    expect(
      component.changePasswordForm.newPassword().valid()
    ).toBe(true)
  })

  it('should reject a new password longer than 128 characters', () => {
    setModel({ newPassword: 'a'.repeat(129) })

    expect(
      component.changePasswordForm.newPassword().valid()
    ).toBe(false)

    expect(
      component.changePasswordForm.newPassword().getError('maxLength')
    ).toBeDefined()
  })

  it('should require the repeated password', () => {
    setModel({
      newPassword: validPassword,
      repeatNewPassword: ''
    })

    expect(
      component.changePasswordForm.repeatNewPassword().valid()
    ).toBe(false)

    setModel({
      repeatNewPassword: validPassword
    })

    expect(
      component.changePasswordForm.repeatNewPassword().valid()
    ).toBe(true)
  })

  it('should reject a repeated password that differs from the new password', () => {
    setModel({
      newPassword: validPassword,
      repeatNewPassword: 'DifferentPassword123!'
    })

    expect(
      component.changePasswordForm.repeatNewPassword().getError('notSame')
    ).toBeDefined()
  })

  it('should accept matching new and repeated passwords', () => {
    setModel({
      newPassword: validPassword,
      repeatNewPassword: validPassword
    })

    expect(
      component.changePasswordForm.repeatNewPassword().valid()
    ).toBe(true)
  })

  it('should reset all password fields and their form states', () => {
    setModel({
      currentPassword: 'OldPassword123!',
      newPassword: validPassword,
      repeatNewPassword: validPassword
    })

    component.changePasswordForm.currentPassword().markAsDirty()
    component.changePasswordForm.currentPassword().markAsTouched()

    component.resetForm()

    expect(component.changePasswordForm.currentPassword().value()).toBe('')
    expect(component.changePasswordForm.currentPassword().dirty()).toBe(false)
    expect(component.changePasswordForm.currentPassword().touched()).toBe(false)

    expect(component.changePasswordForm.newPassword().value()).toBe('')
    expect(component.changePasswordForm.newPassword().dirty()).toBe(false)
    expect(component.changePasswordForm.newPassword().touched()).toBe(false)

    expect(component.changePasswordForm.repeatNewPassword().value()).toBe('')
    expect(component.changePasswordForm.repeatNewPassword().dirty()).toBe(false)
    expect(component.changePasswordForm.repeatNewPassword().touched()).toBe(false)
  })

  it('should clear the form and show confirmation after a successful password change', async () => {
    userService.changePassword.mockReturnValue(of({}))

    setModel({
      currentPassword: 'OldPassword123!',
      newPassword: validPassword,
      repeatNewPassword: validPassword
    })

    vi.spyOn(component, 'resetForm')

    await submitForm()

    expect(component.error()).toBeUndefined()
    expect(component.confirmation()).toBeDefined()
    expect(component.resetForm).toHaveBeenCalled()

    expect(userService.changePassword).toHaveBeenCalledWith({
      current: 'OldPassword123!',
      new: validPassword,
      repeat: validPassword
    })
  })

  it('should handle errors when the password change fails', async () => {
    userService.changePassword.mockReturnValue(
      throwError(() => 'Error')
    )

    vi.spyOn(component, 'resetErrorForm')
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})

    setModel({
      currentPassword: 'OldPassword123!',
      newPassword: validPassword,
      repeatNewPassword: validPassword
    })

    await submitForm()

    expect(component.confirmation()).toBeUndefined()
    expect(component.error()).toBe('Error')
    expect(log).toHaveBeenCalledWith('Error')
    expect(component.resetErrorForm).toHaveBeenCalled()

    expect(
      component.changePasswordForm.currentPassword().value()
    ).toBe('OldPassword123!')

    expect(
      component.changePasswordForm.newPassword().value()
    ).toBe('')

    expect(
      component.changePasswordForm.repeatNewPassword().value()
    ).toBe('')
  })

  it('should not submit when the form is invalid', async () => {
    setModel({
      currentPassword: 'OldPassword123!',
      newPassword: validPassword,
      repeatNewPassword: 'DifferentPassword123!'
    })

    await submitForm()

    expect(userService.changePassword).not.toHaveBeenCalled()
    expect(component.confirmation()).toBeUndefined()
    expect(component.error()).toBeUndefined()
  })

  it('should not submit a password shorter than 12 characters', async () => {
    setModel({
      currentPassword: 'OldPassword123!',
      newPassword: 'Short123!',
      repeatNewPassword: 'Short123!'
    })

    await submitForm()

    expect(userService.changePassword).not.toHaveBeenCalled()
  })

  it('should not submit a password longer than 128 characters', async () => {
    const tooLong = 'a'.repeat(129)

    setModel({
      currentPassword: 'OldPassword123!',
      newPassword: tooLong,
      repeatNewPassword: tooLong
    })

    await submitForm()

    expect(userService.changePassword).not.toHaveBeenCalled()
  })

  it('should show mandatory errors for an empty form', async () => {
    const changeButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('#changeButton')

    expect(changeButton.disabled).toBe(true)

    await submitForm()

    const errors = Array.from(
      fixture.nativeElement.querySelectorAll('mat-error')
    ).map((e: any) => e.textContent.trim())

    expect(errors).toContain('MANDATORY_CURRENT_PASSWORD')
    expect(errors).toContain('MANDATORY_NEW_PASSWORD')
    expect(errors).toContain('MANDATORY_PASSWORD_REPEAT')

    expect(
      fixture.nativeElement.querySelector('.confirmation')
    ).toBeNull()
  })

  it('should show length errors when passwords are too short', async () => {
    setModel({
      currentPassword: 'OldPassword123!',
      newPassword: 'abc',
      repeatNewPassword: 'abc'
    })

    await submitForm()

    expect(errorMessagesInField(1)).toContain('INVALID_PASSWORD_LENGTH')
    expect(errorMessagesInField(2)).toContain('INVALID_PASSWORD_LENGTH')
  })

  it('should show length errors when passwords exceed 128 characters', async () => {
    const tooLong = 'a'.repeat(129)

    setModel({
      currentPassword: 'OldPassword123!',
      newPassword: tooLong,
      repeatNewPassword: tooLong
    })

    await submitForm()

    expect(
      component.changePasswordForm.newPassword().getError('maxLength')
    ).toBeDefined()

    expect(errorMessagesInField(1)).toContain('INVALID_PASSWORD_LENGTH')
    expect(errorMessagesInField(2)).toContain('INVALID_PASSWORD_LENGTH')
  })

  it('should display confirmation and hide it after further edits', async () => {
    setModel({
      currentPassword: 'OldPassword123!',
      newPassword: validPassword,
      repeatNewPassword: validPassword
    })

    await submitForm()

    const confirmation: HTMLElement =
      fixture.nativeElement.querySelector('.confirmation')

    expect(confirmation).toBeTruthy()
    expect(confirmation.getAttribute('role')).toBe('status')

    component.changePasswordForm.newPassword().markAsDirty()
    fixture.detectChanges()

    expect(
      fixture.nativeElement.querySelector('.confirmation')
    ).toBeNull()
  })

  it('should display an error when the password change fails', async () => {
    userService.changePassword.mockReturnValue(
      throwError(() => 'Error')
    )

    vi.spyOn(console, 'log').mockImplementation(() => {})

    setModel({
      currentPassword: 'OldPassword123!',
      newPassword: validPassword,
      repeatNewPassword: validPassword
    })

    await submitForm()

    const error: HTMLElement =
      fixture.nativeElement.querySelector('.error')

    expect(error).toBeTruthy()
    expect(error.getAttribute('role')).toBe('alert')
    expect(error.textContent).toContain('Error')

    expect(
      fixture.nativeElement.querySelector('.confirmation')
    ).toBeNull()
  })

  it('should display the correct password character counters', () => {
    setModel({
      newPassword: validPassword,
      repeatNewPassword: validPassword
    })

    fixture.detectChanges()

    const hints = Array.from(
      fixture.nativeElement.querySelectorAll('.mat-mdc-form-field-hint-end')
    ).map((e: any) => e.textContent.trim())

    expect(hints).toEqual(['15/128', '15/128'])
  })

  it('should warn when a support account violates the corporate password policy', async () => {
    localStorage.setItem('email', 'support@juice-sh.op')

    const log = vi.spyOn(console, 'error')
      .mockImplementation(() => {})

    setModel({
      currentPassword: 'OldPassword123!',
      newPassword: 'abcdefghijkl',
      repeatNewPassword: 'abcdefghijkl'
    })

    await submitForm()

    expect(log).toHaveBeenCalled()
  })

  it('should not warn when a support account satisfies the corporate password policy', async () => {
    localStorage.setItem('email', 'support@juice-sh.op')

    const log = vi.spyOn(console, 'error')
      .mockImplementation(() => {})

    setModel({
      currentPassword: 'OldPassword123!',
      newPassword: 'CorporateP0licy!23',
      repeatNewPassword: 'CorporateP0licy!23'
    })

    await submitForm()

    expect(log).not.toHaveBeenCalled()
  })
})
