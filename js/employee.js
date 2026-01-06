document.addEventListener('DOMContentLoaded', () => {
    // seed sample tasks first, then render
    ensureMyTasksSample();
    // Show dashboard section by default
    showSection('dashboard');
    loadTasks();
    loadAllTasks();
});

// Ensure current user has some sample tasks to display (useful if localStorage was empty)
function ensureMyTasksSample() {
    try {
        const myName = (typeof currentUser !== 'undefined' && currentUser.name) ? currentUser.name : 'Amit Sharma';
        const myTasks = tasks.filter(t => t.handledBy === myName);
        if (myTasks.length >= 5) return; // already enough
        const nextIdBase = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 200;
        const samples = [
            { task: 'Prepare monthly report', status: 'Pending', dueDate: '2024-01-15' },
            { task: 'Refactor auth middleware', status: 'In Progress', dueDate: '2024-01-20' },
            { task: 'Update API docs', status: 'Pending', dueDate: '2024-01-18' },
            { task: 'Fix memory leak in service', status: 'In Progress', dueDate: '2024-01-25' },
            { task: 'Add telemetry for payment flow', status: 'Pending', dueDate: '2024-02-01' },
            { task: 'Review PR #512', status: 'Pending', dueDate: '2024-01-12' },
            { task: 'Optimize image pipeline', status: 'Pending', dueDate: '2024-01-30' }
        ];
        samples.forEach((s, i) => {
            tasks.push({ id: nextIdBase + i, task: s.task, status: s.status, dueDate: s.dueDate, assignedBy: 'Manager', handledBy: myName, projectId: 1 });
        });
        // persist via api if available, otherwise write to localStorage keys used by admin/api
        if (window.api && typeof window.api.saveAll === 'function') {
            window.api.saveAll();
        } else {
            try { localStorage.setItem('ews_tasks', JSON.stringify(tasks)); } catch(e) { console.warn('Could not persist tasks', e); }
        }
    } catch (e) {
        console.error('ensureMyTasksSample error', e);
    }
}

// run sample seeding then refresh UI
ensureMyTasksSample();
loadTasks();

function showSection(sectionName, clickedElement){
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    
    // Sections that map to element IDs
    const sectionMap = { 
        'dashboard': 'dashboardSection',
        'tasks': 'tasksSection',
        'transfer': 'transferSection',
        'docs': 'docsSection' 
    };
    
    // Show the requested section
    const id = sectionMap[sectionName];
    if (id) {
        const sectionEl = document.getElementById(id);
        if (sectionEl) {
            sectionEl.classList.remove('hidden');
        }
    }
    
    // Update Header Title
    const titleMap = { 
        'dashboard': 'My Dashboard',
        'tasks': 'My Tasks',
        'transfer': 'Previous Work History',
        'docs': 'Document Repository' 
    };
    const pageTitleEl = document.getElementById('pageTitle');
    if (pageTitleEl) {
        pageTitleEl.innerText = titleMap[sectionName] || 'My Dashboard';
    }
    
    // Update Sidebar Active State
    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    if (clickedElement && clickedElement.classList) {
        clickedElement.classList.add('active');
    } else {
        // Fallback: find sidebar anchor by onclick attribute
        const sel = Array.from(document.querySelectorAll('.sidebar-menu a')).find(a => {
            const onclick = a.getAttribute('onclick') || '';
            return onclick.includes(sectionName);
        });
        if (sel) sel.classList.add('active');
    }
    
    // Load section-specific data
    if (sectionName === 'tasks') {
        loadAllTasks();
    } else if (sectionName === 'dashboard') {
        loadTasks();
    } else if (sectionName === 'transfer') {
        renderEmployeeExtras();
    } else if (sectionName === 'docs') {
        renderProjectDocuments();
    }
}

function loadTasks() {
    const tableBody = document.getElementById('dashboardTaskTable');
    tableBody.innerHTML = '';

    // Filter tasks for current user (Amit Sharma)
    const myName = (typeof currentUser !== 'undefined' && currentUser.name) ? currentUser.name : 'Amit Sharma';
    const myTasks = tasks.filter(t => t.handledBy === myName || t.handledBy === 'Rahul Verma'); // Show both for demo

    // update pending count
    const pending = myTasks.filter(t=>t.status !== 'Completed').length;
    const pendingEl = document.getElementById('pendingTasksCountEmp'); if (pendingEl) pendingEl.textContent = pending;

    myTasks.forEach(task => {
        const tr = document.createElement('tr');

        let statusClass = 'badge-success';
        if (task.status === 'Pending') statusClass = 'badge-danger';
        if (task.status === 'In Progress') statusClass = 'badge-warning';

        tr.innerHTML = `
            <td>${task.task}</td>
            <td><span class="badge ${statusClass}">${task.status}</span></td>
            <td>${task.dueDate}</td>
            <td>${task.assignedBy}</td>
        `;
        tableBody.appendChild(tr);
    });
    // Update profile card for the current user
    try { renderProfile(); } catch(e) { console.warn('renderProfile error', e); }
}

// Render the small profile card shown on the dashboard
function renderProfile() {
    try {
        const name = (typeof currentUser !== 'undefined' && currentUser.name) ? currentUser.name : 'Amit Sharma';
        const emp = employees.find(e => e.name === name) || employees.find(e => e.id === 2) || { name, role: 'Employee', status: '', project: '' };

        // Avatar
        const avatarEl = document.getElementById('profileAvatar');
        if (avatarEl) {
            avatarEl.innerHTML = '';
            const img = document.createElement('img');
            const safeName = encodeURIComponent(emp.name || name);
            const src = (emp.photo && emp.photo.length) ? emp.photo : `https://ui-avatars.com/api/?name=${safeName}&background=0D8ABC&color=fff&size=256`;
            img.src = src;
            img.alt = emp.name || name;
            avatarEl.appendChild(img);
        }

        const nameEl = document.getElementById('profileName'); if (nameEl) nameEl.textContent = emp.name || name;
        const roleEl = document.getElementById('profileRole'); if (roleEl) roleEl.textContent = emp.role || (currentUser && currentUser.role) || '';
        // show email/login status if linked
        const linkedUser = (window.users || []).find(u => u.employeeId === emp.id);
        const emailPart = linkedUser ? linkedUser.email : (currentUser && currentUser.email ? currentUser.email : 'No login');
        const metaEl = document.getElementById('profileMeta'); if (metaEl) metaEl.textContent = `${emailPart} • ${emp.project || (currentUser && currentUser.project) || '-'} • ${emp.status || 'Active'}`;

        // wire edit button (demo only)
        const editBtn = document.getElementById('editProfileBtn');
        if (editBtn) {
            editBtn.onclick = () => { alert('Edit profile demo - implement form as needed.'); };
        }
    } catch (e) {
        console.error('renderProfile error', e);
    }
}

function loadAllTasks(){
    const body = document.getElementById('allTasksBody'); if (!body) return; body.innerHTML = '';
    const myName = (typeof currentUser !== 'undefined' && currentUser.name) ? currentUser.name : 'Amit Sharma';
    const myTasks = tasks.filter(t=>t.handledBy === myName || t.handledBy === 'Rahul Verma');
    myTasks.forEach(t=>{
        const tr = document.createElement('tr');
        let cls = 'badge-success'; if (t.status==='Pending') cls='badge-danger'; if (t.status==='In Progress') cls='badge-warning';
        const actionDisabled = (t.status === 'Completed') ? 'disabled' : '';
        const actionLabel = (t.status === 'Completed') ? 'Completed' : 'Mark Done';
        const actionClass = (t.status === 'Completed') ? 'btn btn-outline' : 'btn btn-primary';
        tr.innerHTML = `<td>${t.task}</td><td><span class="badge ${cls}">${t.status}</span></td><td>${t.dueDate||'-'}</td><td>${t.assignedBy||'-'}</td><td><button class="${actionClass}" ${actionDisabled} onclick="markTaskCompleted(${t.id})">${actionLabel}</button></td>`;
        body.appendChild(tr);
    });
}

function createToast(message, timeout=2800){
    try{
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container);
        }
        const toast = document.createElement('div'); toast.className = 'toast show'; toast.textContent = message;
        container.appendChild(toast);
        setTimeout(()=>{
            toast.classList.remove('show');
            try{ container.removeChild(toast); }catch(e){}
        }, timeout);
    }catch(e){ console.warn('createToast failed', e); }
}

function markTaskCompleted(id){
    const t = tasks.find(x=>x.id==id); if (!t) return;
    if (t.status === 'Completed') return;
    const ok = confirm(`Mark task "${t.task}" as completed?`);
    if (!ok) return;
    t.status = 'Completed';
    t.completedAt = new Date().toISOString();
    if (window.api && typeof window.api.saveAll === 'function') window.api.saveAll(); else try{ localStorage.setItem('ews_tasks', JSON.stringify(tasks)); }catch(e){}
    loadTasks(); loadAllTasks();
    try { createToast('Task marked completed'); } catch(e){ alert('Task marked completed'); }
}

// Render previous work timeline and files for the current user
function renderEmployeeExtras(){
    try{
        const myName = (typeof currentUser !== 'undefined' && currentUser.name) ? currentUser.name : 'Amit Sharma';
        const emp = employees.find(e=>e.name === myName) || employees.find(e=>e.id===2) || { previousWork: [], files: [] };

        // Timeline: combine previousWork and recent activity logs mentioning the user
        const timelineEl = document.getElementById('empTimeline');
        if (timelineEl) {
            timelineEl.innerHTML = '';
            // previousWork entries (year + desc)
            (emp.previousWork || []).slice().reverse().forEach(w => {
                const item = document.createElement('div'); item.className='timeline-item';
                const date = document.createElement('div'); date.className='timeline-date'; date.textContent = w.year || '';
                const content = document.createElement('div'); content.className='timeline-content';
                content.innerHTML = `<strong>${w.desc}</strong>`;
                item.appendChild(date); item.appendChild(content); timelineEl.appendChild(item);
            });

            // activity logs mentioning the user (most recent first)
            const related = (activityLogs || []).filter(l=> (l.action||'').includes(myName)).slice(-6).reverse();
            related.forEach(l=>{
                const item = document.createElement('div'); item.className='timeline-item';
                const date = document.createElement('div'); date.className='timeline-date'; date.textContent = l.time || '';
                const content = document.createElement('div'); content.className='timeline-content'; content.innerHTML = `<strong>${l.action}</strong>`;
                item.appendChild(date); item.appendChild(content); timelineEl.appendChild(item);
            });

            // if empty, show placeholder
            if (timelineEl.children.length === 0) timelineEl.innerHTML = '<div class="text-muted">No timeline available</div>';
        }

        // Files
        const filesEl = document.getElementById('empFilesList');
        if (filesEl) {
            filesEl.innerHTML = '';
            (emp.files || []).forEach(f=>{
                const div = document.createElement('div'); div.className='file-list-item';
                const left = document.createElement('div'); left.className='flex items-center';
                const ext = (f.name || '').split('.').pop() || '';
                const iconClass = ext === 'pdf' ? 'fa-file-pdf' : (ext==='sql' ? 'fa-file-code' : (ext==='xlsx' || ext==='xls' ? 'fa-file-excel' : 'fa-file'));
                left.innerHTML = `<i class="fas ${iconClass} file-icon"></i><span class="file-name">${f.name}</span>`;
                const right = document.createElement('div'); right.className='file-meta';
                const badge = document.createElement('span'); badge.className = 'badge badge-success'; badge.textContent = f.note ? f.note : '';
                right.appendChild(badge);
                div.appendChild(left); div.appendChild(right); filesEl.appendChild(div);
            });
            if ((emp.files||[]).length === 0) filesEl.innerHTML = '<div class="text-muted">No files available</div>';
        }

        // Exit summary: show when employee has left or exitSummary is present
        const exitEl = document.getElementById('exitSummaryCard');
        if (exitEl) {
            if ((emp.status && emp.status.toLowerCase() === 'left') || emp.exitSummary) {
                const summaryText = emp.exitSummary || (`${emp.name} has left the organization.`);
                exitEl.innerHTML = `<div class="card"><h3>Exit Summary</h3><p class="profile-mt8">${summaryText}</p></div>`;
            } else {
                exitEl.innerHTML = '';
            }
        }
    }catch(e){ console.error('renderEmployeeExtras', e); }
}

// call extras renderer after page load
document.addEventListener('DOMContentLoaded', ()=>{ renderEmployeeExtras(); });

// Simple upload handler so the "Upload File" button does something useful.
// This does not persist to backend; it just shows a confirmation for now.
function uploadEmployeeDocument() {
    const input = document.getElementById('employeeDocInput');
    if (!input) {
        alert('Upload not available on this page.');
        return;
    }
    input.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const uploader = (typeof currentUser !== 'undefined' && currentUser.name) ? currentUser.name : 'Unknown';
        const name = file.name;
        const size = file.size || 0;
        const note = `Uploaded by ${uploader}`;
        const docObj = { name, size, url: '', note, uploader, time: new Date().toISOString() };

        try {
            // add to employee's files
            const empName = (currentUser && currentUser.name) ? currentUser.name : 'Amit Sharma';
            const emp = employees.find(e => e.name === empName) || employees.find(e => e.id === 2);
            if (emp) {
                emp.files = emp.files || [];
                emp.files.unshift(docObj);
            }

            // add to project's documents
            const projectName = (currentUser && currentUser.project) ? currentUser.project : (emp && emp.project) || '';
            const proj = projects.find(p => p.name === projectName) || projects.find(p => p.id === (emp && emp.projectId));
            if (proj) {
                proj.documents = proj.documents || [];
                proj.documents.unshift(docObj);
            }

            // persist demo data if possible
            if (window.api && typeof window.api.saveAll === 'function') {
                window.api.saveAll();
            } else {
                try { localStorage.setItem('ews_employees', JSON.stringify(employees)); } catch (e) { /* ignore */ }
                try { localStorage.setItem('ews_projects', JSON.stringify(projects)); } catch (e) { /* ignore */ }
            }

            // Re-render UI
            renderEmployeeExtras();
            renderProjectDocuments();

            alert(`File "${name}" uploaded and added to project documents (demo).`);
        } catch (err) {
            console.error('uploadEmployeeDocument error', err);
            alert('Upload failed (see console).');
        }

        // reset so the same file can be chosen again
        e.target.value = '';
    };
    input.click();
}

// Render project documents in the Documents section
function renderProjectDocuments() {
    try {
        const listEl = document.getElementById('projectDocsList');
        if (!listEl) return;

        const projName = (currentUser && currentUser.project) ? currentUser.project : '';
        const proj = projects.find(p => p.name === projName) || projects[0];

        listEl.innerHTML = '';
        const docs = (proj && proj.documents) ? proj.documents : [];
        if (docs.length === 0) {
            listEl.innerHTML = '<div class="text-muted">No project documents available</div>';
            return;
        }

        docs.forEach(d => {
            const div = document.createElement('div'); div.className = 'file-list-item';
            const left = document.createElement('div'); left.className = 'flex items-center';
            const ext = (d.name || '').split('.').pop() || '';
            const iconClass = ext === 'pdf' ? 'fa-file-pdf' : (ext==='sql' ? 'fa-file-code' : (ext==='xlsx' || ext==='xls' ? 'fa-file-excel' : 'fa-file'));
            left.innerHTML = `<i class="fas ${iconClass} file-icon"></i><span class="file-name">${d.name}</span>`;
            const right = document.createElement('div'); right.className = 'file-meta';
            const badge = document.createElement('span'); badge.className = 'badge badge-success'; badge.textContent = d.note || '';
            right.appendChild(badge);
            div.appendChild(left); div.appendChild(right); listEl.appendChild(div);
        });
    } catch (e) { console.error('renderProjectDocuments', e); }
}