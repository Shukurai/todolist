import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('todos')
    return saved ? JSON.parse(saved) : []
  })

  const [filterStage, setFilterStage] = useState('all')
  const [filterDeadline, setFilterDeadline] = useState('anydeadline')
  const [filterPriority, setFilterPriority] = useState('anypriority')
  const [dragging, setDragging] = useState(null) // { id, x, y, offsetX, offsetY }
  const [dragOverId, setDragOverId] = useState(null)

  const getMaxColumns = () => Math.max(1, Math.floor(window.innerWidth / 400))
  const [columns, setColumns] = useState(getMaxColumns())

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  useEffect(() => {
    const handleResize = () => {
      const max = getMaxColumns()
      if (columns > max) setColumns(max)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [columns])

  // Mouse drag
  useEffect(() => {
    if (!dragging) return

    const handleMouseMove = (e) => {
      setDragging(d => ({ ...d, x: e.clientX, y: e.clientY }))
    }

    const handleMouseUp = (e) => {
      if (dragOverId && dragOverId !== dragging.id) {
        const fromIndex = todos.findIndex(t => t.id === dragging.id)
        const toIndex = todos.findIndex(t => t.id === dragOverId)
        const newTodos = [...todos]
        const dragged = newTodos.splice(fromIndex, 1)[0]
        newTodos.splice(toIndex, 0, dragged)
        setTodos(newTodos)
      }
      setDragging(null)
      setDragOverId(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, dragOverId, todos])

  const handleMouseDown = (id, e) => {

    if (e.target.closest('button') ||
      e.target.closest('input') ||
      e.target.closest('select') ||
      e.target.closest('label') || 
      e.target.closest('textarea')) return

    const card = e.currentTarget.closest('li')
    const rect = card.getBoundingClientRect()

    setDragging({
      id,
      x: e.clientX,
      y: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      width: rect.width,
    })
  }

  const ICONS = [
    { emoji: '📝', label: 'Note' },
    { emoji: '💼', label: 'Work' },
    { emoji: '🏠', label: 'Home' },
    { emoji: '🛒', label: 'Shopping' },
    { emoji: '💪', label: 'Health' },
    { emoji: '📚', label: 'Study' },
    { emoji: '💰', label: 'Finance' },
    { emoji: '🎮', label: 'Fun' },
  ]

  const addTodo = (text) => {
    setTodos([...todos, new Todo(text)])
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo))
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const toggleEditing = (id) => {
    setTodos(todos.map(todo => todo.id === id ? { ...todo, isEditing: !todo.isEditing } : todo))
  }

  const saveTodo = (id) => {
    setTodos(todos.map(todo => todo.id === id ? { ...todo, isEditing: false } : todo))
  }

  const filteredTodos = todos
    .filter(todo => {
      if (filterStage === 'completed') return todo.completed
      if (filterStage === 'uncompleted') return !todo.completed
      return true
    })
    .filter(todo => {
      if (filterDeadline === 'deadlinesoon') return todo.deadline && (new Date(todo.deadline) - new Date()) / (1000 * 60 * 60 * 24) <= 7
      if (filterDeadline === 'deadlinelater') return todo.deadline && (new Date(todo.deadline) - new Date()) / (1000 * 60 * 60 * 24) > 7
      return true
    })
    .filter(todo => {
      if (filterPriority === 'high') return todo.priority === 'high'
      if (filterPriority === 'normal') return todo.priority === 'normal'
      if (filterPriority === 'low') return todo.priority === 'low'
      return true
    })

  const draggingTodo = dragging ? todos.find(t => t.id === dragging.id) : null

  return (
    <>
      <header>
        <h1>Shuku Do</h1>
        <div className="columns-control">
          <label>Columns: {columns}</label>
          <input
            type="range"
            min={1}
            max={getMaxColumns()}
            value={columns}
            onChange={(e) => setColumns(Number(e.target.value))}
          />
        </div>
        <div className="filter">
          <p>Filter: </p>
          <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)}>
            <option value="all">Any Stage</option>
            <option value="completed">Completed</option>
            <option value="uncompleted">Uncompleted</option>
          </select>
          <select value={filterDeadline} onChange={(e) => setFilterDeadline(e.target.value)}>
            <option value="anydeadline">Any Deadline</option>
            <option value="deadlinesoon">Deadline Soon</option>
            <option value="deadlinelater">Deadline Later</option>
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="anypriority">Any Priority</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
          <button className='reset-filter-button' onClick={() => {
            setFilterStage('all')
            setFilterDeadline('anydeadline')
            setFilterPriority('anypriority')
          }}>Reset Filters</button>
        </div>
        <div className="TodoInput">
          <TodoInput onAdd={addTodo} />
        </div>
      </header>

      <main>
        <ul className="TodoList" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {filteredTodos.map(todo => (
            <li
              key={todo.id}
              className={`
                ${dragging?.id === todo.id ? 'dragging-origin' : ''}
                ${dragOverId === todo.id && dragging?.id !== todo.id ? 'drag-over' : ''}
              `}
              onMouseEnter={() => dragging && setDragOverId(todo.id)}
            >
              <TodoCard
                todo={todo}
                ICONS={ICONS}
                onMouseDown={(e) => handleMouseDown(todo.id, e)}
                onToggle={() => toggleTodo(todo.id)}
                onDelete={() => deleteTodo(todo.id)}
                onToggleEdit={() => toggleEditing(todo.id)}
                onSave={() => saveTodo(todo.id)}
                setTodos={setTodos}
                todos={todos}
              />
            </li>
          ))}
        </ul>
      </main>

      {dragging && draggingTodo && (
        <ul className="drag-ghost-wrapper">
          <li
            className="drag-ghost"
            style={{
              position: 'fixed',
              left: dragging.x - dragging.offsetX,
              top: dragging.y - dragging.offsetY,
              width: dragging.width,
              pointerEvents: 'none',
              zIndex: 1000,
              transform: 'rotate(2deg) scale(1.03)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
              opacity: 0.95,
            }}
          >
            <TodoCard
              todo={draggingTodo}
              ICONS={ICONS}
              ghost
              setTodos={setTodos}
              todos={todos}
            />
          </li>
        </ul>
      )}

      <footer></footer>
    </>
  )
}

function TodoCard({ todo, ICONS, onMouseDown, onToggle, onDelete, onToggleEdit, onSave, setTodos, todos, ghost }) {
  return (
    <div className="card-content">
      <div
        className="CardHeader"
        onMouseDown={ghost ? undefined : onMouseDown}
        style={{ cursor: ghost ? 'grabbing' : 'grab', userSelect: 'none' }}
      >
        <input type="checkbox" id={`cb-${todo.id}`} checked={todo.completed} onChange={onToggle} />
        <label className="todo-checkbox" htmlFor={`cb-${todo.id}`}></label>

        {todo.isEditing ? (
          <div className="edit-header">
            <input
              className="todo-edit-input"
              defaultValue={todo.text}
              autoFocus
              onChange={(e) => setTodos(todos.map(t => t.id === todo.id ? { ...t, text: e.target.value } : t))}
            />
            {todo.icon}
          </div>
        ) : (
          <h3 className="todo-text" style={{
            color: todo.deadline && todo.deadline !== ''
              ? (new Date(todo.deadline) - new Date()) / (1000 * 60 * 60 * 24) > 7
                ? 'var(--text-color)'
                : 'var(--important-color)'
              : 'var(--text-color)'
          }}>
            {todo.text}{todo.icon}
          </h3>
        )}

        {!ghost && (
          <>
            <button onClick={onToggleEdit} className='EditBtn'>✎</button>
            <button onClick={onDelete} className='CloseBtn'>✕</button>
          </>
        )}
      </div>

      {todo.isEditing && !ghost ? (
        <div className="edit-container">
          <div className="icon-picker">
            {ICONS.map(icon => (
              <button
                key={icon.emoji}
                className={`icon-btn ${todo.icon === icon.emoji ? 'selected' : ''}`}
                onClick={() => setTodos(todos.map(t => t.id === todo.id ? { ...t, icon: icon.emoji } : t))}
                title={icon.label}
              >
                {icon.emoji}
              </button>
            ))}
          </div>
          <div className="priority-edit">
            <p>Priority: </p>
            <select value={todo.priority} onChange={(e) => setTodos(todos.map(t => t.id === todo.id ? { ...t, priority: e.target.value } : t))}>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="deadline-edit">
            <p>Deadline: </p>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={todo.deadline || ''}
              onChange={(e) => setTodos(todos.map(t => t.id === todo.id ? { ...t, deadline: e.target.value || null } : t))}
            />
          </div>
          <div className="comment-container">
            <textarea value={todo.comment} onChange={(e) => setTodos(todos.map(t => t.id === todo.id ? { ...t, comment: e.target.value } : t))}></textarea>
          </div>
          <button className="SaveBtn" onClick={onSave}>✓ Save</button>
        </div>
      ) : !ghost ? (
        <div className="card-inner">
          <p className='priority-text' style={{ color: todo.priority === 'high' ? 'var(--important-color)' : 'var(--text-color)' }}>
            Priority: {todo.priority}
          </p>
          <p className='date-text'>Was created: {new Date(todo.createdAt).toLocaleString()}</p>
          {todo.deadline && (
            <p className='deadline-text' style={{ color: 'var(--important-color)' }}>
              Deadline: {new Date(todo.deadline).toLocaleDateString('ru-RU')}
            </p>
          )}
          <div className="comment-container">
            <textarea readOnly value={todo.comment}></textarea>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function TodoInput({ onAdd }) {
  const [text, setText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(text)
    setText('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs to be done?"
      />
      <button type="submit">Add</button>
    </form>
  )
}

class Todo {
  constructor(text) {
    this.id = crypto.randomUUID()
    this.text = text
    this.completed = false
    this.createdAt = Date.now()
    this.deadline = null
    this.priority = 'normal'
    this.comment = ''
    this.isEditing = false
    this.icon = '📝'
  }
}

export default App