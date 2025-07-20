// Export and import functionality
class ExportManager {
    constructor() {
        this.exportFormats = {
            json: 'application/json',
            csv: 'text/csv',
            txt: 'text/plain'
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Import file handling
        const importFile = document.getElementById('import-file');
        if (importFile) {
            importFile.addEventListener('change', (e) => {
                this.handleFileImport(e);
            });
        }

        // Language change event
        document.addEventListener('languageChanged', () => {
            // Update any language-dependent elements
        });
    }

    // Export students
    exportStudents(format = 'json') {
        try {
            const students = studentManager.getStudents();
            const timestamp = new Date().toISOString().split('T')[0];
            
            let data, filename, mimeType;
            
            switch (format) {
                case 'csv':
                    data = this.convertStudentsToCSV(students);
                    filename = `students_${timestamp}.csv`;
                    mimeType = this.exportFormats.csv;
                    break;
                    
                case 'txt':
                    data = this.convertStudentsToText(students);
                    filename = `students_${timestamp}.txt`;
                    mimeType = this.exportFormats.txt;
                    break;
                    
                case 'json':
                default:
                    data = JSON.stringify({
                        students: students,
                        exportedAt: new Date().toISOString(),
                        version: '1.0'
                    }, null, 2);
                    filename = `students_${timestamp}.json`;
                    mimeType = this.exportFormats.json;
                    break;
            }
            
            this.downloadFile(data, filename, mimeType);
            
            // Add to history
            historyManager.addEntry({
                type: 'data_exported',
                description: `Exported ${students.length} students as ${format.toUpperCase()}`,
                data: { format, count: students.length }
            });
            
            this.showSuccessMessage(`Exported ${students.length} students`);
            
        } catch (error) {
            console.error('Export error:', error);
            this.showErrorMessage('Failed to export students');
        }
    }

    // Export seating arrangement
    exportSeating(format = 'json') {
        try {
            const seating = seatingManager.getCurrentSeating();
            const students = studentManager.getStudents();
            const constraints = layoutManager.getConstraints();
            const timestamp = new Date().toISOString().split('T')[0];
            
            let data, filename, mimeType;
            
            switch (format) {
                case 'csv':
                    data = this.convertSeatingToCSV(seating, students);
                    filename = `seating_${timestamp}.csv`;
                    mimeType = this.exportFormats.csv;
                    break;
                    
                case 'txt':
                    data = this.convertSeatingToText(seating, students);
                    filename = `seating_${timestamp}.txt`;
                    mimeType = this.exportFormats.txt;
                    break;
                    
                case 'json':
                default:
                    data = JSON.stringify({
                        seating: seating,
                        students: students,
                        constraints: constraints,
                        layout: seatingManager.currentLayout,
                        exportedAt: new Date().toISOString(),
                        version: '1.0'
                    }, null, 2);
                    filename = `seating_${timestamp}.json`;
                    mimeType = this.exportFormats.json;
                    break;
            }
            
            this.downloadFile(data, filename, mimeType);
            
            // Add to history
            historyManager.addEntry({
                type: 'seating_exported',
                description: `Exported seating arrangement as ${format.toUpperCase()}`,
                data: { format, seatingCount: Object.keys(seating).length }
            });
            
            this.showSuccessMessage('Exported seating arrangement');
            
        } catch (error) {
            console.error('Export error:', error);
            this.showErrorMessage('Failed to export seating arrangement');
        }
    }

    // Export everything
    exportAll(format = 'json') {
        try {
            const students = studentManager.getStudents();
            const seating = seatingManager.getCurrentSeating();
            const constraints = layoutManager.getConstraints();
            const history = historyManager.getHistorySummary();
            const settings = storageManager.getSettings();
            const timestamp = new Date().toISOString().split('T')[0];
            
            const allData = {
                students: students,
                seating: seating,
                constraints: constraints,
                history: history,
                settings: settings,
                layout: seatingManager.currentLayout,
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };
            
            let data, filename, mimeType;
            
            switch (format) {
                case 'json':
                default:
                    data = JSON.stringify(allData, null, 2);
                    filename = `classroom_data_${timestamp}.json`;
                    mimeType = this.exportFormats.json;
                    break;
            }
            
            this.downloadFile(data, filename, mimeType);
            
            // Add to history
            historyManager.addEntry({
                type: 'full_export',
                description: `Exported complete classroom data as ${format.toUpperCase()}`,
                data: { format, studentCount: students.length, seatingCount: Object.keys(seating).length }
            });
            
            this.showSuccessMessage('Exported complete classroom data');
            
        } catch (error) {
            console.error('Export error:', error);
            this.showErrorMessage('Failed to export classroom data');
        }
    }

    // Convert students to CSV format
    convertStudentsToCSV(students) {
        const headers = ['Name', 'Attendance', 'Notes'];
        const csvRows = [headers.join(',')];
        
        students.forEach(student => {
            const row = [
                this.escapeCSVValue(student.name),
                this.escapeCSVValue(student.attendance || 'present'),
                this.escapeCSVValue(student.notes || '')
            ];
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    }

    // Convert students to text format
    convertStudentsToText(students) {
        const lines = ['Student List', '============', ''];
        
        students.forEach((student, index) => {
            lines.push(`${index + 1}. ${student.name}`);
            if (student.attendance !== 'present') {
                lines.push(`   Attendance: ${student.attendance}`);
            }
            if (student.notes) {
                lines.push(`   Notes: ${student.notes}`);
            }
            lines.push('');
        });
        
        lines.push(`Total Students: ${students.length}`);
        lines.push(`Generated: ${new Date().toLocaleString()}`);
        
        return lines.join('\n');
    }

    // Convert seating to CSV format
    convertSeatingToCSV(seating, students) {
        const headers = ['Desk ID', 'Student Name', 'Attendance', 'Notes'];
        const csvRows = [headers.join(',')];
        
        Object.entries(seating).forEach(([deskId, studentName]) => {
            const student = students.find(s => s.name === studentName);
            const row = [
                this.escapeCSVValue(deskId),
                this.escapeCSVValue(studentName),
                this.escapeCSVValue(student?.attendance || 'present'),
                this.escapeCSVValue(student?.notes || '')
            ];
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    }

    // Convert seating to text format
    convertSeatingToText(seating, students) {
        const lines = ['Seating Chart', '=============', ''];
        
        // Group by section
        const sections = {};
        Object.entries(seating).forEach(([deskId, studentName]) => {
            const section = deskId.split('-')[0];
            if (!sections[section]) {
                sections[section] = [];
            }
            sections[section].push({ deskId, studentName });
        });
        
        Object.entries(sections).forEach(([sectionName, desks]) => {
            lines.push(`${sectionName.toUpperCase()}:`);
            desks.forEach(({ deskId, studentName }) => {
                const student = students.find(s => s.name === studentName);
                const attendanceStatus = student?.attendance !== 'present' ? ` (${student.attendance})` : '';
                lines.push(`  ${deskId}: ${studentName}${attendanceStatus}`);
            });
            lines.push('');
        });
        
        lines.push(`Total Seated: ${Object.keys(seating).length}`);
        lines.push(`Generated: ${new Date().toLocaleString()}`);
        
        return lines.join('\n');
    }

    // Handle file import
    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const extension = file.name.split('.').pop().toLowerCase();
                
                switch (extension) {
                    case 'json':
                        this.importJSON(content);
                        break;
                    case 'csv':
                        this.importCSV(content);
                        break;
                    case 'txt':
                        this.importText(content);
                        break;
                    default:
                        throw new Error(`Unsupported file format: ${extension}`);
                }
                
                // Clear the file input
                event.target.value = '';
                
            } catch (error) {
                console.error('Import error:', error);
                this.showErrorMessage(`Failed to import file: ${error.message}`);
            }
        };
        
        reader.readAsText(file);
    }

    // Import JSON data
    importJSON(content) {
        const data = JSON.parse(content);
        
        if (Array.isArray(data)) {
            // Simple array of student names
            this.importStudentNames(data);
        } else if (data.students && Array.isArray(data.students)) {
            // Full student data
            this.importStudentData(data.students);
            
            // Import seating if available
            if (data.seating) {
                this.importSeatingData(data.seating);
            }
            
            // Import constraints if available
            if (data.constraints) {
                this.importConstraints(data.constraints);
            }
        } else {
            throw new Error('Invalid JSON format');
        }
    }

    // Import CSV data
    importCSV(content) {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV file must have at least a header and one data row');
        }
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIndex = headers.findIndex(h => h.includes('name'));
        
        if (nameIndex === -1) {
            throw new Error('CSV file must have a "Name" column');
        }
        
        const students = [];
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values[nameIndex] && values[nameIndex].trim()) {
                const student = {
                    name: values[nameIndex].trim(),
                    attendance: values[headers.indexOf('attendance')] || 'present',
                    notes: values[headers.indexOf('notes')] || ''
                };
                students.push(student);
            }
        }
        
        this.importStudentData(students);
    }

    // Import text data
    importText(content) {
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        const names = [];
        
        lines.forEach(line => {
            // Try to extract student names from various text formats
            if (line.match(/^\d+\./)) {
                // Numbered list format
                const name = line.replace(/^\d+\.\s*/, '').trim();
                if (name) names.push(name);
            } else if (line.includes(':')) {
                // Seating format
                const parts = line.split(':');
                if (parts.length >= 2) {
                    const name = parts[1].trim();
                    if (name) names.push(name);
                }
            } else if (line.length > 0 && !line.includes('=') && !line.includes('Total') && !line.includes('Generated')) {
                // Simple line format
                names.push(line);
            }
        });
        
        this.importStudentNames(names);
    }

    // Import student names
    importStudentNames(names) {
        let addedCount = 0;
        
        names.forEach(name => {
            if (typeof name === 'string' && name.trim()) {
                const trimmedName = name.trim();
                if (!studentManager.getStudentByName(trimmedName)) {
                    const student = {
                        name: trimmedName,
                        attendance: 'present',
                        notes: '',
                        constraints: [],
                        preferences: {}
                    };
                    
                    if (storageManager.addStudent(student)) {
                        addedCount++;
                    }
                }
            }
        });
        
        if (addedCount > 0) {
            studentManager.loadStudents();
            studentManager.updateUI();
            
            // Add to history
            historyManager.addEntry({
                type: 'students_imported',
                description: `Imported ${addedCount} students`,
                data: { count: addedCount }
            });
            
            this.showSuccessMessage(`Imported ${addedCount} students`);
        } else {
            this.showErrorMessage('No new students to import');
        }
    }

    // Import full student data
    importStudentData(students) {
        let addedCount = 0;
        let updatedCount = 0;
        
        students.forEach(studentData => {
            const existingStudent = studentManager.getStudentByName(studentData.name);
            
            if (existingStudent) {
                // Update existing student
                if (storageManager.updateStudent(existingStudent.id, studentData)) {
                    updatedCount++;
                }
            } else {
                // Add new student
                const student = {
                    name: studentData.name,
                    attendance: studentData.attendance || 'present',
                    notes: studentData.notes || '',
                    constraints: studentData.constraints || [],
                    preferences: studentData.preferences || {}
                };
                
                if (storageManager.addStudent(student)) {
                    addedCount++;
                }
            }
        });
        
        if (addedCount > 0 || updatedCount > 0) {
            studentManager.loadStudents();
            studentManager.updateUI();
            
            // Add to history
            historyManager.addEntry({
                type: 'student_data_imported',
                description: `Imported student data: ${addedCount} new, ${updatedCount} updated`,
                data: { added: addedCount, updated: updatedCount }
            });
            
            this.showSuccessMessage(`Imported: ${addedCount} new, ${updatedCount} updated`);
        } else {
            this.showErrorMessage('No student data to import');
        }
    }

    // Import seating data
    importSeatingData(seating) {
        if (seating && typeof seating === 'object') {
            seatingManager.setSeating(seating);
            
            // Add to history
            historyManager.addEntry({
                type: 'seating_imported',
                description: `Imported seating arrangement`,
                data: { seatingCount: Object.keys(seating).length }
            });
            
            this.showSuccessMessage('Imported seating arrangement');
        }
    }

    // Import constraints
    importConstraints(constraints) {
        if (constraints && Array.isArray(constraints)) {
            storageManager.saveConstraints(constraints);
            layoutManager.loadConstraints();
            layoutManager.updateConstraintsList();
            
            // Add to history
            historyManager.addEntry({
                type: 'constraints_imported',
                description: `Imported ${constraints.length} constraints`,
                data: { count: constraints.length }
            });
            
            this.showSuccessMessage(`Imported ${constraints.length} constraints`);
        }
    }

    // Utility methods
    downloadFile(data, filename, mimeType) {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    escapeCSVValue(value) {
        if (value === null || value === undefined) {
            return '';
        }
        
        const stringValue = String(value);
        
        // If the value contains comma, quote, or newline, wrap in quotes and escape quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
    }

    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Escaped quote
                    current += '"';
                    i++; // Skip next quote
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // Field separator
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // Add the last field
        values.push(current.trim());
        
        return values;
    }

    // Print functionality
    printSeatingChart() {
        const printContent = this.generatePrintContent();
        
        // Open print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Seating Chart</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .classroom { display: flex; justify-content: center; gap: 40px; }
                    .section { display: grid; gap: 10px; }
                    .left-section, .right-section { grid-template-columns: repeat(2, 100px); }
                    .middle-section { grid-template-columns: repeat(3, 100px); }
                    .desk { border: 2px solid #000; width: 100px; height: 50px; display: flex; align-items: center; justify-content: center; font-size: 12px; background: white; }
                    .occupied { background: #f0f0f0; }
                    .absent { background: #ffebee; }
                    .late { background: #fff3e0; }
                    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
    }

    generatePrintContent() {
        const seating = seatingManager.getCurrentSeating();
        const students = studentManager.getStudents();
        
        let content = `
            <div class="header">
                <h1>Classroom Seating Chart</h1>
                <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="classroom">
                <div class="section left-section">
        `;
        
        // Generate left section
        for (let i = 0; i < 8; i++) {
            const deskId = `left-section-${i}`;
            const studentName = seating[deskId] || '';
            const student = students.find(s => s.name === studentName);
            const attendanceClass = student?.attendance !== 'present' ? student?.attendance : '';
            
            content += `<div class="desk ${studentName ? 'occupied' : ''} ${attendanceClass}">${studentName}</div>`;
        }
        
        content += `
                </div>
                <div class="section middle-section">
        `;
        
        // Generate middle section
        for (let i = 0; i < 9; i++) {
            const deskId = `middle-section-${i}`;
            const studentName = seating[deskId] || '';
            const student = students.find(s => s.name === studentName);
            const attendanceClass = student?.attendance !== 'present' ? student?.attendance : '';
            
            content += `<div class="desk ${studentName ? 'occupied' : ''} ${attendanceClass}">${studentName}</div>`;
        }
        
        content += `
                </div>
                <div class="section right-section">
        `;
        
        // Generate right section
        for (let i = 0; i < 8; i++) {
            const deskId = `right-section-${i}`;
            const studentName = seating[deskId] || '';
            const student = students.find(s => s.name === studentName);
            const attendanceClass = student?.attendance !== 'present' ? student?.attendance : '';
            
            content += `<div class="desk ${studentName ? 'occupied' : ''} ${attendanceClass}">${studentName}</div>`;
        }
        
        content += `
                </div>
            </div>
            
            <div class="footer">
                <p>Total Students: ${students.length} | Present: ${students.filter(s => s.attendance === 'present').length} | Seated: ${Object.keys(seating).length}</p>
            </div>
        `;
        
        return content;
    }

    // Notification methods
    showSuccessMessage(message) {
        if (window.app) {
            window.app.showNotification(message, 'success');
        } else {
            console.log('Success:', message);
        }
    }

    showErrorMessage(message) {
        if (window.app) {
            window.app.showNotification(message, 'error');
        } else {
            console.error('Error:', message);
        }
    }

    // Advanced export features
    exportSeatingAnalytics() {
        const seating = seatingManager.getCurrentSeating();
        const students = studentManager.getStudents();
        const constraints = layoutManager.getConstraints();
        
        const analytics = {
            totalStudents: students.length,
            seatedStudents: Object.keys(seating).length,
            emptySeats: 25 - Object.keys(seating).length, // Assuming 25 total seats
            attendanceBreakdown: {
                present: students.filter(s => s.attendance === 'present').length,
                absent: students.filter(s => s.attendance === 'absent').length,
                late: students.filter(s => s.attendance === 'late').length
            },
            constraintViolations: layoutManager.validateSeatingAgainstConstraints(seating),
            exportedAt: new Date().toISOString()
        };
        
        const data = JSON.stringify(analytics, null, 2);
        const timestamp = new Date().toISOString().split('T')[0];
        this.downloadFile(data, `seating_analytics_${timestamp}.json`, 'application/json');
        
        this.showSuccessMessage('Exported seating analytics');
    }
}

// Global instance
const exportManager = new ExportManager();
