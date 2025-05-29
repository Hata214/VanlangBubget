/**
 * ⚙️ MongoDB Query Constructor - Theo kiến trúc Mermaid Diagram
 * Xây dựng MongoDB queries từ Query Analysis
 */

import logger from '../utils/logger.js';

class MongoQueryConstructor {
    constructor() {
        this.modelMapping = {
            'query_income': 'Income',
            'income_query': 'Income',
            'income_detail_query': 'Income',
            'savings_income_query': 'Income',
            'query_expense': 'Expense',
            'expense_query': 'Expense',
            'expense_detail_query': 'Expense',
            'query_loan': 'Loan',
            'loan_query': 'Loan',
            'loan_detail_query': 'Loan',
            'query_investment': 'Investment',
            'investment_query': 'Investment',
            'investment_detail_query': 'Investment',
            'savings_query': 'Investment',
            'insert_income': 'Income',
            'insert_expense': 'Expense',
            'insert_loan': 'Loan',
            'insert_savings': 'Income'
        };
    }

    /**
     * 🏗️ Main Query Construction - Entry Point
     */
    async constructQuery(queryAnalysis, userId) {
        logger.info('MongoDB Query Constructor - Starting construction', {
            intent: queryAnalysis.intent,
            userId,
            hasTimeFilter: !!queryAnalysis.timeAnalysis?.mongoFilter,
            hasAmountFilter: !!queryAnalysis.amountAnalysis?.mongoFilter,
            hasCategoryFilter: !!queryAnalysis.categoryAnalysis?.mongoFilter,
            hasAggregation: !!queryAnalysis.aggregationAnalysis?.mongoAggregation
        });

        const mongoQuery = {
            model: this.getModelName(queryAnalysis.intent),
            operation: this.getOperation(queryAnalysis),
            filter: this.buildFilter(queryAnalysis, userId),
            sort: this.buildSort(queryAnalysis),
            limit: this.buildLimit(queryAnalysis),
            aggregation: this.buildAggregation(queryAnalysis, userId),
            projection: this.buildProjection(queryAnalysis)
        };

        logger.info('MongoDB Query Constructor - Construction complete', {
            model: mongoQuery.model,
            operation: mongoQuery.operation,
            filterKeys: Object.keys(mongoQuery.filter),
            hasSort: Object.keys(mongoQuery.sort).length > 0,
            hasAggregation: !!mongoQuery.aggregation,
            hasLimit: !!mongoQuery.limit
        });

        return mongoQuery;
    }

    /**
     * 📝 Filter Construction
     */
    buildFilter(queryAnalysis, userId) {
        const filter = {
            userId: userId // Always filter by user
        };

        // Add time filter
        if (queryAnalysis.timeAnalysis?.mongoFilter) {
            Object.assign(filter, queryAnalysis.timeAnalysis.mongoFilter);
        }

        // Add amount filter
        if (queryAnalysis.amountAnalysis?.mongoFilter) {
            Object.assign(filter, queryAnalysis.amountAnalysis.mongoFilter);
        }

        // Add category filter
        if (queryAnalysis.categoryAnalysis?.mongoFilter) {
            Object.assign(filter, queryAnalysis.categoryAnalysis.mongoFilter);
        }

        return filter;
    }

    /**
     * 🔄 Sort Construction
     */
    buildSort(queryAnalysis) {
        let sort = {};

        // Add sort from analysis
        if (queryAnalysis.sortAnalysis?.mongoSort) {
            Object.assign(sort, queryAnalysis.sortAnalysis.mongoSort);
        }

        // Default sort by date descending if no sort specified
        if (Object.keys(sort).length === 0) {
            sort = { date: -1 };
        }

        return sort;
    }

    /**
     * 📊 Aggregation Pipeline Construction
     */
    buildAggregation(queryAnalysis, userId) {
        if (!queryAnalysis.aggregationAnalysis?.mongoAggregation) {
            return null;
        }

        const pipeline = [];

        // Always start with user filter
        pipeline.push({
            $match: { userId: userId }
        });

        // Add time filter to aggregation if exists
        if (queryAnalysis.timeAnalysis?.mongoFilter) {
            pipeline.push({
                $match: queryAnalysis.timeAnalysis.mongoFilter
            });
        }

        // Add amount filter to aggregation if exists
        if (queryAnalysis.amountAnalysis?.mongoFilter) {
            pipeline.push({
                $match: queryAnalysis.amountAnalysis.mongoFilter
            });
        }

        // Add category filter to aggregation if exists
        if (queryAnalysis.categoryAnalysis?.mongoFilter) {
            pipeline.push({
                $match: queryAnalysis.categoryAnalysis.mongoFilter
            });
        }

        // Add the aggregation operations
        pipeline.push(...queryAnalysis.aggregationAnalysis.mongoAggregation);

        return pipeline;
    }

    /**
     * 🎯 Projection Fields Construction
     */
    buildProjection(queryAnalysis) {
        // Default projection - include all important fields (matching actual database schema)
        const projection = {
            _id: 1,
            amount: 1,
            description: 1,
            category: 1,
            date: 1,
            createdAt: 1
        };

        // Add model-specific fields based on intent
        switch (queryAnalysis.intent) {
            case 'query_loan':
                projection.interestRate = 1;
                projection.lender = 1;
                projection.status = 1;
                projection.dueDate = 1;
                projection.startDate = 1;
                break;
            case 'query_investment':
                projection.type = 1;
                projection.name = 1;
                projection.currentValue = 1;
                projection.initialInvestment = 1;
                break;
        }

        return projection;
    }

    /**
     * 🔢 Limit Construction
     */
    buildLimit(queryAnalysis) {
        // Check for specific limit keywords in sort analysis
        if (queryAnalysis.sortAnalysis?.type === 'recent' ||
            queryAnalysis.sortAnalysis?.type === 'oldest') {
            return 1; // For "latest" or "oldest" queries
        }

        // Check for top N patterns
        const topNPattern = this.extractTopN(queryAnalysis);
        if (topNPattern) {
            return topNPattern;
        }

        // Default limit for performance
        return 50;
    }

    /**
     * 🔧 Helper Methods
     */
    getModelName(intent) {
        return this.modelMapping[intent] || 'Expense';
    }

    getOperation(queryAnalysis) {
        if (queryAnalysis.aggregationAnalysis?.mongoAggregation) {
            return 'aggregate';
        }

        if (queryAnalysis.intent.startsWith('insert_')) {
            return 'create';
        }

        return 'find';
    }

    extractTopN(queryAnalysis) {
        // This would be enhanced to extract "top 5", "first 10" etc.
        // For now, return null
        return null;
    }

    /**
     * 🎯 Execute Query - Integration with Models
     */
    async executeQuery(mongoQuery, models) {
        try {
            const Model = models[mongoQuery.model];
            if (!Model) {
                logger.error('Model not found', {
                    requestedModel: mongoQuery.model,
                    availableModels: Object.keys(models)
                });
                throw new Error(`Model ${mongoQuery.model} not found`);
            }

            logger.info('Executing MongoDB query', {
                model: mongoQuery.model,
                operation: mongoQuery.operation,
                filter: mongoQuery.filter,
                projection: mongoQuery.projection,
                sort: mongoQuery.sort,
                limit: mongoQuery.limit
            });

            let result;

            switch (mongoQuery.operation) {
                case 'find':
                    result = await Model.find(mongoQuery.filter, mongoQuery.projection)
                        .sort(mongoQuery.sort)
                        .limit(mongoQuery.limit);
                    break;

                case 'aggregate':
                    result = await Model.aggregate(mongoQuery.aggregation);
                    break;

                case 'create':
                    // This would be handled by insert handlers
                    throw new Error('Create operation should be handled by insert handlers');

                default:
                    throw new Error(`Unknown operation: ${mongoQuery.operation}`);
            }

            logger.info('MongoDB query executed successfully', {
                model: mongoQuery.model,
                operation: mongoQuery.operation,
                resultCount: Array.isArray(result) ? result.length : 1,
                sampleResult: Array.isArray(result) && result.length > 0 ? result[0] : result
            });

            return result;

        } catch (error) {
            logger.error('Error executing MongoDB query:', {
                error: error.message,
                stack: error.stack,
                model: mongoQuery.model,
                operation: mongoQuery.operation,
                filter: mongoQuery.filter
            });
            throw error;
        }
    }

    /**
     * 📋 Result Processor Integration
     */
    async processResults(results, queryAnalysis) {
        if (!results || results.length === 0) {
            return {
                type: 'empty',
                message: 'Không tìm thấy dữ liệu phù hợp với yêu cầu của bạn.',
                data: []
            };
        }

        // Process based on aggregation type
        if (queryAnalysis.aggregationAnalysis?.type) {
            return this.processAggregationResults(results, queryAnalysis.aggregationAnalysis.type);
        }

        // Process regular query results
        return this.processRegularResults(results, queryAnalysis);
    }

    processAggregationResults(results, aggregationType) {
        switch (aggregationType) {
            case 'sum':
                return {
                    type: 'summary',
                    message: `💰 **Tổng cộng:** ${results[0]?.total?.toLocaleString('vi-VN') || 0} VND`,
                    data: results
                };

            case 'average':
                return {
                    type: 'summary',
                    message: `📊 **Trung bình:** ${results[0]?.average?.toLocaleString('vi-VN') || 0} VND`,
                    data: results
                };

            case 'count':
                return {
                    type: 'summary',
                    message: `🔢 **Số lượng:** ${results[0]?.total || 0} giao dịch`,
                    data: results
                };

            case 'group_by_month':
                const monthlyData = results.map(item =>
                    `📅 **Tháng ${item._id}:** ${item.total.toLocaleString('vi-VN')} VND (${item.count} giao dịch)`
                ).join('\n');
                return {
                    type: 'detailed',
                    message: `📊 **Thống kê theo tháng:**\n\n${monthlyData}`,
                    data: results
                };

            default:
                return {
                    type: 'raw',
                    message: 'Kết quả tổng hợp:',
                    data: results
                };
        }
    }

    processRegularResults(results, queryAnalysis) {
        if (results.length === 0) {
            return {
                type: 'empty',
                message: 'Không tìm thấy dữ liệu phù hợp với yêu cầu của bạn.',
                data: []
            };
        }

        // Tính tổng số tiền
        const totalAmount = results.reduce((sum, item) => sum + (item.amount || 0), 0);

        // Chỉ hiển thị 5 khoản đầu tiên
        const itemsToShow = results.slice(0, 5);
        const formattedResults = itemsToShow.map((item, index) => {
            const date = new Date(item.date).toLocaleDateString('vi-VN');
            const amount = item.amount.toLocaleString('vi-VN');
            return `${index + 1}. **${item.description}** - ${amount} VND (${date})`;
        }).join('\n');

        let message = `💰 **Tổng cộng:** ${totalAmount.toLocaleString('vi-VN')} VND\n\n`;
        message += `📋 **Chi tiết (${itemsToShow.length}/${results.length} khoản):**\n\n${formattedResults}`;

        if (results.length > 5) {
            message += `\n\n... và ${results.length - 5} khoản khác.`;
            message += `\n\n💡 *Bạn có thể hỏi "xem chi tiết tất cả" để xem đầy đủ.*`;
        }

        return {
            type: 'summary',
            message,
            data: results
        };
    }
}

export default MongoQueryConstructor;
