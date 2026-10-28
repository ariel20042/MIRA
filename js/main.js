        // Hebrew month names mapping
        const hebrewMonths = [
            'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
            'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
        ];

        // State
        let entries = JSON.parse(localStorage.getItem('sub_teaching_entries')) || [];

        // DOM Elements
        const subForm = document.getElementById('subForm');
        const entryDate = document.getElementById('entryDate');
        const entryHours = document.getElementById('entryHours');
        const entryNote = document.getElementById('entryNote');
        const toggleNoteBtn = document.getElementById('toggleNoteBtn');
        const noteContainer = document.getElementById('noteContainer');
        const entriesTableBody = document.getElementById('entriesTableBody');
        const totalHoursEl = document.getElementById('totalHours');
        const activeMonthsEl = document.getElementById('activeMonths');
        const monthlyCard = document.getElementById('monthlyCard');
        const monthlyBreakdownList = document.getElementById('monthlyBreakdownList');
        const exportBtn = document.getElementById('exportBtn');

        // Set default date to today
        function setDefaultDate() {
            const today = new Date().toISOString().split('T')[0];
            entryDate.value = today;
        }

        // Toggle Note Visibility
        toggleNoteBtn.addEventListener('click', () => {
            const isVisible = noteContainer.classList.toggle('show');
            toggleNoteBtn.classList.toggle('active', isVisible);
            if (!isVisible) {
                entryNote.value = ''; // clear when hidden
            } else {
                entryNote.focus();
            }
        });

        exportBtn.addEventListener('click', exportToTXT);

        entriesTableBody.addEventListener('click', (event) => {
            const deleteButton = event.target.closest('.btn-delete');
            if (deleteButton) {
                deleteEntry(deleteButton.dataset.entryId);
            }
        });

        // Save to localStorage and update UI
        function saveData() {
            localStorage.setItem('sub_teaching_entries', JSON.stringify(entries));
            render();
        }

        // Add new entry
        subForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const date = entryDate.value;
            const hours = parseFloat(entryHours.value);
            const note = entryNote.value.trim();

            if (!date || isNaN(hours) || hours <= 0) return;

            const newEntry = {
                id: Date.now().toString(),
                date,
                hours,
                note
            };

            entries.unshift(newEntry); // Add to beginning
            saveData();

            // Reset form
            entryHours.value = '';
            entryNote.value = '';
            noteContainer.classList.remove('show');
            toggleNoteBtn.classList.remove('active');
            setDefaultDate();
        });

        // Delete entry
        function deleteEntry(id) {
            if (confirm('האם למשוך/למחוק רישום זה?')) {
                entries = entries.filter(entry => entry.id !== id);
                saveData();
            }
        }

        // Format Date to Israeli DD/MM/YYYY style
        function formatDateHebrew(dateString) {
            if (!dateString) return '';
            const parts = dateString.split('-');
            if (parts.length !== 3) return dateString;
            return `${parts[2]}.${parts[1]}.${parts[0]}`;
        }

        // Render everything
        function render() {
            // Sort entries by date descending
            entries.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Clear table
            entriesTableBody.innerHTML = '';

            if (entries.length === 0) {
                entriesTableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="no-data">
                            <i class="fa-solid fa-inbox no-data-icon"></i>
                            טרם הוזנו שעות. הזן את השעות הראשונות למעלה!
                        </td>
                    </tr>
                `;
                totalHoursEl.textContent = '0';
                activeMonthsEl.textContent = '0';
                monthlyCard.classList.add('is-hidden');
                return;
            }

            // Calculate totals and monthly breakdown
            let total = 0;
            const monthlyData = {};

            entries.forEach(entry => {
                total += Number(entry.hours);

                // Extract YYYY-MM for grouping
                const [year, month] = entry.date.split('-');
                const monthKey = `${year}-${month}`;
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = {
                        year,
                        monthNum: parseInt(month, 10),
                        total: 0
                    };
                }
                monthlyData[monthKey].total += Number(entry.hours);

                // Create table row
                const tr = document.createElement('tr');
                const dateCell = document.createElement('td');
                const date = document.createElement('strong');
                date.textContent = formatDateHebrew(entry.date);
                dateCell.appendChild(date);

                const hoursCell = document.createElement('td');
                const hours = document.createElement('span');
                hours.className = 'hours-value';
                hours.textContent = `${entry.hours} ש'`;
                hoursCell.appendChild(hours);

                const noteCell = document.createElement('td');
                noteCell.className = 'entry-note';
                noteCell.textContent = entry.note || '—';

                const deleteCell = document.createElement('td');
                deleteCell.className = 'delete-cell';
                const deleteButton = document.createElement('button');
                deleteButton.className = 'btn-delete';
                deleteButton.dataset.entryId = entry.id;
                deleteButton.title = 'מחיקה';
                deleteButton.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
                deleteCell.appendChild(deleteButton);

                tr.append(dateCell, hoursCell, noteCell, deleteCell);
                entriesTableBody.appendChild(tr);
            });

            // Update Dashboard cards
            totalHoursEl.textContent = total % 1 === 0 ? total : total.toFixed(1);
            
            const activeMonthsKeys = Object.keys(monthlyData);
            activeMonthsEl.textContent = activeMonthsKeys.length;

            // Render monthly breakdown chips
            monthlyBreakdownList.innerHTML = '';
            activeMonthsKeys.sort().reverse().forEach(key => {
                const data = monthlyData[key];
                const monthName = hebrewMonths[data.monthNum - 1];
                const chip = document.createElement('div');
                chip.className = 'month-chip';
                chip.innerHTML = `
                    <div class="month-name">${monthName} ${data.year}</div>
                    <div class="month-hours">${data.total % 1 === 0 ? data.total : data.total.toFixed(1)} ש'</div>
                `;
                monthlyBreakdownList.appendChild(chip);
            });
            monthlyCard.classList.remove('is-hidden');
        }

        // Export to TXT file
        function exportToTXT() {
            if (entries.length === 0) {
                alert('אין נתונים לייצוא.');
                return;
            }

            // Sort chronologically from oldest to newest for the report
            const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));

            let txtLines = [];

            sortedEntries.forEach(entry => {
                const formattedDate = formatDateHebrew(entry.date);
                const hours = entry.hours;
                const noteStr = entry.note && entry.note.trim() !== '' ? ` - ${entry.note.trim()}` : '';
                txtLines.push(`${formattedDate}: ${hours} שעות${noteStr}`);
            });

            // BOM (\uFEFF) for Hebrew support in Windows Notepad
            const txtContent = '\uFEFF' + txtLines.join('\r\n');

            const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', `שעות_מילוי_מקום_${new Date().toISOString().split('T')[0]}.txt`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // Initial setup
        setDefaultDate();
        render();
    