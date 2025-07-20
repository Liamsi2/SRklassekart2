// Seating arrangement management
class SeatingManager {
    constructor() {
        this.currentSeating = {};
        this.draggedStudent = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDefaultLayout();
        this.updateSeatingDisplay();
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
        // Use weighted seating algorithm if preferences exist
        if (this.hasPreferences(students)) {
            return this.generateWeightedSeating(students, desks);
        }
        
        // Fall back to simple random seating
        const shuffledStudents = this.shuffleArray([...students]);
        const shuffledDesks = this.shuffleArray([...desks]);
        
        return shuffledStudents.slice(0, shuffledDesks.length).map((student, index) => ({
            student,
            desk: shuffledDesks[index]
        }));
    }

    hasPreferences(students) {
        return students.some(student => 
            student.preferences && (
                student.preferences.preferredPartners?.length > 0 ||
                student.preferences.avoidPartners?.length > 0 ||
                student.preferences.sectionPreference
            )
        );
    }

    generateWeightedSeating(students, desks) {
        const assignments = [];
        const availableDesks = [...desks];
        const unassignedStudents = [...students];
        
        // Group desks by section for section preferences
        const deskSections = this.groupDesksBySection(availableDesks);
        
        // Sort students by preference strength (stronger preferences first)
        unassignedStudents.sort((a, b) => {
            const aWeight = (a.preferences?.sectionWeight || 1.0) + 
                           (a.preferences?.preferredPartners?.length || 0) * 0.5;
            const bWeight = (b.preferences?.sectionWeight || 1.0) + 
                           (b.preferences?.preferredPartners?.length || 0) * 0.5;
            return bWeight - aWeight;
        });
        
        while (unassignedStudents.length > 0 && availableDesks.length > 0) {
            const student = unassignedStudents.shift();
            const bestDesk = this.findBestDeskForStudent(student, availableDesks, assignments, deskSections);
            
            if (bestDesk) {
                assignments.push({ student, desk: bestDesk });
                availableDesks.splice(availableDesks.indexOf(bestDesk), 1);
            }
        }
        
        return assignments;
    }

    groupDesksBySection(desks) {
        const sections = { left: [], middle: [], right: [] };
        
        desks.forEach(deskId => {
            if (deskId.includes('left')) sections.left.push(deskId);
            else if (deskId.includes('middle')) sections.middle.push(deskId);
            else if (deskId.includes('right')) sections.right.push(deskId);
        });
        
        return sections;
    }

    findBestDeskForStudent(student, availableDesks, currentAssignments, deskSections) {
        const preferences = student.preferences || {};
        const scores = [];
        
        availableDesks.forEach(deskId => {
            let score = Math.random(); // Base randomness
            
            // Section preference bonus
            if (preferences.sectionPreference) {
                const preferredSection = deskSections[preferences.sectionPreference] || [];
                if (preferredSection.includes(deskId)) {
                    score += (preferences.sectionWeight || 1.0) * 2.0;
                }
            }
            
            // Partner proximity bonus/penalty
            const nearbyDesks = this.getNearbyDesks(deskId);
            nearbyDesks.forEach(nearbyDeskId => {
                const nearbyStudent = currentAssignments.find(a => a.desk === nearbyDeskId)?.student;
                if (nearbyStudent) {
                    // Preferred partner bonus
                    if (preferences.preferredPartners?.includes(nearbyStudent.name)) {
                        score += 3.0;
                    }
                    // Avoid partner penalty
                    if (preferences.avoidPartners?.includes(nearbyStudent.name)) {
                        score -= 5.0;
                    }
                }
            });
            
            scores.push({ deskId, score });
        });
        
        // Sort by score and add some randomness to prevent deterministic results
        scores.sort((a, b) => b.score - a.score);
        
        // Return best desk (with slight randomization among top choices)
        const topChoices = scores.slice(0, Math.min(3, scores.length));
        const randomChoice = topChoices[Math.floor(Math.random() * topChoices.length)];
        
        return randomChoice?.deskId || availableDesks[0];
    }

    getNearbyDesks(deskId) {
        // Get adjacent desks (simplified - assumes grid layout)
        const nearby = [];
        const [section, index] = deskId.split('-');
        const deskIndex = parseInt(index);
        
        // Add logic to find adjacent desks based on your grid layout
        // This is a simplified version - you might want to enhance based on your exact layout
        [-1, 1].forEach(offset => {
            const adjacentId = `${section}-${deskIndex + offset}`;
            if (document.querySelector(`[data-id="${adjacentId}"]`)) {
                nearby.push(adjacentId);
            }
        });
        
        return nearby;
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