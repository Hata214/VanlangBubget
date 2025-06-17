import { Metadata } from 'next'
import Link from 'next/link'
import PublicLayout from '@/components/layout/PublicLayout'
import { Cookie, ArrowLeft, Calendar, Mail, Shield, Database, Settings, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Separator } from '@/components/ui/Separator'
import { Badge } from '@/components/ui/Badge'
import { cookiesMetadata } from '../metadata'
import { useTranslations } from 'next-intl'

export const metadata: Metadata = cookiesMetadata

export default function CookiesPage() {
    const t = useTranslations('legal')
    const sections = [
        {
            id: 'introduction',
            title: '1. Giới thiệu về Cookie',
            icon: Info,
            content: 'Cookie là các tệp tin nhỏ được lưu trữ trên thiết bị của bạn khi truy cập VanLang Budget. Chúng giúp chúng tôi cải thiện trải nghiệm người dùng và cung cấp dịch vụ tốt hơn.'
        },
        {
            id: 'types-of-cookies',
            title: '2. Các loại Cookie chúng tôi sử dụng',
            icon: Database,
            content: [
                'Cookie cần thiết: Đảm bảo website hoạt động đúng cách (đăng nhập, bảo mật).',
                'Cookie hiệu suất: Thu thập thông tin về cách bạn sử dụng website.',
                'Cookie chức năng: Ghi nhớ các tùy chọn của bạn (ngôn ngữ, theme).',
                'Cookie phân tích: Giúp chúng tôi hiểu hành vi người dùng để cải thiện dịch vụ.'
            ]
        },
        {
            id: 'essential-cookies',
            title: '3. Cookie cần thiết',
            icon: Shield,
            content: [
                'Token xác thực (JWT): Duy trì phiên đăng nhập an toàn.',
                'CSRF Token: Bảo vệ khỏi các cuộc tấn công cross-site.',
                'Session ID: Quản lý phiên làm việc của người dùng.',
                'Security cookies: Đảm bảo tính bảo mật khi truyền tải dữ liệu.'
            ],
            highlight: true
        },
        {
            id: 'functional-cookies',
            title: '4. Cookie chức năng',
            icon: Settings,
            content: [
                'Ngôn ngữ: Ghi nhớ ngôn ngữ bạn chọn (Tiếng Việt/English).',
                'Theme: Lưu tùy chọn giao diện (Light/Dark mode).',
                'Tùy chọn hiển thị: Ghi nhớ cách bạn muốn hiển thị dữ liệu.',
                'Cài đặt thông báo: Lưu trữ các tùy chọn thông báo của bạn.'
            ]
        },
        {
            id: 'analytics-cookies',
            title: '5. Cookie phân tích',
            icon: Database,
            content: [
                'Thống kê truy cập: Đếm số lượng người dùng và trang được xem.',
                'Hành vi người dùng: Hiểu cách người dùng tương tác với ứng dụng.',
                'Hiệu suất: Theo dõi tốc độ tải trang và lỗi hệ thống.',
                'Cải thiện UX: Dữ liệu để tối ưu hóa trải nghiệm người dùng.'
            ]
        },
        {
            id: 'third-party-cookies',
            title: '6. Cookie bên thứ ba',
            icon: Database,
            content: [
                'Vercel Analytics: Theo dõi hiệu suất website (nếu được kích hoạt).',
                'CDN Services: Tối ưu hóa tốc độ tải trang.',
                'Font Services: Google Fonts hoặc các dịch vụ font khác.',
                'API Services: Cookie từ các dịch vụ API tích hợp.'
            ]
        },
        {
            id: 'cookie-management',
            title: '7. Quản lý Cookie',
            icon: Settings,
            content: [
                'Bạn có thể xóa cookie thông qua cài đặt trình duyệt.',
                'Tắt cookie có thể ảnh hưởng đến một số tính năng của website.',
                'Cookie cần thiết không thể tắt để đảm bảo bảo mật.',
                'Bạn có thể liên hệ với chúng tôi để biết thêm chi tiết.'
            ]
        },
        {
            id: 'data-retention',
            title: '8. Thời gian lưu trữ',
            icon: Calendar,
            content: [
                'Session cookies: Xóa khi đóng trình duyệt.',
                'Persistent cookies: Lưu trữ từ 30 ngày đến 1 năm.',
                'Authentication tokens: Hết hạn sau 7 ngày không hoạt động.',
                'Preference cookies: Lưu trữ lâu dài cho đến khi người dùng xóa.'
            ]
        }
    ]

    const cookieTypes = [
        {
            label: 'Cần thiết',
            color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            description: 'Không thể tắt'
        },
        {
            label: 'Chức năng',
            color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            description: 'Có thể tắt'
        },
        {
            label: 'Phân tích',
            color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            description: 'Có thể tắt'
        },
        {
            label: 'Bên thứ ba',
            color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
            description: 'Có thể tắt'
        }
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
                            <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                                <Cookie className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">
                                    {t('cookies.title')}
                                </h1>
                                <p className="text-muted-foreground">{t('cookies.subtitle')}</p>
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

                        {/* Cookie Types */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {cookieTypes.map((type, index) => (
                                <div key={index} className="text-center">
                                    <Badge className={`${type.color} mb-1`}>
                                        {type.label}
                                    </Badge>
                                    <p className="text-xs text-muted-foreground">{type.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="text-xl text-orange-600 dark:text-orange-400">
                                Chính sách Cookie – VanLang Budget
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                            {sections.map((section, index) => {
                                const IconComponent = section.icon
                                return (
                                    <div key={section.id} className={`mb-8 ${section.highlight ? 'p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800' : ''}`}>
                                        <div className="flex items-center space-x-3 mb-4">
                                            <div className={`p-2 rounded-lg ${section.highlight ? 'bg-orange-200 dark:bg-orange-800' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                                <IconComponent className={`h-5 w-5 ${section.highlight ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}`} />
                                            </div>
                                            <h3 className="text-lg font-semibold text-foreground">
                                                {section.title}
                                            </h3>
                                        </div>

                                        {Array.isArray(section.content) ? (
                                            <ul className="space-y-2 text-muted-foreground">
                                                {section.content.map((item, itemIndex) => (
                                                    <li key={itemIndex} className="flex items-start">
                                                        <span className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${section.highlight ? 'bg-orange-500' : 'bg-indigo-500'}`}></span>
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

                    {/* Browser Settings Card */}
                    <Card className="mb-8 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                        <CardHeader>
                            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center">
                                <Settings className="w-5 h-5 mr-2" />
                                Cài đặt Cookie trong trình duyệt
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-white dark:bg-blue-900/20 rounded-lg">
                                    <div className="w-8 h-8 mx-auto mb-2 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">Ch</span>
                                    </div>
                                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Chrome</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">Settings → Privacy → Cookies</p>
                                </div>
                                <div className="text-center p-4 bg-white dark:bg-blue-900/20 rounded-lg">
                                    <div className="w-8 h-8 mx-auto mb-2 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">Ff</span>
                                    </div>
                                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Firefox</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">Options → Privacy → Cookies</p>
                                </div>
                                <div className="text-center p-4 bg-white dark:bg-blue-900/20 rounded-lg">
                                    <div className="w-8 h-8 mx-auto mb-2 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">Sf</span>
                                    </div>
                                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Safari</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">Preferences → Privacy</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Warning Card */}
                    <Card className="mb-8 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800">
                        <CardContent className="p-6">
                            <div className="flex items-start space-x-3">
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                    <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                                        Lưu ý quan trọng
                                    </h3>
                                    <p className="text-yellow-700 dark:text-yellow-300">
                                        Việc tắt cookie có thể ảnh hưởng đến trải nghiệm sử dụng VanLang Budget.
                                        Một số tính năng như đăng nhập, lưu cài đặt, và bảo mật có thể không hoạt động đúng cách.
                                        Chúng tôi khuyến nghị chỉ tắt cookie không cần thiết.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Section */}
                    <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
                        <CardContent className="p-6">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-2">
                                    Liên hệ về Cookie
                                </h3>
                                <p className="text-orange-700 dark:text-orange-300 mb-4">
                                    Nếu bạn có thắc mắc về chính sách cookie hoặc cách chúng tôi sử dụng cookie
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Link href="/contact">
                                        <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-900/50">
                                            Trang liên hệ
                                        </Button>
                                    </Link>
                                    <a href="mailto:vanlangbudget@gmail.com">
                                        <Button className="bg-orange-600 hover:bg-orange-700 text-white">
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
                        <Link href="/legal/privacy">
                            <Button variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Chính sách bảo mật
                            </Button>
                        </Link>
                        <Link href="/legal">
                            <Button>
                                Tài liệu pháp lý
                                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </PublicLayout>
    )
} 