const prisma = require('../config/prisma');

// @desc    Get all tasks for the logged-in user (with optional status filter)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    // Filter strictly by the authenticated user's ID
    const where = { userId: req.user.id };

    // Optional status filter from query params (?status=Pending|In Progress|Completed)
    if (req.query.status) {
      where.status = req.query.status;
    }

    // Optional search term filter from query params (?search=abc)
    if (req.query.search) {
      where.OR = [
        { title: { contains: req.query.search, mode: 'insensitive' } },
        { description: { contains: req.query.search, mode: 'insensitive' } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    return res.json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error('Get Tasks Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching tasks',
    });
  }
};

// @desc    Get single task by ID for logged-in user
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    // Strictly filter by task ID and user's ID
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access unauthorized',
      });
    }

    return res.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Get Task By ID Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching task',
    });
  }
};

// @desc    Create a new task for logged-in user
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const { title, description, status, dueDate } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Title and dueDate are required fields',
      });
    }

    // Create task associated strictly with authenticated user's ID
    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        status: status || 'Pending',
        dueDate: new Date(dueDate),
        userId: req.user.id,
      },
    });

    // Broadcast real-time Socket.io event to user room
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.id.toString()).emit('task_created', task);
    }

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    console.error('Create Task Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating task',
    });
  }
};

// @desc    Update a task strictly owned by logged-in user
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const { title, description, status, dueDate } = req.body;

    // Verify task exists and is owned by the user
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access unauthorized',
      });
    }

    // Build update object
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);

    const task = await prisma.task.update({
      where: { id: existing.id },
      data: updateData,
    });

    // Broadcast real-time Socket.io event to user room
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.id.toString()).emit('task_updated', task);
    }

    return res.json({
      success: true,
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    console.error('Update Task Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating task',
    });
  }
};

// @desc    Delete a task strictly owned by logged-in user
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    // Verify task exists and is owned by the user
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or access unauthorized',
      });
    }

    await prisma.task.delete({
      where: { id: existing.id },
    });

    // Broadcast real-time Socket.io event to user room
    const io = req.app.get('io');
    if (io) {
      io.to(req.user.id.toString()).emit('task_deleted', { taskId: req.params.id });
    }

    return res.json({
      success: true,
      message: 'Task deleted successfully',
      taskId: req.params.id,
    });
  } catch (error) {
    console.error('Delete Task Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting task',
    });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};