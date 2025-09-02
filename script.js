// 1단계에서 복사한 본인의 Apps Script 웹 앱 URL을 여기에 붙여넣으세요.
const SCRIPT_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";

// --- DOM 요소 가져오기 ---
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
async function nextItem() {
    const winnerChoice = document.querySelector('input[name="winner"]:checked');
    if (!winnerChoice) {
        alert("Please select an option.");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const currentItem = data[currentItemIndex];
    const payload = {
        evaluator_id: evaluatorId,
        item_id: currentItem.id,
        model_a_output: currentItem.model_A_output,
        model_b_output: currentItem.model_B_output,
        winner: winnerChoice.value,
        reason: reasonText.value.trim()
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Apps Script는 text/plain을 선호
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        if (result.result === "success") {
            currentItemIndex++;
            reasonText.value = '';
            winnerChoice.checked = false;
            displayItem();
        } else {
            alert("Submission failed. Please try again. Error: " + result.message);
        }
    } catch (error) {
        alert("An error occurred: " + error);
    }
    
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit and Next";
}

// 페이지 로드 시 초기화
window.onload = async () => {
    // 평가자 ID 요청
    evaluatorId = prompt("Please enter your evaluator ID (e.g., your name or email):", "");
    if (!evaluatorId) {
        document.body.innerHTML = "<h1>Evaluator ID is required to start.</h1>";
        return;
    }

    // 평가 데이터 로드
    try {
        const response = await fetch('data.json');
        data = await response.json();
        displayItem();
    } catch (error) {
        alert("Failed to load data.json.");
    }
};

submitBtn.addEventListener('click', nextItem);