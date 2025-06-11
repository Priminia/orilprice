const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'oilprice.db');

// 初始化數據庫
function initDatabase() {
    const db = new sqlite3.Database(dbPath);
    
    db.serialize(() => {
        // 創建油價歷史數據表
        db.run(`CREATE TABLE IF NOT EXISTS oil_prices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            oil_type TEXT NOT NULL,
            price REAL NOT NULL,
            price_change REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(date, oil_type)
        )`);
        
        // 創建索引
        db.run(`CREATE INDEX IF NOT EXISTS idx_date ON oil_prices(date)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_oil_type ON oil_prices(oil_type)`);
    });
    
    return db;
}

// 插入或更新油價數據
function insertOilPrice(db, date, oilType, price, priceChange = null) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO oil_prices (date, oil_type, price, price_change)
            VALUES (?, ?, ?, ?)
        `);
        
        stmt.run([date, oilType, price, priceChange], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
        
        stmt.finalize();
    });
}

// 獲取油價數據
function getOilPrices(db, oilType = null, startDate = null, endDate = null) {
    return new Promise((resolve, reject) => {
        let query = 'SELECT * FROM oil_prices WHERE 1=1';
        const params = [];
        
        if (oilType) {
            query += ' AND oil_type = ?';
            params.push(oilType);
        }
        
        if (startDate) {
            query += ' AND date >= ?';
            params.push(startDate);
        }
        
        if (endDate) {
            query += ' AND date <= ?';
            params.push(endDate);
        }
        
        query += ' ORDER BY date ASC'; // 改为升序，更适合图表显示
        
        console.log('执行查询:', query);
        console.log('参数:', params);
        
        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('数据库查询错误:', err);
                reject(err);
            } else {
                console.log(`查询结果: ${rows.length} 条记录`);
                if (rows.length > 0) {
                    console.log('样本数据:', rows[0]);
                }
                resolve(rows);
            }
        });
    });
}

// 獲取最新的油價數據
function getLatestOilPrices(db) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT * FROM oil_prices 
            WHERE date = (SELECT MAX(date) FROM oil_prices)
            ORDER BY oil_type
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// 獲取油價統計數據
function getOilPriceStats(db, oilType) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                oil_type,
                COUNT(*) as count,
                MIN(price) as min_price,
                MAX(price) as max_price,
                AVG(price) as avg_price,
                MIN(date) as start_date,
                MAX(date) as end_date
            FROM oil_prices 
            WHERE oil_type = ?
            GROUP BY oil_type
        `;
        
        db.get(query, [oilType], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

module.exports = {
    initDatabase,
    insertOilPrice,
    getOilPrices,
    getLatestOilPrices,
    getOilPriceStats
};
