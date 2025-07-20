// Preferences management for advanced seating control
class PreferencesManager {
    constructor() {
        this.currentStudent = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Preferences button
        const preferencesBtn = document.getElementById('preferences-btn');
        if (preferencesBtn) {
            preferencesBtn.addEventListener('click', () => {
                this.openPreferencesModal();
            });
        }

        // Close modal
        const closeBtn = document.getElementById('close-preferences');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closePreferencesModal();
            });
        }

        // Student selection
        const studentSelect = document.getElementById('student-select');
        if (studentSelect) {
            studentSelect.addEventListener('change', (e) => {
                this.selectStudent(e.target.value);
            });
        }

        // Save preferences
        const saveBtn = document.getElementById('save-preferences');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.savePreferences();
            });
        }

        // Close modal when clicking outside
        const modal = document.getElementById('preferences-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closePreferencesModal();
                }
            });
        }
    }

    openPreferencesModal() {
        const modal = document.getElementById('preferences-modal');
        if (modal) {
            modal.style.display = 'block';
            this.populateStudentSelect();
        }
    }

    closePreferencesModal() {
        const modal = document.getElementById('preferences-modal');
        if (modal) {
            modal.style.display = 'none';
            this.currentStudent = null;
            this.hideStudentPreferences();
        }
    }

    populateStudentSelect() {
        const select = document.getElementById('student-select');
        const students = studentManager.students;
        
        if (!select) return;

        // Clear existing options except first
        select.innerHTML = '<option value="">Velg elev...</option>';

        // Add students
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = student.name;
            select.appendChild(option);
        });
    }

    selectStudent(studentId) {
        if (!studentId) {
            this.hideStudentPreferences();
            return;
        }

        this.currentStudent = studentManager.students.find(s => s.id === studentId);
        if (this.currentStudent) {
            this.showStudentPreferences();
            this.loadStudentPreferences();
        }
    }

    showStudentPreferences() {
        const container = document.getElementById('student-preferences');
        const nameHeader = document.getElementById('selected-student-name');
        
        if (container && nameHeader && this.currentStudent) {
            nameHeader.textContent = this.currentStudent.name;
            container.style.display = 'block';
        }
    }

    hideStudentPreferences() {
        const container = document.getElementById('student-preferences');
        if (container) {
            container.style.display = 'none';
        }
    }

    loadStudentPreferences() {
        if (!this.currentStudent) return;

        const preferences = this.currentStudent.preferences || {};
        
        // Load section preference
        const sectionSelect = document.getElementById('section-preference');
        if (sectionSelect) {
            sectionSelect.value = preferences.sectionPreference || '';
        }

        // Load section weight
        const weightSelect = document.getElementById('section-weight');
        if (weightSelect) {
            weightSelect.value = preferences.sectionWeight || '1.0';
        }

        // Load partner preferences
        this.loadPartnerCheckboxes();
    }

    loadPartnerCheckboxes() {
        const preferences = this.currentStudent.preferences || {};
        const allStudents = studentManager.students.filter(s => s.id !== this.currentStudent.id);
        
        // Preferred partners
        const preferredContainer = document.getElementById('preferred-partners');
        if (preferredContainer) {
            preferredContainer.innerHTML = '';
            allStudents.forEach(student => {
                const checkbox = this.createPartnerCheckbox(
                    student, 
                    'preferred',
                    preferences.preferredPartners?.includes(student.name) || false
                );
                preferredContainer.appendChild(checkbox);
            });
        }

        // Avoid partners
        const avoidContainer = document.getElementById('avoid-partners');
        if (avoidContainer) {
            avoidContainer.innerHTML = '';
            allStudents.forEach(student => {
                const checkbox = this.createPartnerCheckbox(
                    student, 
                    'avoid',
                    preferences.avoidPartners?.includes(student.name) || false
                );
                avoidContainer.appendChild(checkbox);
            });
        }
    }

    createPartnerCheckbox(student, type, checked) {
        const label = document.createElement('label');
        label.style.display = 'block';
        label.style.marginBottom = '5px';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = student.name;
        checkbox.checked = checked;
        checkbox.setAttribute('data-type', type);
        checkbox.style.marginRight = '8px';

        const text = document.createTextNode(student.name);

        label.appendChild(checkbox);
        label.appendChild(text);

        return label;
    }

    savePreferences() {
        if (!this.currentStudent) return;

        const preferences = {
            preferredPartners: [],
            avoidPartners: [],
            sectionPreference: '',
            sectionWeight: 1.0
        };

        // Get section preferences
        const sectionSelect = document.getElementById('section-preference');
        const weightSelect = document.getElementById('section-weight');
        
        if (sectionSelect) preferences.sectionPreference = sectionSelect.value;
        if (weightSelect) preferences.sectionWeight = parseFloat(weightSelect.value);

        // Get partner preferences
        const preferredCheckboxes = document.querySelectorAll('#preferred-partners input[type="checkbox"]:checked');
        const avoidCheckboxes = document.querySelectorAll('#avoid-partners input[type="checkbox"]:checked');

        preferredCheckboxes.forEach(cb => preferences.preferredPartners.push(cb.value));
        avoidCheckboxes.forEach(cb => preferences.avoidPartners.push(cb.value));

        // Save to student
        studentManager.setStudentPreferences(this.currentStudent.id, preferences);

        alert(`Preferanser lagret for ${this.currentStudent.name}`);
        this.closePreferencesModal();
    }
}

// Initialize preferences manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.preferencesManager = new PreferencesManager();
});