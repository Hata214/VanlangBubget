/**
 * 🔍 Query Processing Engine - Theo kiến trúc Mermaid Diagram
 * Xử lý truy vấn theo mô hình Funnel Search (Level 1 → Level 2 → Level 3)
 */

import logger from '../utils/logger.js';

class QueryProcessingEngine {
    constructor() {
        this.timePatterns = this.initializeTimePatterns();
        this.amountPatterns = this.initializeAmountPatterns();
        this.categoryMapping = this.initializeCategoryMapping();
        this.aggregationPatterns = this.initializeAggregationPatterns();
        this.sortPatterns = this.initializeSortPatterns();
    }

    /**
     * 🎯 Main Query Analysis - Entry Point
     */
    async analyzeQuery(message, intent) {
        const normalizedMessage = message.toLowerCase().trim();

        logger.info('Query Processing Engine - Starting analysis', {
            message: normalizedMessage,
            intent
        });

        const analysis = {
            intent,
            timeAnalysis: this.analyzeTime(normalizedMessage),
            amountAnalysis: this.analyzeAmount(normalizedMessage),
            categoryAnalysis: this.analyzeCategory(normalizedMessage),
            aggregationAnalysis: this.analyzeAggregation(normalizedMessage),
            sortAnalysis: this.analyzeSort(normalizedMessage),
            combinedQuery: null
        };

        // Build combined MongoDB query
        analysis.combinedQuery = this.buildMongoQuery(analysis);

        logger.info('Query Processing Engine - Analysis complete', {
            analysis: {
                hasTimeFilter: !!analysis.timeAnalysis.type,
                hasAmountFilter: !!analysis.amountAnalysis.type,
                hasCategoryFilter: !!analysis.categoryAnalysis.level1,
                hasAggregation: !!analysis.aggregationAnalysis.type,
                hasSort: !!analysis.sortAnalysis.type
            }
        });

        return analysis;
    }

    /**
     * ⏰ Time Analysis - Level 1-2
     */
    analyzeTime(message) {
        const timeAnalysis = {
            type: null,
            period: null,
            mongoFilter: null,
            level: 0
        };

        // Level 1: Basic time periods
        for (const [type, patterns] of Object.entries(this.timePatterns.level1)) {
            if (patterns.some(pattern => message.includes(pattern))) {
                timeAnalysis.type = type;
                timeAnalysis.level = 1;
                timeAnalysis.mongoFilter = this.buildTimeFilter(type);
                break;
            }
        }

        // Level 2: Custom ranges
        if (!timeAnalysis.type) {
            const customRange = this.extractCustomTimeRange(message);
            if (customRange) {
                timeAnalysis.type = 'custom_range';
                timeAnalysis.level = 2;
                timeAnalysis.period = customRange;
                timeAnalysis.mongoFilter = {
                    date: {
                        $gte: customRange.start,
                        $lte: customRange.end
                    }
                };
            }
        }

        return timeAnalysis;
    }

    /**
     * 💰 Amount Analysis - Level 1-3
     */
    analyzeAmount(message) {
        const amountAnalysis = {
            type: null,
            value: null,
            range: null,
            mongoFilter: null,
            level: 0
        };

        // Level 1: Basic amount queries
        for (const [type, patterns] of Object.entries(this.amountPatterns.level1)) {
            if (patterns.some(pattern => message.includes(pattern))) {
                amountAnalysis.type = type;
                amountAnalysis.level = 1;
                break;
            }
        }

        // Level 2: Specific amount comparisons
        if (!amountAnalysis.type) {
            const amountComparison = this.extractAmountComparison(message);
            if (amountComparison) {
                amountAnalysis.type = amountComparison.type;
                amountAnalysis.value = amountComparison.value;
                amountAnalysis.level = 2;
                amountAnalysis.mongoFilter = this.buildAmountFilter(amountComparison);
            }
        }

        // Level 3: Amount ranges
        if (!amountAnalysis.type) {
            const amountRange = this.extractAmountRange(message);
            if (amountRange) {
                amountAnalysis.type = 'amount_range';
                amountAnalysis.range = amountRange;
                amountAnalysis.level = 3;
                amountAnalysis.mongoFilter = {
                    amount: {
                        $gte: amountRange.min,
                        $lte: amountRange.max
                    }
                };
            }
        }

        return amountAnalysis;
    }

    /**
     * 🏷️ Category Analysis - Funnel Model (Level 1 → Level 2 → Level 3)
     */
    analyzeCategory(message) {
        const categoryAnalysis = {
            level1: null,      // Main category
            level2: null,      // Subcategory
            level3: null,      // Specific item
            mongoFilter: null,
            funnelPath: []
        };

        // Level 1: Main Categories
        for (const [mainCategory, data] of Object.entries(this.categoryMapping.level1)) {
            if (data.patterns.some(pattern => message.includes(pattern))) {
                categoryAnalysis.level1 = mainCategory;
                categoryAnalysis.funnelPath.push(`Level1: ${mainCategory}`);

                // Level 2: Subcategories
                for (const [subCategory, subData] of Object.entries(data.subcategories)) {
                    if (subData.patterns.some(pattern => message.includes(pattern))) {
                        categoryAnalysis.level2 = subCategory;
                        categoryAnalysis.funnelPath.push(`Level2: ${subCategory}`);

                        // Level 3: Specific Items
                        for (const [specificItem, specificPatterns] of Object.entries(subData.specificItems || {})) {
                            if (specificPatterns.some(pattern => message.includes(pattern))) {
                                categoryAnalysis.level3 = specificItem;
                                categoryAnalysis.funnelPath.push(`Level3: ${specificItem}`);
                                break;
                            }
                        }
                        break;
                    }
                }
                break;
            }
        }

        // Build MongoDB filter based on funnel level
        categoryAnalysis.mongoFilter = this.buildCategoryFilter(categoryAnalysis);

        return categoryAnalysis;
    }

    /**
     * 📊 Aggregation Analysis
     */
    analyzeAggregation(message) {
        const aggregationAnalysis = {
            type: null,
            mongoAggregation: null
        };

        for (const [type, patterns] of Object.entries(this.aggregationPatterns)) {
            if (patterns.some(pattern => message.includes(pattern))) {
                aggregationAnalysis.type = type;
                aggregationAnalysis.mongoAggregation = this.buildAggregationPipeline(type);
                break;
            }
        }

        return aggregationAnalysis;
    }

    /**
     * 🔄 Sort Analysis
     */
    analyzeSort(message) {
        const sortAnalysis = {
            type: null,
            mongoSort: null
        };

        for (const [type, patterns] of Object.entries(this.sortPatterns)) {
            if (patterns.some(pattern => message.includes(pattern))) {
                sortAnalysis.type = type;
                sortAnalysis.mongoSort = this.buildSortQuery(type);
                break;
            }
        }

        return sortAnalysis;
    }

    /**
     * 🏗️ MongoDB Query Builder Engine
     */
    buildMongoQuery(analysis) {
        const query = {
            filter: {},
            sort: {},
            aggregation: null,
            limit: null
        };

        // Combine filters
        if (analysis.timeAnalysis.mongoFilter) {
            Object.assign(query.filter, analysis.timeAnalysis.mongoFilter);
        }

        if (analysis.amountAnalysis.mongoFilter) {
            Object.assign(query.filter, analysis.amountAnalysis.mongoFilter);
        }

        if (analysis.categoryAnalysis.mongoFilter) {
            Object.assign(query.filter, analysis.categoryAnalysis.mongoFilter);
        }

        // Add sort
        if (analysis.sortAnalysis.mongoSort) {
            Object.assign(query.sort, analysis.sortAnalysis.mongoSort);
        }

        // Add aggregation
        if (analysis.aggregationAnalysis.mongoAggregation) {
            query.aggregation = analysis.aggregationAnalysis.mongoAggregation;
        }

        return query;
    }

    /**
     * 🔧 Helper Methods - Initialize Patterns
     */
    initializeTimePatterns() {
        return {
            level1: {
                today: ['hôm nay', 'today', 'ngày hôm nay'],
                this_week: ['tuần này', 'this week', 'tuần hiện tại'],
                this_month: ['tháng này', 'this month', 'tháng hiện tại'],
                this_year: ['năm này', 'this year', 'năm hiện tại'],
                yesterday: ['hôm qua', 'yesterday', 'ngày hôm qua'],
                last_week: ['tuần trước', 'last week', 'tuần vừa rồi'],
                last_month: ['tháng trước', 'last month', 'tháng vừa rồi'],
                last_year: ['năm trước', 'last year', 'năm vừa rồi']
            }
        };
    }

    initializeAmountPatterns() {
        return {
            level1: {
                max_amount: ['lớn nhất', 'cao nhất', 'highest', 'maximum', 'max'],
                min_amount: ['nhỏ nhất', 'thấp nhất', 'lowest', 'minimum', 'min'],
                above_amount: ['trên', 'lớn hơn', 'above', 'greater than', 'over'],
                below_amount: ['dưới', 'nhỏ hơn', 'below', 'less than', 'under']
            }
        };
    }

    initializeCategoryMapping() {
        return {
            level1: {
                savings_income: {
                    patterns: ['tiền tiết kiệm', 'tiết kiệm của tôi', 'tiết kiệm'],
                    subcategories: {
                        personal_savings: {
                            patterns: ['tiết kiệm cá nhân', 'để dành', 'dành dụm'],
                            specificItems: {}
                        }
                    }
                },
                savings: {
                    patterns: ['gửi tiền ngân hàng', 'tiền gửi ngân hàng', 'gửi ngân hàng', 'tiết kiệm ngân hàng', 'tiền gửi'],
                    subcategories: {
                        bank_savings: {
                            patterns: ['ngân hàng', 'bank', 'gửi tiết kiệm'],
                            specificItems: {}
                        }
                    }
                },
                stock: {
                    patterns: ['cổ phiếu', 'chứng khoán', 'stock'],
                    subcategories: {
                        vietnam_stock: {
                            patterns: ['cổ phiếu việt nam', 'vnindex'],
                            specificItems: {}
                        }
                    }
                },
                gold: {
                    patterns: ['vàng', 'gold', 'kim loại quý'],
                    subcategories: {
                        gold_jewelry: {
                            patterns: ['vàng trang sức', 'jewelry'],
                            specificItems: {}
                        },
                        gold_bar: {
                            patterns: ['vàng miếng', 'gold bar'],
                            specificItems: {}
                        }
                    }
                },
                realestate: {
                    patterns: ['bất động sản', 'đất đai', 'nhà đất', 'real estate'],
                    subcategories: {
                        land: {
                            patterns: ['đất', 'land'],
                            specificItems: {}
                        },
                        house: {
                            patterns: ['nhà', 'house'],
                            specificItems: {}
                        }
                    }
                },
                food_dining: {
                    patterns: ['ăn uống', 'food', 'dining', 'ăn', 'uống'],
                    subcategories: {
                        restaurant: {
                            patterns: ['nhà hàng', 'restaurant', 'dine out'],
                            specificItems: {
                                asian_food: ['đồ á', 'asian cuisine', 'phở', 'cơm'],
                                western_food: ['đồ tây', 'western food', 'pizza', 'burger']
                            }
                        },
                        fast_food: {
                            patterns: ['đồ ăn nhanh', 'fast food', 'quick meal'],
                            specificItems: {
                                kfc: ['kfc', 'gà rán'],
                                mcdonalds: ['mcdonalds', 'mcdonald', 'mc']
                            }
                        }
                    }
                },
                transportation: {
                    patterns: ['di chuyển', 'transportation', 'travel', 'xe'],
                    subcategories: {
                        taxi: {
                            patterns: ['taxi', 'grab', 'uber'],
                            specificItems: {
                                grab_bike: ['grab xe ôm', 'motorbike taxi'],
                                grab_car: ['grab car', 'grab ô tô']
                            }
                        },
                        fuel: {
                            patterns: ['xăng', 'fuel', 'gas', 'dầu'],
                            specificItems: {
                                gasoline: ['xăng', 'gasoline'],
                                diesel: ['dầu diesel', 'diesel']
                            }
                        }
                    }
                }
            }
        };
    }

    initializeAggregationPatterns() {
        return {
            sum: ['tổng', 'total', 'tổng cộng', 'sum'],
            average: ['trung bình', 'average', 'mean', 'tb'],
            count: ['số lượng', 'count', 'bao nhiêu', 'how many'],
            max: ['cao nhất', 'maximum', 'max', 'lớn nhất'],
            min: ['thấp nhất', 'minimum', 'min', 'nhỏ nhất'],
            group_by_month: ['theo tháng', 'by month', 'monthly'],
            group_by_category: ['theo danh mục', 'by category', 'theo loại']
        };
    }

    initializeSortPatterns() {
        return {
            recent: ['gần đây nhất', 'most recent', 'latest', 'mới nhất'],
            oldest: ['cũ nhất', 'oldest', 'earliest'],
            amount_desc: ['từ cao đến thấp', 'highest first', 'giảm dần'],
            amount_asc: ['từ thấp đến cao', 'lowest first', 'tăng dần'],
            name: ['theo tên', 'alphabetical', 'a-z']
        };
    }

    /**
     * 🔧 Helper Methods - Build Filters
     */
    buildTimeFilter(type) {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        switch (type) {
            case 'today':
                return {
                    date: {
                        $gte: startOfDay,
                        $lte: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
                    }
                };
            case 'this_week':
                return {
                    date: {
                        $gte: startOfWeek,
                        $lte: now
                    }
                };
            case 'this_month':
                return {
                    date: {
                        $gte: startOfMonth,
                        $lte: now
                    }
                };
            case 'this_year':
                return {
                    date: {
                        $gte: startOfYear,
                        $lte: now
                    }
                };
            default:
                return null;
        }
    }

    buildAmountFilter(amountComparison) {
        switch (amountComparison.type) {
            case 'above_amount':
                return { amount: { $gt: amountComparison.value } };
            case 'below_amount':
                return { amount: { $lt: amountComparison.value } };
            default:
                return null;
        }
    }

    buildCategoryFilter(categoryAnalysis) {
        const filter = {};

        // Database chỉ có field 'category', không có subcategory hay specific
        if (categoryAnalysis.level1) {
            filter.category = categoryAnalysis.level1;
        }

        // Nếu có level2 hoặc level3, tìm trong description
        if (categoryAnalysis.level2 || categoryAnalysis.level3) {
            const searchTerms = [];
            if (categoryAnalysis.level2) searchTerms.push(categoryAnalysis.level2);
            if (categoryAnalysis.level3) searchTerms.push(categoryAnalysis.level3);

            filter.description = {
                $regex: searchTerms.join('|'),
                $options: 'i'
            };
        }

        return Object.keys(filter).length > 0 ? filter : null;
    }

    buildAggregationPipeline(type) {
        switch (type) {
            case 'sum':
                return [
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ];
            case 'average':
                return [
                    { $group: { _id: null, average: { $avg: "$amount" } } }
                ];
            case 'count':
                return [
                    { $count: "total" }
                ];
            case 'group_by_month':
                return [
                    {
                        $group: {
                            _id: { $month: "$date" },
                            total: { $sum: "$amount" },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { "_id": 1 } }
                ];
            default:
                return null;
        }
    }

    buildSortQuery(type) {
        switch (type) {
            case 'recent':
                return { date: -1 };
            case 'oldest':
                return { date: 1 };
            case 'amount_desc':
                return { amount: -1 };
            case 'amount_asc':
                return { amount: 1 };
            case 'name':
                return { description: 1 };
            default:
                return {};
        }
    }

    extractAmountComparison(message) {
        // Extract amount patterns like "trên 1 triệu", "dưới 500k"
        const amountRegex = /(?:trên|lớn hơn|above|greater than|over|dưới|nhỏ hơn|below|less than|under)\s*(\d+(?:\.\d+)?)\s*(k|nghìn|triệu|tr|m|đồng|vnd)?/i;
        const match = message.match(amountRegex);

        if (match) {
            const number = parseFloat(match[1]);
            const unit = match[2]?.toLowerCase() || '';
            let value = number;

            switch (unit) {
                case 'k':
                case 'nghìn':
                    value = number * 1000;
                    break;
                case 'triệu':
                case 'tr':
                case 'm':
                    value = number * 1000000;
                    break;
            }

            const type = message.includes('trên') || message.includes('lớn hơn') ||
                message.includes('above') || message.includes('greater') ||
                message.includes('over') ? 'above_amount' : 'below_amount';

            return { type, value };
        }

        return null;
    }

    extractAmountRange(message) {
        // Extract range patterns like "từ 5M đến 10M"
        const rangeRegex = /(?:từ|from)\s*(\d+(?:\.\d+)?)\s*(k|nghìn|triệu|tr|m)?\s*(?:đến|to|tới)\s*(\d+(?:\.\d+)?)\s*(k|nghìn|triệu|tr|m)?/i;
        const match = message.match(rangeRegex);

        if (match) {
            const minNumber = parseFloat(match[1]);
            const minUnit = match[2]?.toLowerCase() || '';
            const maxNumber = parseFloat(match[3]);
            const maxUnit = match[4]?.toLowerCase() || '';

            let min = minNumber;
            let max = maxNumber;

            // Convert min
            switch (minUnit) {
                case 'k':
                case 'nghìn':
                    min = minNumber * 1000;
                    break;
                case 'triệu':
                case 'tr':
                case 'm':
                    min = minNumber * 1000000;
                    break;
            }

            // Convert max
            switch (maxUnit) {
                case 'k':
                case 'nghìn':
                    max = maxNumber * 1000;
                    break;
                case 'triệu':
                case 'tr':
                case 'm':
                    max = maxNumber * 1000000;
                    break;
            }

            return { min, max };
        }

        return null;
    }

    extractCustomTimeRange(message) {
        // Extract custom date ranges like "từ 1/1 đến 15/3"
        const dateRangeRegex = /(?:từ|from)\s*(\d{1,2}\/\d{1,2}(?:\/\d{4})?)\s*(?:đến|to|tới)\s*(\d{1,2}\/\d{1,2}(?:\/\d{4})?)/i;
        const match = message.match(dateRangeRegex);

        if (match) {
            try {
                const startDateStr = match[1];
                const endDateStr = match[2];

                // Parse dates (assuming current year if not specified)
                const currentYear = new Date().getFullYear();
                const startParts = startDateStr.split('/');
                const endParts = endDateStr.split('/');

                const startDate = new Date(
                    startParts[2] ? parseInt(startParts[2]) : currentYear,
                    parseInt(startParts[1]) - 1,
                    parseInt(startParts[0])
                );

                const endDate = new Date(
                    endParts[2] ? parseInt(endParts[2]) : currentYear,
                    parseInt(endParts[1]) - 1,
                    parseInt(endParts[0])
                );

                return { start: startDate, end: endDate };
            } catch (error) {
                logger.error('Error parsing custom date range:', error);
                return null;
            }
        }

        return null;
    }
}

export default QueryProcessingEngine;
