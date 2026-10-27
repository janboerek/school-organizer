

// --- TYPEN & INTERFACES ---
interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

interface ToDo {
  id: string;
  text: string;
  completed: boolean;
  assignedTo: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  notes: string;
}

interface Project {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: 'Geplant' | 'In Bearbeitung' | 'Fertig';
  ownerId: string;
  members: string[]; // E-Mails oder User-IDs
  todos: ToDo[];
  meetings: Meeting[];
}

export default function App() {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('school_org_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('school_org_projects');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    // Standard-Beispielprojekt beim ersten Start
    return [
      {
        id: '1',
        title: 'Bio-Referat Photosynthese',
        subject: 'Biologie',
        dueDate: '2026-05-15',
        status: 'In Bearbeitung',
        ownerId: 'demo-user',
        members: ['jan@schule.de', 'anna@schule.de'],
        todos: [
          { id: 't1', text: 'Einleitung & Definition schreiben', completed: true, assignedTo: 'Jan' },
          { id: 't2', text: 'Grafik für Lichtreaktion vorbereiten', completed: false, assignedTo: 'Anna' }
        ],
        meetings: [
          { id: 'm1', title: 'Erstes Brainstorming', date: '2026-05-01', time: '15:00', location: 'Discord / Online', notes: 'Aufteilung der Folien besprochen.' }
        ]
      }
    ];
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'settings'>('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Auth Form State
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');

  // New Project Form
  const [showNewProjModal, setShowNewProjModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newDate, setNewDate] = useState('');

  // Member Invite State
  const [inviteEmail, setInviteEmail] = useState('');

  // New ToDo / Meeting State
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoAssignee, setNewTodoAssignee] = useState('');

  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingDate, setNewMeetingDate] = useState('');
  const [newMeetingTime, setNewMeetingTime] = useState('');
  const [newMeetingLocation, setNewMeetingLocation] = useState('');

  // Speichern in localStorage
  useEffect(() => {
    localStorage.setItem('school_org_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('school_org_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('school_org_current_user');
    }
  }, [currentUser]);

  // Wenn ein Projekt ausgewählt ist, aktualisiere die Ansicht im State
  useEffect(() => {
    if (selectedProject) {
      const updated = projects.find(p => p.id === selectedProject.id);
      if (updated) setSelectedProject(updated);
    }
  }, [projects]);

  // --- LOGIN / REGISTER ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName.trim() || !authEmail.trim()) return;
    const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-purple-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const user: User = {
      id: 'user_' + Date.now(),
      name: authName.trim(),
      email: authEmail.trim().toLowerCase(),
      avatarColor: randomColor
    };
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedProject(null);
  };

  // --- PROJEKT ERSTELLEN ---
  const createProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !currentUser) return;

    const newProj: Project = {
      id: 'proj_' + Date.now(),
      title: newTitle.trim(),
      subject: newSubject.trim() || 'Allgemein',
      dueDate: newDate || new Date().toISOString().split('T')[0],
      status: 'Geplant',
      ownerId: currentUser.id,
      members: [currentUser.email],
      todos: [],
      meetings: []
    };

    setProjects([newProj, ...projects]);
    setNewTitle('');
    setNewSubject('');
    setNewDate('');
    setShowNewProjModal(false);
  };

  const deleteProject = (id: string) => {
    if (confirm('Möchtest du dieses Projekt wirklich löschen?')) {
      setProjects(projects.filter(p => p.id !== id));
      if (selectedProject?.id === id) setSelectedProject(null);
    }
  };

  // --- MITGLIED HINZUFÜGEN ---
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !inviteEmail.trim()) return;
    const email = inviteEmail.trim().toLowerCase();

    if (selectedProject.members.includes(email)) {
      alert('Diese Person ist bereits im Projekt!');
      return;
    }

    const updatedProjects = projects.map(p => {
      if (p.id === selectedProject.id) {
        return { ...p, members: [...p.members, email] };
      }
      return p;
    });

    setProjects(updatedProjects);
    setInviteEmail('');
  };

  const removeMember = (emailToRemove: string) => {
    if (!selectedProject) return;
    const updatedProjects = projects.map(p => {
      if (p.id === selectedProject.id) {
        return { ...p, members: p.members.filter(m => m !== emailToRemove) };
      }
      return p;
    });
    setProjects(updatedProjects);
  };

  // --- TO-DOS ---
  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newTodoText.trim()) return;

    const newTodo: ToDo = {
      id: 'todo_' + Date.now(),
      text: newTodoText.trim(),
      completed: false,
      assignedTo: newTodoAssignee || currentUser?.name || 'Alle'
    };

    const updated = projects.map(p => {
      if (p.id === selectedProject.id) {
        return { ...p, todos: [...p.todos, newTodo] };
      }
      return p;
    });

    setProjects(updated);
    setNewTodoText('');
  };

  const toggleTodo = (todoId: string) => {
    if (!selectedProject) return;
    const updated = projects.map(p => {
      if (p.id === selectedProject.id) {
        const todos = p.todos.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t);
        return { ...p, todos };
      }
      return p;
    });
    setProjects(updated);
  };

  const deleteTodo = (todoId: string) => {
    if (!selectedProject) return;
    const updated = projects.map(p => {
      if (p.id === selectedProject.id) {
        return { ...p, todos: p.todos.filter(t => t.id !== todoId) };
      }
      return p;
    });
    setProjects(updated);
  };

  // --- MEETINGS ---
  const addMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newMeetingTitle.trim()) return;

    const newMeeting: Meeting = {
      id: 'meet_' + Date.now(),
      title: newMeetingTitle.trim(),
      date: newMeetingDate || new Date().toISOString().split('T')[0],
      time: newMeetingTime || '14:00',
      location: newMeetingLocation || 'Online',
      notes: ''
    };

    const updated = projects.map(p => {
      if (p.id === selectedProject.id) {
        return { ...p, meetings: [...p.meetings, newMeeting] };
      }
      return p;
    });

    setProjects(updated);
    setNewMeetingTitle('');
    setNewMeetingLocation('');
  };

  const deleteMeeting = (meetingId: string) => {
    if (!selectedProject) return;
    const updated = projects.map(p => {
      if (p.id === selectedProject.id) {
        return { ...p, meetings: p.meetings.filter(m => m.id !== meetingId) };
      }
      return p;
    });
    setProjects(updated);
  };

  // --- EXPORT / IMPORT ---
  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projects, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "schul_organizer_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // --- RENDER: LOGIN VIEW ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white mb-4 shadow-lg shadow-indigo-500/30">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Schul & Gruppen-Organizer</h1>
            <p className="text-slate-400 text-sm mt-2">Erstelle deinen Account, um deine Projekte und Gruppenarbeiten zu organisieren.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Dein Name</label>
              <input 
                type="text" 
                required
                value={authName}
                onChange={e => setAuthName(e.target.value)}
                placeholder="z.B. Jan Barckmann"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Deine Schul-E-Mail</label>
              <input 
                type="email" 
                required
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                placeholder="z.B. jan@schule.de"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <span>Loslegen</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN APP VIEW ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4">
        <div>
          <div className="flex items-center space-x-3 px-3 py-4 mb-6 border-b border-slate-800">
            <div className={`w-10 h-10 rounded-xl ${currentUser.avatarColor} flex items-center justify-center font-bold text-white shadow`}>
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h2 className="font-semibold truncate text-sm">{currentUser.name}</h2>
              <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => { setActiveTab('dashboard'); setSelectedProject(null); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'dashboard' && !selectedProject ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Übersicht</span>
            </button>
            <button 
              onClick={() => { setActiveTab('projects'); setSelectedProject(null); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'projects' && !selectedProject ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Alle Projekte</span>
            </button>
            <button 
              onClick={() => { setActiveTab('settings'); setSelectedProject(null); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${activeTab === 'settings' && !selectedProject ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Settings className="w-4 h-4" />
              <span>Einstellungen</span>
            </button>
          </nav>
        </div>

        {/* Schnellzugriff Projekte in Sidebar */}
        <div className="mt-8 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Deine Projekte</span>
            <button onClick={() => setShowNewProjModal(true)} className="text-indigo-400 hover:text-indigo-300">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs truncate transition-colors ${selectedProject?.id === p.id ? 'bg-slate-800 text-indigo-400 font-semibold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
              >
                📌 {p.title}
              </button>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button 
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <span>Schul-Organizer</span>
            <span>/</span>
            <span className="text-slate-200 font-semibold">
              {selectedProject ? selectedProject.title : activeTab === 'dashboard' ? 'Übersicht' : activeTab === 'projects' ? 'Projekte' : 'Einstellungen'}
            </span>
          </div>
          <button 
            onClick={() => setShowNewProjModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Neues Projekt</span>
          </button>
        </header>

        <div className="p-8 max-w-6xl w-full mx-auto">

          {/* PROJECT DETAIL VIEW */}
          {selectedProject ? (
            <div className="space-y-8">
              {/* Projekt Header */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {selectedProject.subject}
                    </span>
                    <h1 className="text-2xl font-bold mt-2">{selectedProject.title}</h1>
                    <p className="text-sm text-slate-400 mt-1">Fällig am: {selectedProject.dueDate}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedProject.status}
                      onChange={(e) => {
                        const status = e.target.value as any;
                        setProjects(projects.map(p => p.id === selectedProject.id ? { ...p, status } : p));
                      }}
                      className="bg-slate-800 border border-slate-700 text-sm rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Geplant">Geplant</option>
                      <option value="In Bearbeitung">In Bearbeitung</option>
                      <option value="Fertig">Fertig</option>
                    </select>
                    <button 
                      onClick={() => deleteProject(selectedProject.id)}
                      className="p-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid: Mitglieder & To-Dos */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Linke Spalte: To-Dos & Meetings */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* To-Do Liste */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold flex items-center space-x-2">
                        <CheckSquare className="w-5 h-5 text-indigo-400" />
                        <span>Aufgaben (To-Dos)</span>
                      </h3>
                      <span className="text-xs text-slate-400">
                        {selectedProject.todos.filter(t => t.completed).length} von {selectedProject.todos.length} erledigt
                      </span>
                    </div>

                    <form onSubmit={addTodo} className="flex gap-2 mb-6">
                      <input 
                        type="text"
                        placeholder="Neue Aufgabe..."
                        value={newTodoText}
                        onChange={e => setNewTodoText(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                      <input 
                        type="text"
                        placeholder="Zugewiesen an..."
                        value={newTodoAssignee}
                        onChange={e => setNewTodoAssignee(e.target.value)}
                        className="w-32 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                      <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                        Hinzufügen
                      </button>
                    </form>

                    <div className="space-y-2">
                      {selectedProject.todos.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">Noch keine Aufgaben eingetragen.</p>
                      ) : (
                        selectedProject.todos.map(todo => (
                          <div key={todo.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800/60 rounded-xl">
                            <label className="flex items-center space-x-3 cursor-pointer flex-1">
                              <input 
                                type="checkbox"
                                checked={todo.completed}
                                onChange={() => toggleTodo(todo.id)}
                                className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                              />
                              <span className={`text-sm ${todo.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                {todo.text}
                              </span>
                            </label>
                            <div className="flex items-center space-x-3">
                              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                                {todo.assignedTo}
                              </span>
                              <button onClick={() => deleteTodo(todo.id)} className="text-slate-500 hover:text-red-400">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Treffen / Termine */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="font-bold flex items-center space-x-2 mb-4">
                      <Calendar className="w-5 h-5 text-indigo-400" />
                      <span>Gruppentreffen</span>
                    </h3>

                    <form onSubmit={addMeeting} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-6">
                      <input 
                        type="text"
                        placeholder="Thema / Titel"
                        value={newMeetingTitle}
                        onChange={e => setNewMeetingTitle(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                      <input 
                        type="date"
                        value={newMeetingDate}
                        onChange={e => setNewMeetingDate(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                      <input 
                        type="text"
                        placeholder="Ort / Link"
                        value={newMeetingLocation}
                        onChange={e => setNewMeetingLocation(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                      <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                        Planen
                      </button>
                    </form>

                    <div className="space-y-3">
                      {selectedProject.meetings.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">Keine Treffen geplant.</p>
                      ) : (
                        selectedProject.meetings.map(m => (
                          <div key={m.id} className="p-4 bg-slate-950 border border-slate-800/60 rounded-xl flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-sm">{m.title}</h4>
                              <p className="text-xs text-slate-400 mt-1">📅 {m.date} | 📍 {m.location}</p>
                            </div>
                            <button onClick={() => deleteMeeting(m.id)} className="text-slate-500 hover:text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* Rechte Spalte: Projekt-Mitglieder */}
                <div className="space-y-8">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="font-bold flex items-center space-x-2 mb-4">
                      <Users className="w-5 h-5 text-indigo-400" />
                      <span>Projekt-Mitglieder</span>
                    </h3>

                    <form onSubmit={handleAddMember} className="space-y-3 mb-6">
                      <input 
                        type="email"
                        placeholder="E-Mail des Partners..."
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-sm font-semibold transition-colors">
                        Mitglied einladen
                      </button>
                    </form>

                    <div className="space-y-2">
                      {selectedProject.members.map(email => (
                        <div key={email} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800/60 rounded-xl text-xs">
                          <span className="truncate text-slate-300">{email}</span>
                          {email !== currentUser.email && (
                            <button onClick={() => removeMember(email)} className="text-slate-500 hover:text-red-400 ml-2">
                              Entfernen
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : activeTab === 'dashboard' ? (
            
            /* DASHBOARD VIEW */
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold">Hallo, {currentUser.name}! 👋</h1>
                <p className="text-slate-400 text-sm mt-1">Hier ist die Übersicht deiner aktuellen schulischen Projekte.</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Aktive Projekte</span>
                  <p className="text-3xl font-bold mt-2 text-indigo-400">{projects.length}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Offene To-Dos</span>
                  <p className="text-3xl font-bold mt-2 text-amber-400">
                    {projects.reduce((acc, p) => acc + p.todos.filter(t => !t.completed).length, 0)}
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Geplante Treffen</span>
                  <p className="text-3xl font-bold mt-2 text-emerald-400">
                    {projects.reduce((acc, p) => acc + p.meetings.length, 0)}
                  </p>
                </div>
              </div>

              {/* Projekt-Liste im Dashboard */}
              <div>
                <h2 className="text-lg font-bold mb-4">Deine Projekte</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => setSelectedProject(p)}
                      className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 shadow-xl cursor-pointer transition-all group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400">
                          {p.subject}
                        </span>
                        <span className="text-xs text-slate-400">Fällig: {p.dueDate}</span>
                      </div>
                      <h3 className="font-bold text-lg group-hover:text-indigo-400 transition-colors">{p.title}</h3>
                      <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-4">
                        <span>Status: <strong className="text-slate-200">{p.status}</strong></span>
                        <span>{p.todos.length} Aufgaben</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          ) : activeTab === 'projects' ? (

            /* ALL PROJECTS VIEW */
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Alle Projekte</h1>
              <div className="space-y-3">
                {projects.map(p => (
                  <div key={p.id} onClick={() => setSelectedProject(p)} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-indigo-500 transition-colors">
                    <div>
                      <h3 className="font-bold">{p.title}</h3>
                      <p className="text-xs text-slate-400">Fach: {p.subject} | Fällig: {p.dueDate}</p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-indigo-400">{p.status}</span>
                  </div>
                ))}
              </div>
            </div>

          ) : (

            /* SETTINGS VIEW */
            <div className="space-y-6 max-w-xl">
              <h1 className="text-2xl font-bold">Einstellungen & Backup</h1>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold">Daten exportieren</h3>
                <p className="text-sm text-slate-400">Sichere all deine Projekte und To-Dos als JSON-Datei auf deinem PC.</p>
                <button onClick={exportData} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 px-4 rounded-xl shadow transition-colors flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Backup herunterladen</span>
                </button>
              </div>
            </div>

          )}

        </div>
      </main>

      {/* MODAL: NEUES PROJEKT */}
      {showNewProjModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Neues Projekt erstellen</h3>
              <button onClick={() => setShowNewProjModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={createProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Projekt-Titel</label>
                <input 
                  type="text" 
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="z.B. Bio-Referat Photosynthese"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Fach</label>
                <input 
                  type="text" 
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  placeholder="z.B. Biologie"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Fälligkeitsdatum</label>
                <input 
                  type="date" 
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowNewProjModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors"
                >
                  Abbrechen
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow transition-colors"
                >
                  Erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}