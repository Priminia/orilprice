# 中油歷史油價查詢系統

一個功能完整的油價數據管理和分析系統，可以自動從中油官網爬取歷史油價數據，並提供豐富的數據視覺化和分析功能。

## 功能特色

### 🔄 自動數據爬取
- 從中油官網自動抓取最新油價資訊
- 支援歷史數據回填（2019年至今）
- 智能去重，避免重複資料

### 📊 數據視覺化
- 互動式油價走勢圖表
- 支援多油品同時比較
- 時間範圍篩選功能
- 響應式設計，支援行動裝置

### 📈 數據分析
- 各油品統計分析（最高、最低、平均價格）
- 價格趨勢分析（近30天變化）
- 總體數據統計

### 💾 數據存儲
- 使用SQLite3數據庫存儲
- 高效索引設計
- 數據完整性保護

## 技術架構

- **後端**: Node.js + Express.js
- **資料庫**: SQLite3
- **前端**: Bootstrap 5 + Chart.js
- **爬蟲**: Axios + Cheerio
- **模板引擎**: EJS

## 安裝與使用

### 1. 安裝依賴
```bash
npm install
```

### 2. 啟動服務器
```bash
npm start
```

### 3. 開啟瀏覽器
訪問 `http://localhost:3000`

## 主要頁面

### 首頁 (/)
- 顯示最新油價資訊
- 提供手動更新油價功能
- 系統功能介紹

### 走勢圖表 (/chart)
- 互動式油價走勢圖
- 支援油品篩選
- 時間範圍篩選
- 統計資訊顯示

### 數據分析 (/analytics)
- 總體統計概覽
- 各油品詳細分析
- 近期價格趨勢

## API 端點

### GET /api/oil-prices
獲取油價數據
- 參數: `oilType`, `startDate`, `endDate`, `limit`
- 返回: JSON格式的油價數據

### GET /api/oil-stats/:oilType
獲取特定油品統計
- 參數: 油品類型
- 返回: 統計數據（最高、最低、平均價格等）

### POST /api/update-prices
手動更新油價數據
- 觸發爬蟲程序
- 返回更新結果

## 專案結構

```
oilprice/
├── app.js              # Express應用主文件
├── init.js             # 數據庫初始化腳本
├── package.json        # 項目配置文件
├── bin/
│   └── www            # 服務器啟動文件
├── db/
│   ├── database.js    # 數據庫操作模組
│   └── oilprice.db    # SQLite數據庫文件
├── public/
│   └── stylesheets/
│       └── style.css  # 自定義樣式
├── routes/
│   ├── index.js       # 主要路由
│   └── users.js       # 用戶路由
├── scraper/
│   └── oilScraper.js  # 網頁爬蟲模組
└── views/
    ├── index.ejs      # 首頁模板
    ├── chart.ejs      # 圖表頁面模板
    ├── analytics.ejs  # 分析頁面模板
    └── error.ejs      # 錯誤頁面模板
```

## 數據來源

- [中油公司油價查詢](https://vipmbr.cpc.com.tw/mbwebs/showhistoryprice_oil.aspx)
- [中油公司2019年油價](https://vipmbr.cpc.com.tw/mbwebs/showhistoryprice_oil2019.aspx)

