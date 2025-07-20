// Layout and constraint management
class LayoutManager {
    constructor() {
        this.constraints = [];
        this.editingConstraint = null;
        
        this.init();
    }

    init() {
        this.loadConstraints();
        this.setupEventListeners();
        this.updateConstraintsList();
    }

    setupEventListeners() {
        // Add constraint button
        const addConstraintBtn = document.getElementById('add-constraint-btn');
        if (addConstraintBtn) {
            addConstraintBtn.addEventListener('click', () => {
                this.openConstraintModal();
            });
        }

        // Constraint modal events
        this.setupConstraintModal();
    }

    setupConstraintModal() {
        const modal = document.getElementById('constraint-modal');
        const closeBtn = modal?.querySelector('.close');
        const form = document.getElementById('constraint-form');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeConstraintModal();
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeConstraintModal();
                }
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveConstraint();
            });

            // Cancel button
            const cancelBtn = form.querySelector('button[type="button"]');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.closeConstraintModal();
                });
            }
        }

        // Update student selects when modal opens
        const typeSelect = document.getElementById('constraint-type');
        if (typeSelect) {
            typeSelect.addEventListener('change', () => {
                this.updateConstraintForm();
            });
        }
    }

    openConstraintModal(constraint = null) {
        this.editingConstraint = constraint;
        
        // Populate student selects
        this.populateStudentSelects();
        
        if (constraint) {
            // Edit mode
            document.getElementById('constraint-type').value = constraint.type;
            document.getElementById('constraint-student1').value = constraint.student1;
            document.getElementById('constraint-student2').value = constraint.student2;
        } else {
            // Add mode
            document.getElementById('constraint-form').reset();
        }
        
        this.updateConstraintForm();
        
        const modal = document.getElementById('constraint-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    closeConstraintModal() {
        const modal = document.getElementById('constraint-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.editingConstraint = null;
    }

    populateStudentSelects() {
        const students = studentManager.getStudents();
        const student1Select = document.getElementById('constraint-student1');
        const student2Select = document.getElementById('constraint-student2');

        if (student1Select) {
            student1Select.innerHTML = '<option value="">Select student...</option>';
            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student.name;
                option.textContent = student.name;
                student1Select.appendChild(option);
            });
        }

        if (student2Select) {
            student2Select.innerHTML = '<option value="">Select student...</option>';
            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student.name;
                option.textContent = student.name;
                student2Select.appendChild(option);
            });
        }
    }

    updateConstraintForm() {
        const type = document.getElementById('constraint-type')?.value;
        const student2Container = document.getElementById('constraint-student2')?.parentElement;

        if (student2Container) {
            if (type === 'preferred-area') {
                student2Container.style.display = 'none';
            } else {
                student2Container.style.display = 'block';
            }
        }
    }

    saveConstraint() {
        const form = document.getElementById('constraint-form');
        const formData = new FormData(form);
        
        const type = formData.get('constraint-type');
        const student1 = formData.get('constraint-student1');
        const student2 = formData.get('constraint-student2');

        // Validation
        if (!type || !student1) {
            alert('Please fill in all required fields');
            return;
        }

        if (type !== 'preferred-area' && !student2) {
            alert('Please select second student');
            return;
        }

        if (student1 === student2) {
            alert('Please select different students');
            return;
        }

        // Check for duplicate constraints
        const isDuplicate = this.constraints.some(c => 
            c.type === type && 
            ((c.student1 === student1 && c.student2 === student2) ||
             (c.student1 === student2 && c.student2 === student1))
        );

        if (isDuplicate && !this.editingConstraint) {
            alert('This constraint already exists');
            return;
        }

        const constraint = {
            type: type,
            student1: student1,
            student2: student2 || null
        };

        if (this.editingConstraint) {
            // Update existing constraint
            const index = this.constraints.findIndex(c => c.id === this.editingConstraint.id);
            if (index !== -1) {
                this.constraints[index] = { ...constraint, id: this.editingConstraint.id };
            }
        } else {
            // Add new constraint
            if (storageManager.addConstraint(constraint)) {
                this.loadConstraints();
            }
        }

        this.updateConstraintsList();
        this.closeConstraintModal();
        
        // Update seating manager constraints
        seatingManager.loadConstraints();
    }

    removeConstraint(constraintId) {
        if (confirm('Remove this constraint?')) {
            if (storageManager.removeConstraint(constraintId)) {
                this.loadConstraints();
                this.updateConstraintsList();
                seatingManager.loadConstraints();
            }
        }
    }

    loadConstraints() {
        this.constraints = storageManager.getConstraints();
    }

    updateConstraintsList() {
        const list = document.getElementById('constraints-list');
        if (!list) return;

        list.innerHTML = '';

        if (this.constraints.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = languageManager.translate('no_constraints');
            list.appendChild(emptyState);
            return;
        }

        this.constraints.forEach(constraint => {
            const item = document.createElement('div');
            item.className = 'constraint-item';
            
            const text = this.getConstraintText(constraint);
            
            item.innerHTML = `
                <span class="constraint-text">${this.escapeHtml(text)}</span>
                <button class="constraint-remove" onclick="layoutManager.removeConstraint('${constraint.id}')" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            list.appendChild(item);
        });
    }

    getConstraintText(constraint) {
        const type = constraint.type;
        const student1 = constraint.student1;
        const student2 = constraint.student2;

        switch (type) {
            case 'cannot-sit-together':
                return `${student1} cannot sit next to ${student2}`;
            case 'must-sit-together':
                return `${student1} must sit next to ${student2}`;
            case 'preferred-area':
                return `${student1} prefers specific area`;
            default:
                return `${student1} - ${student2}`;
        }
    }

    getConstraints() {
        return this.constraints;
    }

    validateSeatingAgainstConstraints(seating) {
        const violations = [];
        
        this.constraints.forEach(constraint => {
            const violation = this.checkConstraintViolation(constraint, seating);
            if (violation) {
                violations.push(violation);
            }
        });
        
        return violations;
    }

    checkConstraintViolation(constraint, seating) {
        // Find positions of students
        const student1Desk = Object.keys(seating).find(desk => seating[desk] === constraint.student1);
        const student2Desk = Object.keys(seating).find(desk => seating[desk] === constraint.student2);
        
        if (!student1Desk || !student2Desk) {
            return null; // Can't violate if students aren't seated
        }

        const areAdjacent = this.areDesksAdjacent(student1Desk, student2Desk);

        switch (constraint.type) {
            case 'cannot-sit-together':
                if (areAdjacent) {
                    return {
                        constraint,
                        violation: 'Students are sitting together but should not be'
                    };
                }
                break;
            case 'must-sit-together':
                if (!areAdjacent) {
                    return {
                        constraint,
                        violation: 'Students should be sitting together but are not'
                    };
                }
                break;
        }
        
        return null;
    }

    areDesksAdjacent(desk1Id, desk2Id) {
        // This is a simplified adjacency check
        // In a real implementation, you'd want to consider the actual grid layout
        
        const desk1 = document.querySelector(`[data-id="${desk1Id}"]`);
        const desk2 = document.querySelector(`[data-id="${desk2Id}"]`);
        
        if (!desk1 || !desk2) return false;
        
        const rect1 = desk1.getBoundingClientRect();
        const rect2 = desk2.getBoundingClientRect();
        
        const dx = Math.abs(rect1.left - rect2.left);
        const dy = Math.abs(rect1.top - rect2.top);
        
        // Adjacent if within approximately one desk width/height
        const deskWidth = 140; // Including gap
        const deskHeight = 80;  // Including gap
        
        return (dx <= deskWidth && dy <= deskHeight) && (dx > 0 || dy > 0);
    }

    // Layout templates
    getLayoutTemplates() {
        return {
            standard: {
                name: 'Standard Classroom',
                description: 'Traditional layout with rows facing the board',
                sections: [
                    { id: 'left-section', cols: 2, rows: 4 },
                    { id: 'middle-section', cols: 3, rows: 3 },
                    { id: 'right-section', cols: 2, rows: 4 }
                ]
            },
            'u-shape': {
                name: 'U-Shape',
                description: 'U-shaped arrangement for discussion',
                sections: [
                    { id: 'left-section', cols: 1, rows: 6 },
                    { id: 'middle-section', cols: 4, rows: 2 },
                    { id: 'right-section', cols: 1, rows: 6 }
                ]
            },
            groups: {
                name: 'Group Tables',
                description: 'Small group collaborative layout',
                sections: [
                    { id: 'group-1', cols: 2, rows: 3 },
                    { id: 'group-2', cols: 2, rows: 3 },
                    { id: 'group-3', cols: 2, rows: 3 },
                    { id: 'group-4', cols: 2, rows: 3 }
                ]
            },
            rows: {
                name: 'Theater Rows',
                description: 'Theater-style rows for presentations',
                sections: [
                    { id: 'row-1', cols: 5, rows: 1 },
                    { id: 'row-2', cols: 5, rows: 1 },
                    { id: 'row-3', cols: 5, rows: 1 },
                    { id: 'row-4', cols: 5, rows: 1 },
                    { id: 'row-5', cols: 5, rows: 1 }
                ]
            }
        };
    }

    saveCustomLayout(name, layoutData) {
        const layouts = storageManager.getLayouts();
        layouts[name] = {
            ...layoutData,
            custom: true,
            savedAt: new Date().toISOString()
        };
        return storageManager.saveSection('layouts', layouts);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global instance
const layoutManager = new LayoutManager();
