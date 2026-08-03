const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { ROLE_VALUES, ROLES } = require('../constants/enums');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'User email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    role: {
      type: String,
      required: [true, 'User role is required'],
      enum: {
        values: ROLE_VALUES,
        message: '{VALUE} is not a valid user role',
      },
      default: ROLES.STUDENT,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    skills: {
      type: [String],
      default: [],
    },
    isApproved: {
      type: Boolean,
      default: function () {
        // Students are automatically approved; staff accounts require admin approval
        return this.role === ROLES.STUDENT;
      },
    },
    avatar: {
      type: String,
      default: '',
    },
    emailNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
    pushNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
    resetPasswordOTP: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordOTPExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Indexes for performance
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ isApproved: 1 });
userSchema.index({ role: 1, isApproved: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
