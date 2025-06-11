const axios = require('axios');
const cheerio = require('cheerio');
const { insertOilPrice } = require('../db/database');

// 解析日期格式 (例如: 113/12/09 -> 2024-12-09)
function parseDate(taiwanDate) {
    if (!taiwanDate || taiwanDate.trim() === '') return null;
    
    try {
        // 台灣民國年格式轉換 (民國年 + 1911 = 西元年)
        const parts = taiwanDate.trim().split('/');
        if (parts.length === 3) {
            const rocYear = parseInt(parts[0]);
            const month = parts[1].padStart(2, '0');
            const day = parts[2].padStart(2, '0');
            
            // 民国年转西元年 - 修复计算方式
            let year;
            if (rocYear > 1000) {
                // 如果已经是西元年，直接使用
                year = rocYear;
            } else {
                // 民国年转换
                year = rocYear + 1911;
            }
            
            // 验证年份是否合理 (2000-2030)
            if (year < 2000 || year > 2030) {
                console.warn(`跳过异常年份: ${taiwanDate} -> ${year}年`);
                return null;
            }
            
            const dateStr = `${year}-${month}-${day}`;
            
            // 验证日期格式
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                console.warn(`无效日期: ${dateStr}`);
                return null;
            }
            
            return dateStr;
        }
        
        // 尝试其他日期格式
        if (taiwanDate.includes('-')) {
            const date = new Date(taiwanDate);
            if (!isNaN(date.getTime())) {
                return taiwanDate.split('T')[0]; // 返回 YYYY-MM-DD 格式
            }
        }
        
    } catch (error) {
        console.error('日期解析錯誤:', error);
    }
    return null;
}

// 解析價格 (移除非數字字符)
function parsePrice(priceStr) {
    if (!priceStr) return null;
    
    try {
        const numStr = priceStr.replace(/[^\d.-]/g, '');
        const price = parseFloat(numStr);
        return isNaN(price) ? null : price;
    } catch (error) {
        console.error('價格解析錯誤:', error);
        return null;
    }
}

// 爬取中油公司油價數據
async function scrapeOilPrices(url) {
    try {
        console.log(`正在爬取: ${url}`);
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(response.data);
        const prices = [];
        
        // 尋找包含油價數據的表格
        $('table').each((tableIndex, table) => {
            const $table = $(table);
            
            // 檢查是否是油價表格 (通常包含日期和價格)
            const headers = [];
            $table.find('tr:first th, tr:first td').each((i, th) => {
                headers.push($(th).text().trim());
            });
            
            // 如果表頭包含日期相關字詞，就處理這個表格
            const hasDateColumn = headers.some(h => 
                h.includes('日期') || h.includes('年月日') || h.includes('調價日期')
            );
            
            if (hasDateColumn) {
                console.log('找到油價表格，表頭:', headers);
                
                $table.find('tr').each((rowIndex, row) => {
                    if (rowIndex === 0) return; // 跳過表頭
                    
                    const $row = $(row);
                    const cells = [];
                    
                    $row.find('td').each((cellIndex, cell) => {
                        cells.push($(cell).text().trim());
                    });
                    
                    if (cells.length >= 2) {
                        const dateStr = cells[0];
                        const date = parseDate(dateStr);
                        
                        if (date) {
                            // 處理各種油品價格 (從第二列開始)
                            for (let i = 1; i < cells.length && i < headers.length; i++) {
                                const oilType = headers[i];
                                const priceStr = cells[i];
                                const price = parsePrice(priceStr);
                                
                                if (price !== null && oilType && 
                                    (oilType.includes('92') || oilType.includes('95') || 
                                     oilType.includes('98') || oilType.includes('超級') || 
                                     oilType.includes('柴油') || oilType.includes('無鉛'))) {
                                    
                                    prices.push({
                                        date,
                                        oilType: oilType.replace(/\s+/g, ''),
                                        price
                                    });
                                }
                            }
                        }
                    }
                });
            }
        });
        
        console.log(`成功爬取 ${prices.length} 筆油價數據`);
        return prices;
        
    } catch (error) {
        console.error('爬取油價數據時發生錯誤:', error.message);
        return [];
    }
}

// 更新油價數據到數據庫
async function updateOilPriceData(db) {
    const urls = [
        'https://vipmbr.cpc.com.tw/mbwebs/showhistoryprice_oil.aspx',
        'https://vipmbr.cpc.com.tw/mbwebs/showhistoryprice_oil2019.aspx'
    ];
    
    let totalInserted = 0;
    
    for (const url of urls) {
        try {
            const prices = await scrapeOilPrices(url);
            
            for (const priceData of prices) {
                try {
                    await insertOilPrice(
                        db, 
                        priceData.date, 
                        priceData.oilType, 
                        priceData.price
                    );
                    totalInserted++;
                } catch (error) {
                    // 忽略重複數據錯誤
                    if (!error.message.includes('UNIQUE constraint failed')) {
                        console.error('插入數據錯誤:', error);
                    }
                }
            }
            
            // 避免太頻繁的請求
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`處理 ${url} 時發生錯誤:`, error);
        }
    }
    
    console.log(`總共新增了 ${totalInserted} 筆油價數據`);
    return totalInserted;
}

module.exports = {
    scrapeOilPrices,
    updateOilPriceData,
    parseDate,
    parsePrice
};
