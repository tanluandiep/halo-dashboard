import './style.css';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';
import { CONFIG } from './config.js';

let currentFilterMode = CONFIG.DEFAULT_MODE;
let structureChartInstance = null;
let sourceChartInstance = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadData();
});

function setupEventListeners() {
  document.getElementById('btnModeMonth').addEventListener('click', () => setFilterMode('month'));
  document.getElementById('btnModeDate').addEventListener('click', () => setFilterMode('date'));
  document.getElementById('filterMonth').addEventListener('change', loadData);
  document.getElementById('filterConsultant').addEventListener('change', loadData);
  document.getElementById('filterDateFrom').addEventListener('change', () => { if (currentFilterMode === 'date') loadData(); });
  document.getElementById('filterDateTo').addEventListener('change', () => { if (currentFilterMode === 'date') loadData(); });
  document.getElementById('btnReload').addEventListener('click', loadData);
  document.getElementById('btnDownload').addEventListener('click', downloadDashboardImage);
}

function setFilterMode(mode) {
  currentFilterMode = mode;
  document.getElementById('btnModeMonth').classList.toggle('active', mode === 'month');
  document.getElementById('btnModeDate').classList.toggle('active', mode === 'date');
  document.getElementById('monthFilterGroup').style.display = mode === 'month' ? 'flex' : 'none';
  document.getElementById('dateFilterGroup').classList.toggle('show', mode === 'date');
}

async function loadData() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  loadingOverlay.style.display = 'flex';
  loadingOverlay.style.opacity = '1';

  const consultant = document.getElementById('filterConsultant').value;
  let filterMonth, dateFrom, dateTo;

  if (currentFilterMode === 'month') {
    filterMonth = document.getElementById('filterMonth').value;
    dateFrom = '';
    dateTo = '';
  } else {
    filterMonth = 'dateRange';
    dateFrom = document.getElementById('filterDateFrom').value;
    dateTo = document.getElementById('filterDateTo').value;
  }

  // Build API URL
  const params = new URLSearchParams({
    action: 'getDashboardData',
    month: filterMonth,
    consultant: consultant,
    dateFrom: dateFrom,
    dateTo: dateTo
  });

  try {
    if (CONFIG.API_URL === 'PASTE_YOUR_GAS_WEBAPP_URL_HERE') {
      throw new Error('Please configure your GAS Web App URL in config.js');
    }

    const response = await fetch(`${CONFIG.API_URL}?${params.toString()}`);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const result = await response.json();
    if (result.status !== 'success') throw new Error(result.message);

    onDataLoaded(result.data);
  } catch (error) {
    console.error('Fetch error:', error);
    alert('Lỗi: ' + error.message);
  } finally {
    loadingOverlay.style.opacity = '0';
    setTimeout(() => { loadingOverlay.style.display = 'none'; }, 500);
  }
}

function onDataLoaded(data) {
  populateFilters(data.filterOptions);
  renderCards(data.summary);
  renderForecast(data.summary, data.consultantPerformance);
  renderCharts(data.summary);
  renderRanking(data.consultantPerformance);
}

function populateFilters(options) {
  const monthSelect = document.getElementById('filterMonth');
  const consultSelect = document.getElementById('filterConsultant');

  if (monthSelect.options.length <= 0) {
    const now = new Date();
    const currentMonthStr = (now.getMonth() + 1).toString().padStart(2, '0') + '/' + now.getFullYear();
    
    options.months.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = 'Tháng ' + m;
      if (m === currentMonthStr) opt.selected = true;
      monthSelect.appendChild(opt);
    });
    
    if (!monthSelect.value && monthSelect.options.length > 0) {
      monthSelect.options[monthSelect.options.length - 1].selected = true;
    }
  }

  if (consultSelect.options.length <= 1) {
    options.consultants.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      consultSelect.appendChild(opt);
    });
  }
}

function updateText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function renderCards(s) {
  updateText('cardRevenue', formatVND(s.totalRevenue));
  updateText('cardKpiTarget', formatVND(s.kpiTarget));
  updateText('cardKpiPercent', s.kpiPercent.toFixed(1) + '%');
  updateText('cardHvmCount', s.countHVM);
  updateText('cardHvmTotal', 'Thu: ' + formatVND(s.thuHVM));
  updateText('cardUpcCount', s.countUPC);
  updateText('cardUpcTotal', 'Thu: ' + formatVND(s.thuUPCB));
  updateText('cardCongNo', formatVND(s.congNo));
}

function renderForecast(s, consultants) {
  const expected = s.totalRevenue + s.totalDebt;
  const expectedPercent = s.kpiTarget > 0 ? (expected / s.kpiTarget * 100) : 0;
  const missing = Math.max(0, s.kpiTarget - expected);

  updateText('forecastDebt', formatVND(s.totalDebt));
  updateText('forecastDebtSub', s.studentsWithDebt + ' học viên chưa đóng');
  updateText('forecastExpected', formatVND(expected));
  updateText('forecastPercent', expectedPercent.toFixed(1) + '%');
  updateText('forecastMissing', formatVND(missing));

  const marquee = document.getElementById('personalForecasts');
  marquee.innerHTML = '';

  consultants.slice(0, 15).forEach(c => {
    const item = document.createElement('div');
    item.className = 'forecast-text-item';
    const color = getPercentColor(c.forecastPercent);
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.gap = '8px';
    item.innerHTML = `
      <span>🎯 <strong>${c.name}</strong> dự báo đạt</span>
      <span class="forecast-tag" style="background:${color}">${c.forecastPercent.toFixed(1)}%</span>
    `;
    marquee.appendChild(item);
  });
}

function renderCharts(s) {
  const structureCtx = document.getElementById('structureChart').getContext('2d');
  const sourceCtx = document.getElementById('sourceChart').getContext('2d');

  if (structureChartInstance) structureChartInstance.destroy();
  if (sourceChartInstance) sourceChartInstance.destroy();

  structureChartInstance = new Chart(structureCtx, {
    type: 'doughnut',
    data: {
      labels: ['HVM', 'UPC', 'Công nợ'],
      datasets: [{
        data: [s.thuHVM, s.thuUPCB, s.congNo],
        backgroundColor: ['#10b981', '#06b6d4', '#f59e0b'],
        borderWidth: 0,
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 12 } } },
        tooltip: { callbacks: { label: ctx => ctx.label + ': ' + formatVND(ctx.raw) } }
      }
    }
  });

  const sourceLabels = s.hvmSourceBreakdown.map(x => x.name);
  const sourceValues = s.hvmSourceBreakdown.map(x => x.value);

  sourceChartInstance = new Chart(sourceCtx, {
    type: 'pie',
    data: {
      labels: sourceLabels,
      datasets: [{
        data: sourceValues,
        backgroundColor: ['#8b5cf6', '#ec4899', '#3b82f6', '#f59e0b', '#10b981', '#ef4444'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 12 } } },
        tooltip: { callbacks: { label: ctx => ctx.label + ': ' + formatVND(ctx.raw) } }
      }
    }
  });
}

function renderRanking(data) {
  const tbody = document.getElementById('rankingBody');
  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:60px; color:#64748b;">Không có dữ liệu xếp hạng</td></tr>';
    return;
  }

  data.forEach((row, idx) => {
    const tr = document.createElement('tr');
    const pct = row.kpiPercent || 0;
    const colorClass = getProgressColor(pct);
    const rankClass = idx === 0 ? 'rank-1' : (idx === 1 ? 'rank-2' : (idx === 2 ? 'rank-3' : 'rank-default'));
    const medals = { 0: '🥇', 1: '🥈', 2: '🥉' };

    tr.innerHTML = `
      <td><span class="rank-badge ${rankClass}">${medals[idx] || (idx + 1)}</span></td>
      <td><strong>${row.name}</strong></td>
      <td style="text-align:right;">${formatVND(row.kpiMonth)}</td>
      <td style="text-align:right; color:var(--emerald); font-weight:700">${formatVND(row.doanhSo)}</td>
      <td>
        <div class="progress-container">
          <div class="progress-bg">
            <div class="progress-fill ${colorClass}" style="width: ${Math.min(pct, 100)}%"></div>
          </div>
          <span style="font-weight:700; font-size:12px; color:${getPercentColor(pct)}; min-width:45px;">${pct.toFixed(1)}%</span>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Helpers
function formatVND(num) {
  if (!num) return '0';
  return num.toLocaleString('vi-VN');
}

function getProgressColor(pct) {
  if (pct >= 90) return 'pf-green';
  if (pct >= 60) return 'pf-amber';
  return 'pf-rose';
}

function getPercentColor(pct) {
  if (pct >= 100) return 'var(--emerald)';
  if (pct >= 80) return 'var(--amber)';
  return 'var(--rose)';
}

async function downloadDashboardImage() {
  const element = document.getElementById('dashboardContent');
  const btn = document.getElementById('btnDownload');
  const originalText = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = '⌛ Đang xử lý...';

  const dashboard = document.querySelector('.dashboard');
  dashboard.classList.add('is-capturing');

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#0f172a',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight + 100
    });

    const link = document.createElement('a');
    const month = document.getElementById('filterMonth').value.replace('/', '-');
    link.download = `Halo_Report_${month}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error('Screenshot error:', err);
    alert('Không thể tạo ảnh báo cáo.');
  } finally {
    dashboard.classList.remove('is-capturing');
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}
