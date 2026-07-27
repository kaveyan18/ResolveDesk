const { Server } = require('socket.io');
const Complaint = require('./models/Complaint');
const Notification = require('./models/Notification');

let io = null;

// Track online participants per complaint room: roomId -> Map(socketId -> userObj)
const roomPresence = new Map();

/**
 * Initialize Socket.IO Server
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join a complaint room
    socket.on('join_complaint', ({ complaintId, user }) => {
      if (!complaintId || !user) return;

      const roomId = `complaint_${complaintId}`;
      socket.join(roomId);
      socket.complaintRoom = roomId;
      socket.userData = user;

      // Track presence
      if (!roomPresence.has(roomId)) {
        roomPresence.set(roomId, new Map());
      }
      roomPresence.get(roomId).set(socket.id, user);

      // Broadcast active room presence list to participants in this room
      const activeUsers = Array.from(roomPresence.get(roomId).values());
      io.to(roomId).emit('presence_update', {
        complaintId,
        activeUsers,
      });

      console.log(`[Socket.IO] ${user.name} (${user.role}) joined ${roomId}`);
    });

    // Leave a complaint room
    socket.on('leave_complaint', ({ complaintId }) => {
      if (!complaintId) return;

      const roomId = `complaint_${complaintId}`;
      socket.leave(roomId);

      if (roomPresence.has(roomId)) {
        roomPresence.get(roomId).delete(socket.id);
        const activeUsers = Array.from(roomPresence.get(roomId).values());
        io.to(roomId).emit('presence_update', {
          complaintId,
          activeUsers,
        });
      }

      console.log(`[Socket.IO] Client left ${roomId}`);
    });

    // Handle new message event
    socket.on('send_message', async ({ complaintId, message, sender }) => {
      try {
        if (!complaintId || !message || !sender) return;

        // Save comment to database
        const complaint = await Complaint.findById(complaintId);
        if (!complaint) return;

        const newComment = {
          sender: sender._id,
          message,
          createdAt: new Date(),
        };

        complaint.comments.push(newComment);
        await complaint.save();

        await complaint.populate('comments.sender', 'name role avatar email');

        const savedComment = complaint.comments[complaint.comments.length - 1];

        const roomId = `complaint_${complaintId}`;
        // Broadcast new message to everyone in room
        io.to(roomId).emit('new_message', {
          complaintId,
          comment: savedComment,
        });

        // Trigger notification to non-senders
        let recipientId = null;
        if (sender.role === 'Student') {
          recipientId = complaint.assignedTechnician;
        } else {
          recipientId = complaint.student;
        }

        if (recipientId && recipientId.toString() !== sender._id.toString()) {
          await Notification.create({
            recipient: recipientId,
            sender: sender._id,
            complaint: complaint._id,
            title: `New Comment on #${complaint.ticketId}`,
            message: `${sender.name}: "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"`,
            type: 'new_comment',
          });

          // Also emit unread notification update if user is connected
          io.emit('notification_received', { recipientId: recipientId.toString() });
        }
      } catch (err) {
        console.error('[Socket.IO] Error handling send_message:', err);
      }
    });

    // Handle typing start indicator
    socket.on('typing_start', ({ complaintId, user }) => {
      if (!complaintId || !user) return;
      const roomId = `complaint_${complaintId}`;
      socket.to(roomId).emit('user_typing', {
        complaintId,
        user,
      });
    });

    // Handle typing stop indicator
    socket.on('typing_stop', ({ complaintId, user }) => {
      if (!complaintId || !user) return;
      const roomId = `complaint_${complaintId}`;
      socket.to(roomId).emit('user_stopped_typing', {
        complaintId,
        user,
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (socket.complaintRoom && roomPresence.has(socket.complaintRoom)) {
        const roomId = socket.complaintRoom;
        roomPresence.get(roomId).delete(socket.id);
        const activeUsers = Array.from(roomPresence.get(roomId).values());
        io.to(roomId).emit('presence_update', {
          activeUsers,
        });
      }
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Get Socket.IO instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
};
