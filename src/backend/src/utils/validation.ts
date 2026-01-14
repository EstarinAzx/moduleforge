// Email validation regex from spec
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
    return EMAIL_REGEX.test(email);
}

export function isValidPassword(password: string): boolean {
    return password.length >= 8;
}

export function isValidDisplayName(displayName: string): boolean {
    return displayName.length >= 1 && displayName.length <= 50;
}

export function normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
}
