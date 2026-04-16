import React, { useState, useEffect } from 'react';
import api from '../api';
import { Button } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';

const AdminNotes = () => {
  const [notes, setNotes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [filterPriority, setFilterPriority] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium'
  });

  const priorityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    urgent: 'bg-red-100 text-red-800 border-red-200'
  };

  const priorityBadgeColors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500', 
    urgent: 'bg-red-500'
  };

  useEffect(() => {
    fetchNotes();
  }, [filterPriority]);

  const fetchNotes = async () => {
    try {
      const url = filterPriority === 'all' 
        ? '/admin-notes/' 
        : `/admin-notes/by_priority/?priority=${filterPriority}`;
      const response = await api.get(url);
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNote) {
        await api.put(`/admin-notes/${editingNote.id}/`, formData);
      } else {
        await api.post('/admin-notes/', formData);
      }
      setFormData({ title: '', content: '', priority: 'medium' });
      setShowForm(false);
      setEditingNote(null);
      fetchNotes();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      priority: note.priority
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await api.delete(`/admin-notes/${id}/`);
        fetchNotes();
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const toggleComplete = async (note) => {
    try {
      await api.patch(`/admin-notes/${note.id}/toggle_complete/`);
      fetchNotes();
    } catch (error) {
      console.error('Error toggling completion:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>Admin Notes</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setShowForm(!showForm)}
          style={{ background: '#f97316', border: 'none', fontWeight: 600 }}
        >
          {showForm ? 'Cancel' : 'Add Note'}
        </Button>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: '20px' }}>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '2px solid #e5e7eb',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: '30px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: '#374151' }}>
            {editingNote ? 'Edit Note' : 'Add New Note'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Note title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#f97316'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <textarea
                placeholder="Note content..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows="4"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  fontSize: '16px',
                  outline: 'none',
                  resize: 'vertical',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#f97316'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  fontSize: '16px',
                  backgroundColor: 'white'
                }}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                type="primary"
                htmlType="submit"
                style={{ background: '#f97316', border: 'none', fontWeight: 600 }}
              >
                {editingNote ? 'Update Note' : 'Save Note'}
              </Button>
              <Button
                onClick={() => {
                  setShowForm(false);
                  setEditingNote(null);
                  setFormData({ title: '', content: '', priority: 'medium' });
                }}
                style={{ fontWeight: 600 }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Notes Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px'
      }}>
        {notes.map((note) => (
          <div
            key={note.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              position: 'relative',
              opacity: note.is_completed ? 0.7 : 1
            }}
          >
            {/* Priority Badge */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '12px',
                height: '12px',
                borderRadius: '50%'
              }}
              className={priorityBadgeColors[note.priority]}
            />

            {/* Title */}
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#1f2937',
              textDecoration: note.is_completed ? 'line-through' : 'none'
            }}>
              {note.title}
            </h3>

            {/* Priority Label */}
            <span
              style={{
                display: 'inline-block',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                marginBottom: '12px',
                textTransform: 'uppercase'
              }}
              className={priorityColors[note.priority]}
            >
              {note.priority}
            </span>

            {/* Content */}
            <p style={{
              color: '#4b5563',
              lineHeight: '1.5',
              marginBottom: '16px',
              textDecoration: note.is_completed ? 'line-through' : 'none'
            }}>
              {note.content}
            </p>

            {/* Meta Info */}
            <div style={{
              fontSize: '12px',
              color: '#9ca3af',
              marginBottom: '16px'
            }}>
              <div>By: {note.created_by_name}</div>
              <div>Created: {new Date(note.created_at).toLocaleDateString()}</div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button
                icon={<CheckOutlined />}
                onClick={() => toggleComplete(note)}
                size="small"
                style={{
                  background: note.is_completed ? '#10b981' : '#6b7280',
                  color: 'white',
                  border: 'none',
                  fontWeight: 500
                }}
              >
                {note.is_completed ? 'Completed' : 'Mark Complete'}
              </Button>
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEdit(note)}
                size="small"
                style={{ background: '#f97316', color: 'white', border: 'none', fontWeight: 500 }}
              >
                Edit
              </Button>
              <Button
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(note.id)}
                size="small"
                danger
                style={{ fontWeight: 500 }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {notes.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>No notes yet</h3>
          <p>Create your first admin note to get started!</p>
        </div>
      )}
    </div>
  );
};

export default AdminNotes;