// Simple mock API layer using localStorage and Promises
(function(window){
  const STORAGE_KEYS = {
    employees: 'ews_employees',
    tasks: 'ews_tasks',
    projects: 'ews_projects',
    activityLogs: 'ews_activityLogs',
    permissions: 'ews_permissions'
  };

  const defaultPermissions = {
    Admin: ['employee:add','employee:edit','employee:deactivate','employee:import','employee:export','project:create','task:transfer','view_logs','attach_file','view_profile'],
    Manager: ['employee:edit','project:create','task:transfer','view_profile'],
    Employee: ['view_profile']
  };

  function loadJSON(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){
      console.error('loadJSON error', e);
      return fallback;
    }
  }

  function saveJSON(key, data){
    try{ localStorage.setItem(key, JSON.stringify(data)); }catch(e){ console.error('saveJSON error', e); }
  }

  function init(){
    return new Promise((resolve) => {
      // simulate latency
      setTimeout(()=>{
        window.employees = loadJSON(STORAGE_KEYS.employees, window.employees || []);
        window.tasks = loadJSON(STORAGE_KEYS.tasks, window.tasks || []);
        window.projects = loadJSON(STORAGE_KEYS.projects, window.projects || []);
        window.activityLogs = loadJSON(STORAGE_KEYS.activityLogs, window.activityLogs || []);
        const perms = loadJSON(STORAGE_KEYS.permissions, null);
        window.ews_permissions = perms || defaultPermissions;
        resolve({ employees: window.employees, tasks: window.tasks, projects: window.projects, activityLogs: window.activityLogs });
      }, 200);
    });
  }

  function saveAll(){
    return new Promise((resolve)=>{
      setTimeout(()=>{
        saveJSON(STORAGE_KEYS.employees, window.employees || []);
        saveJSON(STORAGE_KEYS.tasks, window.tasks || []);
        saveJSON(STORAGE_KEYS.projects, window.projects || []);
        saveJSON(STORAGE_KEYS.activityLogs, window.activityLogs || []);
        resolve(true);
      }, 120);
    });
  }

  function getPermissions(){
    return window.ews_permissions || defaultPermissions;
  }

  function setPermissions(obj){
    window.ews_permissions = obj;
    saveJSON(STORAGE_KEYS.permissions, obj);
  }

  function hasPermission(role, action){
    const perms = getPermissions();
    if (!role) return false;
    const list = perms[role] || [];
    return list.includes(action);
  }

  function addActivity(actionText, user='Admin'){
    const nextId = window.activityLogs && window.activityLogs.length ? Math.max(...window.activityLogs.map(l=>l.id)) + 1 : 1;
    const entry = { id: nextId, user, action: actionText, time: (new Date()).toLocaleString() };
    window.activityLogs = window.activityLogs || [];
    window.activityLogs.push(entry);
    saveJSON(STORAGE_KEYS.activityLogs, window.activityLogs);
    return entry;
  }

  window.api = {
    init,
    saveAll,
    getPermissions,
    setPermissions,
    hasPermission,
    addActivity
  };

})(window);
