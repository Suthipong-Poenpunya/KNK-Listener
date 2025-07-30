document.addEventListener('DOMContentLoaded', () => {
    const quizArea = document.getElementById('quiz-area');
    const nextBtn = document.getElementById('next-btn');
    const questionCounter = document.getElementById('question-counter');
    const assessmentContainer = document.getElementById('assessment-container');
    const resultContainer = document.getElementById('result-container');
    const scoreDisplay = document.getElementById('score-display');
    const levelDisplay = document.getElementById('level-display');
    const levelDescription = document.getElementById('level-description');
    const restartBtn = document.getElementById('restart-btn');

    let questions = [];
    const options = [
        { text: "ไม่เลย", value: 0 },
        { text: "น้อยครั้ง", value: 1 },
        { text: "บางครั้ง", value: 2 },
        { text: "บ่อยครั้ง", value: 3 },
        { text: "เป็นประจำ", value: 4 }
    ];
    let currentQuestionIndex = 0;
    let userAnswers = [];

    // Function to fetch questions from PHP backend
    async function fetchQuestions() {
        try {
            const response = await fetch('/EDU-Listener/api/questions.php');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            questions = await response.json();
            if (questions.length > 0) {
                userAnswers = new Array(questions.length).fill(null);
                showQuestion();
                nextBtn.disabled = false;
            } else {
                quizArea.innerHTML = '<p class="text-center text-red-500">ไม่พบคำถาม กรุณาตรวจสอบฐานข้อมูล.</p>';
                nextBtn.disabled = true;
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
            quizArea.innerHTML = '<p class="text-center text-red-500">เกิดข้อผิดพลาดในการโหลดคำถาม.</p>';
            nextBtn.disabled = true;
        }
    }

    function showQuestion() {
        const question = questions[currentQuestionIndex];
        let optionsHtml = '';
        options.forEach((opt, index) => {
            optionsHtml += `
                <label class="block p-4 border border-gray-300 rounded-lg mb-3 cursor-pointer hover:bg-gray-200 transition">
                    <input type="radio" name="answer" value="${opt.value}" data-question-id="${question.question_id}" class="mr-3" ${userAnswers[currentQuestionIndex] === opt.value ? 'checked' : ''}>
                    ${opt.text}
                </label>
            `;
        });
        quizArea.innerHTML = `
            <h3 class="text-xl font-semibold text-dark mb-6">${currentQuestionIndex + 1}. ${question.question_text}</h3>
            <div>${optionsHtml}</div>
        `;
        questionCounter.textContent = `คำถาม ${currentQuestionIndex + 1} จาก ${questions.length}`;

        document.querySelectorAll('input[name="answer"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                userAnswers[currentQuestionIndex] = parseInt(e.target.value);
            });
        });

        if (currentQuestionIndex === questions.length - 1) {
            nextBtn.textContent = 'ส่งคำตอบ';
        } else {
            nextBtn.textContent = 'ต่อไป';
        }
    }

    async function submitAssessment() {
        const collectedAnswers = questions.map((q, index) => ({
            questionId: q.question_id,
            value: userAnswers[index]
        }));

        try {
            const response = await fetch('/EDU-Listener/api/assess.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ answers: collectedAnswers })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            showResult(result.score, result.stressLevel);

        } catch (error) {
            console.error('Error submitting assessment:', error);
            alert('เกิดข้อผิดพลาดในการส่งแบบประเมิน: ' + error.message); // Use custom modal in real app
        }
    }

    function showResult(finalScore, stressLevel) {
        let description = '';
        let colorClass = 'text-accent';

        if (stressLevel === 'ต่ำ') {
            description = 'คุณจัดการกับความเครียดได้ดีเยี่ยม ดูเหมือนว่าคุณจะมีความสุขและผ่อนคลายในชีวิตประจำวัน';
            colorClass = 'text-green-500';
        } else if (stressLevel === 'ปานกลาง') {
            description = 'คุณมีความเครียดอยู่บ้าง ซึ่งเป็นเรื่องปกติ ลองหาเวลาพักผ่อนหรือทำกิจกรรมที่ชอบเพื่อผ่อนคลาย';
            colorClass = 'text-yellow-500';
        } else if (stressLevel === 'สูง') {
            description = 'คุณกำลังเผชิญกับความเครียดในระดับที่น่าเป็นห่วง ควรหาทางจัดการอย่างจริงจัง หรือปรึกษาเพื่อน, ครอบครัว, หรือครูที่ปรึกษา';
            colorClass = 'text-orange-500';
        } else if (stressLevel === 'สูงมาก') {
            description = 'ระดับความเครียดของคุณอยู่ในเกณฑ์ที่ต้องได้รับการดูแลอย่างเร่งด่วน การปรึกษาผู้เชี่ยวชาญหรือจิตแพทย์เป็นทางเลือกที่ดีที่สุด';
            colorClass = 'text-red-500';
        }

        assessmentContainer.classList.add('hidden');
        resultContainer.classList.remove('hidden');

        scoreDisplay.textContent = `${finalScore}/100`;
        scoreDisplay.className = `text-6xl font-bold my-4 ${colorClass}`;
        levelDisplay.textContent = `ระดับความเครียด: ${stressLevel}`;
        levelDescription.textContent = description;
    }

    nextBtn.addEventListener('click', () => {
        if (userAnswers[currentQuestionIndex] === null) {
            alert('กรุณาเลือกคำตอบ'); // Use custom modal in real app
            return;
        }
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            showQuestion();
        } else {
            submitAssessment();
        }
    });

    restartBtn.addEventListener('click', () => {
        currentQuestionIndex = 0;
        userAnswers = new Array(questions.length).fill(null);
        resultContainer.classList.add('hidden');
        assessmentContainer.classList.remove('hidden');
        showQuestion();
    });

    // --- Analytics Chart ---
    let analyticsChartInstance; // To store the Chart.js instance

    async function loadAnalyticsChart() {
        try {
            const response = await fetch('/EDU-Listener/api/analytics.php');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Process data for chart
            const scoresByLevel = {};
            data.forEach(item => {
                if (!scoresByLevel[item.stress_level]) {
                    scoresByLevel[item.stress_level] = { count: 0, totalScore: 0 };
                }
                scoresByLevel[item.stress_level].count++;
                scoresByLevel[item.stress_level].totalScore += parseInt(item.score);
            });

            const labels = Object.keys(scoresByLevel).sort((a, b) => {
                const order = { 'ต่ำ': 1, 'ปานกลาง': 2, 'สูง': 3, 'สูงมาก': 4 };
                return order[a] - order[b];
            });
            const avgScores = labels.map(level => {
                const { count, totalScore } = scoresByLevel[level];
                return count > 0 ? Math.round(totalScore / count) : 0;
            });

            const backgroundColors = labels.map(level => {
                if (level === 'ต่ำ') return 'rgba(163, 177, 138, 0.6)'; // Greenish
                if (level === 'ปานกลาง') return 'rgba(255, 206, 86, 0.6)'; // Yellowish
                if (level === 'สูง') return 'rgba(255, 159, 64, 0.6)'; // Orangish
                if (level === 'สูงมาก') return 'rgba(255, 99, 132, 0.6)'; // Reddish
                return 'rgba(100, 100, 100, 0.6)';
            });
            const borderColors = labels.map(level => {
                if (level === 'ต่ำ') return 'rgba(163, 177, 138, 1)';
                if (level === 'ปานกลาง') return 'rgba(255, 206, 86, 1)';
                if (level === 'สูง') return 'rgba(255, 159, 64, 1)';
                if (level === 'สูงมาก') return 'rgba(255, 99, 132, 1)';
                return 'rgba(100, 100, 100, 1)';
            });


            const ctx = document.getElementById('analyticsChart').getContext('2d');
            if (analyticsChartInstance) {
                analyticsChartInstance.destroy(); // Destroy existing chart instance if any
            }
            analyticsChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'คะแนนความเครียดเฉลี่ย',
                        data: avgScores,
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'คะแนนความเครียดเฉลี่ย (0-100)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'ระดับความเครียด'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return ` คะแนนเฉลี่ย: ${context.raw}`;
                                }
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error loading analytics chart:', error);
            const chartContainer = document.querySelector('#analytics .chart-container');
            chartContainer.innerHTML = '<p class="text-center text-red-500">ไม่สามารถโหลดข้อมูลการวิเคราะห์ได้.</p>';
        }
    }

    const complaintsData = [
        {
            order: 1,
            problemName: "อินเทอร์เน็ตหอพักไม่เสถียร",
            submissionDate: "2024-07-20",
            status: "กำลังดำเนินการ",
            details: "อินเทอร์เน็ตในหอพักอาคาร A ชั้น 3 มีปัญหาหลุดบ่อยและช้ามากในช่วงเย็นถึงกลางคืน ทำให้ไม่สามารถเรียนออนไลน์ได้สะดวก",
            suggestions: "ควรปรับปรุงระบบเครือข่ายอินเทอร์เน็ตให้มีความเสถียรมากขึ้น และเพิ่มแบนด์วิดท์ในช่วงเวลาที่มีผู้ใช้งานหนาแน่น"
        },
        {
            order: 2,
            problemName: "ห้องน้ำคณะสกปรก",
            submissionDate: "2024-07-22",
            status: "รอการตรวจสอบ",
            details: "ห้องน้ำชายชั้น 2 อาคารเรียนรวม ไม่ได้รับการทำความสะอาดมาหลายวัน มีกลิ่นไม่พึงประสงค์และสุขภัณฑ์สกปรก",
            suggestions: "ควรมีการทำความสะอาดห้องน้ำอย่างสม่ำเสมอ อย่างน้อยวันละ 2 ครั้ง และจัดหาอุปกรณ์ทำความสะอาดให้เพียงพอ"
        },
        {
            order: 3,
            problemName: "เครื่องปรับอากาศในห้องเรียนไม่เย็น",
            submissionDate: "2024-07-25",
            status: "แก้ไขแล้ว",
            details: "เครื่องปรับอากาศในห้อง 405 อาคารบรรยายรวมไม่ทำงาน ทำให้ห้องเรียนร้อนมากและไม่เอื้อต่อการเรียนการสอน",
            suggestions: "ควรมีการบำรุงรักษาเครื่องปรับอากาศเป็นประจำ และมีเจ้าหน้าที่พร้อมซ่อมแซมเมื่อเกิดปัญหา"
        },
        {
            order: 4,
            problemName: "ปัญหาการลงทะเบียนวิชาเลือก",
            submissionDate: "2024-07-26",
            status: "ปิดเรื่อง",
            details: "ไม่สามารถลงทะเบียนวิชาเลือกเสรีได้เนื่องจากระบบแจ้งว่าเต็ม ทั้งที่ยังมีที่นั่งว่างตามประกาศ",
            suggestions: "ควรตรวจสอบระบบการลงทะเบียนให้ถูกต้อง และแจ้งจำนวนที่นั่งที่แท้จริงให้ชัดเจน"
        },
        {
            order: 5,
            problemName: "อาหารในโรงอาหารแพงเกินไป",
            submissionDate: "2024-07-27",
            status: "รอการตรวจสอบ",
            details: "ราคาอาหารในโรงอาหารบางร้านปรับขึ้นสูงมาก ไม่เหมาะสมกับปริมาณและคุณภาพที่ได้รับ",
            suggestions: "ควรมีการควบคุมราคาอาหารในโรงอาหารให้เหมาะสมกับค่าครองชีพของนิสิต และตรวจสอบคุณภาพอาหาร"
        },
        {
            order: 6,
            problemName: "น้ำไม่ไหลในอาคารเรียน",
            submissionDate: "2024-07-28",
            status: "กำลังดำเนินการ",
            details: "น้ำประปาไม่ไหลในห้องน้ำและก๊อกน้ำบริเวณชั้น 1 ของอาคารวิทยาศาสตร์ ทำให้ไม่สามารถทำธุระส่วนตัวได้",
            suggestions: "ควรแจ้งเตือนล่วงหน้าหากมีการปิดซ่อมบำรุงระบบน้ำ และเร่งแก้ไขปัญหาให้เร็วที่สุด"
        }
    ];

    const complaintTableBody = document.getElementById('complaintTableBody');
    const detailModal = document.getElementById('detailModal');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');

    // Function to render the table rows
    function renderTable(data) {
        complaintTableBody.innerHTML = ''; // Clear existing rows
        if (data.length === 0) {
            complaintTableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="px-4 py-4 text-center text-gray-500 text-base">
                            ไม่พบข้อมูลการร้องเรียน
                        </td>
                    </tr>
                `;
            return;
        }

        data.forEach(complaint => {
            const row = document.createElement('tr');
            row.classList.add('hover:bg-gray-50', 'cursor-pointer', 'transition-colors', 'duration-200');
            row.innerHTML = `
                    <td class="px-4 py-3 sm:px-6 whitespace-nowrap text-sm font-medium text-gray-900">${complaint.order}</td>
                    <td class="px-4 py-3 sm:px-6 whitespace-nowrap text-sm text-gray-800">${complaint.problemName}</td>
                    <td class="px-4 py-3 sm:px-6 whitespace-nowrap text-sm text-gray-600">${complaint.submissionDate}</td>
                    <td class="px-4 py-3 sm:px-6 whitespace-nowrap text-sm">
                        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${complaint.status === 'แก้ไขแล้ว' ? 'bg-green-100 text-green-800' : ''}
                            ${complaint.status === 'กำลังดำเนินการ' ? 'bg-blue-100 text-blue-800' : ''}
                            ${complaint.status === 'รอการตรวจสอบ' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${complaint.status === 'ปิดเรื่อง' ? 'bg-gray-100 text-gray-800' : ''}
                        ">
                            ${complaint.status}
                        </span>
                    </td>
                `;
            row.addEventListener('click', () => showDetails(complaint));
            complaintTableBody.appendChild(row);
        });
    }

    // Function to filter and search data
    function filterAndSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedStatus = statusFilter.value;

        const filteredData = complaintsData.filter(complaint => {
            const matchesSearch = complaint.problemName.toLowerCase().includes(searchTerm) ||
                complaint.status.toLowerCase().includes(searchTerm);
            const matchesStatus = selectedStatus === "" || complaint.status === selectedStatus;
            return matchesSearch && matchesStatus;
        });
        renderTable(filteredData);
    }

    // Event listeners for search and filter
    searchInput.addEventListener('keyup', filterAndSearch);
    statusFilter.addEventListener('change', filterAndSearch);

    // Function to show complaint details in the modal
    function showDetails(complaint) {
        document.getElementById('modalProblemName').textContent = complaint.problemName;
        document.getElementById('modalOrder').textContent = complaint.order;
        document.getElementById('modalSubmissionDate').textContent = complaint.submissionDate;
        document.getElementById('modalStatus').textContent = complaint.status;
        document.getElementById('modalDetails').textContent = complaint.details;
        document.getElementById('modalSuggestions').textContent = complaint.suggestions;

        // Apply status-specific styling to the modal status text
        const modalStatusElement = document.getElementById('modalStatus');
        modalStatusElement.className = 'font-bold'; // Reset classes
        if (complaint.status === 'แก้ไขแล้ว') {
            modalStatusElement.classList.add('text-green-700');
        } else if (complaint.status === 'กำลังดำเนินการ') {
            modalStatusElement.classList.add('text-blue-700');
        } else if (complaint.status === 'รอการตรวจสอบ') {
            modalStatusElement.classList.add('text-yellow-700');
        } else if (complaint.status === 'ปิดเรื่อง') {
            modalStatusElement.classList.add('text-gray-700');
        }

        detailModal.style.display = 'flex'; // Show the modal
        setTimeout(() => { // Add a slight delay for the transform animation
            detailModal.querySelector('.modal-content').classList.add('show');
        }, 10);
    }

    // Function to close the modal
    function closeModal() {
        detailModal.querySelector('.modal-content').classList.remove('show');
        setTimeout(() => { // Hide after animation
            detailModal.style.display = 'none';
        }, 300); // Match CSS transition duration
    }

    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === detailModal) {
            closeModal();
        }
    });

    // Initial render of the table when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        renderTable(complaintsData);
    });
    // Initial load
    fetchQuestions();
    loadAnalyticsChart();
});
