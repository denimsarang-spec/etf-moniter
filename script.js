// Google Sheets 설정
const GOOGLE_SHEET_ID = "1dK1m0gelNX2CV7PgvrB0XmV_e8x72AORgn-eeI_ZWwc";
const SHEET_NAME = "결과";

// CSV URL로 변환
const CSV_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/query?tqx=out:csv&sheet=${SHEET_NAME}`;

// 페이지 로드 시
document.addEventListener('DOMContentLoaded', () => {
  loadETFData();
  // 5분마다 자동 새로고침
  setInterval(loadETFData, 5 * 60 * 1000);
});

// 데이터 로드
async function loadETFData() {
  try {
    const response = await fetch(CSV_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    const data = parseCSV(csvText);
    
    if (data.length > 0) {
      displayETFTable(data);
      updateStats(data);
      updateLastUpdate();
    } else {
      showNoData();
    }
    
  } catch (error) {
    console.error("데이터 로드 실패:", error);
    showError("데이터를 불러올 수 없습니다. 새로고침 후 다시 시도하세요.");
  }
}

// CSV 파싱
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const data = [];
  
  // 첫 줄은 헤더이므로 제외 (2번 줄부터 시작)
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
    
    if (cells[1]) { // 종목코드 확인
      data.push({
        rank: cells[0],
        code: cells[1],
        name: cells[2],
        foreign: parseInt(cells[3]) || 0,
        institution: parseInt(cells[4]) || 0,
        total: parseInt(cells[5]) || 0,
        yield: parseFloat(cells[6]) || 0,
        consecutive: cells[7] || ""
      });
    }
  }
  
  return data;
}

// 테이블 표시
function displayETFTable(data) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";
  
  data.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.className = index % 2 === 0 ? "even" : "odd";
    
    const yieldClass = item.yield >= 0 ? 'positive' : 'negative';
    const yieldSign = item.yield >= 0 ? '+' : '';
    
    tr.innerHTML = `
      <td class="rank">${item.rank}</td>
      <td class="code">${item.code}</td>
      <td class="name">${item.name}</td>
      <td class="number">${item.foreign.toLocaleString()}</td>
      <td class="number">${item.institution.toLocaleString()}</td>
      <td class="number highlight">${item.total.toLocaleString()}</td>
      <td class="yield ${yieldClass}">${yieldSign}${item.yield.toFixed(2)}%</td>
      <td class="consecutive">${item.consecutive}</td>
    `;
    
    tbody.appendChild(tr);
  });
}

// 통계 업데이트
function updateStats(data) {
  const count = data.length;
  const totalBuy = data.reduce((sum, item) => sum + item.total, 0);
  const avgYield = count > 0 
    ? data.reduce((sum, item) => sum + item.yield, 0) / count 
    : 0;
  
  document.getElementById("etfCount").textContent = count;
  document.getElementById("totalBuy").textContent = totalBuy.toLocaleString();
  document.getElementById("avgYield").textContent = avgYield.toFixed(2) + "%";
}

// 마지막 업데이트 시간 표시
function updateLastUpdate() {
  const now = new Date();
  const time = now.toLocaleTimeString('ko-KR', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });
  document.getElementById("lastUpdate").textContent = `마지막 업데이트: ${time}`;
}

// 수동 새로고침
function manualRefresh() {
  document.getElementById("tableBody").innerHTML = 
    '<tr><td colspan="8" class="loading">새로고침 중...</td></tr>';
  loadETFData();
}

// 에러 표시
function showError(message) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = `<tr><td colspan="8" class="error">❌ ${message}</td></tr>`;
}

// 데이터 없음
function showNoData() {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = '<tr><td colspan="8" class="loading">조건에 맞는 종목이 없습니다.</td></tr>';
}
