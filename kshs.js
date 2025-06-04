const ws = new WebSocket('wss://kshs-quiz1.onrender.com'); // Use your actual PC IP

ws.onopen = () => {
  console.log('Connected to WebSocket server');
  ws.send(JSON.stringify({ type: "registerTeacher" }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Message from server:', data);
  if (data.type === 'studentAnswered') {
  showTeacherOverlay(data); // displays student answer and feedback
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
function showTeacherOverlay({ studentId, question, answer, feedback }) {
  let overlay = document.getElementById('teacher-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'teacher-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '10px';
    overlay.style.right = '10px';
    overlay.style.background = 'rgba(0,0,0,0.9)';
    overlay.style.color = '#fff';
    overlay.style.padding = '20px';
    overlay.style.borderRadius = '8px';
    overlay.style.zIndex = 1000;
    overlay.style.maxWidth = '380px';
    overlay.style.fontSize = '1rem';
    overlay.style.boxShadow = '0 2px 10px rgba(0,0,0,0.5)';
    document.body.appendChild(overlay);
  }
  let html = `<b>Student:</b> ${studentId}<br><b>Question:</b> ${question}`;
  if (answer) {
    html += `<br><b>Answer:</b> ${answer}`;
  }
  if (feedback) {
    html += `<br><b>Feedback:</b> <span style="color:${feedback === 'Correct!' ? 'lightgreen' : 'red'}">${feedback}</span>`;
  }
  overlay.innerHTML = html;
  overlay.style.display = 'block';
}
