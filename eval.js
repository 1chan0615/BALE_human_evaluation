// 1단계에서 복사한 본인의 Apps Script 웹 앱 URL을 여기에 붙여넣으세요.
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxnaFV9C5fezZuKlsGfQQ_HajTdEPRQqTnoFGtRo5AcLuGIrOqKiDrj9jgBR7a57lNM/exec";

// --- DOM 요소 가져오기 ---
const promptText = document.getElementById('prompt-text');
const modelAText = document.getElementById('model-a-text');
const modelBText = document.getElementById('model-b-text');
const submitBtn = document.getElementById('submit-btn');
const reasonText = document.getElementById('reason-text');
const progressText = document.getElementById('progress-text');
const progressIndicator = document.getElementById('progress-indicator');

let currentItemIndex = 0;
let data = [];
let taskType = ''; // sentiment 또는 formality

// --- 함수 정의 ---

function displayItem() { /* 이전과 동일 */ }

async function nextItem() { /* 이전과 거의 동일, payload에 taskType 추가 */
    // ...
    const payload = {
        // ... (이전 데이터들)
        task: taskType // 어떤 과제였는지 기록
    };
    // ... (fetch 로직은 동일)
}

// [수정됨] 페이지 로드 시 초기화 로직
window.onload = async () => {
    // 1. URL 파라미터에서 과제 종류(task)를 읽어옴
    const params = new URLSearchParams(window.location.search);
    taskType = params.get('task'); // 'sentiment' or 'formality'

    if (!taskType) {
        document.body.innerHTML = "<h1>Error: No task selected.</h1>";
        return;
    }
    
    document.getElementById('eval-title').textContent = `Human Evaluation: ${taskType}`;

    // 2. 과제 종류에 따라 다른 데이터 파일 로드
    const dataFile = `data_${taskType}.json`;
    
    try {
        const response = await fetch(dataFile);
        data = await response.json();
        // 3. 데이터를 100개로 제한
        data = data.slice(0, 100);
        displayItem();
    } catch (error) {
        alert(`Failed to load ${dataFile}.`);
    }
};

submitBtn.addEventListener('click', nextItem);