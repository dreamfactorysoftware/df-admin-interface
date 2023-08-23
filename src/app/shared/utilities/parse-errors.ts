const errors = [
  {
    regex: /Duplicate entry '([^']+)' for key 'user_email_unique'/,
    message: 'alerts.duplicateEmail',
  },
];

export function parseError(errorString: string | null): string {
  if (!errorString) {
    return 'alert.genericError';
  }
  const error = errors.find(err => err.regex.test(errorString));
  if (error) {
    return error.message;
  }
  return errorString;
}
