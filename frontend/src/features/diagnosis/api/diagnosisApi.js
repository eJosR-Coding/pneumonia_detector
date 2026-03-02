import { API_URL } from '../const'

/**
 * POST /predict — upload chest X-ray, receive diagnosis + Grad-CAM.
 * @param {File} file
 * @returns {Promise<object>} API result
 */
export async function analyzeDiagnosis(file) {
    const form = new FormData()
    form.append('file', file)

    const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body: form,
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (res.status === 429) {
            throw new Error('Too many requests — please wait a minute and try again.')
        }
        throw new Error(err.detail || `Server error (${res.status})`)
    }

    return res.json()
}
