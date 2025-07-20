// History and undo/redo functionality
class HistoryManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = 50;
        
        this.init();
    }

    init() {
        this.loadHistory();
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // Undo button
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.undo();
            });
        }

        // Redo button
        const redoBtn = document.getElementById('redo-btn');
        if (redoBtn) {
            redoBtn.addEventListener('click', () => {
                this.redo();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    this.undo();
                } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
                    e.preventDefault();
                    this.redo();
                }
            }
        });

        // Language change event
        document.addEventListener('languageChanged', () => {
            this.updateHistoryList();
        });
    }

    addEntry(entry) {
        // Remove any entries after current index (when adding new entry after undo)
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Add timestamp and ID
        entry.timestamp = new Date().toISOString();
        entry.id = this.generateId();

        // Add entry
        this.history.push(entry);
        this.currentIndex = this.history.length - 1;

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }

        this.saveHistory();
        this.updateUI();
        
        // Also save to storage manager for persistence
        storageManager.addHistoryEntry(entry);
    }

    undo() {
        if (!this.canUndo()) return;

        const currentEntry = this.history[this.currentIndex];
        this.applyUndo(currentEntry);
        
        this.currentIndex--;
        this.updateUI();
    }

    redo() {
        if (!this.canRedo()) return;

        this.currentIndex++;
        const entryToRedo = this.history[this.currentIndex];
        this.applyRedo(entryToRedo);
        
        this.updateUI();
    }

    applyUndo(entry) {
        switch (entry.type) {
            case 'student_added':
                if (entry.data.student) {
                    studentManager.removeStudent(entry.data.student.id);
                }
                break;
                
            case 'student_removed':
                if (entry.data.student) {
                    storageManager.addStudent(entry.data.student);
                    studentManager.loadStudents();
                    studentManager.updateUI();
                }
                break;
                
            case 'student_moved':
                if (entry.data.previousSeating) {
                    seatingManager.setSeating(entry.data.previousSeating);
                } else {
                    // Remove student from current position
                    seatingManager.removeStudentFromSeats(entry.data.studentName);
                }
                break;
                
            case 'seating_generated':
                if (entry.data.previousSeating) {
                    seatingManager.setSeating(entry.data.previousSeating);
                }
                break;
                
            case 'seating_cleared':
                if (entry.data.previousSeating) {
                    seatingManager.setSeating(entry.data.previousSeating);
                }
                break;
                
            default:
                console.warn('Unknown entry type for undo:', entry.type);
        }
    }

    applyRedo(entry) {
        switch (entry.type) {
            case 'student_added':
                if (entry.data.student) {
                    storageManager.addStudent(entry.data.student);
                    studentManager.loadStudents();
                    studentManager.updateUI();
                }
                break;
                
            case 'student_removed':
                if (entry.data.student) {
                    studentManager.removeStudent(entry.data.student.id);
                }
                break;
                
            case 'student_moved':
                if (entry.data.deskId && entry.data.studentName) {
                    seatingManager.assignStudentToDesk(entry.data.studentName, entry.data.deskId);
                }
                break;
                
            case 'seating_generated':
                if (entry.data.newSeating) {
                    seatingManager.setSeating(entry.data.newSeating);
                }
                break;
                
            case 'seating_cleared':
                seatingManager.clearAllSeats(false);
                break;
                
            default:
                console.warn('Unknown entry type for redo:', entry.type);
        }
    }

    canUndo() {
        return this.currentIndex >= 0;
    }

    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    updateUI() {
        // Update undo/redo buttons
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');

        if (undoBtn) {
            undoBtn.disabled = !this.canUndo();
            undoBtn.title = this.canUndo() ? 
                `Undo: ${this.history[this.currentIndex]?.description}` : 
                'Nothing to undo';
        }

        if (redoBtn) {
            redoBtn.disabled = !this.canRedo();
            redoBtn.title = this.canRedo() ? 
                `Redo: ${this.history[this.currentIndex + 1]?.description}` : 
                'Nothing to redo';
        }

        this.updateHistoryList();
    }

    updateHistoryList() {
        const list = document.getElementById('history-list');
        if (!list) return;

        list.innerHTML = '';

        if (this.history.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No history available';
            list.appendChild(emptyState);
            return;
        }

        // Show most recent entries first
        const recentHistory = this.history.slice(-10).reverse();

        recentHistory.forEach((entry, index) => {
            const actualIndex = this.history.length - 1 - index;
            const item = document.createElement('div');
            item.className = `history-item ${actualIndex <= this.currentIndex ? 'active' : 'inactive'}`;
            
            const timestamp = new Date(entry.timestamp).toLocaleTimeString();
            
            item.innerHTML = `
                <div class="history-timestamp">${timestamp}</div>
                <div class="history-description">${this.escapeHtml(entry.description)}</div>
            `;
            
            item.addEventListener('click', () => {
                this.jumpToHistoryPoint(actualIndex);
            });
            
            list.appendChild(item);
        });
    }

    jumpToHistoryPoint(targetIndex) {
        if (targetIndex < -1 || targetIndex >= this.history.length) return;

        while (this.currentIndex > targetIndex) {
            this.undo();
        }

        while (this.currentIndex < targetIndex) {
            this.redo();
        }
    }

    clearHistory() {
        this.history = [];
        this.currentIndex = -1;
        this.saveHistory();
        this.updateUI();
        storageManager.clearHistory();
    }

    loadHistory() {
        this.history = storageManager.getHistory() || [];
        this.currentIndex = this.history.length - 1;
    }

    saveHistory() {
        // The individual entries are already saved to storage manager
        // This is just for local state management
    }

    getHistorySummary() {
        return {
            totalEntries: this.history.length,
            currentIndex: this.currentIndex,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            recentEntries: this.history.slice(-5)
        };
    }

    exportHistory() {
        return {
            history: this.history,
            currentIndex: this.currentIndex,
            exportedAt: new Date().toISOString()
        };
    }

    importHistory(data) {
        if (!data.history || !Array.isArray(data.history)) {
            throw new Error('Invalid history data format');
        }

        this.history = data.history;
        this.currentIndex = data.currentIndex || this.history.length - 1;
        
        this.saveHistory();
        this.updateUI();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Advanced history features
    createSnapshot() {
        const snapshot = {
            students: studentManager.getStudents(),
            seating: seatingManager.getCurrentSeating(),
            constraints: layoutManager.getConstraints(),
            timestamp: new Date().toISOString()
        };

        this.addEntry({
            type: 'snapshot',
            description: 'Created snapshot',
            data: { snapshot }
        });

        return snapshot;
    }

    restoreSnapshot(snapshot) {
        if (!snapshot) return false;

        try {
            // Save current state for undo
            const currentSnapshot = this.createSnapshot();

            // Restore students
            if (snapshot.students) {
                storageManager.saveStudents(snapshot.students);
                studentManager.loadStudents();
                studentManager.updateUI();
            }

            // Restore seating
            if (snapshot.seating) {
                seatingManager.setSeating(snapshot.seating);
            }

            // Restore constraints
            if (snapshot.constraints) {
                storageManager.saveConstraints(snapshot.constraints);
                layoutManager.loadConstraints();
                layoutManager.updateConstraintsList();
            }

            this.addEntry({
                type: 'snapshot_restored',
                description: 'Restored snapshot',
                data: { 
                    previousSnapshot: currentSnapshot,
                    restoredSnapshot: snapshot 
                }
            });

            return true;
        } catch (error) {
            console.error('Error restoring snapshot:', error);
            return false;
        }
    }

    // Batch operations
    startBatch(description) {
        this.batchOperations = {
            description: description,
            startTime: Date.now(),
            operations: []
        };
    }

    addToBatch(operation) {
        if (this.batchOperations) {
            this.batchOperations.operations.push(operation);
        }
    }

    endBatch() {
        if (this.batchOperations && this.batchOperations.operations.length > 0) {
            this.addEntry({
                type: 'batch_operation',
                description: this.batchOperations.description,
                data: {
                    operations: this.batchOperations.operations,
                    duration: Date.now() - this.batchOperations.startTime
                }
            });
        }
        this.batchOperations = null;
    }
}

// Global instance
const historyManager = new HistoryManager();
