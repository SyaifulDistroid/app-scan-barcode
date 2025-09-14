export const baseUrlAPI = import.meta.env.VITE_BASE_URL_API

export const headersAllowNgrok = () => {
    return {
        'ngrok-skip-browser-warning': 'true'
    }
}