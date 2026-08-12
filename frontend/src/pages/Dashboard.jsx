import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import TaskStats from '../components/tasks/TaskStats';
import TaskFilter from '../components/tasks/TaskFilter';
import TaskCard from '../components/tasks/TaskCard';
import TaskModal from '../components/tasks/TaskModal';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { socket, connectSocket, disconnectSocket } from '../services/socket';
import { Plus, CheckCircle2, Loader2, RefreshCw, Radio } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);

  // Filter & Search State
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all tasks from backend API
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/tasks');
      if (response.data.success) {
        setAllTasks(response.data.tasks);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.response?.data?.message || 'Failed to fetch tasks from server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Socket.io Real-time Event Listeners & Room Subscription
  useEffect(() => {
    if (user?.id) {
      connectSocket(user.id);

      const onConnect = () => setSocketConnected(true);
      const onDisconnect = () => setSocketConnected(false);

      // Listen for socket events
      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);

      socket.on('task_created', (newTask) => {
        console.log('⚡ Real-time Event: task_created', newTask);
        setAllTasks((prev) => {
          // Avoid duplicate prepend if created locally
          if (prev.some((t) => t.id === newTask.id)) return prev;
          return [newTask, ...prev];
        });
      });

      socket.on('task_updated', (updatedTask) => {
        console.log('⚡ Real-time Event: task_updated', updatedTask);
        setAllTasks((prev) =>
          prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
        );
      });

      socket.on('task_deleted', ({ taskId }) => {
        console.log('⚡ Real-time Event: task_deleted', taskId);
        setAllTasks((prev) => prev.filter((t) => t.id !== taskId));
      });

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('task_created');
        socket.off('task_updated');
        socket.off('task_deleted');
        disconnectSocket();
      };
    }
  }, [user?.id]);

  // Handle Task Save (Create or Edit)
  const handleSaveTask = async (formData) => {
    try {
      setIsSubmitting(true);
      if (editingTask) {
        const response = await api.put(`/tasks/${editingTask.id}`, formData);
        if (response.data.success) {
          setAllTasks((prev) =>
            prev.map((t) => (t.id === editingTask.id ? response.data.task : t))
          );
        }
      } else {
        const response = await api.post('/tasks', formData);
        if (response.data.success) {
          setAllTasks((prev) => [response.data.task, ...prev]);
        }
      }
      setIsModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      console.error('Error saving task:', err);
      throw new Error(err.response?.data?.message || 'Error saving task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inline Status Change Handler
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setAllTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      await api.put(`/tasks/${taskId}`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update task status:', err);
      fetchTasks();
    }
  };

  // Delete Task Handler
  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        setAllTasks((prev) => prev.filter((t) => t.id !== taskId));
        await api.delete(`/tasks/${taskId}`);
      } catch (err) {
        console.error('Failed to delete task:', err);
        fetchTasks();
      }
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // Filter tasks based on selected status tab and search query
  const filteredTasks = allTasks.filter((task) => {
    const matchesStatus =
      statusFilter === 'All' || task.status === statusFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Navbar */}
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header Banner & Real-time Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Task Dashboard
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  socketConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
                title={socketConnected ? 'Live Socket Connected' : 'Connecting Socket...'}
              >
                <Radio className={`w-3 h-3 ${socketConnected ? 'animate-pulse' : ''}`} />
                {socketConnected ? 'Live Sync' : 'Offline'}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Organize, track, and synchronize your tasks in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchTasks}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
              title="Refresh tasks"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              id="open-create-task-modal-btn"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Task</span>
            </button>
          </div>
        </div>

        {/* Real-time Task Count Stats Header Bar */}
        <TaskStats tasks={allTasks} />

        {/* Filter Buttons & Search Input */}
        <TaskFilter
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Main Tasks Content */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <p className="text-slate-400 text-sm font-medium">Loading your tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 max-w-md mx-auto my-12">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">No tasks found</h3>
            <p className="text-slate-400 text-sm mt-1 mb-6">
              {searchQuery || statusFilter !== 'All'
                ? 'No tasks match your current filter or search criteria.'
                : 'You have no tasks yet. Create one to get started!'}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </main>

      {/* Task Modal (Create & Edit) */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveTask}
        editingTask={editingTask}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default Dashboard;
