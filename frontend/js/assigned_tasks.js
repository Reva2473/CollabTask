async function loadMyAssignedTasks() {
    try {
        const tasks = await apiCall('/tasks/my_assigned');
        const container = document.getElementById('assigned-tasks-list');
        
        if (!tasks || tasks.length === 0) {
            container.innerHTML = '<div class="text-[10px] text-dark-muted p-2 italic text-center">No immediate tasks assigned.</div>';
            return;
        }

        container.innerHTML = tasks.map(t => {
            const dueStr = t.due_date ? t.due_date.split('-').reverse().join('-') : 'No Date';
            
            let dateClass = 'text-white/60';
            if (t.due_date) {
                const due = new Date(t.due_date);
                const today = new Date();
                today.setHours(0,0,0,0);
                const diffTime = Math.round((due - today) / (1000 * 60 * 60 * 24));
                if (diffTime <= 3) {
                    dateClass = 'text-accent-rose';
                } else if (diffTime <= 5) {
                    dateClass = 'text-accent-amber';
                }
            }

            return `
            <div class="px-2 py-2 bg-dark-surface border border-dark-border rounded-lg shadow-sm hover:border-dark-hover transition-colors mb-1 cursor-pointer" onclick="jumpToTask('${t.project_id}', '${t.id}')">
                <div class="flex items-start justify-between gap-1.5 mb-1">
                    <h5 class="text-[11px] font-bold text-white truncate max-w-[120px] leading-tight" title="${t.title}">${t.title}</h5>
                    <div class="flex items-center gap-1 shrink-0 ${dateClass} bg-dark-base px-1.5 py-0.5 rounded">
                        <svg width="8" height="8" fill="none" class="shrink-0" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        <span class="text-[9px] font-bold tracking-tight">${dueStr}</span>
                    </div>
                </div>
                <div class="flex gap-1.5 items-center mt-1.5">
                    <div class="px-1.5 py-0.5 bg-dark-base/50 rounded flex items-center gap-1">
                        <svg width="8" height="8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="text-dark-muted"><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                        <span class="text-[9px] font-medium text-dark-muted truncate max-w-[60px]" title="${t.project_name}">${t.project_name}</span>
                    </div>
                    <div class="flex-1"></div>
                    <span class="text-[8px] font-medium text-brand-light truncate max-w-[65px] flex items-center gap-0.5" title="${t.root_title}">
                        <svg width="8" height="8" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"></path></svg>
                        ${t.root_title}
                    </span>
                </div>
            </div>
            `;
        }).join('');
    } catch(err) {
        console.error("Failed to load assigned tasks:", err);
    }
}
