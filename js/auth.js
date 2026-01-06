document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMsg = document.getElementById('errorMsg');

    if (!email || !password) {
        errorMsg.textContent = "Please fill in all fields.";
        errorMsg.style.display = "block";
        return;
    }

    // Try server-backed login if backend is running
    fetch('http://localhost:3000/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    }).then(r => r.json()).then(data => {
        if (data && data.token && data.user) {
            localStorage.setItem('ews_token', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            if (data.user.role && data.user.role.toLowerCase() === 'admin') window.location.href = 'admin.html';
            else window.location.href = 'employee.html';
            return;
        }
        // fallback to old behavior when server returns error
        if (email.includes('admin')) window.location.href = 'admin.html';
        else {
            localStorage.setItem('currentUser', JSON.stringify({ name: 'Amit Sharma', role: 'Developer', email }));
            window.location.href = 'employee.html';
        }
    }).catch(err => {
        // network error or server not running: fallback to client-only demo
        if (email.includes('admin')) window.location.href = 'admin.html';
        else {
            localStorage.setItem('currentUser', JSON.stringify({ name: 'Amit Sharma', role: 'Developer', email }));
            window.location.href = 'employee.html';
        }
    });
});
