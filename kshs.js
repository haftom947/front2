// Always reload if coming from bfcache (browser back/forward cache)
window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    window.location.reload();
  }
});

// Always reset overlays/modals on load for reliability
window.addEventListener('DOMContentLoaded', function() {
  var overlay = document.getElementById('teacher-overlay');
  if (overlay) overlay.style.display = 'none';
  var entry = document.getElementById('question-entry-modal');
  if (entry) entry.style.display = 'none';

  // --- Add fullscreen-on-doubleclick to modals ---
  addFullscreenOnDblClick(overlay);
  addFullscreenOnDblClick(entry);
});

// --- Fullscreen helper functions ---
function requestFullScreen(element) {
  if (!element) return;
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

function addFullscreenOnDblClick(modal) {
  if (!modal) return;
  // Avoid adding multiple listeners
  if (!modal._fullscreenListenerAdded) {
    modal.addEventListener('dblclick', function(e) {
      // Only trigger when background is double-clicked
      if (e.target === modal) {
        requestFullScreen(modal);
      }
    });
    modal._fullscreenListenerAdded = true;
  }
}

const ws = new WebSocket('wss://kshs-quiz1.onrender.com');
let wsReady = false;
let domReady = false;
let initialized = false;

// Control when to show the question overlay
let showQuestionsOverlay = false;

// --- Dynamic student selection ---
function populateStudentDropdown(studentList) {
  const select = document.getElementById('select-student-id');
  if (!select) return;
  select.innerHTML = '<option value="" selected>Select Student</option>';
  studentList.forEach(student => {
    const opt = document.createElement('option');
    opt.value = student.id;
    opt.textContent = `${student.name} (${student.id})`;
    select.appendChild(opt);
  });
}

// --- Only populate the question dropdown when needed, never show overlay here ---
function requestQuestionDropdown(subject) {
  ws.send(JSON.stringify({ type: 'getQuestionsForSubject', subject }));
}

function initializeUI() {
  if (!wsReady || !domReady || initialized) return;
  initialized = true;

  // Request latest students for the dropdown (also after registration)
  ws.send(JSON.stringify({ type: 'getAllStudents' }));

  // --- Remove subject change event for auto question loading! ---
  // Instead, populate question dropdown only when "Send Question" is needed (before sending)
  // (So we fetch on subject selection for send, but only update dropdown, not overlay/content)

  const setTimerBtn = document.getElementById('set-timer-btn');
  if (setTimerBtn) {
    setTimerBtn.onclick = () => {
      const timerInputEl = document.getElementById('global-timer-input');
      const feedbackEl = document.getElementById('timer-feedback');
      const timerInput = parseInt(timerInputEl && timerInputEl.value, 10) || 180;
      ws.send(JSON.stringify({ type: 'setGlobalTimer', value: timerInput }));
      if (feedbackEl) {
        feedbackEl.textContent = 'Timer set to ' + timerInput + ' seconds.';
        setTimeout(() => { feedbackEl.textContent = ''; }, 2000);
      }
    };
  }
  const getStudentsBtn = document.getElementById('get-students-button');
  if (getStudentsBtn) {
    getStudentsBtn.onclick = () => {
      window.triggeredShowAllStudents = true;
      ws.send(JSON.stringify({ type: 'getAllStudents' }));
    };
  }
  const showAllScoresBtn = document.getElementById('show-all-scores-btn');
  if (showAllScoresBtn) {
    showAllScoresBtn.onclick = () => {
      ws.send(JSON.stringify({ type: 'getAllStudentScores' }));
    };
  }
  const showAllPasswordsBtn = document.getElementById('show-all-passwords-btn');
  if (showAllPasswordsBtn) {
    showAllPasswordsBtn.onclick = () => {
      ws.send(JSON.stringify({ type: 'getAllStudentPasswords' }));
    };
  }
  const getQuestionsBtn = document.getElementById('get-questions-button');
  if (getQuestionsBtn) {
    getQuestionsBtn.onclick = () => {
      const questionTypeSelection = document.getElementById('question-type-selection');
      if (questionTypeSelection) questionTypeSelection.style.display = 'block';
    };
  }
  const confirmTypeBtn = document.getElementById('confirm-type-button');
  if (confirmTypeBtn) {
    confirmTypeBtn.onclick = () => {
      const questionTypeSelect = document.getElementById('question-type');
      const questionTypeSelection = document.getElementById('question-type-selection');
      if (questionTypeSelect) {
        const subject = questionTypeSelect.value;
        showQuestionsOverlay = true; // <-- Only for this call!
        ws.send(JSON.stringify({
          type: 'getQuestionsForSubject',
          subject
        }));
      }
      if (questionTypeSelection) questionTypeSelection.style.display = 'none';
    };
  }
  const registerBtn = document.querySelector('.js-register-button');
  if (registerBtn) {
    registerBtn.onclick = () => {
      const stdName = document.querySelector('.student-name')?.value.trim();
      const stdId = document.getElementById('register-student-id')?.value.trim();
      const stdPassword = document.querySelector('.student-password')?.value.trim();
      if (!stdName || !stdId || !stdPassword) {
        alert('Please fill in all the fields before registering.');
        return;
      }
      ws.send(JSON.stringify({
        type: 'register',
        studentName: stdName,
        studentId: stdId,
        studentPassword: stdPassword,
      }));
      showSuccessMessage('register-success', `Student ${stdName} registered successfully.`);
      document.querySelector('.student-name').value = '';
      document.getElementById('register-student-id').value = '';
      document.querySelector('.student-password').value = '';
      // --- Request updated student list right after registration
      ws.send(JSON.stringify({ type: 'getAllStudents' }));
    };
  }
  const removeBtn = document.querySelector('.js-remove-button');
  if (removeBtn) {
    removeBtn.onclick = () => {
      ws.send(JSON.stringify({ type: 'resetStudents' }));
      alert('All student data has been reset.');
      // --- Request updated student list after reset
      ws.send(JSON.stringify({ type: 'getAllStudents' }));
    };
  }
  const subjectSelect = document.getElementById('subject');
  if (subjectSelect) {
    subjectSelect.addEventListener('change', function () {
      // Only populate the question dropdown, do not show overlay/content
      if (wsReady) {
        let subjectKey = subjectSelect.value.charAt(0).toUpperCase() + subjectSelect.value.slice(1);
        requestQuestionDropdown(subjectKey);
      }
    });
  }
  const sendButton = document.querySelector('.send-button');
  if (sendButton) {
    sendButton.addEventListener('click', () => {
      const selectedStudentId = document.getElementById('select-student-id')?.value;
      const subjectSelectEl = document.getElementById('subject');
      const selectedSubject = subjectSelectEl?.value;
      const selectedQuestionIndex = document.getElementById('question-no')?.value;
      if (!selectedStudentId || !selectedSubject || !selectedQuestionIndex) {
        alert("Missing student, subject or question selection.");
        return;
      }
      const subjectKey = selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1);
      // Always ensure dropdown is fresh before sending (could be improved with caching)
      requestQuestionDropdown(subjectKey);
      const questionIndex = parseInt(selectedQuestionIndex.replace('q', '')) - 1;
      ws.send(JSON.stringify({
        type: 'sendQuestion',
        studentId: selectedStudentId,
        subject: subjectKey,
        questionIndex: questionIndex
      }));
      showSuccessMessage('question-success', `Question sent to student ID: ${selectedStudentId}`);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  domReady = true;
  initializeUI();
});

ws.onopen = () => {
  ws.send(JSON.stringify({ type: "registerTeacher" }));
  wsReady = true;
  initializeUI();
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'allStudentScores') {
    let html = `<h2>Student Scores</h2><table border="1" style="width:100%;"><tr>
      <th>Name</th><th>ID</th><th>Correct</th><th>Wrong</th><th>Total</th></tr>`;
    data.students.forEach(s => {
      const score = s.score || { correct: 0, wrong: 0, total: 0 };
      html += `<tr>
        <td>${s.name}</td><td>${s.id}</td>
        <td>${score.correct}</td><td>${score.wrong}</td><td>${score.total}</td>
      </tr>`;
    });
    html += '</table>';
    showCustomOverlay(html);
  }

  if (data.type === 'allStudentPasswords') {
    let html = `<h2>Student Passwords</h2><table border="1" style="width:100%;"><tr>
      <th>Name</th><th>ID</th><th>Password</th></tr>`;
    data.students.forEach(s => {
      html += `<tr>
        <td>${s.name}</td><td>${s.id}</td><td>${s.password}</td>
      </tr>`;
    });
    html += '</table>';
    showCustomOverlay(html);
  }

  if (data.type === 'sentQuestionToTeacher') {
    showTeacherOverlay({
      studentId: data.studentId,
      question: data.question,
      choiceA: data.choiceA,
      choiceB: data.choiceB,
      choiceC: data.choiceC,
      choiceD: data.choiceD
    });
  }

  if (data.type === 'allStudents') {
    // --- Populate student dropdown dynamically
    if (Array.isArray(data.students)) {
      populateStudentDropdown(data.students);
    }
    // --- Also, show overlay for the "Show All Students" button
    let html = `<h2>Registered Students</h2><ul>`;
    data.students.forEach(s => {
      html += `<li><b>${s.id}</b>: ${s.name}</li>`;
    });
    html += '</ul>';
    // Only show overlay if this was the result of the "Show All Students" button
    if (window.triggeredShowAllStudents) {
      showCustomOverlay(html);
      window.triggeredShowAllStudents = false;
    }
  }

  if (data.type === 'questionsForSubject') {
    // Always update the question dropdown (but only show overlay if requested)
    const questionDropdown = document.getElementById('question-no');
    if (questionDropdown) {
      questionDropdown.innerHTML = "";
      data.questions.forEach((_, idx) => {
        const opt = document.createElement('option');
        opt.value = "q" + (idx + 1);
        opt.textContent = "Q" + (idx + 1);
        questionDropdown.appendChild(opt);
      });
    }
    // Only show overlay if we just wanted to DISPLAY the questions
    if (showQuestionsOverlay) {
      let html = `<h2>Questions for ${data.subject}</h2><ol>`;
      data.questions.forEach((q, idx) => {
        html += `<li>
          <b>Q${idx+1}:</b> ${q.question}<br>
          <span style="color:#1966c0">A.</span> ${q.choiceA || ""}<br>
          <span style="color:#1966c0">B.</span> ${q.choiceB || ""}<br>
          <span style="color:#1966c0">C.</span> ${q.choiceC || ""}<br>
          <span style="color:#1966c0">D.</span> ${q.choiceD || ""}<br>
          <span style="color:green"><b>Correct:</b> ${q.correct ? q.correct : "?"}</span>
        </li><br>`;
      });
      html += '</ol>';
      showCustomOverlay(html);
      showQuestionsOverlay = false;
    }
  }

  if (data.type === 'studentAnswered') {
    showTeacherOverlay({
      studentId: data.studentId,
      question: data.question,
      choiceA: data.choiceA,
      choiceB: data.choiceB,
      choiceC: data.choiceC,
      choiceD: data.choiceD,
      answer: data.answer,
      feedback: data.feedback
    });
  }

  if (data.type === 'currentTimerValue') {
    const timerInputEl = document.getElementById('global-timer-input');
    const feedbackEl = document.getElementById('timer-feedback');
    if (timerInputEl) timerInputEl.value = data.value;
    if (feedbackEl) {
      feedbackEl.textContent = 'Timer set to ' + data.value + ' seconds.';
      setTimeout(() => { feedbackEl.textContent = ''; }, 2000);
    }
  }
};

function showTeacherOverlay({ studentId, question, choiceA, choiceB, choiceC, choiceD, answer, feedback }) {
  let overlay = document.getElementById('teacher-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'teacher-overlay';
    document.body.appendChild(overlay);
  }
  // Make sure fullscreen double-click is always enabled!
  addFullscreenOnDblClick(overlay);

  let feedbackHtml = "";
  if (feedback) {
    const isCorrect = feedback.trim().toLowerCase().startsWith('correct');
    feedbackHtml = `<div class="feedback ${isCorrect ? 'correct' : 'incorrect'}">${feedback}</div>`;
  }
  overlay.innerHTML = `
    <h2>KSHS Academic Competition</h2>
    <span class="student-label"><b>Student:</b> ${studentId || ''}</span>
    <div class="question-box">${question || 'Waiting for the question...'}</div>
    <div class="choices">
      <div class="choice-label"><b>A.</b> ${choiceA || ""}</div>
      <div class="choice-label"><b>B.</b> ${choiceB || ""}</div>
      <div class="choice-label"><b>C.</b> ${choiceC || ""}</div>
      <div class="choice-label"><b>D.</b> ${choiceD || ""}</div>
    </div>
    ${answer ? `<div class="answer-row"><b>Submitted Answer:</b> ${answer}</div>` : ''}
    ${feedbackHtml}
    <div style="font-size:0.85em;color:#888;margin-top:10px;text-align:center;">
      Double-click the modal background to enter fullscreen.
    </div>
    <button class="close-btn" id="teacher-overlay-close">Close</button>
  `;
  overlay.style.display = 'block';
  document.getElementById('teacher-overlay-close').onclick = () => {
    overlay.style.display = 'none';
  };
}

function showCustomOverlay(html) {
  let overlay = document.getElementById('teacher-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'teacher-overlay';
    overlay.className = 'card';
    overlay.style.position = 'fixed';
    overlay.style.top = '10%';
    overlay.style.left = '50%';
    overlay.style.transform = 'translateX(-50%)';
    overlay.style.zIndex = 1000;
    overlay.style.maxWidth = '700px';
    overlay.style.width = '90%';
    document.body.appendChild(overlay);
  }
  // Make sure fullscreen double-click is always enabled!
  addFullscreenOnDblClick(overlay);

  overlay.innerHTML = `
    ${html}
    <div style="font-size:0.85em;color:#888;margin-top:10px;text-align:center;">
      Double-click the modal background to enter fullscreen.
    </div>
    <button class="close-btn" id="teacher-overlay-close">Close</button>
  `;
  overlay.style.display = 'block';
  document.getElementById('teacher-overlay-close').onclick = () => {
    overlay.style.display = 'none';
  };
}

function showSuccessMessage(id, message, timeout = 2200) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.className = 'field-feedback success';
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => { el.textContent = ''; }, timeout);
}
