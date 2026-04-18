'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Task } from '@/types';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  type TaskStatus = 'Wishlist' | 'Applied' | 'FirstInterview' | 'SecondInterview' | 'ThirdInterview' | 'Offer' | 'Closed';

  const [newTask, setNewTask] = useState({
    company: '',
    position: '',
    status: 'Wishlist' as TaskStatus,
    deadline: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    // 当认证状态变化时
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      setLoading(false);
    } else if (status === 'authenticated' && session?.user?.id) {
      fetchTasks(session.user.id);
    } else if (status === 'authenticated' && !session?.user?.id) {
      setLoading(false);
    } else if (status === 'loading') {
      // 认证状态正在加载，保持 loading 为 true
    } else {
      // 其他情况，设置 loading 为 false
      setLoading(false);
    }
  }, [status, session, router]);

  // 确保在组件挂载时，如果认证状态不是 loading，就设置 loading 为 false
  useEffect(() => {
    if (status !== 'loading') {
      setLoading(false);
    }
  }, [status]);

  const fetchTasks = async (userId: string) => {
    try {
      const response = await fetch(`/api/tasks?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('获取任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTask,
          title: `${newTask.company} - ${newTask.position}`,
          user_id: session.user.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks([...tasks, data.task]);
        setShowAddModal(false);
        setNewTask({
          company: '',
          position: '',
          status: 'Wishlist' as const,
          deadline: new Date().toISOString().split('T')[0],
          notes: '',
        });
      }
    } catch (error) {
      console.error('添加任务失败:', error);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: taskId, ...updates }),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? data.task : task));
      }
    } catch (error) {
      console.error('更新任务失败:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('确定要删除这个任务吗？')) {
      try {
        const response = await fetch(`/api/tasks?id=${taskId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setTasks(tasks.filter(task => task.id !== taskId));
        }
      } catch (error) {
        console.error('删除任务失败:', error);
      }
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      company: task.company || '',
      position: task.position || '',
      status: task.status as 'Wishlist' | 'Applied' | 'FirstInterview' | 'SecondInterview' | 'ThirdInterview' | 'Offer' | 'Closed',
      deadline: task.deadline || new Date().toISOString().split('T')[0],
      notes: task.notes || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !session?.user?.id) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingTask.id,
          company: newTask.company,
          position: newTask.position,
          status: newTask.status,
          deadline: newTask.deadline,
          notes: newTask.notes,
          title: `${newTask.company} - ${newTask.position}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(prevTasks => prevTasks.map(task => task.id === editingTask.id ? data.task : task));
        setShowEditModal(false);
        setEditingTask(null);
        setNewTask({
          company: '',
          position: '',
          status: 'Wishlist' as const,
          deadline: new Date().toISOString().split('T')[0],
          notes: '',
        });
      }
    } catch (error) {
      console.error('更新任务失败:', error);
    }
  };

  const getStatusIndex = (status: string) => {
    const statusOrder = ['Wishlist', 'Applied', 'FirstInterview', 'SecondInterview', 'ThirdInterview', 'Offer', 'Closed'];
    return statusOrder.indexOf(status);
  };

  const getStatusSpan = (status: string) => {
    const statusOrder = ['Wishlist', 'Applied', 'FirstInterview', 'SecondInterview', 'ThirdInterview', 'Offer', 'Closed'];
    const index = statusOrder.indexOf(status);
    return index + 1;
  };

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.dataTransfer.clearData();
    setDraggedTaskId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, newStatus: Task['status'] | null, targetTaskId: string | null) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      if (targetTaskId && taskId !== targetTaskId) {
        // 垂直拖拽排序
        const draggedIndex = tasks.findIndex(t => t.id === taskId);
        const targetIndex = tasks.findIndex(t => t.id === targetTaskId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
          const newTasks = [...tasks];
          const [draggedTask] = newTasks.splice(draggedIndex, 1);
          newTasks.splice(targetIndex, 0, draggedTask);
          setTasks(newTasks);
        }
      } else if (newStatus) {
        // 水平拖拽改变状态
        const today = new Date().toISOString().split('T')[0];
        handleUpdateTask(taskId, { status: newStatus, deadline: today });
      }
    }
  }, [tasks, handleUpdateTask]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">求职管理系统</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              + 新增任务
            </button>
            <div className="text-sm text-foreground/70">
              {session?.user?.email}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 状态标题行 */}
        <div className="grid grid-cols-7 gap-4 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">意向</h2>
            <span className="bg-light text-primary px-2 py-1 rounded-full text-xs font-medium">
              {tasks.filter(t => t.status === 'Wishlist').length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">已投递</h2>
            <span className="bg-light text-primary px-2 py-1 rounded-full text-xs font-medium">
              {tasks.filter(t => t.status === 'Applied').length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">一面</h2>
            <span className="bg-light text-primary px-2 py-1 rounded-full text-xs font-medium">
              {tasks.filter(t => t.status === 'FirstInterview').length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">二面</h2>
            <span className="bg-light text-primary px-2 py-1 rounded-full text-xs font-medium">
              {tasks.filter(t => t.status === 'SecondInterview').length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">三面</h2>
            <span className="bg-light text-primary px-2 py-1 rounded-full text-xs font-medium">
              {tasks.filter(t => t.status === 'ThirdInterview').length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Offer</h2>
            <span className="bg-light text-primary px-2 py-1 rounded-full text-xs font-medium">
              {tasks.filter(t => t.status === 'Offer').length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">失败</h2>
            <span className="bg-light text-primary px-2 py-1 rounded-full text-xs font-medium">
              {tasks.filter(t => t.status === 'Closed').length}
            </span>
          </div>
        </div>

        {/* 任务卡片区域 */}
        <div className="relative">
          {tasks.map((task) => {
            const statusSpan = getStatusSpan(task.status);
            
            return (
              <div 
                key={task.id}
                className="relative mb-4 h-28"
              >
                {/* 拖拽区域 - 放在卡片下面 */}
                <div className="absolute inset-0 grid grid-cols-7 gap-4 h-full">
                  <div 
                    className="col-span-1 border border-border rounded-lg bg-muted/30"
                    onDrop={(e) => handleDrop(e, 'Wishlist', null)}
                    onDragOver={handleDragOver}
                  />
                  <div 
                    className="col-span-1 border border-border rounded-lg bg-muted/30"
                    onDrop={(e) => handleDrop(e, 'Applied', null)}
                    onDragOver={handleDragOver}
                  />
                  <div 
                    className="col-span-1 border border-border rounded-lg bg-muted/30"
                    onDrop={(e) => handleDrop(e, 'FirstInterview', null)}
                    onDragOver={handleDragOver}
                  />
                  <div 
                    className="col-span-1 border border-border rounded-lg bg-muted/30"
                    onDrop={(e) => handleDrop(e, 'SecondInterview', null)}
                    onDragOver={handleDragOver}
                  />
                  <div 
                    className="col-span-1 border border-border rounded-lg bg-muted/30"
                    onDrop={(e) => handleDrop(e, 'ThirdInterview', null)}
                    onDragOver={handleDragOver}
                  />
                  <div 
                    className="col-span-1 border border-border rounded-lg bg-muted/30"
                    onDrop={(e) => handleDrop(e, 'Offer', null)}
                    onDragOver={handleDragOver}
                  />
                  <div 
                    className="col-span-1 border border-border rounded-lg bg-muted/30"
                    onDrop={(e) => handleDrop(e, 'Closed', null)}
                    onDragOver={handleDragOver}
                  />
                </div>

                {/* 任务卡片 */}
                <div
                  className={`kanban-card absolute top-0 left-0 h-full p-3 border border-border rounded-lg bg-white shadow-sm flex flex-col justify-between ${draggedTaskId === task.id ? 'opacity-50' : ''}`}
                  style={{
                    left: '0%', // 固定在意向栏
                    width: `${(statusSpan / 7) * 100}%`, // 根据状态调整宽度
                    zIndex: 10,
                    boxSizing: 'border-box'
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, null, task.id)}
                  onDragOver={handleDragOver}
                >
                  <div>
                    <h3 className="font-medium text-foreground truncate">{task.company}</h3>
                    <p className="text-sm text-foreground/70 truncate">{task.position}</p>
                    {task.deadline && (
                      <p className="text-xs text-foreground/60 mt-1">重要日期: {new Date(task.deadline).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="btn btn-secondary text-xs py-1 px-2 w-16 text-center flex items-center justify-center whitespace-nowrap"
                      style={{ height: '24px' }}
                    >
                      修改
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="btn btn-danger text-xs py-1 px-2 w-16 text-center flex items-center justify-center whitespace-nowrap"
                      style={{ height: '24px' }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {showAddModal && (
        <div className="modal">
          <div className="modal-content max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">新增任务</h2>
            <form onSubmit={handleAddTask}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">公司</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTask.company}
                    onChange={(e) => setNewTask({ ...newTask, company: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">职位</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTask.position}
                    onChange={(e) => setNewTask({ ...newTask, position: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">状态</label>
                  <select
                    className="form-input"
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value as any })}
                  >
                    <option value="Wishlist">意向</option>
                    <option value="Applied">已投递</option>
                    <option value="FirstInterview">一面</option>
                    <option value="SecondInterview">二面</option>
                    <option value="ThirdInterview">三面</option>
                    <option value="Offer">Offer</option>
                    <option value="Closed">失败</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">重要日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">备注</label>
                  <textarea
                    className="form-input"
                    value={newTask.notes}
                    onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  新增任务
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal">
          <div className="modal-content max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">修改任务</h2>
            <form onSubmit={handleUpdateTaskSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">公司</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTask.company}
                    onChange={(e) => setNewTask({ ...newTask, company: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">职位</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTask.position}
                    onChange={(e) => setNewTask({ ...newTask, position: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">状态</label>
                  <select
                    className="form-input"
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value as any })}
                  >
                    <option value="Wishlist">意向</option>
                    <option value="Applied">已投递</option>
                    <option value="FirstInterview">一面</option>
                    <option value="SecondInterview">二面</option>
                    <option value="ThirdInterview">三面</option>
                    <option value="Offer">Offer</option>
                    <option value="Closed">失败</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">重要日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">备注</label>
                  <textarea
                    className="form-input"
                    value={newTask.notes}
                    onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTask(null);
                    setNewTask({
                      company: '',
                      position: '',
                      status: 'Wishlist' as const,
                      deadline: new Date().toISOString().split('T')[0],
                      notes: '',
                    });
                  }}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}