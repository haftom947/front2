const ws = new WebSocket('wss://kshs-quiz1.onrender.com'); // Use your actual PC IP

ws.onopen = () => {
  console.log('Connected to WebSocket server');
  ws.send(JSON.stringify({ type: "registerTeacher" }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Message from server:', data);
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
};

document.addEventListener('DOMContentLoaded', () => {
document.getElementById('get-students-button').onclick = () => {
  ws.send(JSON.stringify({ type: 'getAllStudents' }));
};

// Show the type dropdown when "Show Questions for Selected Subject" is clicked
document.getElementById('get-questions-button').onclick = () => {
  document.getElementById('question-type-selection').style.display = 'block';
};

// When the type is confirmed, send subject + type to server, then hide the dropdown again
document.getElementById('confirm-type-button').onclick = () => {
  const subject = document.getElementById('question-type').value;
  ws.send(JSON.stringify({
    type: 'getQuestionsForSubject',
    subject,
    questionType
  }));
  document.getElementById('question-type-selection').style.display = 'none';
};
  let selectionMethod = document.querySelector('.js-question-entry-button');
  if (selectionMethod) {
    selectionMethod.addEventListener('click', () => {
      let question = document.querySelector('.js-question-entry');
      question.classList.add('makeit-visible');
    });
  }

  const registerButton = document.querySelector('.js-register-button');
  if (registerButton) {
    registerButton.addEventListener('click', () => {
      let stdName = document.querySelector('.student-name').value.trim();
      let stdId = document.querySelector('.student-id').value.trim();
      let stdPassword = document.querySelector('.student-password').value.trim();
       if (!stdName || !stdId || !stdPassword) {
      alert('Please fill in all the fields before registering.');
      return;
    }

      const studentObj = {
        type: 'register',
        studentName: stdName,
        studentId: stdId,
        studentPassword: stdPassword,
      };

      ws.send(JSON.stringify(studentObj));
alert(`Student ${stdName} registered successfully.`);
// Clear input fields after successful registration
document.querySelector('.student-name').value = '';
document.querySelector('.student-id').value = '';
document.querySelector('.student-password').value = '';
    });
  }

  const removeButton = document.querySelector('.js-remove-button');
  if (removeButton) {
    removeButton.addEventListener('click', () => {
      if (ws.readyState === WebSocket.OPEN) { // Ensure WebSocket is open
        const resetData = { type: 'resetStudents' }; // Message type for resetting students
        ws.send(JSON.stringify(resetData)); // Send the reset message to the server
        alert('All student data has been reset.');
      } else {
        alert('WebSocket connection is not open. Please refresh the page.');
      }
    });
  }

  const resetButton = document.querySelector('.js-reset-system-button');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      const resetData = { type: 'resetSystem' };
      ws.send(JSON.stringify(resetData));
      alert('All students have been reset.');
    });
  }

  const sendButton = document.querySelector('.send-button');
  if (sendButton) {
    sendButton.addEventListener('click', () => {
      const selectedStudentId = document.getElementById('student-id').value;
      console.log(selectedStudentId)   
       const selectedSubject = document.getElementById('subject').value;
             const selectedQuestionIndex = document.getElementById('question-no').value;

      // Capitalize subject to match server keys
      const subjectKey = selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1);
      const questionIndex = parseInt(selectedQuestionIndex.replace('q', '')) - 1;

      const questionData = {
        type: 'sendQuestion',
        studentId: selectedStudentId,
        subject: subjectKey,
        questionIndex: questionIndex
      };

      ws.send(JSON.stringify(questionData));
      alert(`Question sent to student ID: ${selectedStudentId}`);
    });
  }

  const questionEntryButton = document.querySelector('.js-question-entry-button');
  if (questionEntryButton) {
    questionEntryButton.addEventListener('click', () => {
      const questionEntryDiv = document.querySelector('.js-question-entry');
      if (questionEntryDiv) {
        questionEntryDiv.classList.add('makeit-visible'); // Make the subject selection visible
      }
    });

    const subjectDropdown = document.getElementById('subject-question');
    if (subjectDropdown) {
      subjectDropdown.addEventListener('change', () => {
        const selectedSubject = subjectDropdown.value;
        if (selectedSubject && selectedSubject !== 'nothing') {
          // Redirect to question-web.html with the selected subject
          window.location.href = `question-web.html?subject=${encodeURIComponent(selectedSubject)}`;
        }
      });
    }
  }
});
function showTeacherOverlay({ studentId, question, choiceA, choiceB, choiceC, choiceD, answer, feedback }) {
  let overlay = document.getElementById('teacher-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'teacher-overlay';
    document.body.appendChild(overlay);
  }

  // Feedback class for color
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
