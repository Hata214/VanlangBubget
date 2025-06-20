// Utility để test backend endpoints
export async function testBackendConnection() {
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://vanlangbubget.onrender.com'

    console.log('Testing backend connection to:', API_URL)

    try {
        // Test health endpoint
        const healthResponse = await fetch(`${API_URL}/api/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })

        console.log('Health check response:', healthResponse.status, healthResponse.statusText)

        if (healthResponse.ok) {
            const healthData = await healthResponse.json()
            console.log('Health data:', healthData)
        }

        return {
            success: healthResponse.ok,
            status: healthResponse.status,
            url: API_URL
        }
    } catch (error) {
        console.error('Backend connection test failed:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            url: API_URL
        }
    }
}

export async function testAuthEndpoint(token: string) {
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000'

    console.log('Testing auth endpoint with token:', token.substring(0, 20) + '...')

    try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })

        console.log('Auth endpoint response:', response.status, response.statusText)

        if (response.ok) {
            const data = await response.json()
            console.log('Auth data:', data)
            return { success: true, data }
        } else {
            const errorData = await response.text()
            console.log('Auth error:', errorData)
            return { success: false, status: response.status, error: errorData }
        }
    } catch (error) {
        console.error('Auth endpoint test failed:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}
