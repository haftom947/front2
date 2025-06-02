// kshs.js

// 1. Connect to your deployed WebSocket server
const ws = new WebSocket('wss://kshs-quiz1.onrender.com');

ws.onopen = () => {
  console.log('Connected to WebSocket server');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Message from server:', data);

  // 2a. Registration succeeded
  if (data.type === 'registerSuccess') {
    alert(`Student ${data.studentId} registered successfully.`);
    document.querySelector('.student-name').value = '';
    document.querySelector('.student-id').value = '';
    document.querySelector('.student-password').value = '';
    return;
  }

  // 2b. Registration failed (duplicate ID)
  if (data.type === 'registerError') {
    alert(data.message); // e.g. "Student ID already exists."
    return;
  }

  // 3. (You can add other ws.onmessage handlers here if needed.)
  //    For example:
  // if (data.type === 'sendQuestion' && data.status === 'success') { ... }
  // if (data.type === 'sendQuestion' && data.status === 'error') { ... }
  // etc.
};

document.addEventListener('DOMContentLoaded', () => {
  // 4. Register button (sends "register" request, then waits for server response)
  const registerButton = document.querySelector('.js-register-button');
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

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(studentObj));
        // Do NOT alert success yet—wait for ws.onmessage to confirm
      } else {
        alert('WebSocket connection is not open. Please refresh the page.');
      }
    });
  }

  // 5. Remove button (reset all students)
  const removeButton = document.querySelector('.js-remove-button');
  if (removeButton) {
    removeButton.addEventListener('click', () => {
      if (ws.readyState === WebSocket.OPEN) {
        if (confirm('Are you sure you want to remove ALL students?')) {
          ws.send(JSON.stringify({ type: 'resetStudents' }));
          alert('All student data has been reset.');
        }
      } else {
        alert('WebSocket connection is not open. Please refresh the page.');
      }
    });
  }

  // 6. Reset System button (clear students + questions)
  const resetButton = document.querySelector('.js-reset-system-button');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      if (ws.readyState === WebSocket.OPEN) {
        if (confirm('Are you sure you want to reset the entire system?')) {
          ws.send(JSON.stringify({ type: 'resetSystem' }));
          alert('System has been reset (all students and questions).');
        }
      } else {
        alert('WebSocket connection is not open. Please refresh the page.');
      }
    });
  }

  // 7. Send Question button
  const sendButton = document.querySelector('.send-button');
  if (sendButton) {
    sendButton.addEventListener('click', () => {
      const selectedStudentId = document.getElementById('student-id').value.trim();
      const selectedSubject = document.getElementById('subject').value;
      const selectedQuestionIndex = document.getElementById('question-no').value;

      if (!selectedStudentId) {
        alert('Please enter or select a Student ID.');
        return;
      }

      const subjectKey = selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1);
      const questionIndex = parseInt(selectedQuestionIndex.replace('q', '')) - 1;

      const questionData = {
        type: 'sendQuestion',
        studentId: selectedStudentId,
        subject: subjectKey,
        questionIndex: questionIndex,
      };

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(questionData));
        alert(`Question ${selectedQuestionIndex} sent to student ID: ${selectedStudentId}`);
      } else {
        alert('WebSocket connection is not open. Cannot send question.');
      }
    });
  }

  // 8. "Enter Your Question" button (show subject dropdown)
  const questionEntryButton = document.querySelector('.js-question-entry-button');
  if (questionEntryButton) {
    questionEntryButton.addEventListener('click', () => {
      const questionEntryDiv = document.querySelector('.js-question-entry');
      if (questionEntryDiv) {
        questionEntryDiv.classList.add('makeit-visible');
      }
    });

    const subjectDropdown = document.getElementById('subject-question');
    if (subjectDropdown) {
      subjectDropdown.addEventListener('change', () => {
        const selectedSubject = subjectDropdown.value;
        if (selectedSubject && selectedSubject !== 'nothing') {
          window.location.href = `question-web.html?subject=${encodeURIComponent(selectedSubject)}`;
        }
      });
    }
  }

  // 9. Any other button handlers you had—leave below if needed
  // For example, a “Logout” button might be:
  // const logoutButton = document.getElementById('logout-button');
  // if (logoutButton) {
  //   logoutButton.addEventListener('click', () => {
  //     localStorage.removeItem('isTeacherAuthenticated');
  //     window.location.href = 'teacher-login.html';
  //   });
  // }
});
