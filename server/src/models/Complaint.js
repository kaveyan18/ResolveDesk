const mongoose = require('mongoose');
const {
  COMPLAINT_STATUS_VALUES,
  COMPLAINT_STATUS,
  COMPLAINT_PRIORITY_VALUES,
  COMPLAINT_PRIORITY,
} = require('../constants/enums');

const commentSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Comment message cannot be empty'],
      trim: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const complaintSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Complaint category is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    status: {
      type: String,
      required: [true, 'Complaint status is required'],
      enum: {
        values: COMPLAINT_STATUS_VALUES,
        message: '{VALUE} is not a valid complaint status',
      },
      default: COMPLAINT_STATUS.PENDING,
    },
    priority: {
      type: String,
      required: [true, 'Complaint priority is required'],
      enum: {
        values: COMPLAINT_PRIORITY_VALUES,
        message: '{VALUE} is not a valid complaint priority',
      },
      default: COMPLAINT_PRIORITY.MEDIUM,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student user is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    images: {
      type: [String],
      default: [],
    },
    completionImages: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      default: null,
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
    },
    comments: [commentSchema],
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Single field indexes for fast querying
complaintSchema.index({ status: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ student: 1 });
complaintSchema.index({ assignedTechnician: 1 });
complaintSchema.index({ department: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ createdAt: -1 });

// Compound indexes for common queries
complaintSchema.index({ status: 1, assignedTechnician: 1 });
complaintSchema.index({ status: 1, department: 1 });
complaintSchema.index({ student: 1, status: 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
