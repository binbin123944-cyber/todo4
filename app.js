document.addEventListener('DOMContentLoaded', () => {
    // Select DOM elements
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const emptyState = document.getElementById('empty-state');
    const dateDisplay = document.getElementById('date-display'); // Header date

    // Calendar Elements
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthEl = document.getElementById('current-month');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const todayBtn = document.getElementById('today-btn');
    const selectedDateDisplay = document.getElementById('selected-date-display');

    // State
    let todos = JSON.parse(localStorage.getItem('my_todos')) || [];

    // Date State
    let today = new Date();
    let currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    let selectedDate = new Date(); // Defaults to today

    // Helper: Format Date as YYYY-MM-DD
    const formatDateKey = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    // Migration: Add date to legacy todos (default to today)
    todos = todos.map(todo => {
        if (!todo.date) {
            return { ...todo, date: formatDateKey(new Date()) };
        }
        return todo;
    });

    // Initial Render
    updateHeaderDate();
    renderCalendar();
    renderTodos();

    // Event Listeners
    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTodo();
    });

    prevMonthBtn.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderCalendar();
    });

    todayBtn.addEventListener('click', () => {
        currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        selectedDate = new Date();
        renderCalendar();
        renderTodos();
    });

    // Functions
    function updateHeaderDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = today.toLocaleDateString('en-US', options);
    }

    function renderCalendar() {
        currentMonthEl.textContent = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        calendarGrid.innerHTML = '';

        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        // First day of the month
        const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
        // Days in this month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        // Days in prevent month (for padding)
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Previous Month Padding
        for (let i = firstDay; i > 0; i--) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.textContent = daysInPrevMonth - i + 1;
            calendarGrid.appendChild(dayDiv);
        }

        // Current Month Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = i;

            const dateStr = formatDateKey(new Date(year, month, i));

            // Highlight Today
            if (dateStr === formatDateKey(today)) {
                dayDiv.classList.add('today');
            }

            // Highlight Selected
            if (dateStr === formatDateKey(selectedDate)) {
                dayDiv.classList.add('selected');
            }

            // Check if has tasks
            const hasTask = todos.some(t => t.date === dateStr && !t.completed);
            if (hasTask) {
                const dot = document.createElement('div');
                dot.className = 'has-task-dot';
                dayDiv.appendChild(dot);
            }

            dayDiv.addEventListener('click', () => {
                selectedDate = new Date(year, month, i);
                renderCalendar(); // Re-render to update selected selection
                renderTodos();
            });

            calendarGrid.appendChild(dayDiv);
        }
    }

    function addTodo() {
        const text = todoInput.value.trim();
        if (text === '') return;

        const newTodo = {
            id: Date.now(),
            text: text,
            completed: false,
            date: formatDateKey(selectedDate) // Add to selected date
        };

        todos.push(newTodo);
        saveAndRender();
        todoInput.value = '';
        todoInput.focus();
    }

    function toggleTodo(id) {
        todos = todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, completed: !todo.completed };
            }
            return todo;
        });
        saveAndRender();
    }

    function deleteTodo(id) {
        const itemToRemove = document.querySelector(`[data-id="${id}"]`);
        if (itemToRemove) {
            itemToRemove.style.transform = 'translateX(100%)';
            itemToRemove.style.opacity = '0';

            setTimeout(() => {
                todos = todos.filter(todo => todo.id !== id);
                saveAndRender();
            }, 300);
        } else {
            todos = todos.filter(todo => todo.id !== id);
            saveAndRender();
        }
    }

    function saveAndRender() {
        saveTodos();
        renderTodos();
        renderCalendar(); // Update dots on calendar
    }

    function saveTodos() {
        localStorage.setItem('my_todos', JSON.stringify(todos));
    }

    function renderTodos() {
        const targetDate = formatDateKey(selectedDate);

        // Update Section Header for Selected Date
        const isToday = targetDate === formatDateKey(today);
        selectedDateDisplay.textContent = isToday ? "Today's Tasks" : selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        // Filter todos for selected date
        const filteredTodos = todos.filter(t => t.date === targetDate);

        todoList.innerHTML = '';

        if (filteredTodos.length === 0) {
            emptyState.classList.remove('hidden');
            emptyState.querySelector('p').textContent = isToday ? "All caught up!" : "No tasks planned";
        } else {
            emptyState.classList.add('hidden');

            const sortedTodos = [...filteredTodos].sort((a, b) => a.completed - b.completed);

            sortedTodos.forEach(todo => {
                const li = document.createElement('li');
                li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
                li.setAttribute('data-id', todo.id);

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'todo-checkbox';
                checkbox.checked = todo.completed;
                checkbox.addEventListener('change', () => toggleTodo(todo.id));

                const span = document.createElement('span');
                span.className = 'todo-text';
                span.textContent = todo.text;
                span.addEventListener('click', () => toggleTodo(todo.id));

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteTodo(todo.id);
                });

                li.appendChild(checkbox);
                li.appendChild(span);
                li.appendChild(deleteBtn);
                todoList.appendChild(li);
            });
        }
    }
});
