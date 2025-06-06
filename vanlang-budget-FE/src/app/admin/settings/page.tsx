'use client';

import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/Tabs';
import {
    Settings,
    Mail,
    Shield,
    Database,
    Bell,
    Globe,
    Server,
    Save,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Download,
    Upload,
    Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { adminService } from '@/services/adminService';

interface SystemSettings {
    general: {
        siteName: string;
        siteDescription: string;
        maintenanceMode: boolean;
        registrationEnabled: boolean;
        defaultLanguage: string;
        timezone: string;
    };
    security: {
        rateLimitWindow: number;
        rateLimitMax: number;
        sessionTimeout: number;
        passwordMinLength: number;
        requireEmailVerification: boolean;
        enableTwoFactor: boolean;
    };
    email: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        password: string;
        from: string;
        fromName: string;
    };
    notifications: {
        enableEmailNotifications: boolean;
        enablePushNotifications: boolean;
        notificationRetentionDays: number;
        emailTemplates: {
            welcome: string;
            passwordReset: string;
            emailVerification: string;
        };
    };
    backup: {
        autoBackupEnabled: boolean;
        backupFrequency: string;
        backupRetentionDays: number;
        lastBackupDate: string;
    };
}

export default function AdminSettingsPage() {
    const t = useTranslations();

    // State management - Initialize with empty state, will be loaded from backend
    const [settings, setSettings] = useState<SystemSettings | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [backing, setBacking] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [hasChanges, setHasChanges] = useState(false);

    // Load settings from backend
    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await adminService.getSystemSettings();

            if (response.status === 'success') {
                setSettings(response.data.settings);
                setHasChanges(false);
                toast.success('Tải cài đặt thành công');
            } else {
                throw new Error(response.message || 'Failed to load settings');
            }
        } catch (error: any) {
            console.error('Error loading settings:', error);
            toast.error(error.response?.data?.message || 'Không thể tải cài đặt hệ thống');
        } finally {
            setLoading(false);
        }
    };

    // Save settings to backend
    const saveSettings = async () => {
        if (!settings) {
            toast.error('Không có cài đặt để lưu');
            return;
        }

        try {
            setSaving(true);
            const response = await adminService.updateSystemSettings(settings);

            if (response.status === 'success') {
                setSettings(response.data.settings);
                setHasChanges(false);
                toast.success('Lưu cài đặt thành công');
            } else {
                throw new Error(response.message || 'Failed to save settings');
            }
        } catch (error: any) {
            console.error('Error saving settings:', error);
            toast.error(error.response?.data?.message || 'Không thể lưu cài đặt');
        } finally {
            setSaving(false);
        }
    };

    // Handle setting change
    const handleSettingChange = (section: keyof SystemSettings, key: string, value: any) => {
        if (!settings) return;

        setSettings(prev => prev ? ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }) : null);
        setHasChanges(true);
    };

    // Handle nested setting change (for email templates)
    const handleNestedSettingChange = (section: keyof SystemSettings, nestedKey: string, key: string, value: any) => {
        if (!settings) return;

        setSettings(prev => prev ? ({
            ...prev,
            [section]: {
                ...prev[section],
                [nestedKey]: {
                    ...(prev[section] as any)[nestedKey],
                    [key]: value
                }
            }
        }) : null);
        setHasChanges(true);
    };

    // Test email configuration with backend
    const testEmailConfig = async () => {
        if (!settings?.email) {
            toast.error('Không có cấu hình email để kiểm tra');
            return;
        }

        try {
            setTesting(true);
            const response = await adminService.testEmailConfig(settings.email);

            if (response.status === 'success') {
                toast.success(response.message || 'Cấu hình email hoạt động tốt');
            } else {
                throw new Error(response.message || 'Cấu hình email không hợp lệ');
            }
        } catch (error: any) {
            console.error('Error testing email config:', error);
            toast.error(error.response?.data?.message || 'Không thể kiểm tra cấu hình email');
        } finally {
            setTesting(false);
        }
    };

    // Create backup with backend
    const createBackup = async () => {
        try {
            setBacking(true);
            const response = await adminService.createBackup();

            // Create download link for the backup file
            const blob = new Blob([response.data], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vanlang-budget-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Tạo backup thành công');

            // Reload settings to update last backup date
            await loadSettings();
        } catch (error: any) {
            console.error('Error creating backup:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi tạo backup');
        } finally {
            setBacking(false);
        }
    };

    // Restore from backup with backend
    const restoreFromBackup = async (file: File) => {
        try {
            setRestoring(true);
            const response = await adminService.restoreFromBackup(file);

            if (response.status === 'success') {
                toast.success(response.message || 'Khôi phục backup thành công');
                // Reload settings after successful restore
                await loadSettings();
            } else {
                throw new Error(response.message || 'Không thể khôi phục backup');
            }
        } catch (error: any) {
            console.error('Error restoring backup:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi khôi phục backup');
        } finally {
            setRestoring(false);
        }
    };

    // Load data on component mount
    useEffect(() => {
        loadSettings();
    }, []);

    // Show error state if failed to load settings
    if (!loading && !settings) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Cài đặt Hệ thống</h1>
                        <p className="text-muted-foreground">
                            Quản lý cấu hình và thiết lập hệ thống - Kết nối với Backend APIs
                        </p>
                    </div>
                    <Button onClick={loadSettings} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Thử lại
                    </Button>
                </div>

                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-red-800">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Không thể tải cài đặt từ backend. Vui lòng kiểm tra kết nối và thử lại.</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (loading || !settings) {
        return (
            <div className="flex justify-center items-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Đang tải cài đặt từ server...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Cài đặt Hệ thống</h1>
                    <p className="text-muted-foreground">
                        Quản lý cấu hình và thiết lập hệ thống - Kết nối với Backend APIs
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={loadSettings}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Đang tải...' : 'Làm mới'}
                    </Button>
                    <Button
                        onClick={saveSettings}
                        disabled={!hasChanges || saving || loading}
                        size="sm"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                </div>
            </div>

            {/* Status indicators */}
            <div className="space-y-4">
                {/* Backend connection status */}
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="h-4 w-4" />
                            <span>Kết nối thành công với Backend APIs - Tất cả dữ liệu được đồng bộ thời gian thực</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Warning for unsaved changes */}
                {hasChanges && (
                    <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-orange-800">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Bạn có thay đổi chưa được lưu. Nhớ lưu lại trước khi rời khỏi trang.</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Settings Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="general" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Chung
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Bảo mật
                    </TabsTrigger>
                    <TabsTrigger value="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Thông báo
                    </TabsTrigger>
                    <TabsTrigger value="backup" className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Backup
                    </TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cài đặt chung</CardTitle>
                            <CardDescription>
                                Cấu hình cơ bản của hệ thống
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="siteName">Tên website</Label>
                                    <Input
                                        id="siteName"
                                        value={settings.general.siteName}
                                        onChange={(e) => handleSettingChange('general', 'siteName', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="defaultLanguage">Ngôn ngữ mặc định</Label>
                                    <Select
                                        value={settings.general.defaultLanguage}
                                        onValueChange={(value) => handleSettingChange('general', 'defaultLanguage', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="vi">Tiếng Việt</SelectItem>
                                            <SelectItem value="en">English</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="siteDescription">Mô tả website</Label>
                                <Textarea
                                    id="siteDescription"
                                    value={settings.general.siteDescription}
                                    onChange={(e) => handleSettingChange('general', 'siteDescription', e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="timezone">Múi giờ</Label>
                                <Select
                                    value={settings.general.timezone}
                                    onValueChange={(value) => handleSettingChange('general', 'timezone', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Asia/Ho_Chi_Minh">Việt Nam (UTC+7)</SelectItem>
                                        <SelectItem value="UTC">UTC (UTC+0)</SelectItem>
                                        <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                                        <SelectItem value="Europe/London">London (UTC+0)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Chế độ bảo trì</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Tạm thời tắt website để bảo trì
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.general.maintenanceMode}
                                    onCheckedChange={(checked) => handleSettingChange('general', 'maintenanceMode', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Cho phép đăng ký</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Người dùng mới có thể tạo tài khoản
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.general.registrationEnabled}
                                    onCheckedChange={(checked) => handleSettingChange('general', 'registrationEnabled', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="security" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cài đặt bảo mật</CardTitle>
                            <CardDescription>
                                Cấu hình bảo mật và giới hạn truy cập
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="rateLimitMax">Giới hạn request/15 phút</Label>
                                    <Input
                                        id="rateLimitMax"
                                        type="number"
                                        value={settings.security.rateLimitMax}
                                        onChange={(e) => handleSettingChange('security', 'rateLimitMax', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sessionTimeout">Thời gian session (giây)</Label>
                                    <Input
                                        id="sessionTimeout"
                                        type="number"
                                        value={settings.security.sessionTimeout / 1000}
                                        onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value) * 1000)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="passwordMinLength">Độ dài mật khẩu tối thiểu</Label>
                                <Input
                                    id="passwordMinLength"
                                    type="number"
                                    min="6"
                                    max="20"
                                    value={settings.security.passwordMinLength}
                                    onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Yêu cầu xác thực email</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Người dùng phải xác thực email khi đăng ký
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.security.requireEmailVerification}
                                    onCheckedChange={(checked) => handleSettingChange('security', 'requireEmailVerification', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Bật xác thực 2 yếu tố</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Yêu cầu mã OTP khi đăng nhập
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.security.enableTwoFactor}
                                    onCheckedChange={(checked) => handleSettingChange('security', 'enableTwoFactor', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Email Settings */}
                <TabsContent value="email" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cấu hình Email</CardTitle>
                            <CardDescription>
                                Thiết lập SMTP để gửi email
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="emailHost">SMTP Host</Label>
                                    <Input
                                        id="emailHost"
                                        value={settings.email.host}
                                        onChange={(e) => handleSettingChange('email', 'host', e.target.value)}
                                        placeholder="smtp.gmail.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="emailPort">SMTP Port</Label>
                                    <Input
                                        id="emailPort"
                                        type="number"
                                        value={settings.email.port}
                                        onChange={(e) => handleSettingChange('email', 'port', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="emailUser">Username</Label>
                                    <Input
                                        id="emailUser"
                                        value={settings.email.user}
                                        onChange={(e) => handleSettingChange('email', 'user', e.target.value)}
                                        placeholder="your-email@gmail.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="emailPassword">Password</Label>
                                    <Input
                                        id="emailPassword"
                                        type="password"
                                        value={settings.email.password}
                                        onChange={(e) => handleSettingChange('email', 'password', e.target.value)}
                                        placeholder="App password"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="emailFrom">Email gửi</Label>
                                    <Input
                                        id="emailFrom"
                                        value={settings.email.from}
                                        onChange={(e) => handleSettingChange('email', 'from', e.target.value)}
                                        placeholder="noreply@vanlangbudget.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="emailFromName">Tên người gửi</Label>
                                    <Input
                                        id="emailFromName"
                                        value={settings.email.fromName}
                                        onChange={(e) => handleSettingChange('email', 'fromName', e.target.value)}
                                        placeholder="VanLang Budget"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Kết nối bảo mật (SSL/TLS)</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Sử dụng kết nối mã hóa
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.email.secure}
                                    onCheckedChange={(checked) => handleSettingChange('email', 'secure', checked)}
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={testEmailConfig}
                                    variant="outline"
                                    disabled={testing || loading}
                                >
                                    <Mail className={`h-4 w-4 mr-2 ${testing ? 'animate-pulse' : ''}`} />
                                    {testing ? 'Đang kiểm tra...' : 'Kiểm tra cấu hình'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Settings */}
                <TabsContent value="notifications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cài đặt thông báo</CardTitle>
                            <CardDescription>
                                Quản lý thông báo và email templates
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Bật thông báo email</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Gửi thông báo qua email cho người dùng
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.notifications.enableEmailNotifications}
                                    onCheckedChange={(checked) => handleSettingChange('notifications', 'enableEmailNotifications', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Bật push notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Gửi thông báo đẩy trên trình duyệt
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.notifications.enablePushNotifications}
                                    onCheckedChange={(checked) => handleSettingChange('notifications', 'enablePushNotifications', checked)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notificationRetention">Thời gian lưu thông báo (ngày)</Label>
                                <Input
                                    id="notificationRetention"
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={settings.notifications.notificationRetentionDays}
                                    onChange={(e) => handleSettingChange('notifications', 'notificationRetentionDays', parseInt(e.target.value))}
                                />
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-lg font-medium">Email Templates</h4>

                                <div className="space-y-2">
                                    <Label htmlFor="welcomeTemplate">Email chào mừng</Label>
                                    <Textarea
                                        id="welcomeTemplate"
                                        value={settings.notifications.emailTemplates.welcome}
                                        onChange={(e) => handleNestedSettingChange('notifications', 'emailTemplates', 'welcome', e.target.value)}
                                        rows={3}
                                        placeholder="Nội dung email chào mừng người dùng mới..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="passwordResetTemplate">Email đặt lại mật khẩu</Label>
                                    <Textarea
                                        id="passwordResetTemplate"
                                        value={settings.notifications.emailTemplates.passwordReset}
                                        onChange={(e) => handleNestedSettingChange('notifications', 'emailTemplates', 'passwordReset', e.target.value)}
                                        rows={3}
                                        placeholder="Nội dung email đặt lại mật khẩu..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="emailVerificationTemplate">Email xác thực</Label>
                                    <Textarea
                                        id="emailVerificationTemplate"
                                        value={settings.notifications.emailTemplates.emailVerification}
                                        onChange={(e) => handleNestedSettingChange('notifications', 'emailTemplates', 'emailVerification', e.target.value)}
                                        rows={3}
                                        placeholder="Nội dung email xác thực tài khoản..."
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Backup Settings */}
                <TabsContent value="backup" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Backup & Khôi phục</CardTitle>
                            <CardDescription>
                                Quản lý backup dữ liệu hệ thống
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Tự động backup</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Tự động tạo backup theo lịch trình
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.backup.autoBackupEnabled}
                                    onCheckedChange={(checked) => handleSettingChange('backup', 'autoBackupEnabled', checked)}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="backupFrequency">Tần suất backup</Label>
                                    <Select
                                        value={settings.backup.backupFrequency}
                                        onValueChange={(value) => handleSettingChange('backup', 'backupFrequency', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Hàng ngày</SelectItem>
                                            <SelectItem value="weekly">Hàng tuần</SelectItem>
                                            <SelectItem value="monthly">Hàng tháng</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="backupRetention">Thời gian lưu backup (ngày)</Label>
                                    <Input
                                        id="backupRetention"
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={settings.backup.backupRetentionDays}
                                        onChange={(e) => handleSettingChange('backup', 'backupRetentionDays', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            {settings.backup.lastBackupDate && (
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-green-800">
                                        <CheckCircle className="h-4 w-4" />
                                        <span>Backup cuối cùng: {new Date(settings.backup.lastBackupDate).toLocaleString('vi-VN')}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 pt-4">
                                <Button
                                    onClick={createBackup}
                                    variant="outline"
                                    disabled={backing || loading}
                                >
                                    <Download className={`h-4 w-4 mr-2 ${backing ? 'animate-bounce' : ''}`} />
                                    {backing ? 'Đang tạo backup...' : 'Tạo backup ngay'}
                                </Button>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
                                                    toast.error('Vui lòng chọn file JSON hợp lệ');
                                                    return;
                                                }
                                                restoreFromBackup(file);
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={restoring || loading}
                                    />
                                    <Button
                                        variant="outline"
                                        disabled={restoring || loading}
                                    >
                                        <Upload className={`h-4 w-4 mr-2 ${restoring ? 'animate-pulse' : ''}`} />
                                        {restoring ? 'Đang khôi phục...' : 'Khôi phục backup'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
