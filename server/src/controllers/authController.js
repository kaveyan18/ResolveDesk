const User = require('../models/User');
require('../models/Department');
const generateToken = require('../utils/generateToken');
const { ROLES, ROLE_VALUES } = require('../constants/enums');
const { sendPasswordResetOTP } = require('../utils/emailService');

/**
 * @desc    Register a new user (Students auto-approved, Staff pending approval)
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, department, phone, skills } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, email, and password',
      });
    }

    // Check if role is valid
    const targetRole = role || ROLES.STUDENT;
    if (!ROLE_VALUES.includes(targetRole)) {
      return res.status(400).json({
        status: 'fail',
        message: `Invalid role specified. Must be one of: ${ROLE_VALUES.join(', ')}`,
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'User with this email already exists',
      });
    }

    // Determine approval status (Students auto-approved, staff requires admin approval)
    const isApproved = targetRole === ROLES.STUDENT;

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: targetRole,
      department: department || null,
      phone: phone || '',
      skills: Array.isArray(skills) ? skills : [],
      isApproved,
    });

    if (user) {
      // If staff member, account is pending approval
      if (!isApproved) {
        return res.status(201).json({
          status: 'success',
          message:
            'Registration successful. Staff accounts require admin approval before login.',
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isApproved: false,
          },
        });
      }

      // Student registration returns token directly
      return res.status(201).json({
        status: 'success',
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isApproved: true,
        },
      });
    } else {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid user data provided',
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error during registration',
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string') {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide valid email and password',
      });
    }

    // Find user by email (include password for validation)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+password'
    );

    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password',
      });
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password',
      });
    }

    // Check staff account approval status (AGENTS.md section 3)
    if (!user.isApproved) {
      return res.status(403).json({
        status: 'fail',
        message:
          'Your account is pending admin approval. Please contact administrator.',
      });
    }

    await user.populate('department');

    return res.json({
      status: 'success',
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        skills: user.skills,
        avatar: user.avatar,
        emailNotificationsEnabled: user.emailNotificationsEnabled,
        pushNotificationsEnabled: user.pushNotificationsEnabled,
        isApproved: user.isApproved,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error during login',
    });
  }
};

/**
 * @desc    Initiate password reset (Generate OTP)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide an email address',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'No user account found with this email address',
      });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = expiresAt;

    await user.save();

    // Send real email with OTP code using configured SMTP credentials
    await sendPasswordResetOTP({
      recipientEmail: user.email,
      recipientName: user.name,
      otp,
    });

    console.log(
      `[ResolveDesk Auth] OTP generated and sent to email for ${user.email}: ${otp}`
    );

    return res.json({
      status: 'success',
      message: `A 6-digit verification code has been sent to ${user.email}. Please check your email inbox.`,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error during forgot password',
    });
  }
};

/**
 * @desc    Reset password using OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email, OTP, and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'fail',
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+resetPasswordOTP +resetPasswordOTPExpires'
    );

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid email or reset request',
      });
    }

    if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid OTP code',
      });
    }

    if (
      user.resetPasswordOTPExpires &&
      new Date() > new Date(user.resetPasswordOTPExpires)
    ) {
      return res.status(400).json({
        status: 'fail',
        message: 'OTP has expired. Please request a new password reset.',
      });
    }

    user.password = newPassword;
    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpires = null;

    await user.save();

    return res.json({
      status: 'success',
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error resetting password',
    });
  }
};

/**
 * @desc    Get current logged in user details
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('department');

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    return res.json({
      status: 'success',
      user,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error fetching user profile',
    });
  }
};

/**
 * @desc    Update current user profile (name, phone, avatar, preferences)
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      avatar,
      emailNotificationsEnabled,
      pushNotificationsEnabled,
    } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatar !== undefined) user.avatar = avatar;
    if (typeof emailNotificationsEnabled === 'boolean') {
      user.emailNotificationsEnabled = emailNotificationsEnabled;
    }
    if (typeof pushNotificationsEnabled === 'boolean') {
      user.pushNotificationsEnabled = pushNotificationsEnabled;
    }

    await user.save();
    await user.populate('department');

    return res.json({
      status: 'success',
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        skills: user.skills,
        avatar: user.avatar,
        emailNotificationsEnabled: user.emailNotificationsEnabled,
        pushNotificationsEnabled: user.pushNotificationsEnabled,
        isApproved: user.isApproved,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error updating profile',
    });
  }
};

/**
 * @desc    Change user password
 * @route   PUT /api/auth/password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide current password and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'fail',
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        status: 'fail',
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    return res.json({
      status: 'success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error changing password',
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
};
