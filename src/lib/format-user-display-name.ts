export function formatUserDisplayName(user: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
}): string {
    const first = user.firstName?.trim();
    const last = user.lastName?.trim();
    if (first || last) {
        return [first, last].filter(Boolean).join(' ');
    }
    return user.email;
}
