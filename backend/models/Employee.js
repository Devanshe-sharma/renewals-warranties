const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema(
  {
    Dept_Id:            { type: Number, default: null },
    Department:         { type: String, default: '' },
    'Dept Page Link (BO Internal Site)': { type: String, default: '' },
    'Dept Head Email':  { type: String, default: '' },
    'Dept Group Email': { type: String, default: '' },
    'Parent Department':{ type: String, default: '' },
    'Department Type (Delivery or Support)': { type: String, default: '' },
    'Department Head':  { type: String, default: '' },
    'Department Deputy':{ type: String, default: '' },
    Desig_id:           { type: Number, default: null },
    Designation:        { type: String, default: '' },
    Emp_id:             { type: String, default: '' },
    'desig Email Id':   { type: String, default: '' },
    Emp_name:           { type: String, default: '' },
    'Role Document Link': { type: String, default: '' },
    'JD Link':          { type: String, default: '' },
    Remarks:            { type: String, default: '' },
    'Management Level': { type: String, default: '' },
    'Reporting Manager':{ type: String, default: '' },
  },
  {
    collection: 'employees',
    strict: false,      // allows any extra fields Compass imports
    timestamps: true,
  }
);

module.exports = mongoose.model('Employee', EmployeeSchema);