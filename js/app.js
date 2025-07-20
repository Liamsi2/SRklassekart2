// Main application controller
class App {
    constructor() {
        this.initialized = false;
        this.managers = {};
        this.init();
    }

    async init() {
        if (this.initialized) return;

        try {
            // Initialize core managers in order
            await this.initializeManagers();
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Setup print functionality
            this.setupPrintFunctionality();
            
            // Load default data if needed
            this.loadDefaultData();
            
            this.initialized = true;
            
            console.log('Classroom Seating Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            alert('Failed to initialize application. Please refresh the page.');
        }
    }

    async initializeManagers() {
        // Initialize managers in dependency order
        this.managers.storage = storageManager;
        this.managers.student = studentManager;
        this.managers.seating = seatingManager;
        this.managers.layoutCreator = layoutCreator;
    }

    setupGlobalEventListeners() {
        // Window events
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        
        // Document events
        document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
    }

    setupPrintFunctionality() {
        // Print functionality removed - replaced with image saving
    }

    loadDefaultData() {
        const students = this.managers.student.getStudents();
        
        // Load default students if none exist
        if (students.length === 0) {
            const defaultStudents = [
                "Aksel", "Aleksander", "Amelia", "Aleksandra", "Dina", "Gåva", 
                "Hanna", "Sara", "Emily", "Henrik", "Edvard", "Ida", "Marielle", 
                "Matilde", "Ismail", "Mohammed", "Liam", "Kristian", "Damien", 
                "Ingeborg", "Mattias", "Leona", "Nuriya"
            ];
            
            defaultStudents.forEach(name => {
                const student = {
                    name: name,
                    attendance: 'present',
                    notes: '',
                    constraints: [],
                    preferences: {}
                };
                this.managers.storage.addStudent(student);
            });
            
            // Reload students after adding defaults
            this.managers.student.loadStudents();
            this.managers.student.updateUI();
        }
    }

    handleBeforeUnload(event) {
        // Save current state before leaving
        this.saveCurrentState();
    }

    handleGlobalKeydown(event) {
        // Handle keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch(event.key) {
                case 'g':
                    event.preventDefault();
                    this.managers.seating.generateSeating();
                    break;
                case 's':
                    event.preventDefault();
                    this.managers.seating.saveSeatingAsImage();
                    break;
            }
        }
    }

    // Print functionality removed - replaced with image saving

    saveCurrentState() {
        try {
            const snapshot = {
                students: this.managers.student.getStudents(),
                seating: this.managers.seating.getCurrentSeating(),
                timestamp: new Date().toISOString()
            };
            
            this.managers.storage.saveLayout('autosave', snapshot);
            return true;
        } catch (error) {
            console.error('Failed to save current state:', error);
            return false;
        }
    }

    // Print functionality removed - replaced with image saving
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});