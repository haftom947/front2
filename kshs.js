
const ws = new WebSocket('wss://kshs-quiz1.onrender.com');

ws.onopen = () => {
  console.log('Connected to WebSocket server');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Received:", data);

  if (data.type === 'registerSuccess') {
    alert(`Student ${data.studentId} registered successfully.`);
    document.querySelector('.student-name').value = '';
    document.querySelector('.student-id').value = '';
    document.querySelector('.student-password').value = '';
  }

  if (data.type === 'registerError') {
    alert(data.message);
  }

  // Keep other message types intact
  if (data.type === 'questionResponse') {
    console.log("Student response received:", data);
  }

  if (data.type === 'resetConfirm') {
    console.log("Reset confirmation:", data);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const registerButton = document.querySelector('.js-register-button');
  const removeButton = document.querySelector('.js-remove-button');
  const sendButton = document.querySelector('.send-button');
  const questionEntryButton = document.querySelector('.js-question-entry-button');

  if (registerButton) {
    registerButton.addEventListener('click', () => {
      const stdName = document.querySelector('.student-name').value.trim();
      const stdId = document.querySelector('.student-id').value.trim();
      const stdPassword = document.querySelector('.student-password').value.trim();

      if (!stdName || !stdId || !stdPassword) {
        alert('Please fill in all fields.');
        return;
      }

      const studentObj = {
        type: 'register',
        studentName: stdName,
        studentId: stdId,
        studentPassword: stdPassword,
      };

      ws.send(JSON.stringify(studentObj));
    });
  }

  if (removeButton) {
    removeButton.addEventListener('click', () => {
      if (ws.readyState === WebSocket.OPEN) {
        const resetData = { type: 'resetStudents' };
        ws.send(JSON.stringify(resetData));
        alert('All student data has been reset.');
      } else {
        alert('WebSocket connection is not open.');
      }
    });
  }

  if (sendButton) {
    sendButton.addEventListener('click', () => {
      const studentId = document.getElementById('student-id').value;
      const subject = document.getElementById('subject').value;
      const questionNo = document.getElementById('question-no').value;

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'sendQuestion',
          studentId,
          subject,
          questionNo
        }));
      }
    });
  }

  if (questionEntryButton) {
    questionEntryButton.addEventListener('click', () => {
      document.querySelector('.js-question-entry').classList.add('makeit-visible');
    });

    const subjectSelect = document.getElementById('subject-question');
    if (subjectSelect) {
      subjectSelect.addEventListener('change', () => {
        const selectedSubject = subjectSelect.value;
        if (selectedSubject !== 'nothing') {
          window.location.href = `question-entry.html?subject=${selectedSubject}`;
        }
      });
    }
  }
});
