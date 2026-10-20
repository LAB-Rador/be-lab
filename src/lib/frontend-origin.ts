export function frontendOrigin(): string {
    const raw = process.env.FRONTEND_URL;
    if (typeof raw === 'string' && raw.trim()) {
        return raw.split(',')[0].trim().replace(/\/$/, '');
    }
    return 'http://localhost:3000';
}
