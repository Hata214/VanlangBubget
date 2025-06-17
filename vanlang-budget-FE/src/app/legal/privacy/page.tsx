import { Metadata } from 'next'
import Link from 'next/link'
import { privacyMetadata } from '../metadata'

export const metadata: Metadata = privacyMetadata
import PublicLayout from '@/components/layout/PublicLayout'
import { Shield, ArrowLeft, Calendar, Mail, Lock, Database, Eye, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Separator } from '@/components/ui/Separator'
import { Badge } from '@/components/ui/Badge'
import { useTranslations } from 'next-intl'

export default function PrivacyPage() {
    const t = useTranslations('legal')
    const sections = [
        {
            id: 'introduction',
            title: '1. Giới thiệu',
            icon: Shield,
            content: 'Ứng dụng VanLang Budget cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của người dùng. Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn.'
        },
        {
            id: 'data-collection',
            title: '2. Thông tin chúng tôi thu thập',
            icon: Database,
            content: [
                'Thông tin cá nhân: họ tên, email, mật khẩu, số điện thoại (nếu có).',
                'Thông tin tài chính: chi tiêu, thu nhập, ngân sách, khoản vay, đầu tư.',
                'Thông tin thiết bị: IP, loại trình duyệt, thông tin đăng nhập.',
                'Lịch sử sử dụng: thời gian đăng nhập, thao tác người dùng.'
            ]
        },
        {
            id: 'usage-purpose',
            title: '3. Mục đích sử dụng',
            icon: Eye,
            content: [
                'Cung cấp và vận hành dịch vụ quản lý tài chính cá nhân.',
                'Gửi thông báo, nhắc nhở (ngân sách, khoản vay…).',
                'Cải thiện trải nghiệm người dùng và hỗ trợ kỹ thuật.',
                'Phân tích số liệu ẩn danh phục vụ nghiên cứu nội bộ.'
            ]
        },
        {
            id: 'data-protection',
            title: '4. Bảo vệ thông tin cá nhân',
            icon: Lock,
            content: [
                'Mật khẩu người dùng được mã hóa bằng thuật toán bcrypt.',
                'Dữ liệu truyền tải sử dụng giao thức HTTPS bảo mật.',
                'Token xác thực (JWT) được sử dụng để đảm bảo truy cập an toàn.'
            ],
            highlight: true
        },
        {
            id: 'user-rights',
            title: '5. Quyền của người dùng',
            icon: UserCheck,
            content: [
                'Có quyền truy cập, chỉnh sửa hoặc xóa thông tin cá nhân của mình.',
                'Có thể yêu cầu xuất toàn bộ dữ liệu cá nhân.',
                'Có thể yêu cầu xóa vĩnh viễn tài khoản và dữ liệu.'
            ]
        },
        {
            id: 'data-sharing',
            title: '6. Lưu trữ và chia sẻ dữ liệu',
            icon: Database,
            content: [
                'Dữ liệu lưu trữ tại máy chủ an toàn của chúng tôi.',
                'Không chia sẻ thông tin cá nhân cho bên thứ ba, trừ khi có yêu cầu từ cơ quan pháp luật.',
                'Dữ liệu có thể được sử dụng ở dạng ẩn danh cho mục đích thống kê.'
            ]
        },
        {
            id: 'policy-changes',
            title: '7. Thay đổi chính sách',
            icon: Shield,
            content: 'Chúng tôi có quyền thay đổi chính sách bảo mật bất kỳ lúc nào. Người dùng sẽ được thông báo nếu có thay đổi quan trọng.'
        }
    ]

    const securityFeatures = [
        { label: 'Mã hóa bcrypt', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
        { label: 'HTTPS SSL', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
        { label: 'JWT Token', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
        { label: 'Dữ liệu ẩn danh', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' }
    ]

    return (
        <PublicLayout>
            <div className="min-h-screen py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link href="/legal" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t('backToLegal')}
                        </Link>

                        <div className="flex items-center space-x-3 mb-4">
                            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                                <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">
                                    {t('privacy.title')}
                                </h1>
                                <p className="text-muted-foreground">{t('privacy.subtitle')}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                Cập nhật lần cuối: 2025
                            </div>
                            <div className="flex items-center">
                                <Mail className="w-4 h-4 mr-1" />
                                vanlangbudget@gmail.com
                            </div>
                        </div>

                        {/* Security Features */}
                        <div className="flex flex-wrap gap-2">
                            {securityFeatures.map((feature, index) => (
                                <Badge key={index} className={feature.color}>
                                    {feature.label}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="text-xl text-green-600 dark:text-green-400">
                                Chính sách Bảo mật – Ứng dụng VanLang Budget
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                            {sections.map((section, index) => {
                                const IconComponent = section.icon
                                return (
                                    <div key={section.id} className={`mb-8 ${section.highlight ? 'p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800' : ''}`}>
                                        <div className="flex items-center space-x-3 mb-4">
                                            <div className={`p-2 rounded-lg ${section.highlight ? 'bg-green-200 dark:bg-green-800' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                                <IconComponent className={`h-5 w-5 ${section.highlight ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`} />
                                            </div>
                                            <h3 className="text-lg font-semibold text-foreground">
                                                {section.title}
                                            </h3>
                                        </div>

                                        {Array.isArray(section.content) ? (
                                            <ul className="space-y-2 text-muted-foreground">
                                                {section.content.map((item, itemIndex) => (
                                                    <li key={itemIndex} className="flex items-start">
                                                        <span className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${section.highlight ? 'bg-green-500' : 'bg-indigo-500'}`}></span>
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-muted-foreground leading-relaxed">
                                                {section.content}
                                            </p>
                                        )}

                                        {index < sections.length - 1 && !section.highlight && <Separator className="mt-6" />}
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>

                    {/* Data Rights Card */}
                    <Card className="mb-8 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                        <CardHeader>
                            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center">
                                <UserCheck className="w-5 h-5 mr-2" />
                                Quyền của bạn với dữ liệu cá nhân
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-white dark:bg-blue-900/20 rounded-lg">
                                    <Eye className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Truy cập</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">Xem dữ liệu của bạn</p>
                                </div>
                                <div className="text-center p-4 bg-white dark:bg-blue-900/20 rounded-lg">
                                    <Database className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Xuất dữ liệu</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">Tải về toàn bộ dữ liệu</p>
                                </div>
                                <div className="text-center p-4 bg-white dark:bg-blue-900/20 rounded-lg">
                                    <Shield className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Xóa dữ liệu</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">Xóa vĩnh viễn tài khoản</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Section */}
                    <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                        <CardContent className="p-6">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                                    Liên hệ về bảo mật
                                </h3>
                                <p className="text-green-700 dark:text-green-300 mb-4">
                                    Nếu bạn có thắc mắc về chính sách bảo mật hoặc cách chúng tôi xử lý dữ liệu của bạn
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Link href="/contact">
                                        <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/50">
                                            Trang liên hệ
                                        </Button>
                                    </Link>
                                    <a href="mailto:vanlangbudget@gmail.com">
                                        <Button className="bg-green-600 hover:bg-green-700 text-white">
                                            <Mail className="w-4 h-4 mr-2" />
                                            Gửi email
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Navigation */}
                    <div className="flex justify-between items-center mt-8 pt-8 border-t border-border">
                        <Link href="/legal/terms">
                            <Button variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Điều khoản sử dụng
                            </Button>
                        </Link>
                        <Link href="/legal/cookies">
                            <Button>
                                Chính sách Cookie
                                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </PublicLayout>
    )
} 