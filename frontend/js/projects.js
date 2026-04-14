let allProjects = [];

async function loadProjects() {
    try {
        allProjects = await apiCall('/projects/');
        const list = document.getElementById('projects-list');
        
        
        const activeProjects = [];
        const pendingProjects = [];
        
        for(let p of allProjects) {
            let myMem = p.members.find(x => x.user_id === currentUser.id);
            if(myMem && myMem.status === 'Pending') {
                pendingProjects.push(p);
            } else {
                activeProjects.push(p);
            }
        }
        
        window.pendingProjects = pendingProjects;
        updateNotifications();
        
        if (activeProjects.length === 0) {
            list.innerHTML = '<div class="text-xs text-dark-muted p-4 text-center">No active projects.</div>';
            return;
        }
        
        list.innerHTML = activeProjects.map(p => {
            const isActive = p.id === activeProjectId;
            return `
                <button onclick="selectProject('${p.id}')" class="sidebar-item w-full text-left px-3 py-2.5 text-sm font-medium ${isActive ? 'active text-brand-light' : 'text-dark-muted hover:text-white'}">
                    <span class="truncate block">${p.name}</span>
                </button>
            `;
        }).join('');
        
        if (activeProjectId && activeProjects.find(x=>x.id===activeProjectId)) {
            selectProject(activeProjectId);
        } else {
            document.getElementById('no-project-state').classList.remove('hidden-pane');
            document.getElementById('active-project-state').classList.add('hidden-pane');
        }
        
        if (typeof loadMyAssignedTasks === 'function') loadMyAssignedTasks();
    } catch (err) {
        if(err.message.includes('Token has expired')) document.getElementById('logout-btn').click();
    }
}

window.updateNotifications = function() {
    const badge = document.getElementById('notif-badge');
    const notifBtn = document.getElementById('notification-btn');
    const notifList = document.getElementById('notif-list');
    
    const pendingArray = window.pendingProjects || [];
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const upcomingTasks = (window.allTasks || []).filter(t => {
        if (t.is_done) return false;
        if (!t.due_date) return false;
        const due = new Date(t.due_date);
        const diffTime = (due - today) / (1000 * 60 * 60 * 24);
        const isAssigned = t.assignees && t.assignees.some(a => a.user_id === currentUser.id);
        const isProjectAdmin = userRoleInProject === 'Admin';
        return diffTime >= 0 && diffTime < 5 && (isAssigned || isProjectAdmin);
    });

    const totalNotifs = pendingArray.length + upcomingTasks.length;
    
    if(totalNotifs > 0) {
        badge.classList.remove('hidden-pane');
    } else {
        badge.classList.add('hidden-pane');
    }
    
    if(totalNotifs === 0) {
        notifList.innerHTML = '<div class="text-sm text-dark-muted text-center p-6">You have no notifications.</div>';
    } else {
        let html = '';
        html += pendingArray.map(p => `
            <div class="bg-dark-surface border border-dark-border p-4 rounded-xl">
                <div class="font-semibold text-sm text-white mb-1">Invited to '${p.name}'</div>
                <div class="text-xs text-dark-muted mb-3">You have been invited to join this project.</div>
                <div class="flex gap-2">
                    <button onclick="respondInvite('${p.id}', 'accept')" class="px-3 py-2 btn-primary rounded-lg text-xs font-semibold w-full">Accept</button>
                    <button onclick="respondInvite('${p.id}', 'decline')" class="px-3 py-2 bg-dark-hover text-accent-rose hover:bg-accent-rose/10 border border-dark-border hover:border-accent-rose/20 rounded-lg text-xs font-semibold w-full transition-all">Decline</button>
                </div>
            </div>
        `).join('');
        
        html += upcomingTasks.map(t => {
            const due = new Date(t.due_date);
            const diffTime = Math.round((due - today) / (1000 * 60 * 60 * 24));
            const daysStr = diffTime === 0 ? 'Today' : (diffTime === 1 ? 'Tomorrow' : `In ${diffTime} days`);
            
            return `
            <div class="bg-dark-surface border border-accent-amber/30 p-4 rounded-xl">
                <div class="flex items-center gap-2 mb-1">
                    <svg class="text-accent-amber w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <div class="font-semibold text-sm text-white truncate flex-1">${t.title}</div>
                </div>
                <div class="text-xs text-dark-muted mt-1 leading-relaxed">Task is due <span class="text-accent-amber font-semibold">${daysStr}</span>. Make sure to complete it.</div>
            </div>
            `;
        }).join('');
        
        notifList.innerHTML = html;
    }
}

document.getElementById('notification-btn').addEventListener('click', () => {
    document.getElementById('notif-modal').classList.remove('hidden-pane');
});

window.respondInvite = async function(projectId, action) {
    try {
        await apiCall(`/projects/${projectId}/invite`, 'PUT', { action });
        document.getElementById('notif-modal').classList.add('hidden-pane');
        loadProjects();
    } catch(err) { alert(err.message); }
}

function getRoleHtml(role, extraClasses='text-[9px]') {
    let classes = `uppercase font-bold border px-1.5 py-0.5 rounded-md ${extraClasses} `;
    let style = "";
    if(role === 'Admin') classes += 'text-accent-rose bg-accent-rose/10 border-accent-rose/20';
    else if(role === 'Viewer') classes += 'text-dark-muted bg-dark-surface border-dark-border';
    else if(activeProjectId) {
        const p = allProjects.find(x => x.id === activeProjectId);
        if(p && p.custom_roles) {
            const cr = p.custom_roles.find(r => r.name === role);
            if(cr && cr.color) {
                style = `style="color: ${cr.color}; background-color: ${cr.color}1a; border-color: ${cr.color}33"`;
            } else classes += 'text-brand-light bg-brand-default/10 border-brand-default/20';
        }
    }
    return `<span class="${classes}" ${style}>${role}</span>`;
}

async function selectProject(id) {
    activeProjectId = id;
    const project = allProjects.find(p => p.id === id);
    if (!project) return;
    
    
    const listBtns = document.getElementById('projects-list').children;
    Array.from(listBtns).forEach(btn => {
        if(btn.textContent.trim() === project.name) {
            btn.className = "sidebar-item active w-full text-left px-3 py-2.5 text-sm font-medium text-brand-light";
        } else {
            btn.className = "sidebar-item w-full text-left px-3 py-2.5 text-sm font-medium text-dark-muted hover:text-white";
        }
    });

    document.getElementById('no-project-state').classList.add('hidden-pane');
    document.getElementById('active-project-state').classList.remove('hidden-pane');
    
    document.getElementById('active-project-name').textContent = project.name;
    document.getElementById('active-project-desc').textContent = project.description || 'No description provided.';
    
    
    userRoleInProject = 'Viewer';
    if (project.owner_id === currentUser.id) userRoleInProject = 'Admin';
    else {
        const m = project.members.find(x => x.user_id === currentUser.id);
        if (m) userRoleInProject = m.role;
    }
    
    const roleSpan = document.getElementById('active-project-role');
    const roleHtml = getRoleHtml(userRoleInProject, 'text-xs');
    roleSpan.outerHTML = roleHtml.replace('<span', '<span id="active-project-role"');
    
    
    const delBtn = document.getElementById('delete-project-btn');
    const leaveBtn = document.getElementById('leave-project-btn');
    const addBtn = document.getElementById('show-add-member-btn');
    
    delBtn.classList.add('hidden-pane');
    leaveBtn.classList.add('hidden-pane');
    addBtn.classList.add('hidden-pane');
    
    if (userRoleInProject === 'Admin') {
        delBtn.classList.remove('hidden-pane');
        addBtn.classList.remove('hidden-pane');
        document.getElementById('show-add-role-btn').classList.remove('hidden-pane');
        
        if(project.owner_id === currentUser.id) {
            document.getElementById('show-edit-project-btn').classList.remove('hidden-pane');
        } else {
            document.getElementById('show-edit-project-btn').classList.add('hidden-pane');
        }
    } else {
        document.getElementById('show-add-role-btn').classList.add('hidden-pane');
        document.getElementById('show-edit-project-btn').classList.add('hidden-pane');
        leaveBtn.classList.remove('hidden-pane');
    }
    
    const rootTaskBtn = document.getElementById('new-root-task-btn');
    if (userRoleInProject === 'Viewer') {
        rootTaskBtn.classList.add('hidden-pane');
    } else {
        rootTaskBtn.classList.remove('hidden-pane');
    }
    
    
    projectMembers = project.members.filter(m => m.status === 'Joined');
    
    
    if(project.owner_id === currentUser.id) {
        document.getElementById('edit-proj-name').value = project.name;
        document.getElementById('edit-proj-desc').value = project.description || '';
    }

    switchTab('workflow');
    await loadTasks(); 
    renderRoles(project.custom_roles);
}

function renderMembers(members) {
    const list = document.getElementById('project-members-list');
    list.innerHTML = members.map(m => {
        const roleTag = getRoleHtml(m.role, 'text-[10px]');
        const canEdit = userRoleInProject === 'Admin' && m.user_id !== currentUser.id;
        
        
        const memberCompletedTasks = allTasks.filter(t => 
            t.is_done && 
            t.assignees && 
            t.assignees.some(a => a.user_id === m.user_id)
        );

        const tasksHtml = memberCompletedTasks.map(t => {
            const dateStr = t.completed_at ? new Date(t.completed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A';
            return `
                <div class="text-xs border-t border-dark-border py-2 flex justify-between gap-4 text-dark-muted">
                    <span class="truncate">${t.title}</span>
                    <span class="whitespace-nowrap opacity-60 text-[10px]">${dateStr}</span>
                </div>
            `;
        }).join('');

        const noTasksHtml = `<div class="text-xs italic text-dark-muted py-2 border-t border-dark-border mt-2">No tasks completed yet.</div>`;

        return `
        <div class="flex flex-col bg-dark-panel border border-dark-border rounded-xl overflow-hidden transition-all duration-200">
            <div class="p-4 flex items-center justify-between gap-3 ${canEdit ? 'hover:bg-dark-hover cursor-pointer group' : ''}">
                <div class="flex-1 overflow-hidden" ${canEdit ? `onclick="triggerEditMemberRole('${m.user_id}', '${m.username}', '${m.role}')"` : ''}>
                    <div class="flex items-center gap-2 mb-1">
                        <div class="w-6 h-6 rounded-full bg-gradient-to-br from-brand-default/20 to-brand-hover/10 border border-brand-default/15 flex items-center justify-center text-[10px] font-bold text-brand-light flex-shrink-0">${m.username.charAt(0).toUpperCase()}</div>
                        <span class="text-sm font-semibold text-white truncate ${m.status === 'Pending' ? 'opacity-50' : ''}">${m.username} ${m.status === 'Pending' ? '(Pending)' : ''}</span>
                        ${roleTag}
                    </div>
                    ${canEdit ? `<div class="text-[10px] text-brand-light opacity-0 group-hover:opacity-100 transition-opacity ml-8">Click to edit role</div>` : '<div class="text-[10px] text-transparent ml-8">No action</div>'}
                </div>
                
                <button onclick="toggleMemberAccordion('${m.user_id}')" class="p-2 rounded-lg bg-dark-surface border border-dark-border text-dark-muted hover:text-white hover:border-brand-default/30 transition-all" title="View Contributions">
                    <svg id="accordion-icon-${m.user_id}" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" class="transform transition-transform duration-200"><path d="M19 9l-7 7-7-7"></path></svg>
                </button>
            </div>
            
            <div id="accordion-content-${m.user_id}" class="hidden-pane bg-dark-surface px-4 pb-3 border-t border-dark-border">
                <div class="flex items-center gap-2 mt-3 mb-2">
                    <h4 class="text-[11px] font-bold text-white uppercase tracking-wider flex-1">Completed Tasks</h4>
                    <span class="px-1.5 py-0.5 rounded-full bg-brand-default/20 text-brand-light text-[9px] font-bold border border-brand-default/20">${memberCompletedTasks.length}</span>
                </div>
                <div class="max-h-40 overflow-y-auto pr-2">
                    ${memberCompletedTasks.length > 0 ? tasksHtml : noTasksHtml}
                </div>
            </div>
        </div>
    `}).join('');
}

window.toggleMemberAccordion = function(userId) {
    const content = document.getElementById(`accordion-content-${userId}`);
    const icon = document.getElementById(`accordion-icon-${userId}`);
    
    if(content.classList.contains('hidden-pane')) {
        content.classList.remove('hidden-pane');
        icon.classList.add('rotate-180');
    } else {
        content.classList.add('hidden-pane');
        icon.classList.remove('rotate-180');
    }
}


