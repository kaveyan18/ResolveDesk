const User = require('../models/User');
const Department = require('../models/Department');
const { ROLES } = require('../constants/enums');

const DEPARTMENTS_DATA = [
  {
    name: 'Hostel',
    code: 'HOST',
    description: 'Hostel Administration, Room Maintenance, Mess & Housekeeping Services',
    head: {
      name: 'Rajesh Sharma',
      email: 'head.hostel@college.edu',
      phone: '9876543210',
    },
    staff: [
      {
        name: 'Amit Singh',
        email: 'staff.hostel1@college.edu',
        phone: '9876543211',
        skills: ['Room Maintenance', 'Water Supply', 'Plumbing'],
      },
      {
        name: 'Ravi Kumar',
        email: 'staff.hostel2@college.edu',
        phone: '9876543212',
        skills: ['Housekeeping', 'Mess Hygiene', 'Laundry'],
      },
    ],
  },
  {
    name: 'Campus Facilities',
    code: 'CAMP',
    description: 'Campus Infrastructure, Classroom Maintenance, Electrical & HVAC',
    head: {
      name: 'Priya Verma',
      email: 'head.facilities@college.edu',
      phone: '9876543220',
    },
    staff: [
      {
        name: 'Manoj S.',
        email: 'staff.facilities1@college.edu',
        phone: '9876543221',
        skills: ['Electrical', 'Air Conditioner', 'Projector'],
      },
      {
        name: 'Deepak Verma',
        email: 'staff.facilities2@college.edu',
        phone: '9876543222',
        skills: ['Furniture', 'Plumbing', 'Washroom Maintenance'],
      },
    ],
  },
  {
    name: 'IT Services',
    code: 'ITSE',
    description: 'Campus Network, ERP Systems, Student Email & Computer Labs',
    head: {
      name: 'Anil Kumar',
      email: 'head.it@college.edu',
      phone: '9876543230',
    },
    staff: [
      {
        name: 'Rahul Mehta',
        email: 'staff.it1@college.edu',
        phone: '9876543231',
        skills: ['Campus WiFi', 'ERP Login', 'Student Email'],
      },
      {
        name: 'Sanjay Dev',
        email: 'staff.it2@college.edu',
        phone: '9876543232',
        skills: ['Computer Lab', 'Printer Support', 'Software Installation'],
      },
    ],
  },
  {
    name: 'Transport',
    code: 'TRAN',
    description: 'College Bus Fleet, Routes, Driver Schedules & Bus Passes',
    head: {
      name: 'Suresh Patel',
      email: 'head.transport@college.edu',
      phone: '9876543240',
    },
    staff: [
      {
        name: 'Gurpreet Singh',
        email: 'staff.transport1@college.edu',
        phone: '9876543241',
        skills: ['Bus Delay', 'Bus Breakdown', 'Route Issue'],
      },
      {
        name: 'Dinesh Yadav',
        email: 'staff.transport2@college.edu',
        phone: '9876543242',
        skills: ['Driver Complaints', 'Bus Pass Management'],
      },
    ],
  },
  {
    name: 'Examination Cell',
    code: 'EXAM',
    description: 'Hall Tickets, Internal Marks, Exam Schedules & Revaluation',
    head: {
      name: 'Dr. Sunita Rao',
      email: 'head.exam@college.edu',
      phone: '9876543250',
    },
    staff: [
      {
        name: 'Meena Kumari',
        email: 'staff.exam1@college.edu',
        phone: '9876543251',
        skills: ['Hall Ticket Verification', 'Internal Marks Entry'],
      },
      {
        name: 'Alok Nath',
        email: 'staff.exam2@college.edu',
        phone: '9876543252',
        skills: ['Revaluation Processing', 'Exam Schedule Updates'],
      },
    ],
  },
  {
    name: 'Library',
    code: 'LIBR',
    description: 'Book Circulation, Digital Library Access, Seating & System Support',
    head: {
      name: 'Ramesh Chandra',
      email: 'head.library@college.edu',
      phone: '9876543260',
    },
    staff: [
      {
        name: 'Pooja Joshi',
        email: 'staff.library1@college.edu',
        phone: '9876543261',
        skills: ['Book Availability', 'Digital Library Support'],
      },
      {
        name: 'Kiran Bala',
        email: 'staff.library2@college.edu',
        phone: '9876543262',
        skills: ['Fine Issue Settlement', 'Seating & Computer Systems'],
      },
    ],
  },
  {
    name: 'Placement Cell',
    code: 'PLAC',
    description: 'Placement & Internship Portal, Company Drives & Resume Verification',
    head: {
      name: 'Vikram Malhotra',
      email: 'head.placement@college.edu',
      phone: '9876543270',
    },
    staff: [
      {
        name: 'Nitin Saxena',
        email: 'staff.placement1@college.edu',
        phone: '9876543271',
        skills: ['Placement Portal', 'Resume Verification'],
      },
      {
        name: 'Neha Kapoor',
        email: 'staff.placement2@college.edu',
        phone: '9876543272',
        skills: ['Company Registration', 'Interview Schedule'],
      },
    ],
  },
  {
    name: 'Accounts Office',
    code: 'ACCO',
    description: 'Tuition & Hostel Fee Payments, Scholarships, Receipts & Refunds',
    head: {
      name: 'Kavita Gupta',
      email: 'head.accounts@college.edu',
      phone: '9876543280',
    },
    staff: [
      {
        name: 'Tarun Das',
        email: 'staff.accounts1@college.edu',
        phone: '9876543281',
        skills: ['Tuition Fee', 'Fee Receipts', 'Hostel Fee'],
      },
      {
        name: 'Shweta Mishra',
        email: 'staff.accounts2@college.edu',
        phone: '9876543282',
        skills: ['Scholarship Processing', 'Refund Clearance'],
      },
    ],
  },
];

const seedDepartmentsAndStaff = async () => {
  try {
    console.log('[Seeding Data] Seeding departments, heads, and staff members...');

    for (const deptItem of DEPARTMENTS_DATA) {
      // 1. Find or create Department
      let deptDoc = await Department.findOne({
        $or: [{ name: deptItem.name }, { code: deptItem.code }],
      });

      if (!deptDoc) {
        deptDoc = await Department.create({
          name: deptItem.name,
          code: deptItem.code,
          description: deptItem.description,
          isActive: true,
        });
      } else {
        if (!deptDoc.description) {
          deptDoc.description = deptItem.description;
          await deptDoc.save();
        }
      }

      // 2. Find or create Department Head user
      let headUser = await User.findOne({ email: deptItem.head.email });
      if (!headUser) {
        headUser = await User.create({
          name: deptItem.head.name,
          email: deptItem.head.email,
          password: 'Password@123',
          role: ROLES.DEPARTMENT_HEAD,
          phone: deptItem.head.phone,
          department: deptDoc._id,
          isApproved: true,
        });
      } else {
        headUser.department = deptDoc._id;
        headUser.isApproved = true;
        await headUser.save({ validateBeforeSave: false });
      }

      // Link head to department
      if (!deptDoc.head || deptDoc.head.toString() !== headUser._id.toString()) {
        deptDoc.head = headUser._id;
        await deptDoc.save({ validateBeforeSave: false });
      }

      // 3. Find or create Staff / Technicians for this department
      for (const staffMember of deptItem.staff) {
        let staffUser = await User.findOne({ email: staffMember.email });
        if (!staffUser) {
          await User.create({
            name: staffMember.name,
            email: staffMember.email,
            password: 'Password@123',
            role: ROLES.TECHNICIAN,
            phone: staffMember.phone,
            department: deptDoc._id,
            skills: staffMember.skills,
            isApproved: true,
          });
        } else {
          staffUser.department = deptDoc._id;
          staffUser.isApproved = true;
          staffUser.skills = staffMember.skills;
          await staffUser.save({ validateBeforeSave: false });
        }
      }
    }

    console.log('[Seeding Data] All 8 departments with specific heads and staff members seeded successfully!');
  } catch (error) {
    console.error('[Seeding Data Error]:', error.message);
  }
};

module.exports = {
  DEPARTMENTS_DATA,
  seedDepartmentsAndStaff,
};
