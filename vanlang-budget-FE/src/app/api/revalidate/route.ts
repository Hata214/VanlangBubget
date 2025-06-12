import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

// Ví dụ: http://localhost:3001/api/revalidate?path=/&secret=YOUR_SECRET_TOKEN
// Hoặc với tag: http://localhost:3001/api/revalidate?tag=siteContent_homepage&secret=YOUR_SECRET_TOKEN

export async function GET(request: NextRequest) {
    const secret = request.nextUrl.searchParams.get('secret')
    const path = request.nextUrl.searchParams.get('path')
    const tag = request.nextUrl.searchParams.get('tag')

    console.log('🔄 Revalidation API called with:', {
        secret: secret ? 'PROVIDED' : 'MISSING',
        path,
        tag,
        envSecret: process.env.REVALIDATE_SECRET_TOKEN ? 'SET' : 'NOT_SET'
    });

    // Kiểm tra secret token (RẤT QUAN TRỌNG để bảo mật)
    // Bạn nên lưu trữ REVALIDATE_SECRET_TOKEN này trong biến môi trường
    if (secret !== process.env.REVALIDATE_SECRET_TOKEN) {
        console.error('❌ Invalid revalidation secret token');
        return NextResponse.json({
            success: false,
            message: 'Invalid token',
            revalidated: false
        }, { status: 401 })
    }

    if (!path && !tag) {
        console.error('❌ Missing path or tag parameter');
        return NextResponse.json({
            success: false,
            message: 'Missing path or tag parameter',
            revalidated: false
        }, { status: 400 })
    }

    try {
        if (path) {
            revalidatePath(path)
            console.log(`✅ Revalidated path: ${path}`)
            return NextResponse.json({
                success: true,
                revalidated: true,
                path,
                now: Date.now()
            })
        }

        if (tag) {
            revalidateTag(tag)
            console.log(`✅ Revalidated tag: ${tag}`)
            return NextResponse.json({
                success: true,
                revalidated: true,
                tag,
                now: Date.now()
            })
        }

        return NextResponse.json({
            success: false,
            message: 'No action taken',
            revalidated: false
        }, { status: 200 })

    } catch (err: any) {
        console.error('❌ Error revalidating:', err);
        // If there is an error, Next.js will continue to show
        // the last successfully generated page
        return NextResponse.json({
            success: false,
            message: 'Error revalidating',
            error: err.message,
            revalidated: false
        }, { status: 500 })
    }
}
