// Student management functionality
class StudentManager {
    constructor() {
        this.students = [];
        this.filteredStudents = [];
        this.init();
    }

    init() {
        this.loadStudents();
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // Add student on Enter key
        const newStudentInput = document.getElementById('new-student');
        if (newStudentInput) {
            newStudentInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addStudent();
                }
            });
        }
    }

    loadStudents() {
        this.students = storageManager.getStudents();
        this.filteredStudents = [...this.students];
    }

    addStudent() {
        const input = document.getElementById('new-student');
        const name = input.value.trim();
        
        if (!name) return;

        // Check for duplicates
        if (this.students.some(s => s.name.toLowerCase() === name.toLowerCase())) {
            alert('Eleven finnes allerede');
            return;
        }

        const student = {
            name: name,
            attendance: 'present',
            notes: '',
            constraints: [],
            preferences: {}
        };

        if (storageManager.addStudent(student)) {
            input.value = '';
            this.loadStudents();
            this.updateUI();
        }
    }

    removeStudent(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        if (confirm(`Fjern ${student.name}?`)) {
            if (storageManager.removeStudent(studentId)) {
                this.loadStudents();
                this.updateUI();
                
                // Update seating chart
                seatingManager.removeStudentFromSeats(student.name);
            }
        }
    }

    updateUI() {
        this.updateStudentList();
    }

    updateStudentList() {
        const list = document.getElementById('student-list');
        if (!list) return;

        list.innerHTML = '';

        this.filteredStudents.forEach(student => {
            const li = document.createElement('li');
            li.className = `student-item ${student.attendance}`;
            li.innerHTML = `
                <div class="student-info">
                    <div class="student-name">${this.escapeHtml(student.name)}</div>
                </div>
                <div class="student-actions">
                    <button onclick="studentManager.removeStudent('${student.id}')" title="Remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            // Make student draggable
            li.draggable = true;
            li.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', student.name);
                e.dataTransfer.effectAllowed = 'move';
            });

            list.appendChild(li);
        });
    }

    getStudents() {
        return this.students;
    }

    getPresentStudents() {
        return this.students.filter(s => s.attendance === 'present');
    }

    getStudentByName(name) {
        return this.students.find(s => s.name === name);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    clearAllStudents() {
        if (confirm('Fjern alle elever? Dette kan ikke angres.')) {
            this.students.forEach(student => {
                storageManager.removeStudent(student.id);
            });
            this.loadStudents();
            this.updateUI();
            seatingManager.clearAllSeats();
        }
    }
}

// Global instance
const studentManager = new StudentManager();