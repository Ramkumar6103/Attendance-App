// Attendance Management Application
class AttendanceManager {
    constructor() {
        this.students = JSON.parse(localStorage.getItem('students')) || [];
        this.attendance = JSON.parse(localStorage.getItem('attendance')) || {};
        this.activities = JSON.parse(localStorage.getItem('activities')) || [];
        
        this.initializeApp();
        this.bindEvents();
        this.updateDashboard();
        this.renderStudents();
        this.renderAttendance();
        this.updateDateTime();
        
        // Update time every second
        setInterval(() => this.updateDateTime(), 1000);
    }

    initializeApp() {
        // Initialize with sample data if empty
        if (this.students.length === 0) {
            this.addSampleData();
        }
    }

    addSampleData() {
        const sampleStudents = [
            { id: 'ST001', name: 'John Doe', email: 'john.doe@email.com' },
            { id: 'ST002', name: 'Jane Smith', email: 'jane.smith@email.com' },
            { id: 'ST003', name: 'Mike Johnson', email: 'mike.johnson@email.com' },
            { id: 'ST004', name: 'Sarah Wilson', email: 'sarah.wilson@email.com' },
            { id: 'ST005', name: 'David Brown', email: 'david.brown@email.com' }
        ];

        sampleStudents.forEach(student => {
            this.students.push(student);
        });

        this.saveStudents();
        this.addActivity('Sample students added', 'added');
    }

    bindEvents() {
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Add student button
        document.getElementById('add-student-btn').addEventListener('click', () => {
            this.showModal('add-student-modal');
        });

        // Add student form
        document.getElementById('add-student-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addStudent();
        });

        // Edit student form
        document.getElementById('edit-student-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateStudent();
        });

        // Modal close buttons
        document.querySelectorAll('.close, #cancel-add, #cancel-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModals();
            });
        });

        // Attendance controls
        document.getElementById('mark-all-present').addEventListener('click', () => {
            this.markAllAttendance('present');
        });

        document.getElementById('mark-all-absent').addEventListener('click', () => {
            this.markAllAttendance('absent');
        });

        document.getElementById('clear-attendance').addEventListener('click', () => {
            this.clearTodayAttendance();
        });

        // Report controls
        document.getElementById('report-period').addEventListener('change', () => {
            this.generateReport();
        });

        document.getElementById('export-report').addEventListener('click', () => {
            this.exportReport();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });
    }

    switchTab(tabName) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');

        // Update content based on tab
        if (tabName === 'reports') {
            this.generateReport();
        }
    }

    updateDateTime() {
        const now = new Date();
        const dateOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const timeOptions = { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        };

        document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', dateOptions);
        document.getElementById('current-time').textContent = now.toLocaleTimeString('en-US', timeOptions);
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    addStudent() {
        const name = document.getElementById('student-name').value.trim();
        const id = document.getElementById('student-id').value.trim();
        const email = document.getElementById('student-email').value.trim();

        if (!name || !id) {
            alert('Please fill in all required fields');
            return;
        }

        // Check if student ID already exists
        if (this.students.some(student => student.id === id)) {
            alert('Student ID already exists');
            return;
        }

        const student = { id, name, email };
        this.students.push(student);
        this.saveStudents();
        this.addActivity(`Added student: ${name}`, 'added');
        
        this.closeModals();
        this.updateDashboard();
        this.renderStudents();
        this.renderAttendance();
        
        // Clear form
        document.getElementById('add-student-form').reset();
    }

    editStudent(index) {
        const student = this.students[index];
        document.getElementById('edit-student-index').value = index;
        document.getElementById('edit-student-name').value = student.name;
        document.getElementById('edit-student-id').value = student.id;
        document.getElementById('edit-student-email').value = student.email || '';
        
        this.showModal('edit-student-modal');
    }

    updateStudent() {
        const index = parseInt(document.getElementById('edit-student-index').value);
        const name = document.getElementById('edit-student-name').value.trim();
        const id = document.getElementById('edit-student-id').value.trim();
        const email = document.getElementById('edit-student-email').value.trim();

        if (!name || !id) {
            alert('Please fill in all required fields');
            return;
        }

        // Check if student ID already exists (excluding current student)
        if (this.students.some((student, i) => i !== index && student.id === id)) {
            alert('Student ID already exists');
            return;
        }

        const oldName = this.students[index].name;
        this.students[index] = { id, name, email };
        this.saveStudents();
        this.addActivity(`Updated student: ${oldName} → ${name}`, 'added');
        
        this.closeModals();
        this.updateDashboard();
        this.renderStudents();
        this.renderAttendance();
    }

    deleteStudent(index) {
        const student = this.students[index];
        if (confirm(`Are you sure you want to delete ${student.name}?`)) {
            this.students.splice(index, 1);
            this.saveStudents();
            this.addActivity(`Deleted student: ${student.name}`, 'added');
            
            this.updateDashboard();
            this.renderStudents();
            this.renderAttendance();
        }
    }

    markAttendance(studentId, status) {
        const today = new Date().toDateString();
        const now = new Date();
        
        if (!this.attendance[today]) {
            this.attendance[today] = {};
        }
        
        this.attendance[today][studentId] = {
            status: status,
            timestamp: now.toISOString()
        };
        
        this.saveAttendance();
        this.addActivity(`Marked ${status} for student ID: ${studentId}`, status);
        
        this.updateDashboard();
        this.renderAttendance();
    }

    markAllAttendance(status) {
        const today = new Date().toDateString();
        const now = new Date();
        
        if (!this.attendance[today]) {
            this.attendance[today] = {};
        }
        
        this.students.forEach(student => {
            this.attendance[today][student.id] = {
                status: status,
                timestamp: now.toISOString()
            };
        });
        
        this.saveAttendance();
        this.addActivity(`Marked all students as ${status}`, status);
        
        this.updateDashboard();
        this.renderAttendance();
    }

    clearTodayAttendance() {
        const today = new Date().toDateString();
        if (confirm('Are you sure you want to clear today\'s attendance?')) {
            delete this.attendance[today];
            this.saveAttendance();
            this.addActivity('Cleared today\'s attendance', 'added');
            
            this.updateDashboard();
            this.renderAttendance();
        }
    }

    addActivity(message, type) {
        const activity = {
            message,
            type,
            timestamp: new Date().toISOString()
        };
        
        this.activities.unshift(activity);
        
        // Keep only last 50 activities
        if (this.activities.length > 50) {
            this.activities = this.activities.slice(0, 50);
        }
        
        this.saveActivities();
        this.updateRecentActivity();
    }

    updateDashboard() {
        const totalStudents = this.students.length;
        const today = new Date().toDateString();
        const todayAttendance = this.attendance[today] || {};
        
        let presentCount = 0;
        let absentCount = 0;
        
        Object.values(todayAttendance).forEach(record => {
            if (record.status === 'present') presentCount++;
            else if (record.status === 'absent') absentCount++;
        });
        
        const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
        
        document.getElementById('total-students').textContent = totalStudents;
        document.getElementById('present-today').textContent = presentCount;
        document.getElementById('absent-today').textContent = absentCount;
        document.getElementById('attendance-rate').textContent = `${attendanceRate}%`;
        
        this.updateRecentActivity();
    }

    updateRecentActivity() {
        const activityList = document.getElementById('recent-activity-list');
        const recentActivities = this.activities.slice(0, 10);
        
        if (recentActivities.length === 0) {
            activityList.innerHTML = '<p class="no-data">No recent activity</p>';
            return;
        }
        
        activityList.innerHTML = recentActivities.map(activity => {
            const time = new Date(activity.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <div class="activity-item">
                    <div class="activity-icon ${activity.type}">
                        <i class="fas fa-${activity.type === 'present' ? 'check' : activity.type === 'absent' ? 'times' : 'plus'}"></i>
                    </div>
                    <div class="activity-details">
                        <h4>${activity.message}</h4>
                        <p>${time}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderStudents() {
        const studentsList = document.getElementById('students-list');
        
        if (this.students.length === 0) {
            studentsList.innerHTML = '<p class="no-data">No students added yet.</p>';
            return;
        }
        
        studentsList.innerHTML = this.students.map((student, index) => {
            const initials = student.name.split(' ').map(n => n[0]).join('').toUpperCase();
            
            return `
                <div class="student-card">
                    <div class="student-info">
                        <div class="student-avatar">${initials}</div>
                        <div class="student-details">
                            <h4>${student.name}</h4>
                            <p>ID: ${student.id}${student.email ? ` • ${student.email}` : ''}</p>
                        </div>
                    </div>
                    <div class="student-actions">
                        <button class="btn btn-secondary btn-sm" onclick="app.editStudent(${index})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="app.deleteStudent(${index})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderAttendance() {
        const attendanceList = document.getElementById('attendance-list');
        const today = new Date().toDateString();
        const todayAttendance = this.attendance[today] || {};
        
        if (this.students.length === 0) {
            attendanceList.innerHTML = '<p class="no-data">No students added yet. Add students first.</p>';
            return;
        }
        
        attendanceList.innerHTML = this.students.map(student => {
            const attendanceRecord = todayAttendance[student.id];
            const initials = student.name.split(' ').map(n => n[0]).join('').toUpperCase();
            let timeDisplay = '';
            
            if (attendanceRecord) {
                const time = new Date(attendanceRecord.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                timeDisplay = `<span class="attendance-time">Marked at ${time}</span>`;
            }
            
            return `
                <div class="attendance-item">
                    <div class="student-info">
                        <div class="student-avatar">${initials}</div>
                        <div class="student-details">
                            <h4>${student.name}</h4>
                            <p>ID: ${student.id}</p>
                        </div>
                    </div>
                    <div class="attendance-actions">
                        ${timeDisplay}
                        <button class="btn btn-success btn-sm" onclick="app.markAttendance('${student.id}', 'present')" ${attendanceRecord?.status === 'present' ? 'disabled' : ''}>
                            <i class="fas fa-check"></i> Present
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="app.markAttendance('${student.id}', 'absent')" ${attendanceRecord?.status === 'absent' ? 'disabled' : ''}>
                            <i class="fas fa-times"></i> Absent
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    generateReport() {
        const period = document.getElementById('report-period').value;
        const now = new Date();
        let startDate = new Date();
        
        if (period !== 'all') {
            startDate.setDate(now.getDate() - parseInt(period));
        } else {
            startDate = new Date(0); // Beginning of time
        }
        
        const reportData = this.calculateReportData(startDate, now);
        this.displayReport(reportData);
    }

    calculateReportData(startDate, endDate) {
        const report = {
            totalDays: 0,
            totalPresent: 0,
            totalAbsent: 0,
            studentStats: {},
            dailyStats: {}
        };
        
        // Initialize student stats
        this.students.forEach(student => {
            report.studentStats[student.id] = {
                name: student.name,
                present: 0,
                absent: 0,
                rate: 0
            };
        });
        
        // Calculate stats for each day
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateString = currentDate.toDateString();
            const dayAttendance = this.attendance[dateString];
            
            if (dayAttendance) {
                report.totalDays++;
                report.dailyStats[dateString] = { present: 0, absent: 0 };
                
                Object.entries(dayAttendance).forEach(([studentId, record]) => {
                    if (record.status === 'present') {
                        report.totalPresent++;
                        report.dailyStats[dateString].present++;
                        report.studentStats[studentId].present++;
                    } else if (record.status === 'absent') {
                        report.totalAbsent++;
                        report.dailyStats[dateString].absent++;
                        report.studentStats[studentId].absent++;
                    }
                });
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Calculate attendance rates
        Object.values(report.studentStats).forEach(student => {
            const total = student.present + student.absent;
            student.rate = total > 0 ? Math.round((student.present / total) * 100) : 0;
        });
        
        return report;
    }

    displayReport(reportData) {
        const summaryData = document.getElementById('report-summary-data');
        const detailsData = document.getElementById('report-details-data');
        
        // Summary
        const totalSessions = reportData.totalPresent + reportData.totalAbsent;
        const overallRate = totalSessions > 0 ? Math.round((reportData.totalPresent / totalSessions) * 100) : 0;
        
        summaryData.innerHTML = `
            <div class="report-summary-grid">
                <div class="summary-item">
                    <h4>Total Days</h4>
                    <p>${reportData.totalDays}</p>
                </div>
                <div class="summary-item">
                    <h4>Total Present</h4>
                    <p>${reportData.totalPresent}</p>
                </div>
                <div class="summary-item">
                    <h4>Total Absent</h4>
                    <p>${reportData.totalAbsent}</p>
                </div>
                <div class="summary-item">
                    <h4>Overall Rate</h4>
                    <p>${overallRate}%</p>
                </div>
            </div>
        `;
        
        // Details
        const studentRows = Object.values(reportData.studentStats)
            .sort((a, b) => b.rate - a.rate)
            .map(student => {
                const total = student.present + student.absent;
                return `
                    <tr>
                        <td>${student.name}</td>
                        <td>${student.present}</td>
                        <td>${student.absent}</td>
                        <td>${student.rate}%</td>
                    </tr>
                `;
            }).join('');
        
        detailsData.innerHTML = `
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Student Name</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${studentRows}
                </tbody>
            </table>
        `;
    }

    exportReport() {
        const period = document.getElementById('report-period').value;
        const now = new Date();
        let startDate = new Date();
        
        if (period !== 'all') {
            startDate.setDate(now.getDate() - parseInt(period));
        } else {
            startDate = new Date(0);
        }
        
        const reportData = this.calculateReportData(startDate, now);
        
        // Create CSV content
        let csv = 'Student Name,Present,Absent,Attendance Rate\n';
        
        Object.values(reportData.studentStats)
            .sort((a, b) => b.rate - a.rate)
            .forEach(student => {
                csv += `"${student.name}",${student.present},${student.absent},${student.rate}%\n`;
            });
        
        // Create and download file
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // Local Storage Methods
    saveStudents() {
        localStorage.setItem('students', JSON.stringify(this.students));
    }

    saveAttendance() {
        localStorage.setItem('attendance', JSON.stringify(this.attendance));
    }

    saveActivities() {
        localStorage.setItem('activities', JSON.stringify(this.activities));
    }
}

// Initialize the application
const app = new AttendanceManager();

// Add CSS for report table
const style = document.createElement('style');
style.textContent = `
    .report-summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 20px;
    }
    
    .summary-item {
        text-align: center;
        padding: 20px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    
    .summary-item h4 {
        color: #718096;
        font-size: 0.9rem;
        margin-bottom: 10px;
        font-weight: 500;
    }
    
    .summary-item p {
        color: #2d3748;
        font-size: 1.5rem;
        font-weight: 700;
    }
    
    .report-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    
    .report-table th,
    .report-table td {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
    }
    
    .report-table th {
        background: #f8fafc;
        font-weight: 600;
        color: #2d3748;
    }
    
    .report-table tr:hover {
        background: #f8fafc;
    }
    
    .report-table tr:last-child td {
        border-bottom: none;
    }
`;
document.head.appendChild(style); 