// restore-employees.js
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

// paste your raw data here as an array
const RAW_DATA = [
  {
    "Dept_Id": 1,
    "Department": "Management",
    "Dept Head Email": "sunil.prem@briskolive.com",
    "Dept Group Email": "management@briskolive.com",
    "Parent Department": "Management",
    "Department Type (Delivery or Support)": "Support",
    "Department Head": "Sunil Prem",
    "Department Deputy": "",
    "Desig_id": 101,
    "Designation": "Managing Director",
    "Emp_id": 1,
    "desig Email Id": "sunil.prem@briskolive.com",
    "Emp_name": "Sunil Prem",
    "Role Document Link": "",
    "JD Link": "",
    "Remarks": "",
    "Management Level": "",
    "Reporting Manager": ""
  },
  // ... paste all 47 rows here
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const col = mongoose.connection.db.collection('employees');

  // Clear all empty docs and re-insert with correct mapping
  await col.deleteMany({});

  const mapped = RAW_DATA.map(doc => ({
    dept_id:            doc['Dept_Id']                               ?? null,
    department:         doc['Department']                            ?? '',
    dept_page_link:     doc['Dept Page Link (BO Internal Site)']    ?? '',
    dept_head_email:    doc['Dept Head Email']                       ?? '',
    dept_group_email:   doc['Dept Group Email']                      ?? '',
    parent_department:  doc['Parent Department']                     ?? '',
    department_type:    doc['Department Type (Delivery or Support)'] ?? '',
    department_head:    doc['Department Head']                       ?? '',
    department_deputy:  doc['Department Deputy']                     ?? '',
    desig_id:           doc['Desig_id']                              ?? null,
    designation:        doc['Designation']                           ?? '',
    emp_id:             String(doc['Emp_id'] ?? ''),
    emp_name:           doc['Emp_name']                              ?? '',
    desig_email_id:     doc['desig Email Id']                        ?? '',
    role_document_link: doc['Role Document Link']                    ?? '',
    jd_link:            doc['JD Link']                               ?? '',
    remarks:            doc['Remarks']                               ?? '',
    management_level:   doc['Management Level']                      ?? '',
    reporting_manager:  doc['Reporting Manager']                     ?? '',
  }));

  await col.insertMany(mapped);
  console.log(`✅ Restored ${mapped.length} employees`);
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });