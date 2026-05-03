
import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [todos, setTodos] = useState([])

  const [filterStage, setFilterStage] = useState('all')
  const [filterDeadline, setFilterDeadline] = useState('anydeadline')
  const [filterPriority, setFilterPriority] = useState('anypriority')

  const dragItem = useRef(null)
  const [draggingId, setDraggingId] = useState(null)

  const handleDragStart = (id) => {
    dragItem.current = id
    setDraggingId(id)
  }

  const handleDrop = (id) => {
    const fromIndex = todos.findIndex(t => t.id === dragItem.current)
    const toIndex = todos.findIndex(t => t.id === id)
    const newTodos = [...todos]
    const dragged = newTodos.splice(fromIndex, 1)[0]
    newTodos.splice(toIndex, 0, dragged)
    setTodos(newTodos)
    dragItem.current = null
    setDraggingId(null)
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
  const getMaxColumns = () => Math.floor(window.innerWidth / 400)

  const [columns, setColumns] = useState(getMaxColumns())

  useEffect(() => {
    const handleResize = () => {
      const max = getMaxColumns()
      if (columns > max) setColumns(max)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [columns])
  
  const addTodo = (text) => {
    setTodos([...todos, new Todo(text)])
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(todo=>todo.id === id ? {...todo, completed: !todo.completed} : todo))
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const toggleEditing = (id) => {
    setTodos(todos.map(todo => todo.id === id ? { ...todo, isEditing: !todo.isEditing } : todo))
  }

  const saveTodo = (id, newText, newPriority) => {
    setTodos(todos.map(todo => todo.id === id ? { ...todo, text: newText, priority: newPriority, isEditing: false} : todo))
  }

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
          {todos
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
            .map(todo => (
              <li key={todo.id} className={draggingId === todo.id ? 'dragging' : ''}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(todo.id)}>
                <div className="CardHeader"
                  draggable
                  onDragStart={() => handleDragStart(todo.id)}
                  style={{ cursor: 'grab' }}>
                  <input type="checkbox" id={todo.id} checked={todo.completed} onChange={() => toggleTodo(todo.id)} />
                  <label className="todo-checkbox" htmlFor={todo.id}></label>

                  {todo.isEditing
                    ?
                    <div className="edit-header">
                      <input
                        className="todo-edit-input"
                        defaultValue={todo.text}
                        autoFocus
                        onChange={(e) => setTodos(todos.map(t => t.id === todo.id ? { ...t, text: e.target.value } : t))}
                      />
                      {todo.icon}
                    </div>
                    : 
                    <h3 className="todo-text" style={{
                      color: todo.deadline && todo.deadline !== ''
                        ? (new Date(todo.deadline) - new Date()) / (1000 * 60 * 60 * 24) > 7
                          ? 'var(--text-color)'
                          : 'var(--important-color)'
                        : 'var(--text-color)'
                    }}>{todo.text}{todo.icon}</h3>
                  }

                  <button onClick={() => toggleEditing(todo.id)} className='EditBtn'>✎</button>
                  <button onClick={() => deleteTodo(todo.id)} className='CloseBtn'>✕</button>
                </div>

                {todo.isEditing ? (
                  
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
                        onChange={(e) => {
                          console.log('deadline value:', e.target.value)
                          console.log('deadline type:', typeof e.target.value)
                          setTodos(todos.map(t => t.id === todo.id ? { ...t, deadline: e.target.value || null } : t))
                        }}
                      />  
                    </div>
                    <div className="comment-container">
                      <textarea  value={todo.comment} onChange={(e) => setTodos(todos.map(t => t.id === todo.id ? { ...t, comment: e.target.value } : t))}></textarea>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="card-inner">
                        <p className='priority-text' style={{ color: todo.priority === 'high' ? 'var(--important-color)' : 'var(--text-color)' }}>
                          Priority: {todo.priority}
                        </p>
                        <p className='date-text'>Was created: {new Date(todo.createdAt).toLocaleString()}</p>
                        {todo.deadline && (
                          <p className='deadline-text' style={{ color: 'var(--important-color)' }}>Deadline: {todo.deadline ? new Date(todo.deadline).toLocaleDateString() : 'No deadline'}</p>
                        )}
                        <div className="comment-container">
                          <textarea readOnly value={todo.comment} onChange={(e) => setTodos(todos.map(t => t.id === todo.id ? { ...t, comment: e.target.value } : t))}></textarea>
                        </div>
                    </div>
                  </>
                )}
              </li>
            ))
          }
        </ul>
      </main>
      <footer>

      </footer>
    </>
  )
}

function TodoInput({onAdd}){
  const [text, setText] = useState('')
  
  const handleSubmit = (e) => {
    e.preventDefault()

    if(!text.trim()) return
    
    onAdd(text)
    setText('')
    
  }

  return (<form onSubmit={handleSubmit}>
    <input 
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="What needs to be done?"
    />
    <button type="submit">Add</button>
  </form>)
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
  }
}

export default App
