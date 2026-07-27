const Complaint = require('../models/Complaint');

/**
 * Generate a sequential ticket ID (e.g. #CMP-1001, #CMP-1002)
 * @returns {Promise<string>} Sequential ticket ID string
 */
const generateTicketId = async () => {
  const count = await Complaint.countDocuments();
  const nextNum = 1001 + count;
  let ticketId = `#CMP-${nextNum}`;

  // Double check uniqueness in case of race condition
  const exists = await Complaint.findOne({ ticketId });
  if (exists) {
    const timestamp = Date.now().toString().slice(-4);
    ticketId = `#CMP-${nextNum}-${timestamp}`;
  }

  return ticketId;
};

module.exports = generateTicketId;
