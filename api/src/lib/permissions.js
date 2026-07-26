export function hasRole(user, allowedRoles) {
  return Boolean(user && allowedRoles.includes(user.role?.code ?? user.role));
}
