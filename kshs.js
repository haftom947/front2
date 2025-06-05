const ws = new WebSocket('wss://kshs-quiz1.onrender.com'); // Use your actual PC IP

ws.onopen = () => {
  ws.send(JSON.stringify({ type: "registerTeacher" }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'sentQuestionToTeacher') {
    showTeacherOverlay({
      studentId: data.studentId,
      question: data.question,
      choiceA: data.choiceA,
      choiceB: data.choiceB,
      choiceC: data.choiceC,
      choiceD: data.choiceD
    });



  if (data.type === 'allStudents') {
    let html = `<h2>Registered Students</h2><ul>`;
    data.students.forEach(s => {
      html += `<li><b>${s.id}</b>: ${s.name}</li>`;
    });
    html += '</ul>';
    showCustomOverlay(html);
  }

  if (data.type === 'questionsForSubject') {
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
    document.getElementById('global-timer-input').value = data.value;
    document.getElementById('timer-feedback').textContent = 'Timer set to ' + data.value + ' seconds.';
    setTimeout(() => { document.getElementById('timer-feedback').textContent = ''; }, 2000);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('set-timer-btn').onclick = () => {
    const timerInput = parseInt(document.getElementById('global-timer-input').value, 10) || 180;
    ws.send(JSON.stringify({ type: 'setGlobalTimer', value: timerInput }));
    document.getElementById('timer-feedback').textContent = 'Timer set to ' + timerInput + ' seconds.';
    setTimeout(() => { document.getElementById('timer-feedback').textContent = ''; }, 2000);
  };

  document.getElementById('get-students-button').onclick = () => {
    ws.send(JSON.stringify({ type: 'getAllStudents' }));
  };

  document.getElementById('show-all-scores-btn').onclick = () => {
  ws.send(JSON.stringify({ type: 'getAllStudentScores' }));
};
document.getElementById('show-all-passwords-btn').onclick = () => {
  ws.send(JSON.stringify({ type: 'getAllStudentPasswords' }));
};

  document.getElementById('get-questions-button').onclick = () => {
    document.getElementById('question-type-selection').style.display = 'block';
  };

  document.getElementById('confirm-type-button').onclick = () => {
    const subject = document.getElementById('question-type').value;
    ws.send(JSON.stringify({
      type: 'getQuestionsForSubject',
      subject
    }));
    document.getElementById('question-type-selection').style.display = 'none';
  };

  document.querySelector('.js-register-button').onclick = () => {
    let stdName = document.querySelector('.student-name').value.trim();
    let stdId = document.querySelector('.student-id').value.trim();
    let stdPassword = document.querySelector('.student-password').value.trim();
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
    alert(`Student ${stdName} registered successfully.`);
    document.querySelector('.student-name').value = '';
    document.querySelector('.student-id').value = '';
    document.querySelector('.student-password').value = '';
  };

  document.querySelector('.js-remove-button').onclick = () => {
    ws.send(JSON.stringify({ type: 'resetStudents' }));
    alert('All student data has been reset.');
  };

  const sendButton = document.querySelector('.send-button');
  if (sendButton) {
    sendButton.addEventListener('click', () => {
      const selectedStudentId = document.getElementById('student-id').value;
      const selectedSubject = document.getElementById('subject').value;
      const selectedQuestionIndex = document.getElementById('question-no').value;
      const subjectKey = selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1);
      const questionIndex = parseInt(selectedQuestionIndex.replace('q', '')) - 1;
      ws.send(JSON.stringify({
        type: 'sendQuestion',
        studentId: selectedStudentId,
        subject: subjectKey,
        questionIndex: questionIndex
      }));
      alert(`Question sent to student ID: ${selectedStudentId}`);
    });
  }

  // Show/hide question entry modal
  document.querySelector('.js-question-entry-button').onclick = () => {
    document.querySelector('.js-question-entry').classList.add('makeit-visible');
  };
  document.getElementById('subject-question').onchange = () => {
    const val = document.getElementById('subject-question').value;
    if (val && val !== 'nothing') {
      window.location.href = `question-web.html?subject=${encodeURIComponent(val)}`;
    }
  };
});

// Overlay/modal functions
function showTeacherOverlay({ studentId, question, choiceA, choiceB, choiceC, choiceD, answer, feedback }) {
  let overlay = document.getElementById('teacher-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'teacher-overlay';
    document.body.appendChild(overlay);
  }
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
  overlay.innerHTML = `
    ${html}
    <button class="close-btn" id="teacher-overlay-close">Close</button>
  `;
  overlay.style.display = 'block';
  document.getElementById('teacher-overlay-close').onclick = () => {
    overlay.style.display = 'none';
  };
}
