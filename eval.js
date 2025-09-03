const SCRIPT_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";

// --- DOM 요소 ---
const evalSection = document.querySelector('.evaluation-section');
const finalSection = document.getElementById('final-submission-section');
const submitAllBtn = document.getElementById('submit-all-btn');
// (이전과 동일한 다른 DOM 요소들...)
const promptText = document.getElementById('prompt-text');
const modelAText = document.getElementById('model-a-text');
const modelBText = document.getElementById('model-b-text');
const submitBtn = document.getElementById('submit-btn');
const reasonText = document.getElementById('reason-text');
const progressText = document.getElementById('progress-text');
const progressIndicator = document.getElementById('progress-indicator');


let evaluatorId, taskType;
let currentItemIndex = 0;
let data = [];
let allAnswers = []; // 모든 답변을 저장할 배열

// --- 함수 ---

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


// UI를 마지막 제출 화면으로 전환하는 함수
function showFinalSubmitScreen() {
    evalSection.style.display = 'none'; // 기존 평가 영역 숨기기
    document.querySelector('.outputs-container').style.display = 'none';
    document.querySelector('.prompt-section').style.display = 'none';
    finalSection.style.display = 'block'; // 최종 제출 버튼 보이기
}

// "Next" 버튼을 눌렀을 때의 동작
function saveAndNext() {
    const winnerChoice = document.querySelector('input[name="winner"]:checked');
    if (!winnerChoice) {
        alert("Please select an option (A, B, or Tie).");
        return;
    }

    const currentItem = data[currentItemIndex];
    const answer = {
        evaluator_id: evaluatorId,
        item_id: currentItem.id,
        task: taskType,
        model_a_output: currentItem.model_A_output,
        model_b_output: currentItem.model_B_output,
        winner: winnerChoice.value,
        reason: reasonText.value.trim()
    };

    allAnswers.push(answer); // 답변을 배열에 저장
    console.log(`Answer #${currentItemIndex + 1} saved locally.`);

    currentItemIndex++;
    reasonText.value = '';
    winnerChoice.checked = false;

    if (currentItemIndex >= data.length) {
        showFinalSubmitScreen();
    } else {
        displayItem();
    }
}

// "Submit All" 버튼을 눌렀을 때의 동작
async function submitAllResults() {
    submitAllBtn.disabled = true;
    submitAllBtn.textContent = "Submitting...";

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(allAnswers) // 전체 답변 배열을 전송
        });
        const result = await response.json();

        if (result.result === "success") {
            document.body.innerHTML = "<h1>Thank you! All results have been submitted successfully.</h1>";
        } else {
            alert("Submission failed. Error: " + result.message);
        }
    } catch (error) {
        alert("A critical error occurred: " + error);
    }

    submitAllBtn.disabled = false;
    submitAllBtn.textContent = "Submit All 100 Results";
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

submitBtn.addEventListener('click', saveAndNext);
submitAllBtn.addEventListener('click', submitAllResults);