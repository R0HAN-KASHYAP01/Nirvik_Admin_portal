// Field `name` values are the exact DB column names for that role's
// table (except 'password', which never gets inserted into a table).

export const ROLE_CONFIG = {
  official: {
    label: 'Department / Official',
    table: 'officials',
    fields: [
      { name: 'full_name', label: 'Full Name', type: 'text', required: true },
      { name: 'official_email', label: 'Official Email Address', type: 'email', required: true },
      { name: 'mobile_number', label: 'Mobile Number', type: 'text', required: true },
      { name: 'employee_id', label: 'Employee ID', type: 'text', required: true },
      { name: 'designation', label: 'Designation', type: 'text', required: true },
      { name: 'department', label: 'Department', type: 'text', required: true },
      { name: 'state', label: 'State', type: 'text', required: true },
      { name: 'district', label: 'District', type: 'text', required: true },
      { name: 'office_location', label: 'Office Location', type: 'text', required: true },
      { name: 'government_id_path', label: 'Government-Issued ID', type: 'file', required: true },
      { name: 'authorization_doc_path', label: 'Authorization / Official Document', type: 'file', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
    ],
  },

  inspector: {
    label: 'Inspector',
    table: 'inspectors',
    fields: [
      { name: 'full_name', label: 'Full Name', type: 'text', required: true },
      { name: 'official_email', label: 'Official Email Address', type: 'email', required: true },
      { name: 'mobile_number', label: 'Mobile Number', type: 'text', required: true },
      { name: 'pmu_unit_name', label: 'PMU / Unit Name', type: 'text', required: true },
      { name: 'inspector_id', label: 'Inspector ID', type: 'text', required: true },
      { name: 'designation', label: 'Designation', type: 'text', required: true },
      { name: 'department', label: 'Department', type: 'text', required: true },
      { name: 'state', label: 'State', type: 'text', required: true },
      { name: 'district', label: 'District', type: 'text', required: true },
      { name: 'assigned_region', label: 'Assigned Region', type: 'text', required: true },
      { name: 'official_id_doc_path', label: 'Official ID Document', type: 'file', required: true },
      { name: 'authorization_letter_path', label: 'Authorization Letter', type: 'file', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
    ],
  },

  institute_rep: {
    label: 'Institute / NGO Representative',
    table: 'institute_reps',
    fields: [
      { name: 'representative_name', label: 'Representative Name', type: 'text', required: true },
      { name: 'official_email', label: 'Official Email Address', type: 'email', required: true },
      { name: 'mobile_number', label: 'Mobile Number', type: 'text', required: true },
      { name: 'designation', label: 'Designation', type: 'text', required: true },
      { name: 'organization_name', label: 'Organization / NGO Name', type: 'text', required: true },
      { name: 'registration_number', label: 'Registration Number', type: 'text', required: true },
      { name: 'organization_type', label: 'Organization Type', type: 'text', required: true },
      { name: 'complete_address', label: 'Complete Address', type: 'text', required: true },
      { name: 'state', label: 'State', type: 'text', required: true },
      { name: 'district', label: 'District', type: 'text', required: true },
      { name: 'pin_code', label: 'PIN Code', type: 'text', required: true },
      { name: 'registration_certificate_path', label: 'Registration Certificate', type: 'file', required: true },
      { name: 'authorization_letter_path', label: 'Authorization Letter', type: 'file', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
    ],
  },

  state_admin: {
    label: 'State Administrator',
    table: 'state_administrators',
    fields: [
      { name: 'full_name', label: 'Full Name', type: 'text', required: true },
      { name: 'official_email', label: 'Official Email Address', type: 'email', required: true },
      { name: 'mobile_number', label: 'Mobile Number', type: 'text', required: true },
      { name: 'employee_id', label: 'Employee ID', type: 'text', required: true },
      { name: 'designation', label: 'Designation', type: 'text', required: true },
      { name: 'department', label: 'Department', type: 'text', required: true },
      { name: 'division_section', label: 'Division / Section', type: 'text', required: false },
      { name: 'office_name', label: 'Office Name', type: 'text', required: true },
      { name: 'state', label: 'State', type: 'text', required: true },
      { name: 'office_address', label: 'Office Address', type: 'text', required: true },
      { name: 'official_id_doc_path', label: 'Official ID Document', type: 'file', required: true },
      { name: 'authorization_letter_path', label: 'Authorization Letter', type: 'file', required: true },
      { name: 'appointment_order_path', label: 'Appointment / Posting Order', type: 'file', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
    ],
  },

  district_admin: {
    label: 'District Administrator',
    table: 'district_administrators',
    fields: [
      { name: 'full_name', label: 'Full Name', type: 'text', required: true },
      { name: 'official_email', label: 'Official Email Address', type: 'email', required: true },
      { name: 'mobile_number', label: 'Mobile Number', type: 'text', required: true },
      { name: 'employee_id', label: 'Employee ID', type: 'text', required: true },
      { name: 'designation', label: 'Designation', type: 'text', required: true },
      { name: 'department', label: 'Department', type: 'text', required: true },
      { name: 'division_section', label: 'Division / Section', type: 'text', required: false },
      { name: 'office_name', label: 'Office Name', type: 'text', required: true },
      { name: 'state', label: 'State', type: 'text', required: true },
      { name: 'district', label: 'District', type: 'text', required: true },
      { name: 'block_subdivision', label: 'Block / Subdivision', type: 'text', required: false },
      { name: 'office_address', label: 'Office Address', type: 'text', required: true },
      { name: 'official_id_doc_path', label: 'Official ID Document', type: 'file', required: true },
      { name: 'authorization_letter_path', label: 'Authorization Letter', type: 'file', required: true },
      { name: 'appointment_order_path', label: 'Appointment / Posting Order', type: 'file', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
    ],
  },
}

export const ROLE_OPTIONS = Object.entries(ROLE_CONFIG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}))