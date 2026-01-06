const employees = [
  {
    id: 1,
    name: "Rahul Verma",
    role: "Developer",
    status: "Left",
    project: "CRM System"
    ,
    previousWork: [
      { year: 2021, desc: 'Legacy CRM maintenance and bugfixes' },
      { year: 2020, desc: 'E-commerce payment gateway integration' },
      { year: 2019, desc: 'Internal tools automation' }
    ],
    files: [
      { name: 'Architecture_v1.pdf', size: 245678, url: '', note: 'Legacy architecture doc' },
      { name: 'API_Design.docx', size: 56789, url: '', note: 'OAuth flows' }
    ]
  },
  {
    id: 2,
    name: "Amit Sharma",
    role: "Developer",
    status: "Active",
    project: "CRM System"
    ,
    previousWork: [
      { year: 2023, desc: 'API integration and performance tuning' },
      { year: 2021, desc: 'Microservices refactor' },
      { year: 2019, desc: 'Built internal reporting tools' },
      { year: 2018, desc: 'Legacy system migration and automation' }
    ],
    files: [
      { name: 'DB_Schema_v2.sql', size: 34567, url: '', note: 'Updated schema for CRM' },
      { name: 'Integration_test_results.zip', size: 1245789, url: '', note: 'CI test artifacts' },
      { name: 'Performance_Report_Q1.pdf', size: 234567, url: '', note: 'Load test results' },
      { name: 'Service_Diagram.png', size: 45678, url: '', note: 'Microservice topology' },
      { name: 'Release_notes_v1.1.md', size: 6789, url: '', note: 'Release notes' },
      { name: 'Migration_plan.docx', size: 98765, url: '', note: 'DB migration checklist' },
      { name: 'Security_audit.pdf', size: 123456, url: '', note: 'Security findings' },
      { name: 'CI_pipeline.yml', size: 2345, url: '', note: 'CI configuration' },
      { name: 'Benchmark_results.csv', size: 54321, url: '', note: 'Benchmark raw results' },
      { name: 'Customer_requirements.xlsx', size: 76543, url: '', note: 'Requirements doc' },
      { name: 'Code_Review_Notes.txt', size: 4321, url: '', note: 'Review comments' },
      { name: 'Onboarding_Checklist.pdf', size: 21000, url: '', note: 'New hire checklist' }
      ,{ name: 'Design_Notes.pdf', size: 45231, url: '', note: 'UI/UX design brief' }
      ,{ name: 'Sprint_Backlog.xlsx', size: 33456, url: '', note: 'Current sprint backlog' }
      ,{ name: 'Contract_SLA.pdf', size: 89012, url: '', note: 'Service level agreement' }
    ]
  },
  {
    id: 3,
    name: "Sneha Gupta",
    role: "Designer",
    status: "Active",
    project: "Website Redesign"
    ,
    previousWork: [
      { year: 2022, desc: 'Website UI refresh' },
      { year: 2020, desc: 'Mobile-first design rollout' }
    ],
    files: [
      { name: 'Homepage_mockup.fig', size: 867530, url: '', note: 'Figma export' },
      { name: 'Brand_Guidelines.pdf', size: 123456, url: '', note: 'Brand assets and tokens' }
    ]
  }
];

const tasks = [
  { id: 101, task: "Login UI", status: "Completed", dueDate: "2023-10-15", assignedBy: "Manager", handledBy: "Rahul Verma", projectId: 1 },
  { id: 102, task: "API Integration", status: "Pending", dueDate: "2023-11-01", assignedBy: "Manager", handledBy: "Rahul Verma", projectId: 1 },
  { id: 103, task: "Database Schema", status: "In Progress", dueDate: "2023-10-25", assignedBy: "Tech Lead", handledBy: "Amit Sharma", projectId: 1 },
  { id: 104, task: "Landing Page Hero", status: "Completed", dueDate: "2023-09-20", assignedBy: "PM", handledBy: "Sneha Gupta", projectId: 2 },
  { id: 105, task: "Payment Gateway QA", status: "In Progress", dueDate: "2023-11-05", assignedBy: "QA Lead", handledBy: "Amit Sharma", projectId: 1 },
  { id: 106, task: "User Settings Module", status: "Pending", dueDate: "2023-11-12", assignedBy: "Manager", handledBy: "Amit Sharma", projectId: 1 },
  { id: 107, task: "Mobile Menu Animations", status: "Pending", dueDate: "2023-11-02", assignedBy: "Design Lead", handledBy: "Sneha Gupta", projectId: 2 },
  { id: 108, task: "Export CSV Feature", status: "Completed", dueDate: "2023-10-30", assignedBy: "Manager", handledBy: "Rahul Verma", projectId: 1 },
  { id: 109, task: "Accessibility Audit", status: "In Progress", dueDate: "2023-11-08", assignedBy: "PM", handledBy: "Sneha Gupta", projectId: 2 },
  { id: 110, task: "Notification System", status: "Pending", dueDate: "2023-11-20", assignedBy: "Tech Lead", handledBy: "Amit Sharma", projectId: 3 },
  { id: 111, task: "Profile Photo Upload", status: "Completed", dueDate: "2023-09-15", assignedBy: "Manager", handledBy: "Rahul Verma", projectId: 1 },
  { id: 112, task: "SEO Meta Tags", status: "Completed", dueDate: "2023-09-30", assignedBy: "Marketing", handledBy: "Sneha Gupta", projectId: 2 },
  { id: 113, task: "Data Migration Script", status: "In Progress", dueDate: "2023-11-18", assignedBy: "DBA", handledBy: "Amit Sharma", projectId: 1 },
  { id: 114, task: "Error Logging Setup", status: "Completed", dueDate: "2023-10-05", assignedBy: "Tech Lead", handledBy: "Rahul Verma", projectId: 3 },
  { id: 115, task: "UI Kit Polish", status: "Pending", dueDate: "2023-12-01", assignedBy: "Design Lead", handledBy: "Sneha Gupta", projectId: 2 },
  { id: 116, task: "Cache Optimization", status: "In Progress", dueDate: "2023-11-25", assignedBy: "Tech Lead", handledBy: "Amit Sharma", projectId: 1 },
  { id: 117, task: "Unit Test Coverage", status: "Pending", dueDate: "2023-11-30", assignedBy: "QA Lead", handledBy: "Amit Sharma", projectId: 3 },
  { id: 118, task: "Client Onboarding Doc", status: "Completed", dueDate: "2023-09-10", assignedBy: "PM", handledBy: "Rahul Verma", projectId: 1 },
  { id: 119, task: "Responsive Grid Fixes", status: "In Progress", dueDate: "2023-11-02", assignedBy: "Design Lead", handledBy: "Sneha Gupta", projectId: 2 },
  { id: 120, task: "Release v1.2", status: "Pending", dueDate: "2023-12-15", assignedBy: "Release Manager", handledBy: "Amit Sharma", projectId: 1 }
];

// Additional tasks assigned to Amit Sharma to ensure 'My Tasks' shows enough entries
const moreTasksForAmit = [
  { id: 121, task: 'Feature flag rollout', status: 'Pending', dueDate: '2023-12-02', assignedBy: 'PM', handledBy: 'Amit Sharma', projectId: 1 },
  { id: 122, task: 'Refactor auth module', status: 'In Progress', dueDate: '2023-11-28', assignedBy: 'Tech Lead', handledBy: 'Amit Sharma', projectId: 1 },
  { id: 123, task: 'Optimize image pipeline', status: 'Pending', dueDate: '2023-12-05', assignedBy: 'Manager', handledBy: 'Amit Sharma', projectId: 1 },
  { id: 124, task: 'Review PR #432', status: 'Pending', dueDate: '2023-11-15', assignedBy: 'Peer', handledBy: 'Amit Sharma', projectId: 1 },
  { id: 125, task: 'Improve cache hit-rate', status: 'In Progress', dueDate: '2023-12-10', assignedBy: 'DBA', handledBy: 'Amit Sharma', projectId: 1 },
  { id: 126, task: 'Implement rate-limiter', status: 'Pending', dueDate: '2023-12-08', assignedBy: 'Tech Lead', handledBy: 'Amit Sharma', projectId: 3 },
  { id: 127, task: 'Add telemetry events', status: 'In Progress', dueDate: '2023-11-29', assignedBy: 'SRE', handledBy: 'Amit Sharma', projectId: 1 },
  { id: 128, task: 'Fix memory leak', status: 'Pending', dueDate: '2023-12-03', assignedBy: 'QA Lead', handledBy: 'Amit Sharma', projectId: 1 },
  { id: 129, task: 'Upgrade node version', status: 'Completed', dueDate: '2023-11-10', assignedBy: 'Tech Lead', handledBy: 'Amit Sharma', projectId: 1 },
  { id: 130, task: 'Document API endpoints', status: 'Pending', dueDate: '2023-12-12', assignedBy: 'PM', handledBy: 'Amit Sharma', projectId: 1 },
  { id: 131, task: 'Conduct load test', status: 'Pending', dueDate: '2023-12-20', assignedBy: 'SRE', handledBy: 'Amit Sharma', projectId: 1 },
  { id: 132, task: 'Address CVE-2023-XXXX', status: 'In Progress', dueDate: '2023-11-27', assignedBy: 'Security', handledBy: 'Amit Sharma', projectId: 1 }
];

tasks.push(...moreTasksForAmit);


const projects = [
  {
    id: 1,
    name: "CRM System",
    startDate: "2023-01-10",
    endDate: "2023-12-31",
    status: "Active",
    teamSize: 5,
    members: [1,2]
  },
  {
    id: 2,
    name: "Website Redesign",
    startDate: "2023-08-15",
    endDate: "2023-11-20",
    status: "Completed",
    teamSize: 3,
    members: [3]
  },
  {
    id: 3,
    name: "Mobile App v2",
    startDate: "2023-11-01",
    endDate: "2024-03-01",
    status: "Active",
    teamSize: 4,
    members: []
  }
];

const activityLogs = [
  {
    id: 1,
    user: "Admin",
    action: "Created new project 'Mobile App v2'",
    time: "2023-11-01 10:30 AM"
  },
  {
    id: 2,
    user: "Rahul Verma",
    action: "Uploaded 'Architecture_v2.pdf'",
    time: "2023-10-28 02:15 PM"
  },
  {
    id: 3,
    user: "Admin",
    action: "Transferred work from Rahul Verma to Amit Sharma",
    time: "2023-10-30 09:00 AM"
  }
  ,
  { id: 4, user: 'Amit Sharma', action: "Created task 'Cache Optimization'", time: '2023-11-05 11:12 AM' },
  { id: 5, user: 'Sneha Gupta', action: "Uploaded 'Homepage_mockup.fig'", time: '2023-09-18 09:30 AM' },
  { id: 6, user: 'Admin', action: "Imported employees via CSV", time: '2023-10-01 03:20 PM' }
];

const currentUser = {
  name: "Amit Sharma",
  role: "Developer",
  project: "CRM System"
};
