const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzGHJ-MesHOZxIloja7oE5HvWsBIJVCm0kocBjnqEilwK9zQMAie0U0E0-ysHSMgBaq/exec";

// --- DOM 요소 ---
const evalTitle = document.getElementById('eval-title');
const promptSection = document.querySelector('.prompt-section');
const outputsContainer = document.querySelector('.outputs-container');
const evalSection = document.querySelector('.evaluation-section');
const guidanceSection = documentgetElementById('guidance-section');
const finalSection = document.getElementById('final-submission-section');
const submitAllBtn = document.getElementById('submit-all-btn');
const evaluatorIdInput = document.getElementById('evaluator-id-input');
const promptText = document.getElementById('prompt-text');
const modelAText = document.getElementById('model-a-text');
const modelBText = document.getElementById('model-b-text');
const submitBtn = document.getElementById('submit-btn');
const reasonText = document.getElementById('reason-text');
const progressText = document.getElementById('progress-text');
const progressIndicator = document.getElementById('progress-indicator');
const constraintsList = document.getElementById('constraints-list');
const promptReminderText = document.getElementById('prompt-reminder-text');


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
    if(promptSection) promptSection.style.display = 'none';
    if(outputsContainer) outputsContainer.style.display = 'none';
    if(evalSection) evalSection.style.display = 'none';
    if(guidanceSection) guidanceSection.style.display = 'none';

    if(finalSection) finalSection.style.display = 'block';
}

// "Next" 버튼을 눌렀을 때의 동작
function saveAndNext() {
    const constraintChoice = document.querySelector('input[name="winner_constraint"]:checked');
    const naturalnessChoice = document.querySelector('input[name="winner_naturalness"]:checked');

    if (!constraintChoice || !naturalnessChoice) {
        alert("Please answer both questions.");
        return;
    }

    const currentItem = data[currentItemIndex];
    
    const answer = {
        item_id: currentItem.id,
        task: taskType,
        winner_constraint: constraintChoice.value,
        winner_naturalness: naturalnessChoice.value,
        reason: reasonText.value.trim()
    };
    
    allAnswers.push(answer);

    console.log(`[SAVE] Answer #${currentItemIndex + 1} saved locally.`);
    console.log("Saved Answer Object:", answer);
    console.log("Current allAnswers array:", allAnswers);

    currentItemIndex++;
    reasonText.value = '';
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
    const evaluatorId = evaluatorIdInput.value.trim();
    if (!evaluatorId) {
        alert("Please enter your Evaluator ID before submitting.");
        return;
    }

    submitAllBtn.disabled = true;
    submitAllBtn.textContent = "Submitting...";

    const payloadToSend = allAnswers.map(answer => ({
        evaluator_id: evaluatorId,
        item_id: answer.item_id,
        task: answer.task,
        winner_constraint: answer.winner_constraint,
        winner_naturalness: answer.winner_naturalness,
        reason: answer.reason
    }));

    // --- [디버깅 로그 2] ---
    console.log("[SUBMIT] Payload to be sent to Google Sheets:");
    console.log(payloadToSend);
    // ------------------------

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(payloadToSend)
        });
        const result = await response.json();

        if (result.result === "success") {
            document.body.innerHTML = "<h1>Thank you! All results have been submitted successfully.</h1>";
        } else {
            alert("Submission failed. Error: " + result.message);
        }
    } catch (error) {
        alert("A critical error occurred: " + error);
    } finally {
        submitAllBtn.disabled = false;
        submitAllBtn.textContent = "Submit All Results";
    }
}

// 페이지 로드 시 초기화
(async () => {
    const params = new URLSearchParams(window.location.search);
    taskType = params.get('task');

    if (!taskType) {
        document.body.innerHTML = "<h1>Error: No task selected.</h1>";
        return;
    }
    
    const dataFile = `data_${taskType}.json`;
    try {
        const response = await fetch(dataFile);
        data = (await response.json()).slice(0, 100);
        displayItem();
    } catch (error) {
        alert(`Failed to load ${dataFile}.`);
    }
})();


if (submitBtn) submitBtn.addEventListener('click', saveAndNext);
if (submitAllBtn) submitAllBtn.addEventListener('click', submitAllResults);