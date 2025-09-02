#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const TIMEOUT = 10000; // 10 seconds
const MAX_CONCURRENT = 5; // Limit concurrent requests

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'HEAD', // Use HEAD to avoid downloading full content
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkValidator/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      }
    };

    const req = client.request(options, (res) => {
      resolve({
        url,
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: res.headers,
        success: res.statusCode >= 200 && res.statusCode < 400
      });
    });

    req.on('error', (error) => {
      resolve({
        url,
        status: 0,
        statusText: error.message,
        headers: {},
        success: false,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 0,
        statusText: 'Request timeout',
        headers: {},
        success: false,
        error: 'Request timeout'
      });
    });

    req.setTimeout(TIMEOUT);
    req.end();
  });
}

async function validateUrls(urls) {
  const results = [];
  const chunks = [];
  
  // Split URLs into chunks for concurrent processing
  for (let i = 0; i < urls.length; i += MAX_CONCURRENT) {
    chunks.push(urls.slice(i, i + MAX_CONCURRENT));
  }

  log(`\n🔍 Validating ${urls.length} URLs in ${chunks.length} batches...`, 'cyan');

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    log(`\n📦 Processing batch ${i + 1}/${chunks.length} (${chunk.length} URLs)...`, 'blue');
    
    const promises = chunk.map(url => makeRequest(url));
    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults);
    
    // Show progress
    chunkResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const color = result.success ? 'green' : 'red';
      log(`  ${status} ${result.url} - ${result.status} ${result.statusText}`, color);
    });
    
    // Small delay between batches to be respectful
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

function extractUrlsFromNewsData(newsData, datasetName) {
  const urls = [];
  
  Object.entries(newsData).forEach(([month, data]) => {
    if (data.news && Array.isArray(data.news)) {
      data.news.forEach((article, index) => {
        if (article.link) {
          urls.push({
            url: article.link,
            dataset: datasetName,
            month: month,
            outlet: article.outlet,
            title: article.title,
            index: index
          });
        }
      });
    }
  });
  
  return urls;
}

function generateReport(results, allUrls) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  log('\n' + '='.repeat(80), 'cyan');
  log('📊 VALIDATION REPORT', 'cyan');
  log('='.repeat(80), 'cyan');
  
  log(`\n📈 Summary:`, 'white');
  log(`  Total URLs checked: ${results.length}`, 'white');
  log(`  ✅ Successful: ${successful.length}`, 'green');
  log(`  ❌ Failed: ${failed.length}`, 'red');
  log(`  Success rate: ${((successful.length / results.length) * 100).toFixed(1)}%`, 'white');
  
  if (failed.length > 0) {
    log(`\n❌ Failed URLs:`, 'red');
    failed.forEach(result => {
      const urlInfo = allUrls.find(u => u.url === result.url);
      log(`\n  🔗 ${result.url}`, 'red');
      log(`     Dataset: ${urlInfo?.dataset || 'Unknown'}`, 'yellow');
      log(`     Month: ${urlInfo?.month || 'Unknown'}`, 'yellow');
      log(`     Outlet: ${urlInfo?.outlet || 'Unknown'}`, 'yellow');
      log(`     Title: ${urlInfo?.title || 'Unknown'}`, 'yellow');
      log(`     Status: ${result.status} ${result.statusText}`, 'red');
      if (result.error) {
        log(`     Error: ${result.error}`, 'red');
      }
    });
  }
  
  // Group by dataset
  const byDataset = {};
  allUrls.forEach(urlInfo => {
    if (!byDataset[urlInfo.dataset]) {
      byDataset[urlInfo.dataset] = { total: 0, failed: 0 };
    }
    byDataset[urlInfo.dataset].total++;
    
    const result = results.find(r => r.url === urlInfo.url);
    if (result && !result.success) {
      byDataset[urlInfo.dataset].failed++;
    }
  });
  
  log(`\n📊 By Dataset:`, 'white');
  Object.entries(byDataset).forEach(([dataset, stats]) => {
    const successRate = ((stats.total - stats.failed) / stats.total * 100).toFixed(1);
    const color = stats.failed === 0 ? 'green' : stats.failed < stats.total / 2 ? 'yellow' : 'red';
    log(`  ${dataset}: ${stats.total - stats.failed}/${stats.total} (${successRate}%)`, color);
  });
  
  // Status code breakdown
  const statusCodes = {};
  results.forEach(result => {
    const code = result.status;
    statusCodes[code] = (statusCodes[code] || 0) + 1;
  });
  
  log(`\n📊 Status Code Breakdown:`, 'white');
  Object.entries(statusCodes)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([code, count]) => {
      const color = code >= 200 && code < 400 ? 'green' : code >= 400 && code < 500 ? 'yellow' : 'red';
      log(`  ${code}: ${count} URLs`, color);
    });
}

async function main() {
  const dataDir = path.join(__dirname, '..', 'public', 'data');
  
  if (!fs.existsSync(dataDir)) {
    log('❌ Data directory not found!', 'red');
    process.exit(1);
  }
  
  log('🚀 Starting news link validation...', 'cyan');
  
  const datasets = fs.readdirSync(dataDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  log(`📁 Found ${datasets.length} datasets: ${datasets.join(', ')}`, 'blue');
  
  const allUrls = [];
  
  // Extract URLs from all news.json files
  for (const dataset of datasets) {
    const newsFile = path.join(dataDir, dataset, 'news.json');
    
    if (fs.existsSync(newsFile)) {
      try {
        const newsData = JSON.parse(fs.readFileSync(newsFile, 'utf8'));
        const urls = extractUrlsFromNewsData(newsData, dataset);
        allUrls.push(...urls);
        log(`📄 ${dataset}/news.json: ${urls.length} URLs`, 'green');
      } catch (error) {
        log(`❌ Error reading ${dataset}/news.json: ${error.message}`, 'red');
      }
    } else {
      log(`⚠️  No news.json found in ${dataset}`, 'yellow');
    }
  }
  
  if (allUrls.length === 0) {
    log('❌ No URLs found to validate!', 'red');
    process.exit(1);
  }
  
  // Remove duplicates
  const uniqueUrls = [...new Set(allUrls.map(u => u.url))];
  log(`\n🔗 Total unique URLs to validate: ${uniqueUrls.length}`, 'cyan');
  
  // Validate URLs
  const results = await validateUrls(uniqueUrls);
  
  // Generate report
  generateReport(results, allUrls);
  
  log('\n✨ Validation complete!', 'green');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`❌ Unhandled error: ${error.message}`, 'red');
  process.exit(1);
});

// Run the script
main().catch(error => {
  log(`❌ Script error: ${error.message}`, 'red');
  process.exit(1);
});
