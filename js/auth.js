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
    }).catch(async err => {
        // If err has a message from server (authentication failed), show it
        if (err && err.error) {
            errorMsg.textContent = err.error || 'Login failed';
            errorMsg.style.display = 'block';
            return;
        }
        // network error or server not running: fallback to client-only demo
        console.warn('Auth server unreachable, falling back to client demo.', err);
        try {
            // Check for local users array
            const ulist = window.users || [];
            const hashed = await hashPassword(password);
            const matched = ulist.find(u => (u.email||'').toLowerCase() === email.toLowerCase() && (u.password === password || u.password === hashed));
            if (matched) {
                const user = { name: matched.name || matched.email, role: matched.role || 'Employee', email: matched.email };
                localStorage.setItem('currentUser', JSON.stringify(user));
                if ((matched.role||'').toLowerCase() === 'admin') window.location.href = 'admin.html';
                else window.location.href = 'employee.html';
                return;
            }
        } catch (e) {
            console.warn('Local auth fallback failed', e);
        }
        // final fallback: naive redirect (keeps previous behavior)
        if (email.includes('admin')) window.location.href = 'admin.html';
        else {
            localStorage.setItem('currentUser', JSON.stringify({ name: 'Amit Sharma', role: 'Developer', email }));
            window.location.href = 'employee.html';
        }
    });
});

// Hash password using Web Crypto API (returns hex string)
async function hashPassword(password) {
    if (!password) return '';
    try {
        const enc = new TextEncoder();
        const data = enc.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        const bytes = Array.from(new Uint8Array(hash));
        return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        console.warn('hashPassword failed', e);
        return password; // fallback (insecure)
    }
}
