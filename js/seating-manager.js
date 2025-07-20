// Seating arrangement management
class SeatingManager {
    constructor() {
        this.currentSeating = {};
        this.draggedStudent = null;
        
        // Probability configuration - you can modify these values
        this.seatingPreferences = {
            // Student pair probabilities (0.0 = never sit together, 1.0 = always sit together)
            pairProbabilities: {
                // Example: 'Ismail,Liam': 0.3  // 30% chance to sit together
            },
            
            // Section preferences for students (0.0 = avoid, 1.0 = prefer)
            sectionPreferences: {
                // Example: 'Ismail': { left: 0.8, middle: 0.2, right: 0.1 }
            },
            
            // Default section weights when no preferences are set
            defaultSectionWeights: {
                left: 1.0,
                middle: 1.0,
                right: 1.0
            }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDefaultLayout();
        this.updateSeatingDisplay();
        
        // Configure your seating preferences here
        this.configureSeatingPreferences();
    }

    setupEventListeners() {
        // Generate seating button
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateSeating();
            });
        }

        // Clear all button
        const clearAllBtn = document.getElementById('clear-all-btn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllSeats();
            });
        }

        // Save image button
        const saveImageBtn = document.getElementById('save-image-btn');
        if (saveImageBtn) {
            saveImageBtn.addEventListener('click', () => {
                this.saveSeatingAsImage();
            });
        }
    }

    setupDefaultLayout() {
        const classroom = document.getElementById('classroom');
        if (!classroom) return;

        // Clear existing layout
        classroom.innerHTML = '';

        // Create the default layout from your original design
        const leftSection = this.createSection('left', 2, 4);
        const middleSection = this.createSection('middle', 3, 3);
        const rightSection = this.createSection('right', 2, 4);

        classroom.appendChild(leftSection);
        classroom.appendChild(middleSection);
        classroom.appendChild(rightSection);

        this.setupDragAndDrop();
        this.restoreSeating();
    }

    createSection(id, cols, rows) {
        const section = document.createElement('div');
        section.id = id;
        section.className = 'section';
        section.style.display = 'grid';
        section.style.gridTemplateColumns = `repeat(${cols}, 120px)`;
        section.style.gridTemplateRows = `repeat(${rows}, 60px)`;
        section.style.gap = '15px';

        const totalDesks = cols * rows;
        for (let i = 0; i < totalDesks; i++) {
            const desk = this.createDesk(id, i);
            section.appendChild(desk);
        }

        return section;
    }

    createDesk(sectionId, index) {
        const desk = document.createElement('div');
        desk.className = 'table-box';
        desk.dataset.section = sectionId;
        desk.dataset.index = index;
        desk.dataset.id = `${sectionId}-${index}`;
        
        return desk;
    }

    setupDragAndDrop() {
        const desks = document.querySelectorAll('.table-box');
        
        desks.forEach(desk => {
            // Drop events
            desk.addEventListener('dragover', this.handleDragOver.bind(this));
            desk.addEventListener('drop', this.handleDrop.bind(this));
            desk.addEventListener('dragenter', this.handleDragEnter.bind(this));
            desk.addEventListener('dragleave', this.handleDragLeave.bind(this));
            
            // Click events for manual assignment
            desk.addEventListener('click', this.handleDeskClick.bind(this));
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e) {
        e.preventDefault();
        e.target.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.target.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.target.classList.remove('drag-over');
        
        const studentName = e.dataTransfer.getData('text/plain');
        const deskId = e.target.dataset.id;
        
        if (studentName && deskId) {
            this.assignStudentToDesk(studentName, deskId);
        }
    }

    handleDeskClick(e) {
        const desk = e.target.closest('.table-box');
        if (!desk) return;

        const currentStudent = desk.textContent.trim();
        
        if (currentStudent) {
            // If desk is occupied, clear it
            this.clearDesk(desk.dataset.id);
        }
    }

    assignStudentToDesk(studentName, deskId) {
        // Remove student from any existing desk
        this.removeStudentFromSeats(studentName);
        
        // Clear the target desk
        this.clearDesk(deskId);
        
        // Assign student to new desk
        this.currentSeating[deskId] = studentName;
        
        // Update display
        this.updateDeskDisplay(deskId);
        
        // Save to storage
        this.saveCurrentSeating();
    }

    clearDesk(deskId) {
        if (this.currentSeating[deskId]) {
            delete this.currentSeating[deskId];
            this.updateDeskDisplay(deskId);
            this.saveCurrentSeating();
        }
    }

    updateDeskDisplay(deskId) {
        const desk = document.querySelector(`[data-id="${deskId}"]`);
        if (!desk) return;

        const studentName = this.currentSeating[deskId];
        desk.textContent = studentName || '';
        
        if (studentName) {
            desk.classList.add('occupied');
        } else {
            desk.classList.remove('occupied');
        }
    }

    updateSeatingDisplay() {
        Object.keys(this.currentSeating).forEach(deskId => {
            this.updateDeskDisplay(deskId);
        });
    }

    generateSeating() {
        const presentStudents = studentManager.getPresentStudents();
        
        if (presentStudents.length === 0) {
            alert('Ingen elever tilgjengelig for plassering');
            return;
        }

        // Clear current seating
        this.currentSeating = {};
        
        // Clear all desks visually
        const allDesks = document.querySelectorAll('.table-box');
        allDesks.forEach(desk => {
            desk.textContent = '';
            desk.classList.remove('occupied');
        });
        
        // Get available desks
        const desks = Array.from(document.querySelectorAll('.table-box')).map(desk => desk.dataset.id);
        
        // Generate random seating
        const assignments = this.generateRandomSeating(presentStudents, desks);

        // Apply assignments
        assignments.forEach(({ student, desk }) => {
            this.currentSeating[desk] = student.name;
            this.updateDeskDisplay(desk);
        });

        this.saveCurrentSeating();
    }

    generateRandomSeating(students, desks) {
        const assignments = [];
        const availableDesks = [...desks];
        const unassignedStudents = [...students];
        
        // Group desks by section
        const desksBySection = this.groupDesksBySection(availableDesks);
        
        // Process students one by one with probability considerations
        while (unassignedStudents.length > 0 && availableDesks.length > 0) {
            const student = unassignedStudents.shift();
            const selectedDesk = this.selectDeskForStudent(student, desksBySection, assignments);
            
            if (selectedDesk) {
                assignments.push({ student, desk: selectedDesk });
                
                // Remove desk from available desks and section groups
                const deskIndex = availableDesks.indexOf(selectedDesk);
                if (deskIndex > -1) {
                    availableDesks.splice(deskIndex, 1);
                }
                
                // Remove from section groups
                Object.keys(desksBySection).forEach(section => {
                    const sectionIndex = desksBySection[section].indexOf(selectedDesk);
                    if (sectionIndex > -1) {
                        desksBySection[section].splice(sectionIndex, 1);
                    }
                });
            }
        }
        
        return assignments;
    }
    
    groupDesksBySection(desks) {
        const sections = { left: [], middle: [], right: [] };
        
        desks.forEach(deskId => {
            const section = deskId.split('-')[0];
            if (sections[section]) {
                sections[section].push(deskId);
            }
        });
        
        return sections;
    }
    
    selectDeskForStudent(student, desksBySection, existingAssignments) {
        const studentName = student.name;
        const preferences = this.seatingPreferences.sectionPreferences[studentName] || this.seatingPreferences.defaultSectionWeights;
        
        // Choose section based on preferences
        const selectedSection = this.selectSectionByWeight(preferences, desksBySection);
        
        if (!selectedSection || desksBySection[selectedSection].length === 0) {
            // Fallback to any available desk
            const allAvailable = Object.values(desksBySection).flat();
            if (allAvailable.length === 0) return null;
            return allAvailable[Math.floor(Math.random() * allAvailable.length)];
        }
        
        // Try to consider pair probabilities
        const sectionDesks = desksBySection[selectedSection];
        const preferredDesk = this.findDeskConsideringPairs(student, sectionDesks, existingAssignments);
        
        return preferredDesk || sectionDesks[Math.floor(Math.random() * sectionDesks.length)];
    }
    
    selectSectionByWeight(preferences, desksBySection) {
        const availableSections = Object.keys(preferences).filter(section => 
            desksBySection[section] && desksBySection[section].length > 0
        );
        
        if (availableSections.length === 0) return null;
        
        // Calculate weighted random selection
        const totalWeight = availableSections.reduce((sum, section) => sum + preferences[section], 0);
        let random = Math.random() * totalWeight;
        
        for (const section of availableSections) {
            random -= preferences[section];
            if (random <= 0) {
                return section;
            }
        }
        
        return availableSections[0]; // Fallback
    }
    
    findDeskConsideringPairs(student, availableDesks, existingAssignments) {
        const studentName = student.name;
        
        // Check for pair probabilities
        for (const [pairKey, probability] of Object.entries(this.seatingPreferences.pairProbabilities)) {
            const [student1, student2] = pairKey.split(',');
            let partnerName = null;
            
            if (student1 === studentName) {
                partnerName = student2;
            } else if (student2 === studentName) {
                partnerName = student1;
            }
            
            if (partnerName) {
                // Find if partner is already assigned
                const partnerAssignment = existingAssignments.find(a => a.student.name === partnerName);
                
                if (partnerAssignment && Math.random() < probability) {
                    // Try to sit next to partner
                    const adjacentDesk = this.findAdjacentDesk(partnerAssignment.desk, availableDesks);
                    if (adjacentDesk) {
                        return adjacentDesk;
                    }
                }
            }
        }
        
        return null; // No special preference, use random
    }
    
    findAdjacentDesk(targetDeskId, availableDesks) {
        const targetDesk = document.querySelector(`[data-id="${targetDeskId}"]`);
        if (!targetDesk) return null;
        
        const targetRect = targetDesk.getBoundingClientRect();
        
        // Find closest available desk
        let closestDesk = null;
        let closestDistance = Infinity;
        
        for (const deskId of availableDesks) {
            const desk = document.querySelector(`[data-id="${deskId}"]`);
            if (!desk) continue;
            
            const rect = desk.getBoundingClientRect();
            const distance = Math.sqrt(
                Math.pow(rect.left - targetRect.left, 2) + 
                Math.pow(rect.top - targetRect.top, 2)
            );
            
            // Check if it's adjacent (within reasonable distance)
            const deskWidth = 140; // Including gap
            const deskHeight = 80;  // Including gap
            
            if (distance < Math.max(deskWidth, deskHeight) * 1.5 && distance < closestDistance) {
                closestDistance = distance;
                closestDesk = deskId;
            }
        }
        
        return closestDesk;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    clearAllSeats() {
        this.currentSeating = {};
        
        // Clear all desks
        const desks = document.querySelectorAll('.table-box');
        desks.forEach(desk => {
            desk.textContent = '';
            desk.classList.remove('occupied');
        });
        
        this.saveCurrentSeating();
    }

    removeStudentFromSeats(studentName) {
        const deskId = Object.keys(this.currentSeating).find(id => this.currentSeating[id] === studentName);
        if (deskId) {
            this.clearDesk(deskId);
        }
    }

    updateStudentName(oldName, newName) {
        const deskId = Object.keys(this.currentSeating).find(id => this.currentSeating[id] === oldName);
        if (deskId) {
            this.currentSeating[deskId] = newName;
            this.updateDeskDisplay(deskId);
            this.saveCurrentSeating();
        }
    }

    getCurrentSeating() {
        return this.currentSeating;
    }

    setSeating(seating) {
        this.currentSeating = seating;
        this.updateSeatingDisplay();
        this.saveCurrentSeating();
    }

    saveCurrentSeating() {
        storageManager.saveLayout('current', {
            seating: this.currentSeating,
            timestamp: new Date().toISOString()
        });
    }

    restoreSeating() {
        const layouts = storageManager.getLayouts();
        if (layouts.current && layouts.current.seating) {
            this.currentSeating = layouts.current.seating;
            this.updateSeatingDisplay();
        }
    }

    setupCustomLayout(layout) {
        const classroom = document.getElementById('classroom');
        if (!classroom) return;

        // Clear existing layout
        classroom.innerHTML = '';

        // Create container for custom layout
        const container = document.createElement('div');
        container.className = 'custom-layout';
        container.style.position = 'relative';
        container.style.width = '100%';
        container.style.height = '600px';
        container.style.margin = '0 auto';

        // Create desks based on layout
        layout.desks.forEach(desk => {
            const deskElement = document.createElement('div');
            deskElement.className = 'table-box';
            deskElement.dataset.id = desk.id;
            deskElement.style.position = 'absolute';
            deskElement.style.left = desk.x + 'px';
            deskElement.style.top = desk.y + 'px';
            
            // Add remove button for custom desks
            if (desk.isCustom) {
                deskElement.classList.add('custom-desk');
                const removeBtn = document.createElement('button');
                removeBtn.innerHTML = '×';
                removeBtn.className = 'remove-desk-btn';
                removeBtn.style.position = 'absolute';
                removeBtn.style.top = '-10px';
                removeBtn.style.right = '-10px';
                removeBtn.style.width = '20px';
                removeBtn.style.height = '20px';
                removeBtn.style.backgroundColor = '#dc3545';
                removeBtn.style.color = 'white';
                removeBtn.style.border = 'none';
                removeBtn.style.borderRadius = '50%';
                removeBtn.style.cursor = 'pointer';
                removeBtn.style.fontSize = '12px';
                removeBtn.style.zIndex = '11';
                removeBtn.style.display = 'none'; // Hidden by default
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    deskElement.remove();
                };
                deskElement.appendChild(removeBtn);
            }
            
            container.appendChild(deskElement);
        });

        classroom.appendChild(container);
        this.setupDragAndDrop();
        this.restoreSeating();
    }

    // Configuration methods - use these to set probabilities
    setPairProbability(student1, student2, probability) {
        const key = `${student1},${student2}`;
        this.seatingPreferences.pairProbabilities[key] = Math.max(0, Math.min(1, probability));
        console.log(`Set ${student1} and ${student2} sitting together probability to ${probability * 100}%`);
    }
    
    setSectionPreference(studentName, leftWeight = 1.0, middleWeight = 1.0, rightWeight = 1.0) {
        this.seatingPreferences.sectionPreferences[studentName] = {
            left: Math.max(0, leftWeight),
            middle: Math.max(0, middleWeight),
            right: Math.max(0, rightWeight)
        };
        console.log(`Set section preferences for ${studentName}: left=${leftWeight}, middle=${middleWeight}, right=${rightWeight}`);
    }
    
    // Example configuration method - call this to set up your preferences
    configureSeatingPreferences() {
        // Example: Set Ismail and Liam to have 30% chance of sitting together
         this.setPairProbability('Ismail', 'Liam', 1.0);
        
        // Example: Make a student prefer the right section
        // this.setSectionPreference('Ismail', 0.1, 0.2, 0.8); // 80% chance for right section
        
        // Example: Make a student prefer the left section
        // this.setSectionPreference('Liam', 0.8, 0.2, 0.1); // 80% chance for left section
        
        console.log('Seating preferences configured. Modify this method to set your own preferences.');
    }

    saveSeatingAsImage() {
        const classroomContainer = document.querySelector('.classroom-container');
        if (!classroomContainer) return;

        // Create a temporary container that includes the labels as they appear in the app
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.top = '-9999px';
        tempContainer.style.left = '-9999px';
        tempContainer.style.backgroundColor = '#ffffff';
        tempContainer.style.padding = '40px';
        tempContainer.style.width = 'auto';
        tempContainer.style.height = 'auto';

        // Clone the entire classroom container including labels
        const containerClone = classroomContainer.cloneNode(true);
        containerClone.style.margin = '0';
        
        // Ensure the TAVLE text is white in the image
        const tavleLabel = containerClone.querySelector('.label-center');
        if (tavleLabel) {
            tavleLabel.style.color = 'white';
            tavleLabel.style.backgroundColor = '#343a40';
        }

        // Add the cloned container to temp container
        tempContainer.appendChild(containerClone);

        document.body.appendChild(tempContainer);

        // Import html2canvas dynamically
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = () => {
            html2canvas(tempContainer, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false
            }).then(canvas => {
                // Create download link
                const link = document.createElement('a');
                link.download = `klasseromsplassering-${new Date().toLocaleDateString('nb-NO')}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                
                // Clean up
                document.body.removeChild(tempContainer);
            }).catch(error => {
                console.error('Failed to capture image:', error);
                alert('Kunne ikke lagre bildet. Prøv igjen.');
                document.body.removeChild(tempContainer);
            });
        };
        document.head.appendChild(script);
    }
}

// Global instance
const seatingManager = new SeatingManager();
