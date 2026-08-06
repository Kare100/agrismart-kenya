const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Client-side checks before a signin/signup network call. Catches the
// common typos instantly instead of waiting on a round trip only to get
// back the same thing from the server. `mode` matters because sign-up has
// a minimum password length (matches Supabase's default of 6) that
// sign-in shouldn't enforce — an existing shorter password must still work.
export function validateCredentials({ email, password, mode, lang }) {
  const isSW = lang === 'SW';
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return isSW ? 'Weka barua pepe yako' : 'Enter your email';
  }
  if (!EMAIL_RE.test(trimmedEmail)) {
    return isSW ? 'Barua pepe si sahihi' : 'Enter a valid email address';
  }
  if (!password) {
    return isSW ? 'Weka nywila yako' : 'Enter your password';
  }
  if (mode === 'signup' && password.length < 6) {
    return isSW ? 'Nywila lazima iwe na herufi 6 au zaidi' : 'Password must be at least 6 characters';
  }
  return '';
}
