// Layout creation and management
class LayoutCreator {
    constructor() {
        this.currentGrid = null;
        this.selectedCells = [];
        this.layouts = {};
        this.init();
    }

    init() {
        this.loadLayouts();
        this.setupEventListeners();
        this.updateLayoutSelect();
    }

    setupEventListeners() {
        // Create layout button
        const createBtn = document.getElementById('create-layout-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.openLayoutModal();
            });
        }

        // Delete layout button
        const deleteBtn = document.getElementById('delete-layout-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteCurrentLayout();
            });
        }

        // No modal close button needed



        // Save layout
        const saveBtn = document.getElementById('save-layout-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveLayout();
            });
        }

        // Cancel layout
        const cancelBtn = document.getElementById('cancel-layout-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeLayoutModal();
            });
        }

        // Layout selection
        const layoutSelect = document.getElementById('layout-select');
        if (layoutSelect) {
            layoutSelect.addEventListener('change', (e) => {
                this.switchLayout(e.target.value);
            });
        }

        // No modal events needed
    }

    openLayoutModal() {
        // No modal - work directly on the main page
        this.resetModal();
        this.setupEmptyClassroom();
        this.enableEditMode();
        this.hideAddStudentButton();
    }

    closeLayoutModal() {
        // No modal - just restore the original state
        this.resetModal();
        this.disableEditMode();
        this.restoreOriginalClassroom();
    }

    resetModal() {
        const nameInput = document.getElementById('layout-name');
        
        if (nameInput) nameInput.value = '';
        
        this.selectedCells = [];
        this.currentGrid = null;
    }

    setupEmptyClassroom() {
        const classroom = document.getElementById('classroom');
        const studentList = document.getElementById('student-list');
        if (!classroom || !studentList) return;

        // Store original content
        this.originalClassroomContent = classroom.innerHTML;
        this.originalStudentListContent = studentList.innerHTML;

        // Hide the "Legg til elev" button
        this.hideAddStudentButton();

        // Clear the classroom completely - clean slate
        classroom.innerHTML = '';
        
        // Create empty container
        const container = document.createElement('div');
        container.className = 'empty-layout-container';
        container.style.position = 'relative';
        container.style.width = '100%';
        container.style.height = '600px';
        container.style.backgroundColor = '#f9f9f9';
        container.style.border = '2px dashed #ccc';
        container.style.borderRadius = '8px';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        
        // Add instruction text
        const instruction = document.createElement('div');
        instruction.style.color = '#666';
        instruction.style.fontSize = '18px';
        instruction.style.textAlign = 'center';
        instruction.textContent = 'Klikk "Legg til pult" for å starte';
        
        container.appendChild(instruction);
        classroom.appendChild(container);

        // Replace student list with add desk button
        this.setupAddDeskPanel();
    }

    restoreOriginalClassroom() {
        const classroom = document.getElementById('classroom');
        const studentList = document.getElementById('student-list');
        
        if (classroom && this.originalClassroomContent) {
            classroom.innerHTML = this.originalClassroomContent;
            // Restore drag and drop functionality
            seatingManager.setupDragAndDrop();
            seatingManager.restoreSeating();
        }
        
        if (studentList && this.originalStudentListContent) {
            studentList.innerHTML = this.originalStudentListContent;
        }
        
        // Remove save button from bottom right
        this.removeSaveButtonBottomRight();
        
        // Show the "Legg til elev" button again
        this.showAddStudentButton();
    }

    enableEditMode() {
        this.editMode = true;
        const classroom = document.getElementById('classroom');
        if (classroom) {
            classroom.classList.add('edit-mode');
            // Add grid overlay for snapping
            this.addGridOverlay();
            // Enable dragging for existing desks
            this.enableDeskDragging();
        }
    }

    disableEditMode() {
        this.editMode = false;
        const classroom = document.getElementById('classroom');
        if (classroom) {
            classroom.classList.remove('edit-mode');
            // Remove grid overlay
            this.removeGridOverlay();
            // Disable dragging for existing desks
            this.disableDeskDragging();
        }
    }

    toggleEditMode() {
        if (this.editMode) {
            this.disableEditMode();
        } else {
            this.enableEditMode();
        }
    }

    addGridOverlay() {
        const classroom = document.getElementById('classroom');
        if (!classroom) return;

        const overlay = document.createElement('div');
        overlay.id = 'grid-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '1';
        overlay.style.backgroundImage = 'repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(0,0,0,0.1) 19px, rgba(0,0,0,0.1) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(0,0,0,0.1) 19px, rgba(0,0,0,0.1) 20px)';
        
        classroom.style.position = 'relative';
        classroom.appendChild(overlay);
    }

    removeGridOverlay() {
        const overlay = document.getElementById('grid-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    setupEditableClassroom() {
        const classroom = document.getElementById('classroom');
        if (!classroom) return;

        // Make all existing desks draggable
        const desks = classroom.querySelectorAll('.table-box');
        desks.forEach(desk => {
            // Convert static positioned desks to absolute positioning
            const rect = desk.getBoundingClientRect();
            const classroomRect = classroom.getBoundingClientRect();
            
            desk.style.position = 'absolute';
            desk.style.left = (rect.left - classroomRect.left) + 'px';
            desk.style.top = (rect.top - classroomRect.top) + 'px';
            desk.style.margin = '0';
            desk.classList.add('moveable-desk');
        });

        // Set classroom to relative positioning
        classroom.style.position = 'relative';
        
        // Clear the grid layout and make it a free-form container
        const sections = classroom.querySelectorAll('.section');
        sections.forEach(section => {
            section.style.display = 'contents';
        });
    }

    setupAddDeskPanel() {
        const studentList = document.getElementById('student-list');
        if (!studentList) return;

        // Create add desk panel
        studentList.innerHTML = '';
        
        const addDeskPanel = document.createElement('div');
        addDeskPanel.style.padding = '20px';
        addDeskPanel.style.backgroundColor = '#f8f9fa';
        addDeskPanel.style.borderRadius = '8px';
        addDeskPanel.style.border = '1px solid #dee2e6';
        addDeskPanel.style.height = '100%';
        addDeskPanel.style.display = 'flex';
        addDeskPanel.style.flexDirection = 'column';
        
        const title = document.createElement('h4');
        title.textContent = 'Lag ditt oppsett';
        title.style.marginBottom = '15px';
        title.style.color = '#495057';
        
        // No instructions needed
        
        const addDeskBtn = document.createElement('button');
        addDeskBtn.className = 'btn btn-primary';
        addDeskBtn.style.marginTop = '15px';
        addDeskBtn.style.width = '100%';
        addDeskBtn.style.fontSize = '16px';
        addDeskBtn.innerHTML = '<i class="fas fa-plus"></i> Legg til pult';
        addDeskBtn.onclick = () => this.addNewDesk();
        
        // Spacer to push save button to bottom
        const spacer = document.createElement('div');
        spacer.style.flex = '1';
        
        addDeskPanel.appendChild(title);
        addDeskPanel.appendChild(addDeskBtn);
        addDeskPanel.appendChild(spacer);
        studentList.appendChild(addDeskPanel);
        
        // Add save button in bottom right corner of the main page
        this.addSaveButtonBottomRight();
    }

    addNewDesk() {
        const classroom = document.getElementById('classroom');
        if (!classroom) return;

        // Remove instruction text if this is the first desk
        const instructionContainer = classroom.querySelector('.empty-layout-container');
        if (instructionContainer) {
            instructionContainer.remove();
            
            // Create proper container for desks
            const container = document.createElement('div');
            container.className = 'custom-layout-container';
            container.style.position = 'relative';
            container.style.width = '100%';
            container.style.height = '600px';
            container.style.backgroundColor = '#f9f9f9';
            container.style.border = '1px solid #ddd';
            container.style.borderRadius = '8px';
            classroom.appendChild(container);
        }

        const container = classroom.querySelector('.custom-layout-container') || classroom;
        const deskId = `custom-desk-${Date.now()}`;
        const desk = document.createElement('div');
        desk.className = 'table-box moveable-desk';
        desk.dataset.id = deskId;
        desk.style.position = 'absolute';
        desk.style.left = '100px';
        desk.style.top = '100px';
        desk.style.zIndex = '10';

        // Add context menu for deletion
        desk.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (confirm('Fjern denne pulten?')) {
                desk.remove();
            }
        });

        container.appendChild(desk);
        this.enableDeskDragging(desk);
    }

    addSaveButtonBottomRight() {
        // Remove existing save button if any
        this.removeSaveButtonBottomRight();
        
        // Create save button container in bottom right
        const saveContainer = document.createElement('div');
        saveContainer.id = 'save-container-bottom-right';
        saveContainer.style.position = 'fixed';
        saveContainer.style.bottom = '20px';
        saveContainer.style.right = '20px';
        saveContainer.style.zIndex = '1000';
        saveContainer.style.display = 'flex';
        saveContainer.style.flexDirection = 'column';
        saveContainer.style.gap = '10px';
        saveContainer.style.backgroundColor = '#fff';
        saveContainer.style.padding = '15px';
        saveContainer.style.border = '1px solid #dee2e6';
        saveContainer.style.borderRadius = '8px';
        saveContainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = 'layout-name-input';
        nameInput.placeholder = 'Navn på oppsett...';
        nameInput.style.width = '200px';
        nameInput.style.padding = '8px';
        nameInput.style.border = '1px solid #ccc';
        nameInput.style.borderRadius = '4px';
        nameInput.style.marginBottom = '5px';
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-success';
        saveBtn.style.width = '100%';
        saveBtn.style.fontSize = '16px';
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Lagre';
        saveBtn.onclick = () => this.saveLayoutDirectly();
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.style.width = '100%';
        cancelBtn.style.fontSize = '16px';
        cancelBtn.style.marginTop = '5px';
        cancelBtn.innerHTML = '<i class="fas fa-times"></i> Avbryt';
        cancelBtn.onclick = () => this.closeLayoutModal();
        
        saveContainer.appendChild(nameInput);
        saveContainer.appendChild(saveBtn);
        saveContainer.appendChild(cancelBtn);
        
        document.body.appendChild(saveContainer);
    }
    
    removeSaveButtonBottomRight() {
        const saveContainer = document.getElementById('save-container-bottom-right');
        if (saveContainer) {
            saveContainer.remove();
        }
    }
    
    hideAddStudentButton() {
        const addStudentBtn = document.getElementById('add-student-btn');
        if (addStudentBtn) {
            addStudentBtn.style.display = 'none';
        }
    }
    
    showAddStudentButton() {
        const addStudentBtn = document.getElementById('add-student-btn');
        if (addStudentBtn) {
            addStudentBtn.style.display = 'block';
        }
    }
    


    enableDeskDragging(specificDesk = null) {
        const desks = specificDesk ? [specificDesk] : document.querySelectorAll('.moveable-desk');
        
        desks.forEach(desk => {
            if (desk.dragEnabled) return; // Already enabled
            
            desk.dragEnabled = true;
            desk.style.cursor = 'move';
            
            let isDragging = false;
            let startX, startY, startLeft, startTop;

            const mouseDownHandler = (e) => {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                startLeft = parseInt(desk.style.left) || 0;
                startTop = parseInt(desk.style.top) || 0;
                
                desk.style.zIndex = '100';
                e.preventDefault();
            };

            const mouseMoveHandler = (e) => {
                if (!isDragging) return;

                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                const newLeft = startLeft + deltaX;
                const newTop = startTop + deltaY;

                // Snap to grid (20px grid for more precision)
                const gridSize = 20;
                const snappedLeft = Math.round(newLeft / gridSize) * gridSize;
                const snappedTop = Math.round(newTop / gridSize) * gridSize;

                desk.style.left = Math.max(0, snappedLeft) + 'px';
                desk.style.top = Math.max(0, snappedTop) + 'px';
            };

            const mouseUpHandler = () => {
                isDragging = false;
                desk.style.zIndex = '10';
            };

            // Add context menu for deletion
            desk.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (confirm('Fjern denne pulten?')) {
                    desk.remove();
                }
            });

            desk.mouseDownHandler = mouseDownHandler;
            desk.mouseMoveHandler = mouseMoveHandler;
            desk.mouseUpHandler = mouseUpHandler;

            desk.addEventListener('mousedown', mouseDownHandler);
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        });
    }

    disableDeskDragging() {
        const desks = document.querySelectorAll('.moveable-desk');
        desks.forEach(desk => {
            if (!desk.dragEnabled) return;
            
            desk.dragEnabled = false;
            desk.style.cursor = 'default';
            
            if (desk.mouseDownHandler) {
                desk.removeEventListener('mousedown', desk.mouseDownHandler);
                document.removeEventListener('mousemove', desk.mouseMoveHandler);
                document.removeEventListener('mouseup', desk.mouseUpHandler);
            }
        });
    }

    saveLayoutDirectly() {
        // Get all desk positions from the classroom
        const classroom = document.getElementById('classroom');
        const desks = classroom.querySelectorAll('.moveable-desk');
        
        if (desks.length === 0) {
            alert('Vennligst legg til minst én pult før du lagrer');
            return;
        }

        // Get name from input field (now from bottom right container)
        const nameInput = document.getElementById('layout-name-input');
        const name = nameInput ? nameInput.value.trim() : '';
        
        if (!name) {
            alert('Vennligst skriv inn et navn for oppsettet');
            return;
        }

        const deskPositions = [];
        desks.forEach((desk, index) => {
            const left = parseInt(desk.style.left) || 0;
            const top = parseInt(desk.style.top) || 0;
            
            deskPositions.push({
                id: desk.dataset.id || `desk-${index}`,
                x: left,
                y: top,
                isCustom: true
            });
        });

        // Create layout object
        const layout = {
            name: name,
            desks: deskPositions,
            createdAt: new Date().toISOString()
        };

        // Save to storage
        this.layouts[name] = layout;
        this.saveLayoutsToStorage();

        // Update select dropdown
        this.updateLayoutSelect();

        // Close layout creator
        this.closeLayoutModal();

        alert(`Oppsettet "${name}" er lagret!`);
    }

    saveLayout() {
        // Keep the old method for modal save button
        this.saveLayoutDirectly();
    }

    loadLayouts() {
        const savedLayouts = localStorage.getItem('classroom_layouts');
        if (savedLayouts) {
            try {
                this.layouts = JSON.parse(savedLayouts);
            } catch (error) {
                console.error('Failed to load layouts:', error);
                this.layouts = {};
            }
        }

        // Add default layout if not exists
        if (!this.layouts.default) {
            this.layouts.default = {
                name: 'Standard klasseromsoppsett',
                isDefault: true,
                desks: this.getDefaultLayoutDesks()
            };
        }
    }

    getDefaultLayoutDesks() {
        // Default layout: left (2x4), middle (3x3), right (2x4)
        const desks = [];
        let deskId = 0;

        // Left section (2x4)
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 2; col++) {
                desks.push({
                    id: `left-${deskId}`,
                    section: 'left',
                    row: row,
                    col: col,
                    gridRow: row,
                    gridCol: col
                });
                deskId++;
            }
        }

        // Middle section (3x3)
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                desks.push({
                    id: `middle-${deskId}`,
                    section: 'middle',
                    row: row,
                    col: col,
                    gridRow: row,
                    gridCol: col + 3
                });
                deskId++;
            }
        }

        // Right section (2x4)
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 2; col++) {
                desks.push({
                    id: `right-${deskId}`,
                    section: 'right',
                    row: row,
                    col: col,
                    gridRow: row,
                    gridCol: col + 7
                });
                deskId++;
            }
        }

        return desks;
    }

    saveLayoutsToStorage() {
        localStorage.setItem('classroom_layouts', JSON.stringify(this.layouts));
    }

    updateLayoutSelect() {
        const select = document.getElementById('layout-select');
        if (!select) return;

        // Clear existing options
        select.innerHTML = '';

        // Add layouts
        Object.keys(this.layouts).forEach(key => {
            const layout = this.layouts[key];
            const option = document.createElement('option');
            option.value = key;
            option.textContent = layout.name;
            select.appendChild(option);
        });
    }

    switchLayout(layoutKey) {
        const layout = this.layouts[layoutKey];
        if (!layout) return;

        if (layout.isDefault) {
            // Switch to default layout
            seatingManager.setupDefaultLayout();
            this.hideDeleteButton();
        } else {
            // Switch to custom layout
            seatingManager.setupCustomLayout(layout);
            this.showDeleteButton();
        }
    }

    showDeleteButton() {
        const deleteBtn = document.getElementById('delete-layout-btn');
        if (deleteBtn) {
            deleteBtn.style.display = 'inline-block';
        }
    }

    hideDeleteButton() {
        const deleteBtn = document.getElementById('delete-layout-btn');
        if (deleteBtn) {
            deleteBtn.style.display = 'none';
        }
    }

    deleteCurrentLayout() {
        const layoutSelect = document.getElementById('layout-select');
        const currentLayout = layoutSelect.value;
        
        if (currentLayout === 'default') {
            alert('Kan ikke slette standardoppsettet');
            return;
        }

        if (confirm(`Er du sikker på at du vil slette oppsettet "${this.layouts[currentLayout].name}"?`)) {
            delete this.layouts[currentLayout];
            this.saveLayoutsToStorage();
            this.updateLayoutSelect();
            
            // Switch back to default
            layoutSelect.value = 'default';
            this.switchLayout('default');
            
            alert('Oppsettet er slettet');
        }
    }

    getLayouts() {
        return this.layouts;
    }
}

// Global instance
const layoutCreator = new LayoutCreator();