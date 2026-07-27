const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { ROLES, ROLE_VALUES } = require('../constants/enums');

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
    const userExists = await User.findOne({ email });
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
      name,
      email,
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

    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password',
      });
    }

    // Find user and select password explicitly
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password',
      });
    }

    // Match password using bcrypt
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password',
      });
    }

    // Enforce approval check for staff
    if (!user.isApproved) {
      return res.status(403).json({
        status: 'fail',
        message: 'Account pending admin approval. Please contact administrator.',
      });
    }

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
 * @desc    Request password reset OTP
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email address',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'No account found with that email address',
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = otpExpires;
    await user.save();

    return res.json({
      status: 'success',
      message: 'Password reset OTP generated successfully',
      otp, // Included for development testing & API response
      expiresIn: '10 minutes',
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

    // Find user with OTP fields explicitly selected
    const user = await User.findOne({ email }).select(
      '+resetPasswordOTP +resetPasswordOTPExpires'
    );

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid email or reset request',
      });
    }

    // Check if OTP matches and is not expired
    if (
      !user.resetPasswordOTP ||
      user.resetPasswordOTP !== otp ||
      !user.resetPasswordOTPExpires ||
      user.resetPasswordOTPExpires < new Date()
    ) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid or expired OTP',
      });
    }

    // Update password and clear OTP fields
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;

    await user.save();

    return res.json({
      status: 'success',
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Server error during password reset',
    });
  }
};

/**
 * @desc    Get current authenticated user profile
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

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getMe,
};
