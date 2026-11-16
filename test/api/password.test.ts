/*
 * Copyright (c) 2014-2026 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import type { Express } from 'express'
import config from 'config'
import { createTestApp } from './helpers/setup'
import { login } from './helpers/auth'

let app: Express

before(async () => {
  const result = await createTestApp()
  app = result.app
}, { timeout: 60000 })

void describe('/rest/user/change-password', () => {
  void it('POST password change for newly created user with valid authorization and current password', async () => {
    await request(app)
      .post('/api/Users')
      .set({ 'content-type': 'application/json' })
      .send({
        email: 'kuni@be.rt',
        password: 'KunigundeSecure2026!',
        passwordRepeat: 'KunigundeSecure2026!'
      })
      .expect(201)

    const { token } = await login(app, { email: 'kuni@be.rt', password: 'KunigundeSecure2026!' })

    const res = await request(app)
      .post('/rest/user/change-password')
      .set({ Authorization: 'Bearer ' + token })
      .send({ current: 'KunigundeSecure2026!', new: 'NewKunigunde2026!', repeat: 'NewKunigunde2026!' })

    assert.equal(res.status, 200)
    assert.equal(res.body.message, 'Password changed successfully')

    const newLogin = await login(app, { email: 'kuni@be.rt', password: 'NewKunigunde2026!' })
    assert.equal(typeof newLogin.token, 'string')
  })

  void it('POST password change with wrong current password is rejected', async () => {
    const { token } = await login(app, {
      email: 'bjoern@' + config.get<string>('application.domain'),
      password: 'monkey summer birthday are all bad passwords but work just fine in a long passphrase'
    })

    const res = await request(app)
      .post('/rest/user/change-password')
      .set({ Authorization: 'Bearer ' + token })
      .send({ current: 'definitely_wrong', new: 'StrongNewPassword2026!', repeat: 'StrongNewPassword2026!' })

    assert.equal(res.status, 401)
    assert.ok(res.text.includes('Current password is not correct'))
  })

  void it('POST password change without new password is rejected', async () => {
    const res = await request(app)
      .post('/rest/user/change-password')
      .send({})

    assert.equal(res.status, 401)
    assert.ok(res.text.includes('Password cannot be empty'))
  })

  void it('POST password change with mismatching repeated password is rejected', async () => {
    const res = await request(app)
      .post('/rest/user/change-password')
      .send({ new: 'StrongNewPassword2026!', repeat: 'DifferentPassword2026!' })

    assert.equal(res.status, 401)
    assert.ok(res.text.includes('New and repeated password do not match'))
  })

  void it('POST password change without authorization cannot succeed', async () => {
    const res = await request(app)
      .post('/rest/user/change-password')
      .send({ current: 'AnyCurrentPassword2026!', new: 'StrongNewPassword2026!', repeat: 'StrongNewPassword2026!' })

    assert.equal(res.status, 401)
  })

  void it('POST password change with unrecognized authorization token cannot succeed', async () => {
    const res = await request(app)
      .post('/rest/user/change-password')
      .set({ Authorization: 'Bearer unknown' })
      .send({ current: 'AnyCurrentPassword2026!', new: 'StrongNewPassword2026!', repeat: 'StrongNewPassword2026!' })

    assert.equal(res.status, 401)
  })

  void it('POST password change for Bender without current password is rejected', async () => {
    const { token } = await login(app, {
      email: 'bender@' + config.get<string>('application.domain'),
      password: 'OhG0dPlease1nsertLiquor!'
    })

    const res = await request(app)
      .post('/rest/user/change-password')
      .set({ Authorization: 'Bearer ' + token })
      .send({ new: 'slurmCl4ssic2026!', repeat: 'slurmCl4ssic2026!' })

    assert.equal(res.status, 401)
    assert.ok(res.text.includes('Current password is not correct'))
  })

  void it('GET password change is not permitted', async () => {
    const res = await request(app)
      .get('/rest/user/change-password?current=anything&new=anything&repeat=anything')

    assert.notEqual(res.status, 200)
  })
})

void describe('/rest/user/reset-password', () => {
  void it('POST password reset for Jim with correct answer to his security question', async () => {
    const res = await request(app)
      .post('/rest/user/reset-password')
      .set({ 'content-type': 'application/json' })
      .send({
        email: 'jim@' + config.get<string>('application.domain'),
        answer: 'Samuel',
        new: 'ncc-1701',
        repeat: 'ncc-1701'
      })

    assert.equal(res.status, 200)
  })

  void it('POST password reset for Bender with correct answer to his security question', async () => {
    const res = await request(app)
      .post('/rest/user/reset-password')
      .set({ 'content-type': 'application/json' })
      .send({
        email: 'bender@' + config.get<string>('application.domain'),
        answer: 'Stop\'n\'Drop',
        new: 'OhG0dPlease1nsertLiquor!',
        repeat: 'OhG0dPlease1nsertLiquor!'
      })

    assert.equal(res.status, 200)
  })

  void it('POST password reset for Bjoern´s internal account with correct answer to his security question', async () => {
    const res = await request(app)
      .post('/rest/user/reset-password')
      .set({ 'content-type': 'application/json' })
      .send({
        email: 'bjoern@' + config.get<string>('application.domain'),
        answer: 'West-2082',
        new: 'monkey summer birthday are all bad passwords but work just fine in a long passphrase',
        repeat: 'monkey summer birthday are all bad passwords but work just fine in a long passphrase'
      })

    assert.equal(res.status, 200)
  })

  void it('POST password reset for Bjoern´s OWASP account with correct answer to his security question', async () => {
    const res = await request(app)
      .post('/rest/user/reset-password')
      .set({ 'content-type': 'application/json' })
      .send({
        email: 'bjoern@owasp.org',
        answer: 'Zaya',
        new: 'kitten lesser pooch karate buffoon indoors',
        repeat: 'kitten lesser pooch karate buffoon indoors'
      })

    assert.equal(res.status, 200)
  })

  void it('POST password reset for Morty with correct answer to his security question', async () => {
    const res = await request(app)
      .post('/rest/user/reset-password')
      .set({ 'content-type': 'application/json' })
      .send({
        email: 'morty@' + config.get<string>('application.domain'),
        answer: '5N0wb41L',
        new: 'iBurri3dMySe1fInTheB4ckyard!',
        repeat: 'iBurri3dMySe1fInTheB4ckyard!'
      })

    assert.equal(res.status, 200)
  })

  void it('POST password reset with wrong answer to security question', async () => {
    const res = await request(app)
      .post('/rest/user/reset-password')
      .set({ 'content-type': 'application/json' })
      .send({
        email: 'bjoern@' + config.get<string>('application.domain'),
        answer: '25436',
        new: '12345',
        repeat: '12345'
      })

    assert.equal(res.status, 401)
    assert.ok(res.text.includes('Wrong answer to security question.'))
  })

  void it('POST password reset without any data is blocked', async () => {
    const res = await request(app)
      .post('/rest/user/reset-password')

    assert.equal(res.status, 400)
    assert.equal(res.body.error, 'Email address is required.')
  })

  void it('POST password reset without new password throws a 401 error', async () => {
    const res = await request(app)
      .post('/rest/user/reset-password')
      .set({ 'content-type': 'application/json' })
      .send({
        email: 'bjoern@' + config.get<string>('application.domain'),
        answer: 'W-2082',
        repeat: '12345'
      })

    assert.equal(res.status, 401)
    assert.ok(res.text.includes('Password cannot be empty.'))
  })

  void it('POST password reset with mismatching passwords throws a 401 error', async () => {
    const res = await request(app)
      .post('/rest/user/reset-password')
      .set({ 'content-type': 'application/json' })
      .send({
        email: 'bjoern@' + config.get<string>('application.domain'),
        answer: 'W-2082',
        new: '12345',
        repeat: '1234_'
      })

    assert.equal(res.status, 401)
    assert.ok(res.text.includes('New and repeated password do not match.'))
  })

  void it('POST password reset with no email address throws a 412 error', async () => {
    const res = await request(app)
      .post('/rest/user/reset-password')
      .set({ 'content-type': 'application/json' })
      .send({
        answer: 'W-2082',
        new: 'abcdef',
        repeat: 'abcdef'
      })

    assert.equal(res.status, 400)
    assert.equal(res.body.error, 'Email address is required.')
  })

  void it('POST password reset with no answer to the security question throws a 412 error', async () => {
    const res = await request(app)
      .post('/rest/user/reset-password')
      .set({ 'content-type': 'application/json' })
      .send({
        email: 'bjoern@' + config.get<string>('application.domain'),
        new: 'abcdef',
        repeat: 'abcdef'
      })

    assert.equal(res.status, 400)
    assert.equal(res.body.error, 'Security question answer is required.')
  })

  void it('POST password reset rate limit cannot be bypassed using X-Forwarded-For', async () => {
    let lastStatus = 0

    for (let i = 0; i < 101; i++) {
      const res = await request(app)
        .post('/rest/user/reset-password')
        .set({
          'content-type': 'application/json',
          'X-Forwarded-For': `192.0.2.${(i % 250) + 1}`
        })
        .send({})

      lastStatus = res.status
    }

    assert.equal(lastStatus, 429)
  })
})
