import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

// Ví dụ: http://localhost:3001/api/revalidate?path=/&secret=YOUR_SECRET_TOKEN
// Hoặc với tag: http://localhost:3001/api/revalidate?tag=siteContent_homepage&secret=YOUR_SECRET_TOKEN

export async function GET(request: NextRequest) {
    const secret = request.nextUrl.searchParams.get('secret')
    const path = request.nextUrl.searchParams.get('path')
    const tag = request.nextUrl.searchParams.get('tag')

    // Kiểm tra secret token (RẤT QUAN TRỌNG để bảo mật)
    // Bạn nên lưu trữ REVALIDATE_SECRET_TOKEN này trong biến môi trường
    if (secret !== process.env.REVALIDATE_SECRET_TOKEN) {
        return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }

    if (!path && !tag) {
        return NextResponse.json({ message: 'Missing path or tag parameter' }, { status: 400 })
    }

    try {
        if (path) {
            await revalidatePath(path)
            console.log(`Revalidated path: ${path}`)
            return NextResponse.json({ revalidated: true, path, now: Date.now() })
        }

        if (tag) {
            await revalidateTag(tag)
            console.log(`Revalidated tag: ${tag}`)
            return NextResponse.json({ revalidated: true, tag, now: Date.now() })
        }

        return NextResponse.json({ message: 'No action taken' }, { status: 200 })

    } catch (err: any) {
        console.error('Error revalidating:', err);
        // If there is an error, Next.js will continue to show
        // the last successfully generated page
        return NextResponse.json({ message: 'Error revalidating', error: err.message }, { status: 500 })
    }
}
