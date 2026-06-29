export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

export function maskPhone(phone: string): string {
  const clean = normalizePhone(phone);
  if (clean.length === 11) {
    return `${clean.slice(0, 3)}-****-${clean.slice(7)}`;
  } else if (clean.length === 10) {
    return `${clean.slice(0, 3)}-***-${clean.slice(6)}`;
  }
  return phone;
}
