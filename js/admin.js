// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Initialize mock API and load data
    api.init().then(()=>{
        loadEmployees();
        loadProjects();
        loadLogs();
        populateTransferSelects();
        loadDashboard();
        applyPermissionUI();
        loadPermissions();
    });
});

// Navigation Logic
function showSection(sectionName) {
    // Hide all sections, BUT ensure stats usually stay visible if we want, 
    // or we can toggle them. For this design, let's keep stats on top of 'employees' only or make it a dashboard home.
    // For simplicity based on user request "Admin ko ek glance me sab samajh aa jaye", let's keep stats visible on 'employees' (which acts as Dashboard home)
    document.querySelectorAll('.section').forEach(el => el.classList.add('hidden'));

    // Hide all sections
    document.querySelectorAll('.section').forEach(el => el.classList.add('hidden'));

    // Sections that map to element IDs
    const sectionMap = {
        'employees': 'employeesSection',
        'transfer': 'transferSection',
        'projects': 'projectsSection',
        'logs': 'logsSection',
        'dashboard': 'dashboardSection',
        'profile': 'profileSection',
        'permissions': 'permissionsSection',
        'reports': 'reportsSection'
    };

    // Show the requested section
    const activeId = sectionMap[sectionName];
    if (activeId) {
        document.getElementById(activeId).classList.remove('hidden');
    }

    // Update Header Title
    const titleMap = {
        'employees': 'Employee Management',
        'transfer': 'Work Transfer Protocol',
        'projects': 'Project Overview',
        'logs': 'System Activity Logs',
        'dashboard': 'Dashboard',
        'profile': 'Employee Profile'
    };
    document.getElementById('pageTitle').innerText = titleMap[sectionName] || 'Admin Panel';

    // Update Sidebar Active State (if element provided mark it, otherwise clear all)
    document.querySelectorAll('.sidebar-menu a').forEach(el => el.classList.remove('active'));
    if (arguments[1]) {
        arguments[1].classList.add('active');
    } else {
        // try to find sidebar anchor whose onclick contains the section name
        const sel = Array.from(document.querySelectorAll('.sidebar-menu a')).find(a => (a.getAttribute('onclick')||'').includes(sectionName));
        if (sel) sel.classList.add('active');
    }
    // Special: if dashboard requested, refresh dashboard contents
    if (sectionName === 'dashboard') loadDashboard();
    if (sectionName === 'reports') loadReports();
}

// 1. Employee Management
function loadEmployees() {
    const tableBody = document.getElementById('employeeTableBody');
    tableBody.innerHTML = '';

    employees.forEach(emp => {
        const tr = document.createElement('tr');

        const statusBadge = emp.status === 'Active'
            ? '<span class="badge badge-success">Active</span>'
            : '<span class="badge badge-danger">Left</span>';

        // Actions based on permissions
        const canEdit = api.hasPermission(currentUser.role, 'employee:edit');
        const canDeactivate = api.hasPermission(currentUser.role, 'employee:deactivate');
        const canViewProfile = api.hasPermission(currentUser.role, 'view_profile');

        const editBtn = canEdit ? `<button class="btn btn-outline" style="padding:5px 10px;" onclick="openEditEmployeeModal(${emp.id})"><i class="fas fa-edit"></i></button>` : '';
        const actionBtn = emp.status === 'Active' && canDeactivate
            ? `<button class="btn btn-outline" style="padding:5px 10px; color: #dc3545; border-color: #dc3545;" onclick="deactivateEmployee(${emp.id})"><i class="fas fa-ban"></i></button>`
            : `<button class="btn btn-outline" style="padding:5px 10px;" disabled><i class="fas fa-check"></i></button>`;

        const nameCell = canViewProfile ? `<a href="#" onclick="openEmployeeProfile(${emp.id})">${emp.name}</a>` : emp.name;

        tr.innerHTML = `
            <td>#${emp.id}</td>
            <td>
                <div class="flex items-center gap-10">
                    <div style="width:30px;height:30px;background:#e9ecef;border-radius:50%;display:flex;align-items:center;justify-content:center;">
                        ${emp.name.charAt(0)}
                    </div>
                    ${nameCell}
                </div>
            </td>
            <td>${emp.role}</td>
            <td>${emp.project}</td>
            <td>${statusBadge}</td>
            <td>
                ${editBtn}
                ${actionBtn}
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function deactivateEmployee(id) {
    const emp = employees.find(e => e.id === id);
    if (!api.hasPermission(currentUser.role, 'employee:deactivate')) {
        showToast('You do not have permission to deactivate employees.', 'error');
        return;
    }
    if (confirm(`Are you sure you want to deactivate ${emp.name}?`)) {
        emp.status = "Left";
        api.addActivity(`Deactivated ${emp.name}`, 'Admin');
        api.saveAll().then(()=>{
            loadEmployees();
            showToast(`${emp.name} deactivated.`, 'warning');
        });
    }
}

// 2. Project Management
function loadProjects() {
    const tableBody = document.getElementById('projectsTableBody');
    tableBody.innerHTML = '';
    // populate projects table and task filter project select
    const projectFilter = document.getElementById('taskFilterProject');
    if (projectFilter) {
        projectFilter.innerHTML = '<option value="">All Projects</option>';
    }

    projects.forEach(proj => {
        const tr = document.createElement('tr');
        let statusBadge = '';
        if (proj.status === 'Active') statusBadge = '<span class="badge badge-success">Active</span>';
        else if (proj.status === 'Completed') statusBadge = '<span class="badge badge-warning">Completed</span>';

        const assignBtn = `<button class="btn btn-outline" onclick="openAssignModal(${proj.id})">Assign</button>`;

        tr.innerHTML = `
            <td><strong>${proj.name}</strong></td>
            <td>${proj.startDate || '-'} - ${proj.endDate || '-'}</td>
            <td><i class="fas fa-users"></i> ${ (proj.members && proj.members.length) || proj.teamSize || 0 }</td>
            <td>${statusBadge}</td>
            <td>${assignBtn} <button class="btn btn-outline" onclick="alert('View Project: ${proj.name}')">View</button></td>
        `;
        tableBody.appendChild(tr);

        if (projectFilter) {
            const opt = document.createElement('option');
            opt.value = proj.id;
            opt.textContent = proj.name;
            projectFilter.appendChild(opt);
        }
    });
}

let editingProjectId = null;
function openCreateProjectModal() {
    editingProjectId = null;
    document.getElementById('projectModalTitle').innerText = 'Create Project';
    document.getElementById('projName').value = '';
    document.getElementById('projStart').value = '';
    document.getElementById('projEnd').value = '';
    document.getElementById('projStatus').value = 'Active';
    document.getElementById('projectModal').classList.remove('hidden');
}

function closeProjectModal() { document.getElementById('projectModal').classList.add('hidden'); }

function saveProjectFromForm() {
    const name = document.getElementById('projName').value.trim();
    const start = document.getElementById('projStart').value;
    const end = document.getElementById('projEnd').value;
    const status = document.getElementById('projStatus').value;
    if (!name) { showToast('Project name required', 'error'); return; }
    if (editingProjectId) {
        const p = projects.find(p=>p.id===editingProjectId);
        p.name = name; p.startDate = start; p.endDate = end; p.status = status;
        api.addActivity(`Edited project ${p.name}`);
    } else {
        const nextId = projects.length ? Math.max(...projects.map(p=>p.id)) + 1 : 1;
        const p = { id: nextId, name, startDate: start, endDate: end, status, members: [], teamSize: 0 };
        projects.push(p);
        api.addActivity(`Created project ${name}`);
    }
    api.saveAll().then(()=>{
        loadProjects();
        closeProjectModal();
        showToast('Project saved', 'success');
    });
}

let assignProjectId = null;
function openAssignModal(projectId) {
    assignProjectId = projectId;
    const list = document.getElementById('assignEmployeesList');
    list.innerHTML = '';
    const proj = projects.find(p=>p.id==projectId);
    employees.forEach(emp => {
        const id = `assign_${emp.id}`;
        const div = document.createElement('label');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        const checked = (proj.members||[]).includes(emp.id) ? 'checked' : '';
        div.innerHTML = `<input type="checkbox" id="${id}" value="${emp.id}" ${checked} style="margin-right:8px;"> ${emp.name} (${emp.role})`;
        list.appendChild(div);
    });
    document.getElementById('assignModal').classList.remove('hidden');
}

function closeAssignModal(){ document.getElementById('assignModal').classList.add('hidden'); }

function saveProjectAssignment(){
    if (!assignProjectId) return;
    const proj = projects.find(p=>p.id==assignProjectId);
    const checks = Array.from(document.getElementById('assignEmployeesList').querySelectorAll('input[type=checkbox]'));
    const members = checks.filter(c=>c.checked).map(c=>parseInt(c.value));
    proj.members = members;
    proj.teamSize = members.length;
    api.addActivity(`Assigned ${members.length} employee(s) to ${proj.name}`);
    api.saveAll().then(()=>{
        loadProjects();
        closeAssignModal();
        showToast('Assignment saved', 'success');
    });
}

// 3. Activity Logs
function loadLogs() {
    const tableBody = document.getElementById('logsTableBody');
    tableBody.innerHTML = '';

    activityLogs.forEach(log => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="text-muted" style="font-size: 0.9rem;">${log.time}</td>
            <td><strong>${log.user}</strong></td>
            <td>${log.action}</td>
        `;
        tableBody.appendChild(tr);
    });
}

/* ---------- Dashboard ---------- */
function loadDashboard() {
    // counts
    document.getElementById('totalEmployeesCount').textContent = employees.length;
    document.getElementById('activeProjectsCount').textContent = projects.filter(p => p.status === 'Active').length;
    document.getElementById('pendingTasksCount').textContent = tasks.filter(t => (t.status || '').toLowerCase() !== 'completed').length;
    document.getElementById('employeesLeftCount').textContent = employees.filter(e => e.status === 'Left').length;

    const recent = activityLogs.slice(-6).reverse();
    const container = document.getElementById('recentActivity');
    container.innerHTML = '';
    recent.forEach(r => {
        const d = document.createElement('div');
        d.className = 'activity-item';
        d.innerHTML = `<div class="activity-time">${r.time}</div><div class="activity-text"><strong>${r.user}</strong> — ${r.action}</div>`;
        container.appendChild(d);
    });
}

/* ---------- Tasks & Work Overview ---------- */
function loadTasks() {
    const tbody = document.getElementById('tasksTableBody');
    tbody.innerHTML = '';
    const projFilter = document.getElementById('taskFilterProject').value;
    const statusFilter = document.getElementById('taskFilterStatus').value;
    const start = document.getElementById('taskStartDate') ? document.getElementById('taskStartDate').value : '';
    const end = document.getElementById('taskEndDate') ? document.getElementById('taskEndDate').value : '';

    const filtered = tasks.filter(t => {
        if (projFilter && String(t.projectId) !== String(projFilter)) return false;
        if (statusFilter && t.status !== statusFilter) return false;
        // date range filter: if either start or end provided, require task to have dueDate within the range
        if ((start || end)) {
            if (!t.dueDate) return false;
            const d = new Date(t.dueDate);
            if (start) {
                const s = new Date(start);
                if (d < s) return false;
            }
            if (end) {
                const e = new Date(end);
                // include whole day for end
                e.setHours(23,59,59,999);
                if (d > e) return false;
            }
        }
        return true;
    });

    filtered.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.task}</td>
            <td>${t.handledBy || '-'}</td>
            <td>${t.status || '-'}</td>
            <td>${t.dueDate || '-'}</td>
            <td>${(projects.find(p=>p.id==t.projectId)||{}).name || t.project || '-'}</td>
            <td><button class="btn btn-outline" onclick="alert('Edit Task')">Edit</button></td>
        `;
        tbody.appendChild(tr);
    });

    // summary
    // summaries respect filters when range is applied: compute from filtered list when date filters specified
    const totalCount = (start || end) ? filtered.length : tasks.length;
    const completedCount = (start || end) ? filtered.filter(t=>t.status==='Completed').length : tasks.filter(t=>t.status==='Completed').length;
    const pendingCount = (start || end) ? filtered.filter(t=>t.status!=='Completed').length : tasks.filter(t=>t.status!=='Completed').length;
    document.getElementById('totalTasksCount').textContent = totalCount;
    document.getElementById('completedTasksCount').textContent = completedCount;
    document.getElementById('pendingTasksCountOverview').textContent = pendingCount;

    // per-employee workload: (simple console for now)
    const workload = {};
    tasks.forEach(t => { if (t.handledBy) workload[t.handledBy] = (workload[t.handledBy]||0)+1; });
    // could render a small list or chart later
}

let editingTaskId = null;
function openCreateTaskModal(){
    editingTaskId = null;
    document.getElementById('taskModalTitle').innerText = 'Create Task';
    document.getElementById('taskName').value = '';
    document.getElementById('taskDue').value = '';
    document.getElementById('taskStatusSelect').value = 'Pending';
    // populate assign select and project select
    const assignSel = document.getElementById('taskAssign');
    assignSel.innerHTML = '<option value="">Unassigned</option>';
    employees.forEach(emp => {
        const opt = document.createElement('option'); opt.value = emp.name; opt.textContent = `${emp.name} (${emp.role})`; assignSel.appendChild(opt);
    });
    const projSel = document.getElementById('taskProjectSelect'); projSel.innerHTML = '<option value="">Select Project</option>';
    projects.forEach(p=>{ const o=document.createElement('option'); o.value = p.id; o.textContent = p.name; projSel.appendChild(o); });
    document.getElementById('taskModal').classList.remove('hidden');
}

function closeTaskModal(){ document.getElementById('taskModal').classList.add('hidden'); }

function saveTaskFromForm(){
    const name = document.getElementById('taskName').value.trim();
    if (!name) { showToast('Task title is required', 'error'); return; }
    const handledBy = document.getElementById('taskAssign').value || '';
    const projectVal = document.getElementById('taskProjectSelect').value;
    const projectId = projectVal ? parseInt(projectVal) : null;
    const due = document.getElementById('taskDue').value || '';
    const status = document.getElementById('taskStatusSelect').value || 'Pending';
    const nextId = tasks.length ? Math.max(...tasks.map(t=>t.id)) + 1 : 1001;
    const t = { id: nextId, task: name, status: status, dueDate: due, assignedBy: currentUser.name, handledBy: handledBy, projectId: projectId };
    tasks.push(t);
    const nextLogId = activityLogs.length ? Math.max(...activityLogs.map(l => l.id)) + 1 : 1;
    activityLogs.push({ id: nextLogId, user: currentUser.name || 'Admin', action: `Created task '${name}'`, time: formatDateTime(new Date()) });
    api.saveAll().then(()=>{
        loadTasks();
        closeTaskModal();
        showToast('Task created', 'success');
    });
}

/* ---------- Reports & Analytics ---------- */
function loadReports() {
    const start = document.getElementById('reportStartDate') ? document.getElementById('reportStartDate').value : '';
    const end = document.getElementById('reportEndDate') ? document.getElementById('reportEndDate').value : '';
    renderWorkloadChart(start, end);
    renderOverdueTasks(start, end);
    renderProjectsSummary(start, end);
    renderTopEmployees(start, end);
}

function renderWorkloadChart(start, end) {
    const container = document.getElementById('workloadChart');
    container.innerHTML = '';
    const workload = {};
    tasks.forEach(t => {
        if ((start||end) && t.dueDate) {
            const d = new Date(t.dueDate);
            if (start && d < new Date(start)) return;
            if (end) { const e = new Date(end); e.setHours(23,59,59,999); if (d > e) return; }
        } else if ((start||end) && !t.dueDate) {
            // if filtering by date and task has no due date, exclude
            return;
        }
        const name = t.handledBy || 'Unassigned'; workload[name] = (workload[name]||0)+1;
    });
    const entries = Object.keys(workload).map(k=>({name:k,count:workload[k]})).sort((a,b)=>b.count-a.count);
    const max = entries[0] ? entries[0].count : 1;
    entries.forEach(e => {
        const row = document.createElement('div'); row.className='wk-bar';
        const label = document.createElement('div'); label.className='label'; label.textContent = e.name;
        const barWrap = document.createElement('div'); barWrap.className='bar';
        barWrap.style.width = `${Math.round((e.count / max) * 100)}%`;
        const count = document.createElement('div'); count.className='count'; count.textContent = e.count;
        row.appendChild(label); row.appendChild(barWrap); row.appendChild(count);
        container.appendChild(row);
    });
}

function renderOverdueTasks(start, end) {
    const list = document.getElementById('overdueList'); list.innerHTML='';
    const now = new Date();
    const overdue = tasks.filter(t=>t.dueDate && new Date(t.dueDate) < now && t.status !== 'Completed' && (
        (!start && !end) || ( (start && new Date(t.dueDate) >= new Date(start)) || !start ) && ( (end && new Date(t.dueDate) <= (function(){const e=new Date(end);e.setHours(23,59,59,999);return e;})()) || !end )
    ));
    overdue.forEach(t=>{
        const el = document.createElement('div'); el.className='task-item';
        el.innerHTML = `<strong>${t.task}</strong><div class="text-muted">Assigned: ${t.handledBy||'-'} · Due: ${t.dueDate}</div>`;
        list.appendChild(el);
    });
    if (overdue.length===0) list.innerHTML = '<div class="text-muted">No overdue tasks</div>';
}

function renderProjectsSummary(start, end) {
    const div = document.getElementById('projectsSummary'); div.innerHTML='';
    projects.forEach(p=>{
        const el = document.createElement('div'); el.className='proj-item';
        const activeTasks = tasks.filter(t=> (t.projectId==p.id || t.project==p.name) && (
            (!start && !end) || ( t.dueDate && (!start || new Date(t.dueDate) >= new Date(start)) && (!end || new Date(t.dueDate) <= (function(){const e=new Date(end);e.setHours(23,59,59,999);return e;})()) )
        ));
        el.innerHTML = `<strong>${p.name}</strong><div class="text-muted">Status: ${p.status} · Team: ${ (p.members||[]).length } · Tasks: ${activeTasks.length}</div>`;
        div.appendChild(el);
    });
}

function renderTopEmployees(start, end) {
    const div = document.getElementById('topEmployees'); div.innerHTML='';
    const workload = {};
    tasks.forEach(t=>{
        if ((start||end) && t.dueDate) {
            const d=new Date(t.dueDate); if (start && d < new Date(start)) return; if (end){const e=new Date(end); e.setHours(23,59,59,999); if (d>e) return; }
        } else if ((start||end) && !t.dueDate) return;
        if (t.handledBy) workload[t.handledBy]=(workload[t.handledBy]||0)+1;
    });
    const arr = Object.keys(workload).map(k=>({name:k,count:workload[k]})).sort((a,b)=>b.count-a.count).slice(0,10);
    arr.forEach(a=>{ const el=document.createElement('div'); el.className='emp-item'; el.innerHTML=`${a.name} <span class="text-muted">• ${a.count} task(s)</span>`; div.appendChild(el); });
    if (arr.length===0) div.innerHTML='<div class="text-muted">No tasks assigned yet</div>';
}

function exportReportsCSV(){
    const rows = [];
    rows.push(['Report','Value']);
    rows.push(['Total Employees', employees.length]);
    rows.push(['Total Projects', projects.length]);
    rows.push(['Total Tasks', tasks.length]);
    const overdue = tasks.filter(t=>t.dueDate && new Date(t.dueDate) < new Date() && t.status!=='Completed').length;
    rows.push(['Overdue Tasks', overdue]);
    // workload per employee
    const workload = {};
    tasks.forEach(t=>{ const name=t.handledBy||'Unassigned'; workload[name]=(workload[name]||0)+1; });
    rows.push([]);
    rows.push(['Employee','Task Count']);
    Object.keys(workload).forEach(k=> rows.push([k, workload[k]]));

    const csv = rows.map(r=>r.map(c=>`"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ews_report.csv'; a.click(); URL.revokeObjectURL(url);
    showToast('Report exported.', 'success');
}

/* ---------- Employee Profiles ---------- */
let currentProfileId = null;
function openEmployeeProfile(id) {
    currentProfileId = id;
    showSection('profile');
    loadEmployeeProfile(id);
}

function loadEmployeeProfile(id) {
    const emp = employees.find(e => e.id == id);
    if (!emp) return;
    document.getElementById('profileName').innerText = emp.name;
    document.getElementById('profileMeta').innerText = `${emp.role} · ${emp.project || '—'} · ${emp.status}`;

    // Tasks
    const taskBody = document.getElementById('profileTasksBody');
    taskBody.innerHTML = '';
    tasks.filter(t => t.handledBy === emp.name).forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${t.task}</td><td>${t.status}</td><td>${t.dueDate || '-'}</td>`;
        taskBody.appendChild(tr);
    });

    // Timeline - use activity logs related to employee
    const timeline = document.getElementById('profileTimeline');
    timeline.innerHTML = '';
    activityLogs.filter(l => l.action.includes(emp.name)).slice(-10).reverse().forEach(l => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML = `<div class="timeline-date">${l.time}</div><div class="timeline-content">${l.action}</div>`;
        timeline.appendChild(item);
    });

    // Files - stored on employee.files array
    const filesDiv = document.getElementById('profileFiles');
    filesDiv.innerHTML = '';
    emp.files = emp.files || [];
    emp.files.forEach((f, idx) => {
        const fi = document.createElement('div');
        fi.className = 'file-item';
        fi.innerHTML = `<div><strong>${f.name}</strong><div class="meta">${f.size} bytes</div></div><div><button class="btn btn-outline" onclick="downloadEmployeeFile(${id}, ${idx})">Download</button></div>`;
        filesDiv.appendChild(fi);
    });

    document.getElementById('profileNotes').value = emp.notes || '';
}

function attachFileToEmployee(event) {
    const file = event.target.files[0];
    if (!file || !currentProfileId) return;
    const emp = employees.find(e => e.id == currentProfileId);
    if (!emp) return;
    const reader = new FileReader();
    reader.onload = e => {
        emp.files = emp.files || [];
        emp.files.push({ name: file.name, size: file.size, data: e.target.result, note: '' });
        const nextLogId = activityLogs.length ? Math.max(...activityLogs.map(l => l.id)) + 1 : 1;
        activityLogs.push({ id: nextLogId, user: currentUser.name || 'Admin', action: `Uploaded file '${file.name}' for ${emp.name}`, time: formatDateTime(new Date()) });
        api.saveAll().then(()=>{
            loadEmployeeProfile(currentProfileId);
            showToast('File attached.', 'success');
        });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

function downloadEmployeeFile(empId, index) {
    const emp = employees.find(e => e.id == empId);
    if (!emp || !emp.files || !emp.files[index]) return;
    const f = emp.files[index];
    const a = document.createElement('a');
    if (f.data) {
        a.href = f.data;
        a.download = f.name;
        a.click();
        return;
    }
    if (f.url) {
        a.href = f.url;
        a.download = f.name;
        a.click();
        return;
    }
    showToast('File data not available for download.', 'error');
}

function saveProfileNotes() {
    if (!currentProfileId) return;
    const emp = employees.find(e => e.id == currentProfileId);
    emp.notes = document.getElementById('profileNotes').value;
    const nextLogId = activityLogs.length ? Math.max(...activityLogs.map(l => l.id)) + 1 : 1;
    activityLogs.push({ id: nextLogId, user: 'Admin', action: `Added note to ${emp.name}`, time: formatDateTime(new Date()) });
        api.saveAll();
    showToast('Notes saved.', 'success');
}

// 4. Work Transfer Logic
function populateTransferSelects() {
    const leaverSelect = document.getElementById('leaverSelect');
    const receiverSelect = document.getElementById('receiverSelect');
    // Reset selects to avoid duplicate entries when called multiple times
    leaverSelect.innerHTML = '<option value="">Select Employee</option>';
    receiverSelect.innerHTML = '<option value="">Select Employee</option>';

    employees.forEach(emp => {
        const option = `<option value="${emp.id}">${emp.name} (${emp.role})</option>`;
        leaverSelect.innerHTML += option;
        receiverSelect.innerHTML += option;
    });
}

function loadLeaverData() {
    const leaverId = document.getElementById('leaverSelect').value;
    const dataSection = document.getElementById('leaverData');

    if (!leaverId) {
        dataSection.classList.add('hidden');
        return;
    }

    // Dummy counts based on user
    const pendingTasks = 5; // Hardcoded dummy for effect
    const files = 12;

    document.getElementById('pendingCount').textContent = pendingTasks;
    document.getElementById('fileCount').textContent = files;
    dataSection.classList.remove('hidden');
}

function handleTransfer() {
    const leaverId = document.getElementById('leaverSelect').value;
    const receiverId = document.getElementById('receiverSelect').value;

    if (!leaverId || !receiverId) {
        alert("Please select both a leaving employee and a receiving employee.");
        return;
    }

    if (leaverId === receiverId) {
        alert("Leaver and Receiver cannot be the same person.");
        return;
    }

    const leaver = employees.find(e => e.id == leaverId);
    const receiver = employees.find(e => e.id == receiverId);
    const leaverName = leaver.name;
    const receiverName = receiver.name;

    // Transfer tasks handled by the leaver to the receiver
    let transferredCount = 0;
    tasks.forEach(t => {
        if (t.handledBy === leaverName) {
            t.handledBy = receiverName;
            transferredCount++;
        }
    });

    // Add an activity log entry
    const nextLogId = activityLogs.length ? Math.max(...activityLogs.map(l => l.id)) + 1 : 1;
    activityLogs.push({
        id: nextLogId,
        user: 'Admin',
        action: `Transferred ${transferredCount} task(s) from ${leaverName} to ${receiverName}`,
        time: formatDateTime(new Date())
    });

    // Refresh UI
    loadEmployees();
    loadProjects();
    loadLogs();
    populateTransferSelects();

    alert(`✅ Success!\n\n${transferredCount} task(s) moved from ${leaverName} to ${receiverName}.\n\nThis work was previously handled by: ${leaverName}`);
}

/* ---------- Persistence & Utilities ---------- */
function saveToStorage() {
    // legacy wrapper - delegate to api.saveAll() for persistence
    try {
        if (window.api && typeof window.api.saveAll === 'function') {
            window.api.saveAll();
        } else {
            localStorage.setItem('ews_employees', JSON.stringify(employees));
            localStorage.setItem('ews_tasks', JSON.stringify(tasks));
            localStorage.setItem('ews_projects', JSON.stringify(projects));
            localStorage.setItem('ews_activityLogs', JSON.stringify(activityLogs));
        }
    } catch (e) {
        console.error('Failed to save to storage', e);
    }
}

function loadFromStorage() {
    try {
        const e = localStorage.getItem('ews_employees');
        const t = localStorage.getItem('ews_tasks');
        const p = localStorage.getItem('ews_projects');
        const a = localStorage.getItem('ews_activityLogs');
        if (e) {
            window.employees = JSON.parse(e);
        }
        if (t) window.tasks = JSON.parse(t);
        if (p) window.projects = JSON.parse(p);
        if (a) window.activityLogs = JSON.parse(a);
    } catch (err) {
        console.error('Failed to load from storage', err);
    }
}

/* ---------- Employee Add / Edit ---------- */
let editingEmployeeId = null;
function openAddEmployeeModal() {
    editingEmployeeId = null;
    document.getElementById('employeeModalTitle').innerText = 'Add Employee';
    document.getElementById('empName').value = '';
    document.getElementById('empRole').value = '';
    document.getElementById('empProject').value = '';
    document.getElementById('empStatus').value = 'Active';
    document.getElementById('employeeModal').classList.remove('hidden');
}

function openEditEmployeeModal(id) {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    editingEmployeeId = id;
    document.getElementById('employeeModalTitle').innerText = 'Edit Employee';
    document.getElementById('empName').value = emp.name;
    document.getElementById('empRole').value = emp.role;
    document.getElementById('empProject').value = emp.project || '';
    document.getElementById('empStatus').value = emp.status || 'Active';
    document.getElementById('employeeModal').classList.remove('hidden');
}

function closeEmployeeModal() {
    document.getElementById('employeeModal').classList.add('hidden');
}

function saveEmployeeFromForm() {
    const name = document.getElementById('empName').value.trim();
    const role = document.getElementById('empRole').value.trim();
    const project = document.getElementById('empProject').value.trim();
    const status = document.getElementById('empStatus').value;
    if (!name || !role) {
        showToast('Name and Role are required.', 'error');
        return;
    }
    if (editingEmployeeId) {
        const emp = employees.find(e => e.id === editingEmployeeId);
        emp.name = name;
        emp.role = role;
        emp.project = project;
        emp.status = status;
        const nextLogId = activityLogs.length ? Math.max(...activityLogs.map(l => l.id)) + 1 : 1;
        activityLogs.push({ id: nextLogId, user: 'Admin', action: `Edited ${emp.name}`, time: formatDateTime(new Date()) });
        showToast('Employee updated.', 'success');
    } else {
        const nextId = employees.length ? Math.max(...employees.map(e => e.id)) + 1 : 1;
        const newEmp = { id: nextId, name, role, status, project };
        employees.push(newEmp);
        const nextLogId = activityLogs.length ? Math.max(...activityLogs.map(l => l.id)) + 1 : 1;
        activityLogs.push({ id: nextLogId, user: 'Admin', action: `Added ${name}`, time: formatDateTime(new Date()) });
        showToast('Employee added.', 'success');
    }
        api.saveAll();
    closeEmployeeModal();
    loadEmployees();
    populateTransferSelects();
    loadLogs();
}

/* ---------- Search & CSV ---------- */
let currentSearchQuery = '';
function searchEmployees(q) {
    currentSearchQuery = q.trim().toLowerCase();
    loadEmployees();
}

function exportEmployeesCSV() {
    const headers = ['id','name','role','project','status'];
    const rows = employees.map(e => [e.id, e.name, e.role, e.project || '', e.status]);
    const csv = [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Employees exported.', 'success');
}

function handleCSVImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(Boolean);
        const header = lines.shift().split(/,|\t/).map(h => h.replace(/"/g,'').trim().toLowerCase());
        lines.forEach(line => {
            const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
            const obj = {};
            header.forEach((h,i) => obj[h]=cols[i] || '');
            const nextId = employees.length ? Math.max(...employees.map(e => e.id)) + 1 : 1;
            employees.push({ id: nextId, name: obj.name || 'Unknown', role: obj.role || '', project: obj.project || '', status: obj.status || 'Active' });
        });
        api.saveAll();
        loadEmployees();
        populateTransferSelects();
        showToast('CSV imported.', 'success');
    };
    reader.readAsText(file);
    // reset input
    event.target.value = '';
}

/* ---------- Toasts & Notifications ---------- */
function showToast(message, type='info') {
    const container = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast';
    if (type === 'success') t.style.background = '#0f5132';
    if (type === 'error') t.style.background = '#641220';
    if (type === 'warning') t.style.background = '#3c2f00';
    t.textContent = message;
    container.appendChild(t);
    // animate in
    requestAnimationFrame(()=> t.classList.add('show'));
    setTimeout(()=>{
        t.classList.remove('show');
        setTimeout(()=> container.removeChild(t), 220);
    }, 3800);
}

function showNotifications() {
    alert('Notifications: ' + (activityLogs.slice(-5).map(l => `${l.time} - ${l.action}`).join('\n') || 'No recent activity.'));
}

/* ---------- Theme Toggle ---------- */
let monoTheme = false;
function toggleTheme() {
    monoTheme = !monoTheme;
    if (monoTheme) document.body.classList.add('theme-dark'); else document.body.classList.remove('theme-dark');
}

// Helper: format a human-readable timestamp
function formatDateTime(date) {
    try {
        return date.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
        return date.toString();
    }
}

/* ---------- Permissions UI helpers ---------- */
const ALL_ACTIONS = ['employee:add','employee:edit','employee:deactivate','employee:import','employee:export','project:create','task:transfer','view_logs','attach_file','view_profile'];
let selectedRole = 'Admin';

function applyPermissionUI(){
    try{
        const canAdd = api.hasPermission(currentUser.role, 'employee:add');
        const addBtn = document.querySelector('button[onclick="openAddEmployeeModal()"]');
        if (addBtn) addBtn.style.display = canAdd ? '' : 'none';

        const csvInput = document.getElementById('csvInput');
        if (csvInput && csvInput.parentNode) csvInput.parentNode.style.display = api.hasPermission(currentUser.role, 'employee:import') ? '' : 'none';

        const exportBtn = document.querySelector('button[onclick="exportEmployeesCSV()"]');
        if (exportBtn) exportBtn.style.display = api.hasPermission(currentUser.role, 'employee:export') ? '' : 'none';
    }catch(e){ console.error(e); }
}

function loadPermissions(){
    const perms = api.getPermissions();
    // default select Admin
    selectedRole = 'Admin';
    renderPermissionsForm(selectedRole, perms[selectedRole]);
}

function selectRole(role){
    selectedRole = role;
    const perms = api.getPermissions();
    renderPermissionsForm(role, perms[role] || []);
}

function renderPermissionsForm(role, grantedList){
    document.getElementById('roleTitle').innerText = `Permissions for: ${role}`;
    const form = document.getElementById('permissionsForm');
    form.innerHTML = '';
    ALL_ACTIONS.forEach(act => {
        const id = `perm_${role}_${act}`.replace(/[^a-z0-9_]/gi,'');
        const checked = (grantedList || []).includes(act) ? 'checked' : '';
        const el = document.createElement('label');
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.innerHTML = `<input type="checkbox" id="${id}" data-action="${act}" ${checked} style="margin-right:8px;"> ${act}`;
        form.appendChild(el);
    });
}

function savePermissionsForRole(){
    const perms = api.getPermissions();
    const form = document.getElementById('permissionsForm');
    const checks = Array.from(form.querySelectorAll('input[type=checkbox]'));
    const allowed = checks.filter(c=>c.checked).map(c=>c.getAttribute('data-action'));
    perms[selectedRole] = allowed;
    api.setPermissions(perms);
    showToast('Permissions updated.', 'success');
}
