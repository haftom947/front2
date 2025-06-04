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
    <h2>KSHS Academic Competition - Question</h2>
    <div>
      <b>Student:</b> ${studentId || ''}<br>
      <div style="margin: 12px 0; font-weight: bold;">${question || 'Waiting for the question...'}</div>
      <form style="pointer-events: none; opacity:0.7;">
        <label><input type="radio" name="answer" value="A" disabled> <span>${choiceA || ""}</span></label><br>
        <label><input type="radio" name="answer" value="B" disabled> <span>${choiceB || ""}</span></label><br>
        <label><input type="radio" name="answer" value="C" disabled> <span>${choiceC || ""}</span></label><br>
        <label><input type="radio" name="answer" value="D" disabled> <span>${choiceD || ""}</span></label><br>
      </form>
      ${answer ? `<b>Answer:</b> ${answer}<br>` : ''}
      ${feedback ? `<div class="feedback" style="color:${feedback === 'Correct!' ? 'green' : 'red'};">${feedback}</div>` : ''}
      <button class="close-btn" id="teacher-overlay-close">Close</button>
    </div>
  `;
  overlay.style.display = 'block';
  document.getElementById('teacher-overlay-close').onclick = () => {
    overlay.style.display = 'none';
  };
}
