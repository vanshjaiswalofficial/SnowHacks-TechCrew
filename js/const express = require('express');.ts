const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/ews');

const Store = mongoose.model('Store', new mongoose.Schema({
  employees: Array,
  tasks: Array,
  projects: Array,
  activityLogs: Array,
  permissions: Object
}));

// Init DB
(async ()=>{
  if(!await Store.findOne()){
    await Store.create({
      employees: [],
      tasks: [],
      projects: [],
      activityLogs: [],
      permissions:{
        Admin:['employee:add','employee:edit','employee:deactivate','project:create','task:transfer','view_logs'],
        Manager:['employee:edit','project:create'],
        Employee:['view_profile']
      }
    });
  }
})();

// API
app.get('/api/init', async (req,res)=>{
  res.json(await Store.findOne());
});

app.post('/api/save', async (req,res)=>{
  await Store.updateOne({}, req.body);
  res.json({success:true});
});

app.post('/api/activity', async (req,res)=>{
  const store = await Store.findOne();
  store.activityLogs.push({
    id: store.activityLogs.length + 1,
    user: req.body.user,
    action: req.body.action,
    time: new Date().toLocaleString()
  });
  await store.save();
  res.json({success:true});
});

// FRONTEND
app.get('/', (req,res)=>{
res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Employee Work System</title>
<style>
body{font-family:Arial;padding:20px}
button{margin:5px}
.box{border:1px solid #ccc;padding:10px;margin:10px 0}
</style>
</head>
<body>

<h2>Employee Work System</h2>

<div class="box">
<button onclick="addEmployee()">Add Employee</button>
<button onclick="addProject()">Add Project</button>
<button onclick="viewLogs()">View Logs</button>
</div>

<pre id="output"></pre>

<script>
let employees=[], projects=[], tasks=[], activityLogs=[], permissions={};

const api={
  init:()=>fetch('/api/init').then(r=>r.json()).then(d=>{
    employees=d.employees;
    projects=d.projects;
    tasks=d.tasks;
    activityLogs=d.activityLogs;
    permissions=d.permissions;
    render();
  }),
  saveAll:()=>fetch('/api/save',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({employees,projects,tasks,activityLogs,permissions})
  }),
  hasPermission:(role,action)=>(permissions[role]||[]).includes(action),
  addActivity:(action,user='Admin')=>fetch('/api/activity',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({user,action})
  })
};

function addEmployee(){
  if(!api.hasPermission('Admin','employee:add')) return alert('No permission');
  employees.push({id:Date.now(),name:'New Employee'});
  api.addActivity('Employee Added');
  api.saveAll();
  render();
}

function addProject(){
  projects.push({id:Date.now(),name:'New Project'});
  api.addActivity('Project Created');
  api.saveAll();
  render();
}

function viewLogs(){
  document.getElementById('output').textContent =
    JSON.stringify(activityLogs,null,2);
}

function render(){
  document.getElementById('output').textContent =
    JSON.stringify({employees,projects},null,2);
}

api.init();
</script>

</body>
</html>
`);
});

app.listen(5000,()=>console.log('🚀 Running http://localhost:5000'));
