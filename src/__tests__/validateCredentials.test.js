import { validateCredentials } from '../utils/validateCredentials';

describe('validateCredentials', () => {
  test('requires an email', () => {
    const err = validateCredentials({ email: '', password: 'secret1', mode: 'signin', lang: 'EN' });
    expect(err).toBe('Enter your email');
  });

  test('rejects a malformed email', () => {
    const err = validateCredentials({ email: 'not-an-email', password: 'secret1', mode: 'signin', lang: 'EN' });
    expect(err).toBe('Enter a valid email address');
  });

  test('requires a password', () => {
    const err = validateCredentials({ email: 'a@b.com', password: '', mode: 'signin', lang: 'EN' });
    expect(err).toBe('Enter your password');
  });

  test('enforces a 6-character minimum only on signup', () => {
    const signupErr = validateCredentials({ email: 'a@b.com', password: '123', mode: 'signup', lang: 'EN' });
    expect(signupErr).toMatch(/at least 6 characters/);

    const signinOk = validateCredentials({ email: 'a@b.com', password: '123', mode: 'signin', lang: 'EN' });
    expect(signinOk).toBe('');
  });

  test('passes for valid signup credentials', () => {
    const err = validateCredentials({ email: 'farmer@example.com', password: 'secret1', mode: 'signup', lang: 'EN' });
    expect(err).toBe('');
  });

  test('returns Swahili messages when lang is SW', () => {
    const err = validateCredentials({ email: '', password: '', mode: 'signin', lang: 'SW' });
    expect(err).toBe('Weka barua pepe yako');
  });
});
