export function isValidPassword(password) {
  if (!password) return false;

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);

  return hasMinLength && hasNumber && hasLetter;
}
