var express = require('express');
var router = express.Router();
const { initDatabase, getOilPrices, getLatestOilPrices, getOilPriceStats } = require('../db/database');
const { updateOilPriceData } = require('../scraper/oilScraper');

// 初始化數據庫
const db = initDatabase();

/* GET home page. */
router.get('/', async function(req, res, next) {
  try {
    const latestPrices = await getLatestOilPrices(db);
    res.render('index', { 
      title: '中油歷史油價查詢系統',
      latestPrices: latestPrices
    });
  } catch (error) {
    console.error('獲取最新油價錯誤:', error);
    res.render('index', { 
      title: '中油歷史油價查詢系統',
      latestPrices: []
    });
  }
});

/* GET oil prices API */
router.get('/api/oil-prices', async function(req, res, next) {
  try {
    const { oilType, startDate, endDate, limit } = req.query;
    let prices = await getOilPrices(db, oilType, startDate, endDate);
    
    // 如果沒有指定限制且數據量很大，則限制返回數量
    if (!limit && prices.length > 5000) {
      prices = prices.slice(0, 5000);
    } else if (limit) {
      const limitNum = parseInt(limit);
      if (limitNum > 0) {
        prices = prices.slice(0, limitNum);
      }
    }
    
    res.json({ success: true, data: prices });
  } catch (error) {
    console.error('獲取油價數據錯誤:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* GET oil price statistics */
router.get('/api/oil-stats/:oilType', async function(req, res, next) {
  try {
    const { oilType } = req.params;
    const stats = await getOilPriceStats(db, oilType);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('獲取油價統計錯誤:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* POST update oil prices */
router.post('/api/update-prices', async function(req, res, next) {
  try {
    console.log('開始更新油價數據...');
    const insertedCount = await updateOilPriceData(db);
    
    // 如果爬取失败，生成一些模拟数据
    if (insertedCount === 0) {
      console.log('爬取失败，生成模拟数据...');
      const { generateFallbackData } = require('../scraper/fallbackData');
      const fallbackCount = await generateFallbackData(db);
      res.json({ 
        success: true, 
        message: `爬取失败，已生成 ${fallbackCount} 筆模拟數據` 
      });
    } else {
      res.json({ 
        success: true, 
        message: `成功更新 ${insertedCount} 筆油價數據` 
      });
    }
  } catch (error) {
    console.error('更新油價數據錯誤:', error);
    
    // 尝试生成后备数据
    try {
      const { generateFallbackData } = require('../scraper/fallbackData');
      const fallbackCount = await generateFallbackData(db);
      res.json({ 
        success: true, 
        message: `网络错误，已生成 ${fallbackCount} 筆后备數據` 
      });
    } catch (fallbackError) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

/* GET chart page */
router.get('/chart', async function(req, res, next) {
  try {
    const latestPrices = await getLatestOilPrices(db);
    res.render('chart', { 
      title: '油價走勢圖',
      latestPrices: latestPrices
    });
  } catch (error) {
    console.error('獲取圖表數據錯誤:', error);
    res.render('chart', { 
      title: '油價走勢圖',
      latestPrices: []
    });
  }
});

/* GET analytics page */
router.get('/analytics', async function(req, res, next) {
  try {
    res.render('analytics', { 
      title: '數據分析'
    });
  } catch (error) {
    console.error('獲取分析頁面錯誤:', error);
    res.render('analytics', { 
      title: '數據分析'
    });
  }
});

/* GET chart debug page */
router.get('/chart-debug', async function(req, res, next) {
  try {
    res.render('chart_debug', { 
      title: '油價走勢圖 (調試版)'
    });
  } catch (error) {
    console.error('獲取調試圖表頁面錯誤:', error);
    res.render('chart_debug', { 
      title: '油價走勢圖 (調試版)'
    });
  }
});

/* GET fuel calculator page */
router.get('/calculator', async function(req, res, next) {
  try {
    const latestPrices = await getLatestOilPrices(db);
    res.render('calculator', { 
      title: '油價計算機',
      latestPrices: latestPrices
    });
  } catch (error) {
    console.error('獲取計算機頁面錯誤:', error);
    res.render('calculator', { 
      title: '油價計算機',
      latestPrices: []
    });
  }
});

/* POST calculate fuel cost */
router.post('/api/calculate-fuel-cost', async function(req, res, next) {
  try {
    const { fuelConsumption, distance, oilType } = req.body;
    
    // 獲取最新油價
    const latestPrices = await getLatestOilPrices(db);
    const selectedOil = latestPrices.find(price => price.oil_type === oilType);
    
    if (!selectedOil) {
      return res.status(400).json({ 
        success: false, 
        error: '找不到指定的油品價格' 
      });
    }
    
    // 計算油費
    // 油費 = (行駛距離 / 油耗) * 油價
    const fuelNeeded = distance / fuelConsumption; // 需要的油量(公升)
    const totalCost = fuelNeeded * selectedOil.price; // 總油費
    
    res.json({ 
      success: true, 
      data: {
        fuelNeeded: Math.round(fuelNeeded * 100) / 100, // 保留兩位小數
        totalCost: Math.round(totalCost * 100) / 100,
        oilPrice: selectedOil.price,
        oilType: selectedOil.oil_type,
        fuelConsumption: fuelConsumption,
        distance: distance
      }
    });
  } catch (error) {
    console.error('計算油費錯誤:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
