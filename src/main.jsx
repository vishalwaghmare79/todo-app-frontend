import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = 'http://localhost:4000/api';

function App() {
  const [mode, setMode] = useState('login');
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem('todo-auth');
    return saved ? JSON.parse(saved) : null;
  });
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [title, setTitle] = useState('');
  const [todos, setTodos] = useState([]);
  const [message, setMessage] = useState('');

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {})
    }),
    [auth]
  );

  useEffect(() => {
    if (auth?.token) {
      loadTodos();
    }
  }, [auth]);

  async function api(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...headers, ...options.headers }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  }

  async function submitAuth(event) {
    event.preventDefault();
    setMessage('');

    try {
      const data = await api(`/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        body: JSON.stringify(form)
      });

      setAuth(data);
      localStorage.setItem('todo-auth', JSON.stringify(data));
      setForm({ name: '', email: '', password: '' });
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function loadTodos() {
    try {
      setTodos(await api('/todos'));
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function addTodo(event) {
    event.preventDefault();
    setMessage('');

    if (!title.trim()) return;

    try {
      const todo = await api('/todos', {
        method: 'POST',
        body: JSON.stringify({ title })
      });

      setTodos([todo, ...todos]);
      setTitle('');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function toggleTodo(todo) {
    const updated = await api(`/todos/${todo._id}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: !todo.completed })
    });

    setTodos(todos.map((item) => (item._id === updated._id ? updated : item)));
  }

  async function deleteTodo(id) {
    await api(`/todos/${id}`, { method: 'DELETE' });
    setTodos(todos.filter((todo) => todo._id !== id));
  }

  function logout() {
    localStorage.removeItem('todo-auth');
    setAuth(null);
    setTodos([]);
  }

  if (!auth) {
    return (
      <main className="page">
        <section className="panel auth-panel">
          <h1>Todo List</h1>
          <div className="tabs">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
              Login
            </button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
              Register
            </button>
          </div>

          <form onSubmit={submitAuth}>
            {mode === 'register' && (
              <input
                placeholder="Name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            )}
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
            <input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
            <button type="submit">{mode === 'login' ? 'Login' : 'Create Account'}</button>
          </form>
          {message && <p className="message">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="panel todo-panel">
        <header>
          <div>
            <p>Welcome, {auth.user.name}</p>
            <h1>Your Todos</h1>
          </div>
          <button className="secondary" onClick={logout}>
            Logout
          </button>
        </header>

        <form className="todo-form" onSubmit={addTodo}>
          <input
            placeholder="Add a todo"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <button type="submit">Add</button>
        </form>

        {message && <p className="message">{message}</p>}

        <ul className="todos">
          {todos.map((todo) => (
            <li key={todo._id}>
              <label>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo)}
                />
                <span className={todo.completed ? 'done' : ''}>{todo.title}</span>
              </label>
              <button className="danger" onClick={() => deleteTodo(todo._id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
