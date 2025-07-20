// Local storage management
class StorageManager {
    constructor() {
        this.storageKey = 'classroomSeatingManager';
        this.defaultData = {
            students: [],
            constraints: [],
            layouts: {},
            history: [],
            settings: {
                language: 'no',
                defaultLayout: 'standard',
                maxHistoryItems: 20
            }
        };
    }

    // Get all data from storage
    getData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                return { ...this.defaultData, ...data };
            }
        } catch (error) {
            console.warn('Error reading from localStorage:', error);
        }
        return { ...this.defaultData };
    }

    // Save all data to storage
    saveData(data) {
        try {
            const mergedData = { ...this.getData(), ...data };
            localStorage.setItem(this.storageKey, JSON.stringify(mergedData));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    // Get specific data section
    getSection(section) {
        const data = this.getData();
        return data[section] || this.defaultData[section];
    }

    // Save specific data section
    saveSection(section, sectionData) {
        const data = this.getData();
        data[section] = sectionData;
        return this.saveData(data);
    }

    // Student management
    getStudents() {
        return this.getSection('students');
    }

    saveStudents(students) {
        return this.saveSection('students', students);
    }

    addStudent(student) {
        const students = this.getStudents();
        student.id = this.generateId();
        student.createdAt = new Date().toISOString();
        students.push(student);
        return this.saveStudents(students);
    }

    updateStudent(studentId, updates) {
        const students = this.getStudents();
        const index = students.findIndex(s => s.id === studentId);
        if (index !== -1) {
            students[index] = { ...students[index], ...updates, updatedAt: new Date().toISOString() };
            return this.saveStudents(students);
        }
        return false;
    }

    removeStudent(studentId) {
        const students = this.getStudents();
        const filtered = students.filter(s => s.id !== studentId);
        return this.saveStudents(filtered);
    }

    // Constraints management
    getConstraints() {
        return this.getSection('constraints');
    }

    saveConstraints(constraints) {
        return this.saveSection('constraints', constraints);
    }

    addConstraint(constraint) {
        const constraints = this.getConstraints();
        constraint.id = this.generateId();
        constraint.createdAt = new Date().toISOString();
        constraints.push(constraint);
        return this.saveConstraints(constraints);
    }

    removeConstraint(constraintId) {
        const constraints = this.getConstraints();
        const filtered = constraints.filter(c => c.id !== constraintId);
        return this.saveConstraints(filtered);
    }

    // History management
    getHistory() {
        return this.getSection('history');
    }

    addHistoryEntry(entry) {
        const history = this.getHistory();
        const settings = this.getSection('settings');
        
        entry.id = this.generateId();
        entry.timestamp = new Date().toISOString();
        
        history.unshift(entry); // Add to beginning
        
        // Limit history size
        if (history.length > settings.maxHistoryItems) {
            history.splice(settings.maxHistoryItems);
        }
        
        return this.saveSection('history', history);
    }

    clearHistory() {
        return this.saveSection('history', []);
    }

    // Layouts management
    getLayouts() {
        return this.getSection('layouts');
    }

    saveLayout(layoutName, layoutData) {
        const layouts = this.getLayouts();
        layouts[layoutName] = {
            ...layoutData,
            savedAt: new Date().toISOString()
        };
        return this.saveSection('layouts', layouts);
    }

    // Settings management
    getSettings() {
        return this.getSection('settings');
    }

    updateSettings(updates) {
        const settings = this.getSettings();
        const newSettings = { ...settings, ...updates };
        return this.saveSection('settings', newSettings);
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Export data
    exportData() {
        return JSON.stringify(this.getData(), null, 2);
    }

    // Import data
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Validate data structure
            if (typeof data !== 'object' || data === null) {
                throw new Error('Invalid data format');
            }

            // Merge with existing data
            const currentData = this.getData();
            const mergedData = { ...currentData, ...data };
            
            return this.saveData(mergedData);
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Clear all data
    clearAllData() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    // Backup and restore
    createBackup() {
        const data = this.getData();
        const backup = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: data
        };
        return JSON.stringify(backup, null, 2);
    }

    restoreBackup(backupJson) {
        try {
            const backup = JSON.parse(backupJson);
            
            if (!backup.data || !backup.version) {
                throw new Error('Invalid backup format');
            }

            return this.saveData(backup.data);
        } catch (error) {
            console.error('Error restoring backup:', error);
            return false;
        }
    }
}

// Global instance
const storageManager = new StorageManager();
