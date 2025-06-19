import React from 'react';

/**
 * Interface cho dữ liệu cổ phiếu từ backend
 */
interface StockData {
  symbol: string;
  price: {
    current: number;
    formatted: string;
    change: number;
    pct_change: number;
    pct_change_formatted: string;
  };
  volume: {
    raw: number;
    formatted: string;
  };
  analysis: {
    trend: string;
    analysis: string;
    recommendation: string;
    technical_indicators?: {
      price_change: number;
      pct_change: number;
      volume: number;
      volume_level: string;
    };
  };
  source: string;
  timestamp: string;
}

/**
 * Kiểm tra xem tin nhắn có phải là response cổ phiếu không
 */
export const isStockMessage = (message: any): boolean => {
  return message.metadata?.intent === 'stock_query' && message.metadata?.symbol;
};

/**
 * Trích xuất dữ liệu cổ phiếu từ metadata
 */
export const extractStockData = (message: any): StockData | null => {
  if (!isStockMessage(message)) return null;

  const { metadata } = message;

  // Tạo dữ liệu cổ phiếu từ metadata
  return {
    symbol: metadata.symbol,
    price: {
      current: metadata.price || 0,
      formatted: formatPrice(metadata.price || 0),
      change: metadata.change || 0,
      pct_change: metadata.pct_change || 0,
      pct_change_formatted: formatPctChange(metadata.pct_change || 0)
    },
    volume: {
      raw: metadata.volume || 0,
      formatted: formatVolume(metadata.volume || 0)
    },
    analysis: {
      trend: metadata.analysis || 'neutral',
      analysis: extractAnalysisFromText(message.text),
      recommendation: extractRecommendationFromText(message.text)
    },
    source: metadata.source || 'TCBS',
    timestamp: new Date().toISOString()
  };
};

/**
 * Format giá cổ phiếu theo VND
 */
const formatPrice = (price: number): string => {
  if (!price || price === 0) return 'N/A';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

/**
 * Format phần trăm thay đổi
 */
const formatPctChange = (pctChange: number): string => {
  if (pctChange === null || pctChange === undefined) return 'N/A';
  const sign = pctChange >= 0 ? '+' : '';
  const emoji = pctChange >= 0 ? '📈' : '📉';
  return `${emoji} ${sign}${pctChange.toFixed(2)}%`;
};

/**
 * Format khối lượng giao dịch
 */
const formatVolume = (volume: number): string => {
  if (!volume || volume === 0) return 'N/A';
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toLocaleString('vi-VN');
};

/**
 * Trích xuất phân tích từ text response
 */
const extractAnalysisFromText = (text: string): string => {
  const analysisMatch = text.match(/🔍 \*\*Phân tích:\*\*\n(.+?)\n\n/s);
  return analysisMatch ? analysisMatch[1] : 'Không có phân tích';
};

/**
 * Trích xuất khuyến nghị từ text response
 */
const extractRecommendationFromText = (text: string): string => {
  const recommendationMatch = text.match(/💡 \*\*Khuyến nghị:\*\* (.+?)\n\n/s);
  return recommendationMatch ? recommendationMatch[1] : 'Không có khuyến nghị';
};

/**
 * Component hiển thị thông tin cổ phiếu - KHÔNG thay đổi giao diện hiện tại
 * Chỉ format text response để hiển thị đẹp hơn trong chat bubble hiện có
 */
export const StockMessageCard: React.FC<{ stockData: StockData }> = ({ stockData }) => {
  // Trả về text đã format sẵn thay vì component phức tạp
  // Để không thay đổi giao diện hiện tại của chat
  const { symbol, price, volume, analysis } = stockData;

  const trendEmoji = {
    'strong_bullish': '🚀',
    'bullish': '📈',
    'neutral': '➡️',
    'bearish': '📉',
    'strong_bearish': '💥'
  };

  const emoji = trendEmoji[analysis.trend as keyof typeof trendEmoji] || '📊';

  const formattedText = `${emoji} **${symbol}** - ${price.formatted}

📊 **Thay đổi:** ${price.pct_change_formatted}
📈 **Khối lượng:** ${volume.formatted}

🔍 **Phân tích:** ${analysis.analysis}

💡 **Khuyến nghị:** ${analysis.recommendation}

💬 *Thông tin tham khảo, không phải lời khuyên đầu tư*`;

  return (
    <div className="text-sm whitespace-pre-wrap">
      {formattedText}
    </div>
  );
};

/**
 * Component wrapper để hiển thị tin nhắn cổ phiếu hoặc tin nhắn thường
 */
export const MessageContent: React.FC<{ message: any }> = ({ message }) => {
  const stockData = extractStockData(message);

  if (stockData) {
    return <StockMessageCard stockData={stockData} />;
  }

  // Hiển thị tin nhắn thường
  return (
    <div className="text-sm whitespace-pre-wrap">
      {message.text}
    </div>
  );
};
