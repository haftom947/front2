
const ws = new WebSocket('wss://kshs-quiz1.onrender.com'); // your deployed WebSocket URL

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

  // Add additional WebSocket response handling below as needed
};

document.addEventListener('DOMContentLoaded', () => {
  const registerButton = document.querySelector('.js-register-button');
  const removeButton = document.querySelector('.js-remove-button');

  registerButton.addEventListener('click', () => {
    let stdName = document.querySelector('.student-name').value.trim();
    let stdId = document.querySelector('.student-id').value.trim();
    let stdPassword = document.querySelector('.student-password').value.trim();

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

  if (removeButton) {
    removeButton.addEventListener('click', () => {
      if (ws.readyState === WebSocket.OPEN) {
        const resetData = { type: 'resetStudents' };
        ws.send(JSON.stringify(resetData));
        alert('All student data has been reset.');
      } else {
        alert('WebSocket connection is not open. Please refresh the page.');
      }
    });
  }

  // Add more button event handlers below if needed (e.g., send question)
});
