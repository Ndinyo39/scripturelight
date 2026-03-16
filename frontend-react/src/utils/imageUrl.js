/**
 * Returns the full URL for a user-uploaded image/file.
 * Automatically detects the environment and uses the correct base URL.
 * This avoids http:// mixed-content warnings on production.
 */
export const getImageUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath; // Already an absolute URL (e.g., Cloudinary)
    }
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocal ? 'http://localhost:5000' : '';
    return `${baseUrl}/${filePath}`.replace(/\/\//g, '/').replace(':/', '://');
};
