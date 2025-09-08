// eval.js (최종 완성본)
document.addEventListener('DOMContentLoaded', () => {

    // [중요] 본인의 Apps Script 웹 앱 URL을 여기에 붙여넣으세요.
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxVSuZz4g0_Hrkjtjphk-WtHCfhNXqn38h9VG5DJCRqA5xQ5HrWTBeXI39A48G-2fcp/exec";

    // --- DOM 요소 ---
    const evalTitle = document.getElementById('eval-title');
    const promptSection = document.querySelector('.prompt-section');
    const guidanceSection = document.getElementById('guidance-section');
    const outputsContainer = document.querySelector('.outputs-container');
    const evalSection = document.querySelector('.evaluation-section');
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

    let taskType;
    let currentItemIndex = 0;
    let data = [];
    let allAnswers = [];
    let currentAssignment = {};

    // --- 함수 정의 ---

    function displayItem() {
        if (currentItemIndex >= data.length) {
            showFinalSubmitScreen();
            return;
        }
        const item = data[currentItemIndex];

        if (Math.random() < 0.5) {
            modelAText.textContent = item.model_A.output;
            modelBText.textContent = item.model_B.output;
            currentAssignment = { 'A': item.model_A.name, 'B': item.model_B.name };
        } else {
            modelAText.textContent = item.model_B.output;
            modelBText.textContent = item.model_A.output;
            currentAssignment = { 'A': item.model_B.name, 'B': item.model_A.name };
        }
        
        promptText.textContent = item.prompt;
        constraintsList.innerHTML = '';
        let reminderParts = [];

        if (item.must_have && item.must_have.length > 0) {
            const text = `Concepts: ${item.must_have.join(', ')}`;
            const li = document.createElement('li');
            li.innerHTML = `<strong>Must Have:</strong> ${item.must_have.join(', ')}`;
            constraintsList.appendChild(li);
            reminderParts.push(text);
        }
        if (item.forbidden && item.forbidden.length > 0) {
             const text = `Forbidden: ${item.forbidden.join(', ')}`;
            const li = document.createElement('li');
            li.innerHTML = `<strong>Forbidden:</strong> ${item.forbidden.join(', ')}`;
            constraintsList.appendChild(li);
            reminderParts.push(text);
        }
        if (item.sentiment && item.sentiment.length > 0) {
             const text = `Sentiment: ${item.sentiment}`;
            const li = document.createElement('li');
            li.innerHTML = `<strong>Sentiment:</strong> ${item.sentiment}`;
            constraintsList.appendChild(li);
            reminderParts.push(text);
        }
        
        promptReminderText.textContent = reminderParts.join(' | ');
        progressText.textContent = `${currentItemIndex + 1} / ${data.length}`;
        progressIndicator.style.width = `${((currentItemIndex + 1) / data.length) * 100}%`;
    }
    
    function showFinalSubmitScreen() {
        if(promptSection) promptSection.style.display = 'none';
        if(guidanceSection) guidanceSection.style.display = 'none';
        if(outputsContainer) outputsContainer.style.display = 'none';
        if(evalSection) evalSection.style.display = 'none';
        if(finalSection) finalSection.style.display = 'block';
    }

    function saveAndNext() {
        const constraintChoice = document.querySelector('input[name="winner_constraint"]:checked');
        const naturalnessChoice = document.querySelector('input[name="winner_naturalness"]:checked');

        if (!constraintChoice || !naturalnessChoice) {
            alert("Please answer both questions.");
            return;
        }

        const getRealWinner = (choiceValue) => {
            if (choiceValue === 'Tie') return 'Tie';
            return currentAssignment[choiceValue]; 
        };

        const answer = {
            item_id: data[currentItemIndex].id,
            task: taskType,
            winner_constraint: getRealWinner(constraintChoice.value),
            winner_naturalness: getRealWinner(naturalnessChoice.value),
            reason: reasonText.value.trim()
        };
        
        allAnswers.push(answer);
        
        currentItemIndex++;
        reasonText.value = '';
        constraintChoice.checked = false;
        naturalnessChoice.checked = false;

        displayItem();
    }

    async function submitAllResults() {
        const evaluatorId = evaluatorIdInput.value.trim();
        if (!evaluatorId) {
            alert("Please enter your Evaluator ID before submitting.");
            return;
        }

        submitAllBtn.disabled = true;
        submitAllBtn.textContent = "Submitting...";

        const payloadToSend = allAnswers.map(ans => ({ evaluator_id: evaluatorId, ...ans }));

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST', mode: 'cors', cache: 'no-cache',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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
    
    (async () => {
        const params = new URLSearchParams(window.location.search);
        taskType = params.get('task');
        if (!taskType) {
            document.body.innerHTML = "<h1>Error: No task selected. Please go back.</h1>";
            return;
        }
        
        const dataFile = `data_${taskType}.json`;
        try {
            const response = await fetch(dataFile);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            data = (await response.json()).slice(0, 100);
            displayItem();
        } catch (error) {
            console.error("Data loading error:", error);
            alert(`Failed to load or parse ${dataFile}. Please check if the file exists and is valid. See console (F12) for details.`);
        }
    })();

    if (submitBtn) submitBtn.addEventListener('click', saveAndNext);
    if (submitAllBtn) submitAllBtn.addEventListener('click', submitAllResults);
});