export const ADMIN_PASSWORD = "admin123!@#";

export function isAdminPassword(password: string) {
  return password === ADMIN_PASSWORD;
}
