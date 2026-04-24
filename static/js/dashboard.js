document.addEventListener('DOMContentLoaded', () => {
    const targetRoleSelect = document.getElementById('targetRole');
    const skillsContainer = document.getElementById('skillsContainer');
    
    // Handle role saving via AJAX
    if(targetRoleSelect) {
        targetRoleSelect.addEventListener('change', async (e) => {
            const role = e.target.value;
            // Provide a quick feedback loading state
            targetRoleSelect.disabled = true;
            try {
                const response = await fetch('/api/save-target-role', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ role: role })
                });
                const data = await response.json();
                if(data.success) {
                    // Quick flash feedback using a dynamic toast or just re-enabling
                    targetRoleSelect.disabled = false;
                }
            } catch (err) {
                console.error("Error saving role", err);
                targetRoleSelect.disabled = false;
            }
        });
    }

    // Load skills
    async function loadSkills() {
        try {
            const response = await fetch('/api/get-user-skills');
            const skills = await response.json();
            window.cachedSkills = skills;

            renderSkillsList(skills);
            
            const chartView = document.getElementById('chart-view');
            if(chartView && chartView.classList.contains('active')) {
                renderChart(window.cachedSkills);
            }
        } catch (err) {
            console.error("Error fetching skills", err);
            if(skillsContainer) {
                skillsContainer.innerHTML = '<div class="alert alert-danger">Error loading skills. Please refresh.</div>';
            }
        }
    }

    function renderSkillsList(skills) {
        if(!skillsContainer) return;
        
        if(!skills || skills.length === 0) {
            skillsContainer.innerHTML = `
                <div class="text-center py-5">
                    <div class="rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm border border-light border-opacity-10" style="width: 80px; height: 80px; background: rgba(255,255,255,0.05);">
                        <i class="fa-solid fa-clipboard-list text-white opacity-50 fs-1"></i>
                    </div>
                    <h5 class="fw-bold text-white mb-2">No skills tracked yet</h5>
                    <p class="text-white opacity-50 mb-0">Use the form on the left to add your first skill<br>and begin your JobPath journey.</p>
                </div>
            `;
            return;
        }

        let html = '<div class="d-flex flex-column gap-3">';
        skills.forEach((skill, index) => {
            const percentage = skill.proficiency * 10;
            // We use simple transition animation for width by starting at 0 and updating it after render
            html += `
                <div class="skill-item shadow-sm">
                    <div class="d-flex justify-content-between align-items-center pb-2">
                        <span class="fw-bold text-dark fs-5">${skill.skill_name}</span>
                        <div class="d-flex align-items-center gap-3">
                            <span class="badge bg-light text-primary border border-primary border-opacity-25 px-3 py-2 rounded-pill shadow-sm">Level ${skill.proficiency}/10</span>
                            <form action="/delete-skill/${skill.id}" method="POST" class="m-0 p-0">
                                <button type="submit" class="btn btn-sm text-danger p-2 hover-elevate bg-light rounded-circle" title="Delete skill">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                      <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                    <div class="progress mt-2" style="height: 12px; background-color: #f1f3f5;">
                        <div class="progress-bar" role="progressbar" style="width: 0%; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s;" aria-valuenow="${skill.proficiency}" aria-valuemin="0" aria-valuemax="10" data-width="${percentage}%"></div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        skillsContainer.innerHTML = html;

        // Trigger animations
        setTimeout(() => {
            const bars = document.querySelectorAll('.progress-bar');
            bars.forEach(bar => {
                bar.style.width = bar.getAttribute('data-width');
            });
        }, 100);
    }

    let radarChart = null;

    function renderChart(skills) {
        if(!document.getElementById('skillsRadarChart')) return;
        
        if(!skills || skills.length === 0) {
            // Give generic chart to make UI look good
            skills = [
                {skill_name: 'Add Skills', proficiency: 5},
                {skill_name: 'To See', proficiency: 5},
                {skill_name: 'Your Graph', proficiency: 5}
            ];
        }

        const labels = skills.map(s => s.skill_name);
        const data = skills.map(s => s.proficiency);

        const ctx = document.getElementById('skillsRadarChart').getContext('2d');
        
        if(radarChart) {
            radarChart.destroy();
        }

        radarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Skill Proficiency',
                    data: data,
                    backgroundColor: 'rgba(13, 110, 253, 0.2)',
                    borderColor: 'rgba(13, 110, 253, 1)',
                    pointBackgroundColor: '#fff',
                    pointBorderColor: 'rgba(13, 110, 253, 1)',
                    pointHoverBackgroundColor: 'rgba(13, 110, 253, 1)',
                    pointHoverBorderColor: '#fff',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    borderWidth: 2,
                    borderJoinStyle: 'round'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        pointLabels: {
                            font: {
                                size: 14,
                                family: "'Inter', sans-serif",
                                weight: '500'
                            },
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        ticks: {
                            min: 0,
                            max: 10,
                            stepSize: 2,
                            display: false,
                            backdropColor: 'transparent'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        padding: 12,
                        titleFont: { family: "'Inter', sans-serif", size: 14 },
                        bodyFont: { family: "'Inter', sans-serif", size: 14 }
                    }
                }
            }
        });
    }

    // Trigger loads
    if(skillsContainer) {
        loadSkills();
    }
    
    // Tab switching chart redraw fix
    const chartTab = document.getElementById('chart-tab');
    if(chartTab) {
        chartTab.addEventListener('shown.bs.tab', () => {
            if(!radarChart && window.cachedSkills) {
                renderChart(window.cachedSkills);
            } else if(radarChart) {
                radarChart.resize();
            }
        });
    }
});
