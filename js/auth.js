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

    // Try server-backed login; show server errors to user. Only fallback to demo on network failure.
    fetch('http://localhost:3000/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    }).then(r => {
        if (!r.ok) return r.json().then(err => { throw err; });
        return r.json();
    }).then(data => {
        localStorage.setItem('ews_token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        if (data.user.role && data.user.role.toLowerCase() === 'admin') window.location.href = 'admin.html';
        else window.location.href = 'employee.html';
    }).catch(err => {
        // If err has a message from server (authentication failed), show it
        if (err && err.error) {
            errorMsg.textContent = err.error || 'Login failed';
            errorMsg.style.display = 'block';
            return;
        }
        // network error or server not running: fallback to client-only demo
        console.warn('Auth server unreachable, falling back to client demo.', err);
        if (email.includes('admin')) window.location.href = 'admin.html';
        else {
            localStorage.setItem('currentUser', JSON.stringify({ name: 'Amit Sharma', role: 'Developer', email }));
            window.location.href = 'employee.html';
        }
    });
});
