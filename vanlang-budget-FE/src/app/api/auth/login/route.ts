import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authService } from '@/services/authService'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, password } = body

        const data = await authService.login(email, password)

        const response = NextResponse.json(
            { success: true, data },
            { status: 200 }
        )

        // Set cookie - data.token is now a string
        response.cookies.set('token', data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 // 7 days
        })

        // Set refresh token cookie if available
        if (data.refreshToken) {
            response.cookies.set('refreshToken', data.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60 // 30 days
            })
        }

        return response
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                message: error.message || 'Internal server error'
            },
            { status: error.status || 500 }
        )
    }
}
