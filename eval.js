const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzGHJ-MesHOZxIloja7oE5HvWsBIJVCm0kocBjnqEilwK9zQMAie0U0E0-ysHSMgBaq/exec";

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

    // --- [수정됨] 상세 정보 표시 ---
    document.getElementById('prompt-text').textContent = item.prompt;
    const constraintsList = document.getElementById('constraints-list');
    constraintsList.innerHTML = ''; // 이전 목록 초기화

    // must_have 정보 추가
    if (item.must_have && item.must_have.length > 0) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>Must Have:</strong> ${item.must_have.join(', ')}`;
        constraintsList.appendChild(li);
    }
    // forbidden 정보 추가
    if (item.forbidden && item.forbidden.length > 0) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>Forbidden:</strong> ${item.forbidden.join(', ')}`;
        constraintsList.appendChild(li);
    }
    // sentiment 정보 추가
    if (item.sentiment) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>Sentiment:</strong> ${item.sentiment}`;
        constraintsList.appendChild(li);
    }
    // ----------------------------

    modelAText.textContent = item.model_A_output;
    modelBText.textContent = item.model_B_output;
    
    // 진행 상황 업데이트
    progressText.textContent = `${currentItemIndex + 1} / ${data.length}`;
    progressIndicator.style.width = `${((currentItemIndex + 1) / data.length) * 100}%`;
    const reminderElement = document.getElementById('prompt-reminder-text');
    let reminderParts = []; // 표시할 제약 조건들을 담을 배열

    // 1. must_have 추가
    if (item.must_have && item.must_have.length > 0) {
        reminderParts.push(`Concepts: ${item.must_have.join(', ')}`);
    }
    // 2. sentiment 추가 (존재할 경우)
    if (item.sentiment) {
        reminderParts.push(`Sentiment: ${item.sentiment}`);
    }
    // 3. forbidden 추가 (존재할 경우)
    if (item.forbidden && item.forbidden.length > 0) {
        reminderParts.push(`Forbidden: ${item.forbidden.join(', ')}`);
    }

    // 배열의 모든 부분을 ' | '로 연결하여 최종 텍스트 생성
    reminderElement.textContent = reminderParts.join(' | ');
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
    // [수정] 두 질문에 대한 응답을 모두 가져옵니다.
    const constraintChoice = document.querySelector('input[name="winner_constraint"]:checked');
    const naturalnessChoice = document.querySelector('input[name="winner_naturalness"]:checked');

    // [수정] 두 질문 모두에 답했는지 확인합니다.
    if (!constraintChoice || !naturalnessChoice) {
        alert("Please answer both questions.");
        return;
    }

    const currentItem = data[currentItemIndex];
    
    // [수정] payload 객체에 두 가지 응답을 모두 담습니다.
    const answer = {
        evaluator_id: evaluatorId,
        item_id: currentItem.id,
        task: taskType,
        model_a_output: currentItem.model_A_output,
        model_b_output: currentItem.model_B_output,
        winner_constraint: constraintChoice.value,
        winner_naturalness: naturalnessChoice.value,
        reason: reasonText.value.trim()
    };
    
    allAnswers.push(answer);
    console.log(`Answer #${currentItemIndex + 1} saved locally.`);

    currentItemIndex++;
    reasonText.value = '';
    // [수정] 두 질문의 선택을 모두 초기화합니다.
    constraintChoice.checked = false;
    naturalnessChoice.checked = false;

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


submitBtn.addEventListener('click', saveAndNext);
submitAllBtn.addEventListener('click', submitAllResults);