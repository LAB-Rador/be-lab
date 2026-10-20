export function splitFullName(value: unknown): { firstName: string; lastName: string | null } | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim().replace(/\s+/g, ' ');
    if (!trimmed) return null;
    const space = trimmed.indexOf(' ');
    if (space === -1) {
        return { firstName: trimmed, lastName: null };
    }
    const lastName = trimmed.slice(space + 1).trim();
    return {
        firstName: trimmed.slice(0, space),
        lastName: lastName || null,
    };
}
