'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Task } from '@/types';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    company: '',
    position: '',
    city: '',
    salary: '',
    status: 'Wishlist' as const,
    deadline: '',
    resume_version: '',
    notes: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (session?.user?.id) {
      fetchTasks(session.user.id);
    }
  }, [status, session, router]);

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
          user_id: session.user.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks([...tasks, data.task]);
        setShowAddModal(false);
        setNewTask({
          title: '',
          company: '',
          position: '',
          city: '',
          salary: '',
          status: 'Wishlist' as const,
          deadline: '',
          resume_version: '',
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
        setTasks(tasks.map(task => task.id === taskId ? data.task : task));
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

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  // 处理拖拽开始
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  // 处理拖拽结束
  const handleDragEnd = (e: React.DragEvent) => {
    e.dataTransfer.clearData();
  };

  // 处理拖拽放置
  const handleDrop = (e: React.DragEvent, newStatus: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      handleUpdateTask(taskId, { status: newStatus });
    }
  };

  // 处理拖拽经过
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (status === 'loading' || loading) {
    return <div className="flex items-center justify-center min-h-screen">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">求职管理系统</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + 新增任务
            </button>
            <div className="text-sm text-gray-600">
              {session?.user?.email}
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex overflow-x-auto space-x-4 pb-4">
          {/* 意向池 */}
          <div 
            className="kanban-column"
            onDrop={(e) => handleDrop(e, 'Wishlist')}
            onDragOver={handleDragOver}
          >
            <h2 className="text-lg font-semibold mb-4">意向池 ({getTasksByStatus('Wishlist').length})</h2>
            {getTasksByStatus('Wishlist').map(task => (
              <div 
                key={task.id} 
                className="kanban-card"
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={handleDragEnd}
              >
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                <p className="text-sm text-gray-600">{task.company}</p>
                <p className="text-sm text-gray-600">{task.position}</p>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 已投递 */}
          <div 
            className="kanban-column"
            onDrop={(e) => handleDrop(e, 'Applied')}
            onDragOver={handleDragOver}
          >
            <h2 className="text-lg font-semibold mb-4">已投递 ({getTasksByStatus('Applied').length})</h2>
            {getTasksByStatus('Applied').map(task => (
              <div 
                key={task.id} 
                className="kanban-card"
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={handleDragEnd}
              >
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                <p className="text-sm text-gray-600">{task.company}</p>
                <p className="text-sm text-gray-600">{task.position}</p>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 测评/笔试中 */}
          <div 
            className="kanban-column"
            onDrop={(e) => handleDrop(e, 'Testing')}
            onDragOver={handleDragOver}
          >
            <h2 className="text-lg font-semibold mb-4">测评/笔试中 ({getTasksByStatus('Testing').length})</h2>
            {getTasksByStatus('Testing').map(task => (
              <div 
                key={task.id} 
                className="kanban-card"
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={handleDragEnd}
              >
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                <p className="text-sm text-gray-600">{task.company}</p>
                <p className="text-sm text-gray-600">{task.position}</p>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 面试中 */}
          <div 
            className="kanban-column"
            onDrop={(e) => handleDrop(e, 'Interviewing')}
            onDragOver={handleDragOver}
          >
            <h2 className="text-lg font-semibold mb-4">面试中 ({getTasksByStatus('Interviewing').length})</h2>
            {getTasksByStatus('Interviewing').map(task => (
              <div 
                key={task.id} 
                className="kanban-card"
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={handleDragEnd}
              >
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                <p className="text-sm text-gray-600">{task.company}</p>
                <p className="text-sm text-gray-600">{task.position}</p>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 录用 */}
          <div 
            className="kanban-column"
            onDrop={(e) => handleDrop(e, 'Offer')}
            onDragOver={handleDragOver}
          >
            <h2 className="text-lg font-semibold mb-4">录用 ({getTasksByStatus('Offer').length})</h2>
            {getTasksByStatus('Offer').map(task => (
              <div 
                key={task.id} 
                className="kanban-card"
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={handleDragEnd}
              >
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                <p className="text-sm text-gray-600">{task.company}</p>
                <p className="text-sm text-gray-600">{task.position}</p>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 遗憾结案 */}
          <div 
            className="kanban-column"
            onDrop={(e) => handleDrop(e, 'Closed')}
            onDragOver={handleDragOver}
          >
            <h2 className="text-lg font-semibold mb-4">遗憾结案 ({getTasksByStatus('Closed').length})</h2>
            {getTasksByStatus('Closed').map(task => (
              <div 
                key={task.id} 
                className="kanban-card"
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={handleDragEnd}
              >
                <h3 className="font-medium text-gray-900">{task.title}</h3>
                <p className="text-sm text-gray-600">{task.company}</p>
                <p className="text-sm text-gray-600">{task.position}</p>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 新增任务弹窗 */}
      {showAddModal && (
        <div className="modal">
          <div className="modal-content max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">新增任务</h2>
            <form onSubmit={handleAddTask}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">标题</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    required
                  />
                </div>
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
                  <label className="block text-sm font-medium text-gray-700">城市</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTask.city}
                    onChange={(e) => setNewTask({ ...newTask, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">薪资</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTask.salary}
                    onChange={(e) => setNewTask({ ...newTask, salary: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">状态</label>
                  <select
                    className="form-input"
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value as any })}
                  >
                    <option value="Wishlist">意向池</option>
                    <option value="Applied">已投递</option>
                    <option value="Testing">测评/笔试中</option>
                    <option value="Interviewing">面试中</option>
                    <option value="Offer">录用</option>
                    <option value="Closed">遗憾结案</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">截止日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">简历版本</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTask.resume_version}
                    onChange={(e) => setNewTask({ ...newTask, resume_version: e.target.value })}
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
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  新增任务
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
