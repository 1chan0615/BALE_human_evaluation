// [중요] 1단계에서 복사한 본인의 Apps Script 웹 앱 URL을 여기에 붙여넣으세요.
const SCRIPT_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";

// --- DOM 요소 가져오기 ---
const evalTitle = document.getElementById('eval-title');
const promptText = document.getElementById('prompt-text');
const modelAText = document.getElementById('model-a-text');
const modelBText = document.getElementById('model-b-text');
const submitBtn = document.getElementById('submit-btn');
const reasonText = document.getElementById('reason-text');
const progressText = document.getElementById('progress-text');
const progressIndicator = document.getElementById('progress-indicator');

let evaluatorId = '';
let currentItemIndex = 0;
let data = [];
let taskType = '';

// --- 함수 정의 ---

// 데이터를 화면에 표시하는 함수
function displayItem() {
    if (currentItemIndex >= data.length) {
        document.body.innerHTML = "<h1>Thank you for completing the evaluation!</h1>";
        return;
    }
    const item = data[currentItemIndex];
    promptText.textContent = item.prompt;
    modelAText.textContent = item.model_A_output;
    modelBText.textContent = item.model_B_output;
    
    // 진행 상황 업데이트
    progressText.textContent = `${currentItemIndex + 1} / ${data.length}`;
    progressIndicator.style.width = `${((currentItemIndex + 1) / data.length) * 100}%`;
}

// 다음 항목으로 넘어가기
async function submitAndNext() {
    const winnerChoice = document.querySelector('input[name="winner"]:checked');
    if (!winnerChoice) {
        alert("Please select an option (A, B, or Tie).");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const currentItem = data[currentItemIndex];
    const payload = {
        evaluator_id: evaluatorId,
        item_id: currentItem.id,
        task: taskType,
        model_a_output: currentItem.model_A_output,
        model_b_output: currentItem.model_B_output,
        winner: winnerChoice.value,
        reason: reasonText.value.trim()
    };

    console.log("Submitting payload:", payload); // 디버깅용 로그

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        if (result.result === "success") {
            console.log("Submission successful."); // 디버깅용 로그
            currentItemIndex++;
            reasonText.value = '';
            winnerChoice.checked = false;
            displayItem();
        } else {
            alert("Submission failed. Please try again. Error: " + result.message);
        }
    } catch (error) {
        alert("A critical error occurred: " + error);
        console.error("Submission error:", error); // 디버깅용 로그
    }
    
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit and Next";
}

// 페이지 로드 시 초기화
window.onload = async () => {
    // 1. URL 파라미터에서 과제 종류(task)를 읽어옴
    const params = new URLSearchParams(window.location.search);
    taskType = params.get('task');

    if (!taskType) {
        document.body.innerHTML = "<h1>Error: No task selected. Please go back to the task selection page.</h1>";
        return;
    }
    
    evalTitle.textContent = `Human Evaluation: ${taskType.charAt(0).toUpperCase() + taskType.slice(1)}`;

    // 2. 이전에 저장된 평가자 ID를 사용하거나 새로 요청
    evaluatorId = sessionStorage.getItem('evaluatorId');
    if (!evaluatorId) {
        evaluatorId = prompt("Please enter your evaluator ID (e.g., your name or email):", "");
        if (!evaluatorId) {
            document.body.innerHTML = "<h1>Evaluator ID is required to start.</h1>";
            return;
        }
        sessionStorage.setItem('evaluatorId', evaluatorId);
    }
    
    // 3. 과제 종류에 따라 다른 데이터 파일 로드
    const dataFile = `data_${taskType}.json`;
    console.log(`Loading data from: ${dataFile}`); // 디버깅용 로그
    
    try {
        const response = await fetch(dataFile);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const loadedData = await response.json();
        data = loadedData.slice(0, 100); // 100개로 제한
        console.log(`Successfully loaded ${data.length} items.`); // 디버깅용 로그
        displayItem();
    } catch (error) {
        alert(`Failed to load or parse ${dataFile}. Please check if the file exists and is a valid JSON.`);
        console.error("Data loading error:", error); // 디버깅용 로그
    }
};

submitBtn.addEventListener('click', submitAndNext);