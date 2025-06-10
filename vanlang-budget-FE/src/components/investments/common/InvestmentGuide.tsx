'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/Card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Star } from 'lucide-react';

export default function InvestmentGuide() {
    const t = useTranslations('Investments');

    return (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <CardTitle className="text-xl text-blue-800">Hướng dẫn đầu tư</CardTitle>
                </div>
                <CardDescription className="text-blue-600">
                    Tìm hiểu cách quản lý danh mục đầu tư của bạn một cách hiệu quả
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="text-blue-700 hover:text-blue-900">
                            Các loại đầu tư
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-700">
                            <ul className="list-disc pl-5 space-y-1">
                                <li><span className="font-medium">Cổ phiếu:</span> Đầu tư vào các công ty niêm yết trên thị trường chứng khoán</li>
                                <li><span className="font-medium">Vàng:</span> Đầu tư vào vàng miếng, vàng SJC hoặc các sản phẩm vàng khác</li>
                                <li><span className="font-medium">Tiền điện tử:</span> Đầu tư vào các đồng tiền số như Bitcoin, Ethereum</li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2">
                        <AccordionTrigger className="text-blue-700 hover:text-blue-900">
                            Cách thêm khoản đầu tư mới
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-700">
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Chọn tab <span className="font-medium">"Thêm đầu tư"</span></li>
                                <li>Chọn loại đầu tư phù hợp (cổ phiếu, vàng, crypto...)</li>
                                <li>Nhập tên tài sản và mã ký hiệu (nếu có)</li>
                                <li>Nhập giá hiện tại của một đơn vị tài sản</li>
                                <li>Nhập số lượng đã mua và ngày mua</li>
                                <li>Điền phí giao dịch nếu có</li>
                                <li>Thêm ghi chú để dễ theo dõi (không bắt buộc)</li>
                                <li>Nhấn <span className="font-medium">"Thêm đầu tư"</span> để lưu</li>
                            </ol>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3">
                        <AccordionTrigger className="text-blue-700 hover:text-blue-900">
                            Theo dõi hiệu suất đầu tư
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-700">
                            <p className="mb-2">
                                Hệ thống sẽ tự động tính toán hiệu suất đầu tư của bạn dựa trên:
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><span className="font-medium">Giá mua:</span> Giá ban đầu khi bạn mua tài sản</li>
                                <li><span className="font-medium">Giá hiện tại:</span> Giá mới nhất của tài sản (cập nhật theo thời gian thực cho một số loại tài sản)</li>
                                <li><span className="font-medium">Lợi nhuận/Lỗ:</span> Chênh lệch giữa giá trị hiện tại và giá trị ban đầu</li>
                                <li><span className="font-medium">ROI (%):</span> Tỷ lệ % lợi nhuận trên vốn đầu tư</li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-4">
                        <AccordionTrigger className="text-blue-700 hover:text-blue-900">
                            Các mẹo quản lý đầu tư
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-700">
                            <ul className="list-disc pl-5 space-y-1">
                                <li><span className="font-medium">Cập nhật thường xuyên:</span> Cập nhật giá hiện tại của tài sản thường xuyên để theo dõi chính xác</li>
                                <li><span className="font-medium">Đa dạng hóa:</span> Đầu tư vào nhiều loại tài sản khác nhau để giảm thiểu rủi ro</li>
                                <li><span className="font-medium">Ghi chép chi tiết:</span> Thêm ghi chú về lý do đầu tư, chiến lược và mục tiêu giá</li>
                                <li><span className="font-medium">Lên kế hoạch dài hạn:</span> Đặt mục tiêu rõ ràng cho từng khoản đầu tư</li>
                                <li><span className="font-medium">Phân tích định kỳ:</span> Xem xét hiệu suất danh mục đầu tư định kỳ và điều chỉnh nếu cần</li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}
