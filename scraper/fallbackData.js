const { insertOilPrice } = require('../db/database');

// 生成后备数据的函数
async function generateFallbackData(db) {
    console.log('生成后备油价数据...');
    
    const today = new Date();
    const oilTypes = ['92無鉛汽油', '95無鉛汽油', '98無鉛汽油', '超級柴油'];
    
    // 基础价格（基于2024年的实际趋势）
    const basePrices = {
        '92無鉛汽油': 28.0,
        '95無鉛汽油': 29.5,
        '98無鉛汽油': 31.5,
        '超級柴油': 26.5
    };
    
    let insertedCount = 0;
    
    try {
        // 生成最近30天的数据
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            for (const oilType of oilTypes) {
                const basePrice = basePrices[oilType];
                // 添加小幅随机波动 (±1元)
                const variation = (Math.random() - 0.5) * 2;
                const price = Math.round((basePrice + variation) * 10) / 10;
                
                try {
                    await insertOilPrice(db, dateStr, oilType, price);
                    insertedCount++;
                } catch (error) {
                    // 忽略重复数据错误
                    if (!error.message.includes('UNIQUE constraint failed')) {
                        console.error(`插入后备数据失败: ${dateStr} ${oilType}`, error.message);
                    }
                }
            }
        }
        
        console.log(`成功生成 ${insertedCount} 条后备数据`);
        return insertedCount;
        
    } catch (error) {
        console.error('生成后备数据失败:', error);
        return 0;
    }
}

// 生成历史趋势数据
async function generateHistoricalData(db) {
    console.log('生成历史趋势数据...');
    
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2024-12-31');
    const oilTypes = ['92無鉛汽油', '95無鉛汽油', '98無鉛汽油', '超級柴油'];
    
    const basePrices = {
        '92無鉛汽油': 28.0,
        '95無鉛汽油': 29.5,
        '98無鉛汽油': 31.5,
        '超級柴油': 26.5
    };
    
    let insertedCount = 0;
    
    try {
        // 每周生成一次数据
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 7)) {
            const dateStr = date.toISOString().split('T')[0];
            
            for (const oilType of oilTypes) {
                const basePrice = basePrices[oilType];
                // 基于时间的趋势变化
                const months = (date.getFullYear() - 2023) * 12 + date.getMonth();
                const trend = Math.sin(months * 0.3) * 3; // 周期性波动
                const random = (Math.random() - 0.5) * 2; // 随机波动
                const price = Math.round((basePrice + trend + random) * 10) / 10;
                
                try {
                    await insertOilPrice(db, dateStr, oilType, price);
                    insertedCount++;
                } catch (error) {
                    if (!error.message.includes('UNIQUE constraint failed')) {
                        console.error(`插入历史数据失败: ${dateStr} ${oilType}`, error.message);
                    }
                }
            }
        }
        
        console.log(`成功生成 ${insertedCount} 条历史数据`);
        return insertedCount;
        
    } catch (error) {
        console.error('生成历史数据失败:', error);
        return 0;
    }
}

module.exports = {
    generateFallbackData,
    generateHistoricalData
};
