// Language management
class LanguageManager {
    constructor() {
        this.currentLang = localStorage.getItem('language') || 'no';
        this.translations = {
            no: {
                // Header
                'app-title': 'Klasseromsplanlegger',
                
                // Toolbar
                'Standard': 'Standard',
                'U-Shape': 'U-form',
                'Groups': 'Grupper',
                'Rows': 'Rader',
                'Random': 'Tilfeldig',
                'Alphabetical': 'Alfabetisk',
                'With Constraints': 'Med begrensninger',
                'Manual': 'Manuell',
                'Generate Seating': 'Generer plasser',
                'Clear All': 'Tøm alle',
                
                // Labels
                'Group Room': 'Grupperom',
                'BOARD': 'TAVLE',
                
                // Student management
                'Student List': 'Elevliste',
                'Search students...': 'Søk elever...',
                'Add student': 'Legg til elev',
                'Add': 'Legg til',
                'Present': 'Tilstede',
                'Total': 'Totalt',
                
                // Constraints
                'Constraints': 'Begrensninger',
                'Add Constraint': 'Legg til begrensning',
                'Cannot sit together': 'Kan ikke sitte sammen',
                'Must sit together': 'Må sitte sammen',
                'Preferred area': 'Foretrukket område',
                
                // Import/Export
                'Import/Export': 'Import/Export',
                'Export Students': 'Eksporter elever',
                'Export Seating': 'Eksporter plassering',
                'Import': 'Importer',
                
                // History
                'Seating History': 'Tidligere plasseringer',
                
                // Modal
                'Student Information': 'Elevinformasjon',
                'Name': 'Navn',
                'Notes': 'Notater',
                'Attendance': 'Fremmøte',
                'Present': 'Tilstede',
                'Absent': 'Fraværende',
                'Late': 'Sen',
                'Save': 'Lagre',
                'Cancel': 'Avbryt',
                
                // Constraint modal
                'Type': 'Type',
                'Student 1': 'Elev 1',
                'Student 2': 'Elev 2',
                
                // Messages
                'student_added': 'Elev lagt til',
                'student_removed': 'Elev fjernet',
                'seating_generated': 'Nye plasser generert',
                'constraint_added': 'Begrensning lagt til',
                'data_exported': 'Data eksportert',
                'data_imported': 'Data importert'
            },
            en: {
                // Header
                'app-title': 'Classroom Seating Manager',
                
                // Toolbar
                'Standard': 'Standard',
                'U-Shape': 'U-Shape',
                'Groups': 'Groups',
                'Rows': 'Rows',
                'Random': 'Random',
                'Alphabetical': 'Alphabetical',
                'With Constraints': 'With Constraints',
                'Manual': 'Manual',
                'Generate Seating': 'Generate Seating',
                'Clear All': 'Clear All',
                
                // Labels
                'Group Room': 'Group Room',
                'BOARD': 'BOARD',
                
                // Student management
                'Student List': 'Student List',
                'Search students...': 'Search students...',
                'Add student': 'Add student',
                'Add': 'Add',
                'Present': 'Present',
                'Total': 'Total',
                
                // Constraints
                'Constraints': 'Constraints',
                'Add Constraint': 'Add Constraint',
                'Cannot sit together': 'Cannot sit together',
                'Must sit together': 'Must sit together',
                'Preferred area': 'Preferred area',
                
                // Import/Export
                'Import/Export': 'Import/Export',
                'Export Students': 'Export Students',
                'Export Seating': 'Export Seating',
                'Import': 'Import',
                
                // History
                'Seating History': 'Seating History',
                
                // Modal
                'Student Information': 'Student Information',
                'Name': 'Name',
                'Notes': 'Notes',
                'Attendance': 'Attendance',
                'Present': 'Present',
                'Absent': 'Absent',
                'Late': 'Late',
                'Save': 'Save',
                'Cancel': 'Cancel',
                
                // Constraint modal
                'Type': 'Type',
                'Student 1': 'Student 1',
                'Student 2': 'Student 2',
                
                // Messages
                'student_added': 'Student added',
                'student_removed': 'Student removed',
                'seating_generated': 'New seating generated',
                'constraint_added': 'Constraint added',
                'data_exported': 'Data exported',
                'data_imported': 'Data imported'
            }
        };
    }

    init() {
        this.updateLanguage(this.currentLang);
        this.setupLanguageSelector();
    }

    setupLanguageSelector() {
        const selector = document.getElementById('language-select');
        if (selector) {
            selector.value = this.currentLang;
            selector.addEventListener('change', (e) => {
                this.updateLanguage(e.target.value);
            });
        }
    }

    updateLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang;

        // Update all translatable elements
        document.querySelectorAll('[data-' + lang + ']').forEach(element => {
            element.textContent = element.getAttribute('data-' + lang);
        });

        // Update placeholders
        document.querySelectorAll('[data-' + lang + '-placeholder]').forEach(element => {
            element.placeholder = element.getAttribute('data-' + lang + '-placeholder');
        });

        // Update select options
        document.querySelectorAll('option[data-' + lang + ']').forEach(option => {
            option.textContent = option.getAttribute('data-' + lang);
        });

        // Trigger custom event for components that need to update
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    translate(key) {
        return this.translations[this.currentLang][key] || key;
    }

    getCurrentLanguage() {
        return this.currentLang;
    }
}

// Global instance
const languageManager = new LanguageManager();
