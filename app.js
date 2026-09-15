// ---- Storage shim ----
// Some browsers throw when localStorage is touched on a file:// page or in private mode.
// Swapping in an in-memory store keeps the whole app working instead of dying on first write.
(function ensureStorage() {
	let usable = true;
	try {
		const probe = '__forge_probe__';
		window.localStorage.setItem(probe, '1');
		window.localStorage.removeItem(probe);
	} catch (error) {
		usable = false;
	}
	if (usable) return;
	const memory = new Map();
	const fallback = {
		getItem: (key) => (memory.has(String(key)) ? memory.get(String(key)) : null),
		setItem: (key, value) => { memory.set(String(key), String(value)); },
		removeItem: (key) => { memory.delete(String(key)); },
		clear: () => memory.clear(),
		key: (index) => [...memory.keys()][index] ?? null,
		get length() { return memory.size; },
	};
	try {
		Object.defineProperty(window, 'localStorage', { configurable: true, get: () => fallback });
	} catch (error) {
		window.forgeMemoryStorage = fallback;
	}
	console.warn('Forge: localStorage unavailable, falling back to in-memory storage. Data will not persist. Serve the app over http:// to enable saving.');
})();

// ---- Gym avatars: a premium perk, drawn as inline SVG so they stay crisp at any size ----
const avatarColours = ['#d9ef54', '#ff765f', '#76b6d7', '#72d6b0', '#ffad5c', '#c9a6f5', '#ff2bd6', '#faff00'];
const avatarArt = {
	dumbbell: '<rect x="12" y="26" width="7" height="12" rx="2"/><rect x="45" y="26" width="7" height="12" rx="2"/><rect x="20" y="28" width="5" height="8" rx="1.5"/><rect x="39" y="28" width="5" height="8" rx="1.5"/><rect x="25" y="30" width="14" height="4" rx="1.5"/>',
	kettlebell: '<path d="M32 16c-6 0-9 4-9 8 0 2 .6 3.4 1.4 4.4C20.6 30.6 18 35 18 40c0 6 6 10 14 10s14-4 14-10c0-5-2.6-9.4-6.4-11.6.8-1 1.4-2.4 1.4-4.4 0-4-3-8-9-8zm0 4c3 0 5 2 5 4s-2 3-5 3-5-1-5-3 2-4 5-4z"/>',
	barbell: '<rect x="8" y="24" width="6" height="16" rx="2"/><rect x="16" y="20" width="7" height="24" rx="2"/><rect x="41" y="20" width="7" height="24" rx="2"/><rect x="50" y="24" width="6" height="16" rx="2"/><rect x="23" y="29" width="18" height="6" rx="2"/>',
	flex: '<path d="M20 44c0-8 4-14 10-14 4 0 6 2 8 2 4 0 6-4 6-8 0-2-1-4-3-5 4 0 8 4 8 10 0 8-6 13-12 13-3 0-5-1-7-1-4 0-6 2-6 6z"/><circle cx="24" cy="24" r="6"/>',
	trophy: '<path d="M22 14h20v10c0 7-4 12-10 12s-10-5-10-12V14z"/><path d="M18 16h-4v4c0 4 2 6 5 7M46 16h4v4c0 4-2 6-5 7" fill="none" stroke="currentColor" stroke-width="3"/><rect x="29" y="36" width="6" height="8"/><rect x="22" y="44" width="20" height="5" rx="1.5"/>',
	shoe: '<path d="M14 38c0-4 2-6 5-8l8-5 4 5 5-3 4 4 6 1c4 .6 6 3 6 6v4H14v-4z"/><rect x="12" y="42" width="42" height="5" rx="2"/>',
	bottle: '<rect x="27" y="12" width="10" height="6" rx="2"/><path d="M25 20h14c2 0 3 1.4 3 3v24c0 2.4-1.4 4-4 4H26c-2.6 0-4-1.6-4-4V23c0-1.6 1-3 3-3z"/><rect x="26" y="30" width="12" height="7" rx="1.5" fill="#14231f" opacity=".35"/>',
	heart: '<path d="M32 48S14 38 14 27c0-6 4-10 9-10 4 0 7 2 9 5 2-3 5-5 9-5 5 0 9 4 9 10 0 11-18 21-18 21z"/>',
	bolt: '<path d="M36 10L18 36h11l-3 18 20-28H34l2-16z"/>',
	medal: '<path d="M22 10h8l6 14h-8L22 10zM42 10h-8l-6 14h8l6-14z"/><circle cx="32" cy="40" r="14"/><circle cx="32" cy="40" r="7" fill="#14231f" opacity=".3"/>',
};
const avatarKeys = Object.keys(avatarArt);

function avatarKey() { return `forge-avatar-${currentUserKey()}`; }
function loadAvatar() { try { return JSON.parse(localStorage.getItem(avatarKey()) || 'null'); } catch (error) { return null; } }
function saveAvatar(value) { if (value) localStorage.setItem(avatarKey(), JSON.stringify(value)); else localStorage.removeItem(avatarKey()); applyAvatar(); }
function avatarSvg(art, colour, size) {
	return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true"><circle cx="32" cy="32" r="32" fill="${colour}"/><g fill="#14231f">${avatarArt[art]}</g></svg>`;
}
function applyAvatar() {
	const avatar = loadAvatar();
	const initials = (document.querySelector('#profile-name')?.textContent || 'You').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
	[['#topbar-avatar', 42], ['#profile-avatar', 66], ['#profile-page-avatar', 66]].forEach(([selector, size]) => {
		const node = document.querySelector(selector);
		if (!node) return;
		if (avatar && isPremium()) { node.innerHTML = avatarSvg(avatar.art, avatar.colour, size); node.classList.add('has-art'); }
		else { node.textContent = initials; node.classList.remove('has-art'); }
	});
}
function renderAvatarPicker() {
	const locked = !isPremium();
	document.querySelector('#avatar-lock').style.display = locked ? 'block' : 'none';
	document.querySelector('#avatar-content').classList.toggle('locked', locked);
	const current = loadAvatar() || { art: avatarKeys[0], colour: avatarColours[0] };
	document.querySelector('#avatar-grid').innerHTML = avatarKeys.map((art) => `<button type="button" class="avatar-option${art === current.art ? ' active' : ''}" data-art="${art}">${avatarSvg(art, current.colour, 52)}</button>`).join('');
	document.querySelector('#avatar-colours').innerHTML = avatarColours.map((colour) => `<button type="button" class="colour-swatch${colour === current.colour ? ' active' : ''}" data-colour="${colour}" style="background:${colour}" aria-label="Colour ${colour}"></button>`).join('');
	document.querySelectorAll('.avatar-option').forEach((button) => button.addEventListener('click', () => { saveAvatar({ ...current, art: button.dataset.art }); renderAvatarPicker(); showToast('Avatar updated.'); }));
	document.querySelectorAll('.colour-swatch').forEach((button) => button.addEventListener('click', () => { saveAvatar({ ...current, colour: button.dataset.colour }); renderAvatarPicker(); }));
}
document.querySelector('#choose-avatar').addEventListener('click', () => { renderAvatarPicker(); showModal('avatar-modal'); });
document.querySelector('#avatar-reset').addEventListener('click', () => { saveAvatar(null); renderAvatarPicker(); showToast('Back to your initials.'); });
document.querySelector('#avatar-upgrade').addEventListener('click', () => { closeModal(); openTab('premium'); setPremiumTab('pricing'); });

// ---- Badges: earned from real activity, visible to everyone ----
const badgeCatalog = [
	{ id: 'first-session', name: 'First Rep', icon: '🎯', tier: 'bronze', description: 'Complete your very first workout. Everyone starts somewhere.', test: (stats) => stats.total >= 1, progress: (stats) => `${Math.min(stats.total, 1)} / 1 workout` },
	{ id: 'ten-month', name: 'Ten a Month', icon: '🔟', tier: 'silver', description: 'Train more than 10 times within a single calendar month.', test: (stats) => stats.bestMonth >= 10, progress: (stats) => `${stats.bestMonth} / 10 in your best month` },
	{ id: 'one-year', name: 'One Year Strong', icon: '🎂', tier: 'gold', description: 'Stay a Forge member for a full year. Loyalty counts.', test: (stats) => stats.daysAsMember >= 365, progress: (stats) => `${stats.daysAsMember} / 365 days as a member` },
	{ id: 'premium', name: 'Forge Elite', icon: '👑', tier: 'elite', description: 'Hold an active Forge Premium subscription. The full toolkit, unlocked.', test: (stats) => stats.premium, progress: (stats) => (stats.premium ? 'Subscription active' : 'Not subscribed yet') },
	{ id: 'goal-crusher', name: 'Goal Crusher', icon: '🏆', tier: 'gold', description: 'Set a goal inside Forge and mark it achieved.', test: (stats) => stats.goalsDone >= 1, progress: (stats) => `${stats.goalsDone} goal${stats.goalsDone === 1 ? '' : 's'} achieved` },
	{ id: 'week-warrior', name: 'Week Warrior', icon: '🔥', tier: 'silver', description: 'Hit a seven day training streak without missing a day.', test: (stats) => stats.bestStreak >= 7, progress: (stats) => `${stats.bestStreak} / 7 day streak` },
	{ id: 'quarter-century', name: 'Twenty-Five Club', icon: '⚡', tier: 'silver', description: 'Log 25 completed sessions in total.', test: (stats) => stats.total >= 25, progress: (stats) => `${stats.total} / 25 workouts` },
	{ id: 'century', name: 'Century Club', icon: '💯', tier: 'gold', description: 'Reach 100 completed workouts. Serious mileage.', test: (stats) => stats.total >= 100, progress: (stats) => `${stats.total} / 100 workouts` },
	{ id: 'record-breaker', name: 'Record Breaker', icon: '📈', tier: 'bronze', description: 'Set your first personal best on any lift.', test: (stats) => stats.prCount >= 1, progress: (stats) => `${stats.prCount} personal best${stats.prCount === 1 ? '' : 's'}` },
	{ id: 'early-bird', name: 'Early Bird', icon: '🌅', tier: 'bronze', description: 'Finish a workout before 8 in the morning.', test: (stats) => stats.earlySession, progress: (stats) => (stats.earlySession ? 'Earned' : 'No session before 08:00 yet') },
	{ id: 'night-owl', name: 'Night Owl', icon: '🌙', tier: 'bronze', description: 'Finish a workout after 9 in the evening.', test: (stats) => stats.lateSession, progress: (stats) => (stats.lateSession ? 'Earned' : 'No session after 21:00 yet') },
	{ id: 'marathon', name: 'Endurance', icon: '⏳', tier: 'silver', description: 'Complete a single session lasting over an hour.', test: (stats) => stats.longestSession >= 3600, progress: (stats) => `${Math.round(stats.longestSession / 60)} / 60 minutes in your longest session` },
	{ id: 'architect', name: 'Architect', icon: '🧱', tier: 'bronze', description: 'Build five different workout templates.', test: (stats) => stats.templates >= 5, progress: (stats) => `${stats.templates} / 5 workouts built` },
	{ id: 'social', name: 'Training Partner', icon: '🤝', tier: 'bronze', description: 'Connect with three friends inside Forge.', test: (stats) => stats.friends >= 3, progress: (stats) => `${stats.friends} / 3 friends` },
	{ id: 'planner', name: 'The Planner', icon: '🗓️', tier: 'silver', description: 'Schedule and complete ten sessions on your calendar.', test: (stats) => stats.calendarDone >= 10, progress: (stats) => `${stats.calendarDone} / 10 scheduled sessions completed` },
];

function badgeStats() {
	const reports = loadReports();
	const profile = JSON.parse(localStorage.getItem('forge-profile') || '{}');
	const prs = JSON.parse(localStorage.getItem(prsKey()) || '{}');
	const calendar = (() => { try { return JSON.parse(localStorage.getItem(calendarKey()) || '{}'); } catch (error) { return {}; } })();

	const months = {};
	reports.forEach((report) => {
		const date = new Date(report.date);
		const key = `${date.getFullYear()}-${date.getMonth()}`;
		months[key] = (months[key] || 0) + 1;
	});

	// Longest streak ever, not just the current one.
	const days = [...new Set(reports.map((report) => new Date(report.date).toDateString()))]
		.map((value) => new Date(value).setHours(0, 0, 0, 0)).sort((a, b) => a - b);
	let bestStreak = days.length ? 1 : 0;
	let run = days.length ? 1 : 0;
	for (let index = 1; index < days.length; index += 1) {
		run = days[index] - days[index - 1] === 86400000 ? run + 1 : 1;
		bestStreak = Math.max(bestStreak, run);
	}

	return {
		total: reports.length,
		bestMonth: Math.max(0, ...Object.values(months)),
		bestStreak,
		prCount: Object.keys(prs).length,
		premium: isPremium(),
		goalsDone: loadGoals().filter((goal) => goal.done).length,
		templates: loadWorkouts().length,
		friends: loadFriends().length,
		calendarDone: Object.values(calendar).filter((entry) => entry.status === 'training' && entry.completed).length,
		longestSession: Math.max(0, ...reports.map((report) => report.elapsed || report.duration || 0)),
		earlySession: reports.some((report) => new Date(report.date).getHours() < 8),
		lateSession: reports.some((report) => new Date(report.date).getHours() >= 21),
		daysAsMember: profile.joined ? Math.floor((Date.now() - new Date(profile.joined).getTime()) / 86400000) : 0,
	};
}

function earnedKey() { return `forge-badges-${currentUserKey()}`; }

function renderBadges() {
	const grid = document.querySelector('#badge-grid');
	if (!grid) return;
	const stats = badgeStats();
	const earned = badgeCatalog.filter((badge) => badge.test(stats));
	document.querySelector('#badge-count').textContent = `${earned.length} / ${badgeCatalog.length}`;

	// Announce anything newly unlocked since last time.
	let seen = [];
	try { seen = JSON.parse(localStorage.getItem(earnedKey()) || '[]'); } catch (error) { seen = []; }
	const fresh = earned.filter((badge) => !seen.includes(badge.id));
	if (fresh.length) {
		localStorage.setItem(earnedKey(), JSON.stringify(earned.map((badge) => badge.id)));
		fresh.forEach((badge, index) => setTimeout(() => showToast(`${badge.icon} Badge unlocked: ${badge.name}`), 1200 + index * 2200));
	}

	grid.innerHTML = badgeCatalog.map((badge) => {
		const unlocked = badge.test(stats);
		return `<button type="button" class="badge-tile ${badge.tier}${unlocked ? ' unlocked' : ' locked'}" data-badge="${badge.id}"><span class="badge-icon">${unlocked ? badge.icon : '🔒'}</span><b>${badge.name}</b></button>`;
	}).join('');

	grid.querySelectorAll('[data-badge]').forEach((button) => button.addEventListener('click', () => {
		const badge = badgeCatalog.find((item) => item.id === button.dataset.badge);
		const unlocked = badge.test(stats);
		document.querySelector('#badge-hero').className = `badge-hero ${badge.tier}${unlocked ? ' unlocked' : ' locked'}`;
		document.querySelector('#badge-hero').textContent = unlocked ? badge.icon : '🔒';
		document.querySelector('#badge-title').textContent = badge.name;
		document.querySelector('#badge-desc').textContent = badge.description;
		document.querySelector('#badge-status').innerHTML = unlocked
			? `<span class="badge-earned">✓ Unlocked</span><small>${badge.progress(stats)}</small>`
			: `<span class="badge-pending">Locked</span><small>${badge.progress(stats)}</small>`;
		showModal('badge-modal');
	}));
}

const tabs = document.querySelectorAll('[data-tab]');
const navItems = document.querySelectorAll('.nav-item');
const contents = document.querySelectorAll('.tab-content');
const toast = document.querySelector('#toast');
const authScreen = document.querySelector('#auth-screen');
let isSignUp = false;
// 'server' once a real backend session is confirmed (see restoreSession/handleAuthSubmit below),
// 'local' while running against the localStorage-only fallback accounts.
let authMode = 'local';

function openTab(name) { if (name === 'menu') return; contents.forEach((content) => content.classList.toggle('active', content.id === `${name}-tab`)); navItems.forEach((item) => item.classList.toggle('active', item.dataset.tab === name)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function showToast(message) { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2200); }
function showModal(id) { document.querySelector('#modal-backdrop').classList.add('open'); document.querySelectorAll('.modal-panel').forEach((panel) => panel.classList.toggle('open', panel.id === id)); }
function closeModal() { document.querySelector('#modal-backdrop').classList.remove('open'); }

// The runner owns one guided session from start to report. It deliberately keeps report data separate per account.
document.querySelector('#modal-backdrop').insertAdjacentHTML('afterbegin', '<section class="modal-panel runner-modal" id="runner-modal"><div class="runner-head"><div><p class="eyebrow">ACTIVE WORKOUT</p><h2 id="runner-title">Push strength</h2></div><button class="modal-close">×</button></div><div class="runner-meta"><span id="runner-progress">Exercise 1 of 1</span><div class="timer-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="ring-track" cx="60" cy="60" r="52"/><circle class="ring-fill" id="runner-ring" cx="60" cy="60" r="52"/></svg><strong id="runner-timer">00:00</strong></div></div><div id="hydration-banner" class="hydration-banner"><span class="hydration-icon">💧</span><div><b>Halfway there — drink some water</b><span>A few sips now keeps your strength up for the rest of the session.</span></div><button type="button" class="hydration-close" aria-label="Dismiss">×</button></div><div id="runner-exercise-list"></div><p class="runner-status" id="runner-status"></p><button class="secondary-button full" id="runner-finish">Finish workout</button></section><section class="modal-panel report-modal" id="report-modal"><button class="modal-close">×</button><p class="eyebrow">WORKOUT REPORT</p><h2>Session complete</h2><div class="report-summary" id="report-summary"></div><button class="primary-button full" id="report-done">Done</button></section><section class="modal-panel reports-modal" id="reports-modal"><button class="modal-close">×</button><p class="eyebrow">SAVED REPORTS</p><h2>Your workout history</h2><div id="reports-list"></div></section>');
document.body.insertAdjacentHTML('beforeend', '<div class="menu-sheet" id="menu-sheet"><button class="menu-close" id="menu-close">×</button><p class="eyebrow">FORGE MENU</p><h2>More sections</h2><div class="menu-grid"><button data-menu-tab="coach">✦ <span>AI Coach</span></button><button data-menu-tab="social">♧ <span>Social</span></button><button data-menu-tab="goals">◎ <span>Goals</span></button><button data-menu-tab="premium">◆ <span>Premium</span></button><button id="open-reports">▤ <span>Reports</span></button><button data-menu-tab="profile">● <span>Profile</span></button></div></div>');
const menuSheet = document.querySelector('#menu-sheet');
function openMenu() { menuSheet.classList.add('open'); }
function closeMenu() { menuSheet.classList.remove('open'); }
document.querySelector('#menu-close').addEventListener('click', closeMenu);
document.querySelectorAll('[data-menu-tab]').forEach((button) => button.addEventListener('click', () => { closeMenu(); openTab(button.dataset.menuTab); }));
document.querySelector('#open-reports').addEventListener('click', () => { closeMenu(); renderReports(); showModal('reports-modal'); });
document.querySelector('.nav-item[data-tab="menu"]').addEventListener('click', openMenu);
const languageCatalog = {
	en: { language: 'Language', start: 'Start workout', finish: 'Finish workout', menu: 'More sections', reports: 'Your workout history', translations: {} },
	es: { language: 'Idioma', start: 'Iniciar entrenamiento', finish: 'Finalizar entrenamiento', menu: 'Más secciones', reports: 'Historial de entrenamientos', translations: { 'YOUR TRAINING, MEASURED': 'TU ENTRENAMIENTO, MEDIDO', 'Build a stronger': 'Construye una rutina', 'routine.': 'más fuerte.', 'Email': 'Correo electrónico', 'Password': 'Contraseña', 'Sign in': 'Iniciar sesión', 'New here? Create an account': '¿Nuevo aquí? Crea una cuenta', 'CURRENT STREAK': 'RACHA ACTUAL', 'days': 'días', 'TODAY\'S PLAN': 'PLAN DE HOY', 'Edit plan': 'Editar plan', 'READY TO TRAIN': 'LISTO PARA ENTRENAR', 'Start workout': 'Iniciar entrenamiento', 'YOUR NUMBERS': 'TUS NÚMEROS', 'Progress at a glance': 'Progreso de un vistazo', 'TRAINING LOG': 'REGISTRO DE ENTRENAMIENTO', 'Build your session': 'Construye tu sesión', 'PROGRESS': 'PROGRESO', 'Proof of your work': 'La prueba de tu trabajo', 'PERSONAL GOALS': 'OBJETIVOS PERSONALES', 'Make it measurable': 'Hazlo medible', 'TRAINING CALENDAR': 'CALENDARIO DE ENTRENAMIENTO', 'Plan your gym days': 'Planifica tus días de gimnasio', 'YOUR TRAINING CREW': 'TU EQUIPO DE ENTRENAMIENTO', 'Train together': 'Entrena en equipo', 'FORGE PREMIUM': 'FORGE PREMIUM', 'YOUR PROFILE': 'TU PERFIL', 'Home': 'Inicio', 'Workout': 'Entrenamiento', 'Calendar': 'Calendario', 'Menu': 'Menú', 'Social': 'Social', 'Goals': 'Objetivos', 'Premium': 'Premium', 'Reports': 'Informes', 'Profile': 'Perfil' } },
	fr: { language: 'Langue', start: "Commencer l'entraînement", finish: "Terminer l'entraînement", menu: 'Autres sections', reports: 'Historique des entraînements', translations: { 'YOUR TRAINING, MEASURED': 'VOTRE ENTRAÎNEMENT, MESURÉ', 'Build a stronger': 'Construisez une routine', 'routine.': 'plus forte.', 'Email': 'E-mail', 'Password': 'Mot de passe', 'Sign in': 'Se connecter', 'New here? Create an account': 'Nouveau ici ? Créer un compte', 'CURRENT STREAK': 'SÉRIE ACTUELLE', 'days': 'jours', 'TODAY\'S PLAN': "PLAN D'AUJOURD'HUI", 'Edit plan': 'Modifier le plan', 'READY TO TRAIN': 'PRÊT À S’ENTRAÎNER', 'YOUR NUMBERS': 'VOS CHIFFRES', 'Progress at a glance': 'Progrès en un coup d’œil', 'TRAINING LOG': 'JOURNAL D’ENTRAÎNEMENT', 'Build your session': 'Construisez votre séance', 'PROGRESS': 'PROGRÈS', 'Proof of your work': 'La preuve de votre travail', 'PERSONAL GOALS': 'OBJECTIFS PERSONNELS', 'Make it measurable': 'Rendez-le mesurable', 'TRAINING CALENDAR': 'CALENDRIER D’ENTRAÎNEMENT', 'Plan your gym days': 'Planifiez vos jours de sport', 'YOUR TRAINING CREW': 'VOTRE ÉQUIPE', 'Train together': 'Entraînez-vous ensemble', 'YOUR PROFILE': 'VOTRE PROFIL', 'Home': 'Accueil', 'Workout': 'Entraînement', 'Calendar': 'Calendrier', 'Menu': 'Menu', 'Social': 'Social', 'Goals': 'Objectifs', 'Premium': 'Premium', 'Reports': 'Rapports', 'Profile': 'Profil' } },
	de: { language: 'Sprache', start: 'Training starten', finish: 'Training beenden', menu: 'Weitere Bereiche', reports: 'Trainingsverlauf', translations: { 'YOUR TRAINING, MEASURED': 'DEIN TRAINING, GEMESSEN', 'Build a stronger': 'Baue eine stärkere', 'routine.': 'Routine auf.', 'Email': 'E-Mail', 'Password': 'Passwort', 'Sign in': 'Anmelden', 'New here? Create an account': 'Neu hier? Konto erstellen', 'CURRENT STREAK': 'AKTUELLE SERIE', 'days': 'Tage', 'TODAY\'S PLAN': 'HEUTIGER PLAN', 'Edit plan': 'Plan bearbeiten', 'READY TO TRAIN': 'BEREIT ZUM TRAINING', 'YOUR NUMBERS': 'DEINE ZAHLEN', 'Progress at a glance': 'Fortschritt auf einen Blick', 'TRAINING LOG': 'TRAININGSPROTOKOLL', 'Build your session': 'Baue deine Einheit', 'PROGRESS': 'FORTSCHRITT', 'Proof of your work': 'Der Beweis deiner Arbeit', 'PERSONAL GOALS': 'PERSÖNLICHE ZIELE', 'Make it measurable': 'Mach es messbar', 'TRAINING CALENDAR': 'TRAININGSKALENDER', 'Plan your gym days': 'Plane deine Trainingstage', 'YOUR TRAINING CREW': 'DEIN TRAININGSTEAM', 'Train together': 'Gemeinsam trainieren', 'YOUR PROFILE': 'DEIN PROFIL', 'Home': 'Start', 'Workout': 'Training', 'Calendar': 'Kalender', 'Menu': 'Menü', 'Social': 'Soziales', 'Goals': 'Ziele', 'Premium': 'Premium', 'Reports': 'Berichte', 'Profile': 'Profil' } },
	pt: { language: 'Idioma', start: 'Começar treino', finish: 'Terminar treino', menu: 'Mais secções', reports: 'Histórico de treinos', translations: { 'YOUR TRAINING, MEASURED': 'O TEU TREINO, MEDIDO', 'Build a stronger': 'Constrói uma rotina', 'routine.': 'mais forte.', 'Email': 'E-mail', 'Password': 'Palavra-passe', 'Sign in': 'Iniciar sessão', 'New here? Create an account': 'Novo aqui? Criar uma conta', 'CURRENT STREAK': 'SEQUÊNCIA ATUAL', 'days': 'dias', 'TODAY\'S PLAN': 'PLANO DE HOJE', 'Edit plan': 'Editar plano', 'READY TO TRAIN': 'PRONTO PARA TREINAR', 'YOUR NUMBERS': 'OS TEUS NÚMEROS', 'Progress at a glance': 'Progresso num relance', 'TRAINING LOG': 'REGISTO DE TREINO', 'Build your session': 'Constrói a tua sessão', 'PROGRESS': 'PROGRESSO', 'Proof of your work': 'A prova do teu trabalho', 'PERSONAL GOALS': 'OBJETIVOS PESSOAIS', 'Make it measurable': 'Torna-o mensurável', 'TRAINING CALENDAR': 'CALENDÁRIO DE TREINO', 'Plan your gym days': 'Planeia os teus dias', 'YOUR TRAINING CREW': 'A TUA EQUIPA', 'Train together': 'Treinem juntos', 'YOUR PROFILE': 'O TEU PERFIL', 'Home': 'Início', 'Workout': 'Treino', 'Calendar': 'Calendário', 'Menu': 'Menu', 'Social': 'Social', 'Goals': 'Objetivos', 'Premium': 'Premium', 'Reports': 'Relatórios', 'Profile': 'Perfil' } },
	el: { language: 'Γλώσσα', start: 'Έναρξη προπόνησης', finish: 'Ολοκλήρωση προπόνησης', menu: 'Περισσότερες ενότητες', reports: 'Ιστορικό προπονήσεων', translations: { 'YOUR TRAINING, MEASURED': 'Η ΠΡΟΠΟΝΗΣΗ ΣΟΥ, ΜΕΤΡΗΜΕΝΗ', 'Build a stronger': 'Χτίσε μια πιο δυνατή', 'routine.': 'ρουτίνα.', 'Email': 'Email', 'Password': 'Κωδικός', 'Sign in': 'Σύνδεση', 'New here? Create an account': 'Νέος εδώ; Δημιούργησε λογαριασμό', 'CURRENT STREAK': 'ΤΡΕΧΟΝ ΣΕΡΙ', 'days': 'ημέρες', 'TODAY\'S PLAN': 'ΣΗΜΕΡΙΝΟ ΠΛΑΝΟ', 'Edit plan': 'Επεξεργασία πλάνου', 'READY TO TRAIN': 'ΕΤΟΙΜΟΣ ΓΙΑ ΠΡΟΠΟΝΗΣΗ', 'YOUR NUMBERS': 'ΟΙ ΑΡΙΘΜΟΙ ΣΟΥ', 'Progress at a glance': 'Η πρόοδος με μια ματιά', 'TRAINING LOG': 'ΗΜΕΡΟΛΟΓΙΟ ΠΡΟΠΟΝΗΣΗΣ', 'Build your session': 'Χτίσε τη συνεδρία σου', 'PROGRESS': 'ΠΡΟΟΔΟΣ', 'Proof of your work': 'Απόδειξη της δουλειάς σου', 'PERSONAL GOALS': 'ΠΡΟΣΩΠΙΚΟΙ ΣΤΟΧΟΙ', 'Make it measurable': 'Κάνε το μετρήσιμο', 'TRAINING CALENDAR': 'ΗΜΕΡΟΛΟΓΙΟ ΠΡΟΠΟΝΗΣΕΩΝ', 'Plan your gym days': 'Σχεδίασε τις ημέρες γυμναστικής', 'YOUR TRAINING CREW': 'Η ΟΜΑΔΑ ΠΡΟΠΟΝΗΣΗΣ ΣΟΥ', 'Train together': 'Προπονηθείτε μαζί', 'YOUR PROFILE': 'ΤΟ ΠΡΟΦΙΛ ΣΟΥ', 'Home': 'Αρχική', 'Workout': 'Προπόνηση', 'Calendar': 'Ημερολόγιο', 'Menu': 'Μενού', 'Social': 'Κοινωνικά', 'Goals': 'Στόχοι', 'Premium': 'Premium', 'Reports': 'Αναφορές', 'Profile': 'Προφίλ', 'FORGE PREMIUM': 'FORGE PREMIUM', 'Train with the full toolkit': 'Προπονήσου με όλα τα εργαλεία', 'Overview': 'Επισκόπηση', 'Benefits': 'Οφέλη', 'Pricing': 'Τιμολόγηση', 'Extras': 'Επιπλέον', 'MEMBERSHIP': 'ΣΥΝΔΡΟΜΗ', 'Forge Premium': 'Forge Premium', 'Unlock every advanced tracking and customization feature with no ads.': 'Ξεκλείδωσε όλες τις προηγμένες λειτουργίες παρακολούθησης και προσαρμογής, χωρίς διαφημίσεις.', 'See plans and pricing': 'Δες τα πλάνα και τις τιμές', 'WHY UPGRADE': 'ΓΙΑΤΙ ΝΑ ΑΝΑΒΑΘΜΙΣΕΙΣ', 'Built for consistency': 'Φτιαγμένο για συνέπεια', 'EVERYTHING INCLUDED': 'ΟΛΑ ΠΕΡΙΛΑΜΒΑΝΟΝΤΑΙ', 'Premium benefits': 'Οφέλη συνδρομής', 'CHOOSE YOUR PLAN': 'ΕΠΙΛΕΞΕ ΤΟ ΠΛΑΝΟ ΣΟΥ', 'Simple pricing': 'Απλή τιμολόγηση', 'DAILY TRACKING': 'ΚΑΘΗΜΕΡΙΝΗ ΠΑΡΑΚΟΛΟΥΘΗΣΗ', 'Fuel and movement': 'Διατροφή και κίνηση', 'PROFILE STYLE': 'ΣΤΥΛ ΠΡΟΦΙΛ', 'Choose your theme': 'Επίλεξε το θέμα σου' } },
	ar: { language: 'اللغة', start: 'ابدأ التمرين', finish: 'إنهاء التمرين', menu: 'أقسام أخرى', reports: 'سجل التمارين', translations: { 'YOUR TRAINING, MEASURED': 'تدريبك، بالأرقام', 'Build a stronger': 'ابنِ روتينًا', 'routine.': 'أقوى.', 'Email': 'البريد الإلكتروني', 'Password': 'كلمة المرور', 'Sign in': 'تسجيل الدخول', 'New here? Create an account': 'جديد هنا؟ أنشئ حسابًا', 'CURRENT STREAK': 'السلسلة الحالية', 'days': 'أيام', 'TODAY\'S PLAN': 'خطة اليوم', 'Edit plan': 'تعديل الخطة', 'READY TO TRAIN': 'مستعد للتمرين', 'YOUR NUMBERS': 'أرقامك', 'Progress at a glance': 'التقدم في لمحة', 'TRAINING LOG': 'سجل التدريب', 'Build your session': 'ابنِ جلستك', 'PROGRESS': 'التقدم', 'Proof of your work': 'دليل عملك', 'PERSONAL GOALS': 'الأهداف الشخصية', 'Make it measurable': 'اجعلها قابلة للقياس', 'TRAINING CALENDAR': 'تقويم التدريب', 'Plan your gym days': 'خطط لأيام النادي', 'YOUR TRAINING CREW': 'فريق تدريبك', 'Train together': 'تدربوا معًا', 'YOUR PROFILE': 'ملفك الشخصي', 'Home': 'الرئيسية', 'Workout': 'التمرين', 'Calendar': 'التقويم', 'Menu': 'القائمة', 'Social': 'اجتماعي', 'Goals': 'الأهداف', 'Premium': 'بريميوم', 'Reports': 'التقارير', 'Profile': 'الملف الشخصي' } }
};
const translatedNodes = [];
let currentLanguage = 'en';
let runner = null;
let runnerInterval = null;
const runnerWords = { es: { sets: 'series', reps: 'repeticiones', Set: 'Serie', of: 'de', Exercise: 'Ejercicio', 'Start exercise': 'Iniciar ejercicio', 'Complete set': 'Completar serie', 'Finish exercise': 'Finalizar ejercicio', started: 'comenzó', 'Complete each set when you finish it.': 'Completa cada serie cuando termines.', 'Exercise complete. Start the next exercise when ready.': 'Ejercicio completo. Inicia el siguiente cuando estés listo.', complete: 'completada', 'Timer continues until the next set.': 'El temporizador continúa hasta la siguiente serie.' }, fr: { sets: 'séries', reps: 'répétitions', Set: 'Série', of: 'sur', Exercise: 'Exercice', 'Start exercise': "Commencer l'exercice", 'Complete set': 'Terminer la série', 'Finish exercise': "Terminer l'exercice", started: 'a commencé', 'Complete each set when you finish it.': 'Terminez chaque série quand vous avez fini.', 'Exercise complete. Start the next exercise when ready.': 'Exercice terminé. Commencez le suivant quand vous êtes prêt.', complete: 'terminée', 'Timer continues until the next set.': 'Le minuteur continue jusqu’à la série suivante.' }, de: { sets: 'Sätze', reps: 'Wiederholungen', Set: 'Satz', of: 'von', Exercise: 'Übung', 'Start exercise': 'Übung starten', 'Complete set': 'Satz abschließen', 'Finish exercise': 'Übung beenden', started: 'gestartet', 'Complete each set when you finish it.': 'Schließe jeden Satz ab, wenn du fertig bist.', 'Exercise complete. Start the next exercise when ready.': 'Übung abgeschlossen. Starte die nächste Übung.', complete: 'abgeschlossen', 'Timer continues until the next set.': 'Der Timer läuft bis zum nächsten Satz weiter.' }, pt: { sets: 'séries', reps: 'repetições', Set: 'Série', of: 'de', Exercise: 'Exercício', 'Start exercise': 'Começar exercício', 'Complete set': 'Concluir série', 'Finish exercise': 'Terminar exercício', started: 'começou', 'Complete each set when you finish it.': 'Conclui cada série quando terminares.', 'Exercise complete. Start the next exercise when ready.': 'Exercício concluído. Começa o próximo quando estiveres pronto.', complete: 'concluída', 'Timer continues until the next set.': 'O temporizador continua até à série seguinte.' }, el: { sets: 'σετ', reps: 'επαναλήψεις', Set: 'Σετ', of: 'από', Exercise: 'Άσκηση', 'Start exercise': 'Έναρξη άσκησης', 'Complete set': 'Ολοκλήρωση σετ', 'Finish exercise': 'Ολοκλήρωση άσκησης', started: 'ξεκίνησε', 'Complete each set when you finish it.': 'Ολοκλήρωσε κάθε σετ όταν τελειώνεις.', 'Exercise complete. Start the next exercise when ready.': 'Η άσκηση ολοκληρώθηκε. Ξεκίνα την επόμενη.', complete: 'ολοκληρώθηκε', 'Timer continues until the next set.': 'Ο χρονοδιακόπτης συνεχίζει μέχρι το επόμενο σετ.' }, ar: { sets: 'مجموعات', reps: 'تكرارات', Set: 'مجموعة', of: 'من', Exercise: 'تمرين', 'Start exercise': 'ابدأ التمرين', 'Complete set': 'أكمل المجموعة', 'Finish exercise': 'أنه التمرين', started: 'بدأ', 'Complete each set when you finish it.': 'أكمل كل مجموعة عند الانتهاء منها.', 'Exercise complete. Start the next exercise when ready.': 'اكتمل التمرين. ابدأ التمرين التالي عندما تكون مستعدًا.', complete: 'اكتملت', 'Timer continues until the next set.': 'يستمر المؤقت حتى المجموعة التالية.' } };
function t(text) { return runnerWords[currentLanguage]?.[text] || languageCatalog[currentLanguage]?.translations[text] || text; }
function translateStaticText(language) { translatedNodes.forEach(({ node, original }) => { node.nodeValue = original; }); translatedNodes.length = 0; const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); while (walker.nextNode()) { const node = walker.currentNode; const original = node.nodeValue.trim(); if (!original || original.length < 3 || node.parentElement.closest('script,style,select')) continue; if (languageCatalog[language]?.translations[original]) { translatedNodes.push({ node, original: node.nodeValue }); node.nodeValue = node.nodeValue.replace(original, languageCatalog[language].translations[original]); } } }
function applyLanguage(language) { const copy = languageCatalog[language] || languageCatalog.en; currentLanguage = language; document.documentElement.lang = language; document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'; translateStaticText(language); const picker = document.querySelector('.language-picker'); if (picker) picker.firstChild.textContent = `${copy.language} `; const start = document.querySelector('#start-workout'); if (start) start.firstChild.textContent = `${copy.start} `; const finish = document.querySelector('#runner-finish'); if (finish) finish.firstChild.textContent = `${copy.finish} `; document.querySelector('#menu-sheet h2').textContent = copy.menu; document.querySelector('#reports-modal h2').textContent = copy.reports; localStorage.setItem('forge-language', language); document.querySelectorAll('#language-select, #app-language-select').forEach((select) => { select.value = language; }); if (runner) renderRunner(); }
document.querySelectorAll('#language-select, #app-language-select').forEach((select) => select.addEventListener('change', (event) => applyLanguage(event.target.value)));
applyLanguage(localStorage.getItem('forge-language') || 'en');

function currentUserKey() { const email = localStorage.getItem('forge-session'); return (email || 'guest').toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
function runnerExercises(workout) { return workout.exercises.map((exercise) => ({ ...exercise, completedSets: 0, started: false, running: false, finished: false, setStartedAt: null, totalTime: 0, setTimes: [] })); }
function formatTime(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function runnerButtonLabel(exercise) {
	if (exercise.running) return exercise.completedSets + 1 >= exercise.sets ? t('Finish exercise') : t('Complete set');
	if (exercise.completedSets === 0) return t('Start exercise');
	return `${t('Start set')} ${exercise.completedSets + 1}`;
}
const RING_LENGTH = 2 * Math.PI * 52;
// The ring starts full and drains as the set runs, so effort reads at a glance.
function setRingProgress(fraction) {
	const ring = document.querySelector('#runner-ring');
	if (!ring) return;
	const clamped = Math.max(0, Math.min(1, fraction));
	ring.style.strokeDasharray = String(RING_LENGTH);
	ring.style.strokeDashoffset = String(RING_LENGTH * (1 - clamped));
	ring.classList.toggle('overtime', clamped <= 0);
}
// A set has no fixed length, so we pace the ring against a sensible target: about four seconds per rep.
function targetSetSeconds(exercise) { return Math.max(30, (Number(exercise.reps) || 10) * 4); }
function stopRunnerClock() { clearInterval(runnerInterval); runnerInterval = null; }
function startRunnerClock(exercise) {
	stopRunnerClock();
	exercise.setStartedAt = Date.now();
	const target = targetSetSeconds(exercise);
	document.querySelector('#runner-timer').textContent = '00:00';
	setRingProgress(1);
	runnerInterval = setInterval(() => {
		const elapsed = Math.floor((Date.now() - exercise.setStartedAt) / 1000);
		document.querySelector('#runner-timer').textContent = formatTime(elapsed);
		setRingProgress(1 - elapsed / target);
	}, 1000);
}
function renderRunner() {
	const list = document.querySelector('#runner-exercise-list');
	list.innerHTML = runner.exercises.map((exercise, index) => {
		const isActive = index === runner.activeIndex && !exercise.finished;
		const setLines = exercise.setTimes.map((time, setIndex) => `<span class="runner-set-chip">${t('Set')} ${setIndex + 1} · ${formatTime(time)}</span>`).join('');
		const controls = isActive ? `<div class="runner-set-editor"><span>${t('Planned sets')}</span><button type="button" class="set-step" data-step="-1">−</button><b>${exercise.sets}</b><button type="button" class="set-step" data-step="1">+</button></div><div class="runner-controls"><span>${t('Set')} ${Math.min(exercise.completedSets + 1, exercise.sets)} ${t('of')} ${exercise.sets}</span><button type="button" class="primary-button runner-start">${runnerButtonLabel(exercise)} <span>→</span></button></div>` : '';
		return `<article class="runner-exercise ${isActive ? 'active' : ''} ${exercise.finished ? 'finished' : ''}"><div class="runner-exercise-top"><span class="exercise-icon emoji">${categoryIcons[exercise.category] || '🏋️'}</span><div><b>${exercise.name}</b><small>${exercise.category} · ${exercise.sets} ${t('sets')} x ${exercise.reps} ${t('reps')}</small></div><span class="runner-set-count">${exercise.completedSets}/${exercise.sets}</span></div>${setLines ? `<div class="runner-set-log">${setLines}</div>` : ''}${controls}</article>`;
	}).join('');
	document.querySelector('#runner-progress').textContent = `${t('Exercise')} ${Math.min(runner.activeIndex + 1, runner.exercises.length)} ${t('of')} ${runner.exercises.length}`;
	const activeExercise = runner.exercises[runner.activeIndex];
	if (!activeExercise?.running) { document.querySelector('#runner-timer').textContent = '00:00'; setRingProgress(1); }
	document.querySelector('#runner-finish').disabled = !runner.exercises.every((exercise) => exercise.finished);
	list.querySelector('.runner-start')?.addEventListener('click', advanceRunner);
	list.querySelectorAll('.set-step').forEach((button) => button.addEventListener('click', () => adjustRunnerSets(Number(button.dataset.step))));
}
function adjustRunnerSets(step) {
	const exercise = runner.exercises[runner.activeIndex];
	const next = exercise.sets + step;
	if (next < Math.max(exercise.completedSets + (exercise.running ? 1 : 0), 1) || next > 12) return;
	exercise.sets = next;
	if (runner.workoutId) {
		const list = loadWorkouts();
		const workout = list.find((item) => item.id === runner.workoutId);
		const source = workout?.exercises.find((item) => item.name === exercise.name);
		if (source) { source.sets = next; saveWorkouts(list); renderWorkoutTemplates(); }
	}
	renderRunner();
}
function startWorkout(workout) {
	if (!workout?.exercises?.length) { showToast(t('Add at least one exercise first.')); openTab('workout'); return; }
	const chosen = runnerExercises(workout);
	stopRunnerClock();
	runner = { exercises: chosen, activeIndex: 0, startedAt: Date.now(), workoutId: workout.id, workoutName: workout.name };
	document.querySelector('#runner-title').textContent = workout.name;
	document.querySelector('#runner-status').textContent = t('Press start when you are ready for your first set.');
	renderRunner();
	showModal('runner-modal');
}
// ---- Hydration nudge: fires once, the moment the session passes its halfway mark ----
function maybeHydrationReminder() {
	if (!runner || runner.hydrationShown) return;
	const planned = runner.exercises.reduce((sum, item) => sum + item.sets, 0);
	const done = runner.exercises.reduce((sum, item) => sum + item.completedSets, 0);
	if (!planned || done < planned / 2) return;
	runner.hydrationShown = true;
	const banner = document.querySelector('#hydration-banner');
	banner.classList.add('show');
	if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
	clearTimeout(runner.hydrationTimer);
	runner.hydrationTimer = setTimeout(() => banner.classList.remove('show'), 9000);
}

function advanceRunner() {
	const exercise = runner.exercises[runner.activeIndex];
	if (!exercise.running) {
		exercise.running = true;
		exercise.started = true;
		startRunnerClock(exercise);
		document.querySelector('#runner-status').textContent = `${exercise.name} · ${t('Set')} ${exercise.completedSets + 1}. ${t('Press complete when the set is done.')}`;
		renderRunner();
		return;
	}
	const setTime = Math.max(0, Math.floor((Date.now() - exercise.setStartedAt) / 1000));
	exercise.setTimes.push(setTime);
	exercise.totalTime += setTime;
	exercise.completedSets += 1;
	exercise.running = false;
	exercise.setStartedAt = null;
	stopRunnerClock();
	document.querySelector('#runner-timer').textContent = '00:00';
	setRingProgress(1);
	maybeHydrationReminder();
	if (exercise.completedSets >= exercise.sets) {
		exercise.finished = true;
		const hasNext = runner.activeIndex < runner.exercises.length - 1;
		if (hasNext) {
			runner.activeIndex += 1;
			document.querySelector('#runner-status').textContent = `${exercise.name} ${t('complete')}. ${t('Start the next exercise when ready.')}`;
		} else {
			document.querySelector('#runner-status').textContent = t('All exercises complete. Open your report.');
			renderRunner();
			finishGuidedWorkout();
			return;
		}
	} else {
		document.querySelector('#runner-status').textContent = `${t('Set')} ${exercise.completedSets} ${t('complete')} (${formatTime(setTime)}). ${t('Rest, then start the next set.')}`;
	}
	renderRunner();
}
function finishGuidedWorkout() {
	stopRunnerClock();
	const worked = runner.exercises.filter((exercise) => exercise.completedSets > 0);
	const report = {
		id: Date.now(),
		date: new Date().toISOString(),
		duration: runner.exercises.reduce((sum, exercise) => sum + exercise.totalTime, 0),
		elapsed: Math.floor((Date.now() - runner.startedAt) / 1000),
		exercises: worked.length,
		sets: runner.exercises.reduce((sum, exercise) => sum + exercise.completedSets, 0),
		reps: runner.exercises.reduce((sum, exercise) => sum + exercise.completedSets * exercise.reps, 0),
		exerciseStats: worked.map((exercise) => ({ name: exercise.name, category: exercise.category, planned: exercise.sets, sets: exercise.completedSets, reps: exercise.completedSets * exercise.reps, time: exercise.totalTime, best: Math.min(...exercise.setTimes), average: Math.round(exercise.totalTime / exercise.setTimes.length), setTimes: exercise.setTimes })),
		details: worked.map((exercise) => `${exercise.name}: ${exercise.completedSets}/${exercise.sets} sets`).join(' · '),
	};
	const key = `forge-reports-${currentUserKey()}`;
	const reports = JSON.parse(localStorage.getItem(key) || '[]');
	reports.unshift(report);
	localStorage.setItem(key, JSON.stringify(reports.slice(0, 50)));
	refreshStats();
	renderBadges();
	document.querySelector('#report-summary').innerHTML = `<div><b>${formatTime(report.elapsed)}</b><span>${t('Session length')}</span></div><div><b>${report.reps}</b><span>${t('Total reps')}</span></div><div><b>${report.sets}</b><span>${t('Sets finished')}</span></div><div class="report-exercise-stats">${report.exerciseStats.map((stat) => `<article><b>${categoryIcons[stat.category] || '🏋️'} ${stat.name}</b><span>${stat.sets}/${stat.planned} ${t('sets')} · ${stat.reps} ${t('reps')} · ${formatTime(stat.time)} ${t('working time')}</span><small>${stat.setTimes.map((time, index) => `${t('Set')} ${index + 1}: ${formatTime(time)}`).join(' · ')}</small><small>${t('Fastest')}: ${formatTime(stat.best)} · ${t('Average')}: ${formatTime(stat.average)}</small></article>`).join('')}</div><p>${report.details}</p>`;
	closeModal();
	showModal('report-modal');
}
function renderReports() { const reports = JSON.parse(localStorage.getItem(`forge-reports-${currentUserKey()}`) || '[]'); document.querySelector('#reports-list').innerHTML = reports.length ? reports.map((report) => `<article class="saved-report"><b>${new Date(report.date).toLocaleDateString()}</b><span>${formatTime(report.elapsed || report.duration)} · ${report.reps} reps · ${report.sets} sets</span><small>${report.exerciseStats ? report.exerciseStats.map((stat) => `${stat.name}: ${stat.sets} sets · ${formatTime(stat.time)}`).join(' | ') : report.details}</small></article>`).join('') : '<p class="empty-state">Finish a guided workout to see its report here.</p>'; }
document.querySelector('#runner-finish').addEventListener('click', () => { if (runner?.exercises.some((exercise) => exercise.completedSets > 0)) finishGuidedWorkout(); else showToast('Complete at least one set before viewing the report.'); });
document.querySelector('#report-done').addEventListener('click', closeModal);
document.querySelector('#hydration-banner .hydration-close').addEventListener('click', () => document.querySelector('#hydration-banner').classList.remove('show'));

const trackerFields = ['meal', 'water', 'calorie', 'steps'];
const savedTracking = JSON.parse(localStorage.getItem('forge-tracking') || '{}');
trackerFields.forEach((field) => { const input = document.querySelector(`#${field}-input`); if (input && savedTracking[field]) input.value = savedTracking[field]; });
const subscribeButton = document.querySelector('#subscribe-button');
function updateSubscriptionButton() { const yearly = localStorage.getItem('forge-billing') === 'yearly'; subscribeButton.innerHTML = localStorage.getItem('forge-premium') === 'active' ? `Premium active · ${yearly ? '€64.69 / year' : '€5.99 / month'} ✓` : `Subscribe for ${yearly ? '€64.69 / year' : '€5.99 / month'} <span>→</span>`; }
function setPremiumTab(name) {
	document.querySelectorAll('.premium-tab').forEach((button) => button.classList.toggle('active', button.dataset.ptab === name));
	document.querySelectorAll('.premium-tab-content').forEach((panel) => panel.classList.toggle('active', panel.id === `premium-${name}`));
}
document.querySelectorAll('.premium-tab').forEach((button) => button.addEventListener('click', () => setPremiumTab(button.dataset.ptab)));
document.querySelectorAll('[data-ptab-link]').forEach((button) => button.addEventListener('click', () => setPremiumTab(button.dataset.ptabLink)));

document.querySelector('#subscribe-button').addEventListener('click', () => { if (localStorage.getItem('forge-premium') === 'active') { showToast('Forge Premium is already active.'); return; } const yearly = localStorage.getItem('forge-billing') === 'yearly'; document.querySelector('#payment-summary').textContent = yearly ? '€64.69 / year · save 10%' : '€5.99 / month'; showModal('payment-modal'); });
document.querySelector('#payment-form').addEventListener('submit', (event) => { event.preventDefault(); const plan = localStorage.getItem('forge-billing') || 'monthly'; localStorage.setItem('forge-premium', 'active'); localStorage.setItem('forge-subscription', JSON.stringify({ status: 'active', plan, started: new Date().toISOString(), lastFour: document.querySelector('#card-number').value.replace(/\D/g, '').slice(-4) })); event.target.reset(); closeModal(); updateSubscriptionButton(); renderNutritionLock(); applyAvatar(); renderBadges(); initCoach(); showToast('Payment accepted. Premium is active.'); });
document.querySelectorAll('.billing-option').forEach((option) => option.addEventListener('click', () => { document.querySelectorAll('.billing-option').forEach((item) => item.classList.remove('active')); option.classList.add('active'); localStorage.setItem('forge-billing', option.dataset.billing); updateSubscriptionButton(); showToast(`${option.dataset.billing === 'yearly' ? 'Yearly' : 'Monthly'} plan selected.`); }));
const savedBilling = localStorage.getItem('forge-billing') || 'monthly'; document.querySelector(`.billing-option[data-billing="${savedBilling}"]`)?.classList.add('active'); updateSubscriptionButton();
document.querySelector('#save-trackers').addEventListener('click', () => { const tracking = Object.fromEntries(trackerFields.map((field) => [field, document.querySelector(`#${field}-input`).value || 0])); localStorage.setItem('forge-tracking', JSON.stringify(tracking)); showToast('Today\'s tracking saved.'); });
const themeColors = { lime: '#d9ef54', coral: '#ff765f', blue: '#76b6d7', mint: '#72d6b0', orange: '#ffad5c', 'neon-pink': '#ff2bd6', 'neon-green': '#7dff00', 'neon-blue': '#00e5ff', 'neon-yellow': '#faff00' };
document.querySelectorAll('.theme-swatch').forEach((swatch) => swatch.addEventListener('click', () => { document.documentElement.style.setProperty('--lime', themeColors[swatch.dataset.theme]); document.querySelectorAll('.theme-swatch').forEach((item) => item.classList.remove('active')); swatch.classList.add('active'); localStorage.setItem('forge-theme', swatch.dataset.theme); showToast('Theme updated.'); }));
const savedTheme = localStorage.getItem('forge-theme'); if (savedTheme) document.querySelector(`.theme-swatch[data-theme="${savedTheme}"]`)?.click();
document.querySelector('#generate-report').addEventListener('click', () => { const tracking = JSON.parse(localStorage.getItem('forge-tracking') || '{}'); const sets = JSON.parse(localStorage.getItem('forge-sets') || '[]'); document.querySelector('#monthly-report span').textContent = `${sets.length} sets logged · ${tracking.steps || 0} steps · ${tracking.calorie || 0} kcal tracked today. Keep building your month.`; showToast('Monthly report generated.'); });
tabs.forEach((tab) => tab.addEventListener('click', () => openTab(tab.dataset.tab)));
document.querySelectorAll('.modal-close').forEach((button) => button.addEventListener('click', closeModal));
document.querySelector('#modal-backdrop').addEventListener('click', (event) => { if (event.target.id === 'modal-backdrop') closeModal(); });

// ---- Exercise library: a well-organized menu of common exercises, grouped by category ----
const categoryIcons = { Chest: '🏋️', Back: '🚣', Legs: '🦵', Shoulders: '🤸', Arms: '💪', Core: '🧘', Cardio: '🏃', Custom: '⭐' };
const exerciseLibrary = [
	{ name: 'Bench press', category: 'Chest', equipment: 'Barbell', sets: 4, reps: 8, rest: 120 },
	{ name: 'Incline dumbbell press', category: 'Chest', equipment: 'Dumbbell', sets: 3, reps: 10, rest: 90 },
	{ name: 'Cable fly', category: 'Chest', equipment: 'Cable', sets: 3, reps: 12, rest: 60 },
	{ name: 'Push-up', category: 'Chest', equipment: 'Bodyweight', sets: 3, reps: 15, rest: 60 },
	{ name: 'Dips', category: 'Chest', equipment: 'Bodyweight', sets: 3, reps: 10, rest: 90 },
	{ name: 'Deadlift', category: 'Back', equipment: 'Barbell', sets: 4, reps: 5, rest: 150 },
	{ name: 'Barbell row', category: 'Back', equipment: 'Barbell', sets: 4, reps: 8, rest: 120 },
	{ name: 'Lat pulldown', category: 'Back', equipment: 'Machine', sets: 3, reps: 10, rest: 90 },
	{ name: 'Pull-up', category: 'Back', equipment: 'Bodyweight', sets: 3, reps: 8, rest: 90 },
	{ name: 'Seated cable row', category: 'Back', equipment: 'Cable', sets: 3, reps: 12, rest: 60 },
	{ name: 'Back squat', category: 'Legs', equipment: 'Barbell', sets: 4, reps: 8, rest: 150 },
	{ name: 'Romanian deadlift', category: 'Legs', equipment: 'Barbell', sets: 3, reps: 10, rest: 120 },
	{ name: 'Leg press', category: 'Legs', equipment: 'Machine', sets: 4, reps: 10, rest: 90 },
	{ name: 'Walking lunge', category: 'Legs', equipment: 'Dumbbell', sets: 3, reps: 12, rest: 60 },
	{ name: 'Leg curl', category: 'Legs', equipment: 'Machine', sets: 3, reps: 12, rest: 60 },
	{ name: 'Calf raise', category: 'Legs', equipment: 'Machine', sets: 4, reps: 15, rest: 45 },
	{ name: 'Overhead press', category: 'Shoulders', equipment: 'Barbell', sets: 3, reps: 10, rest: 120 },
	{ name: 'Arnold press', category: 'Shoulders', equipment: 'Dumbbell', sets: 3, reps: 10, rest: 90 },
	{ name: 'Lateral raise', category: 'Shoulders', equipment: 'Dumbbell', sets: 3, reps: 15, rest: 45 },
	{ name: 'Face pull', category: 'Shoulders', equipment: 'Cable', sets: 3, reps: 15, rest: 45 },
	{ name: 'Barbell curl', category: 'Arms', equipment: 'Barbell', sets: 3, reps: 12, rest: 60 },
	{ name: 'Hammer curl', category: 'Arms', equipment: 'Dumbbell', sets: 3, reps: 12, rest: 60 },
	{ name: 'Tricep pushdown', category: 'Arms', equipment: 'Cable', sets: 3, reps: 12, rest: 60 },
	{ name: 'Skull crusher', category: 'Arms', equipment: 'Barbell', sets: 3, reps: 10, rest: 60 },
	{ name: 'Hanging leg raise', category: 'Core', equipment: 'Bodyweight', sets: 3, reps: 12, rest: 60 },
	{ name: 'Cable crunch', category: 'Core', equipment: 'Cable', sets: 3, reps: 15, rest: 45 },
	{ name: 'Russian twist', category: 'Core', equipment: 'Bodyweight', sets: 3, reps: 20, rest: 45 },
	{ name: 'Treadmill intervals', category: 'Cardio', equipment: 'Machine', sets: 1, reps: 20, rest: 0 },
	{ name: 'Rowing machine', category: 'Cardio', equipment: 'Machine', sets: 1, reps: 15, rest: 0 },
	{ name: 'Jump rope', category: 'Cardio', equipment: 'Bodyweight', sets: 3, reps: 2, rest: 30 },
];

// ---- Saved workouts: user-built sessions, persisted per account ----
function workoutsKey() { return `forge-workouts-${currentUserKey()}`; }
function loadWorkouts() { try { return JSON.parse(localStorage.getItem(workoutsKey()) || '[]'); } catch (error) { return []; } }
function saveWorkouts(list) { localStorage.setItem(workoutsKey(), JSON.stringify(list)); }

// The workout currently being assembled in the builder.
let draft = null;

function renderWorkoutTemplates() {
	const list = loadWorkouts();
	document.querySelector('#workout-count').textContent = `${list.length} ${list.length === 1 ? 'SAVED' : 'SAVED'}`;
	const container = document.querySelector('#workout-templates');
	if (!list.length) {
		container.innerHTML = '<p class="empty-state">No workouts yet. Tap “New workout” to build your first session from scratch.</p>';
		return;
	}
	container.innerHTML = list.map((workout) => {
		const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
		return `<article class="template-card" data-id="${workout.id}"><div class="template-top"><div><b>${workout.name}</b><small>${workout.exercises.length} exercises · ${totalSets} sets</small></div><button type="button" class="template-delete" data-delete="${workout.id}" aria-label="Delete workout">🗑</button></div><div class="template-chips">${workout.exercises.map((exercise) => `<span class="template-chip">${categoryIcons[exercise.category] || '🏋️'} ${exercise.name}</span>`).join('')}</div><div class="template-actions"><button type="button" class="secondary-button" data-edit="${workout.id}">Edit</button><button type="button" class="primary-button" data-start="${workout.id}">Start <span>→</span></button></div></article>`;
	}).join('');
	container.querySelectorAll('[data-start]').forEach((button) => button.addEventListener('click', () => {
		const workout = loadWorkouts().find((item) => item.id === Number(button.dataset.start));
		if (workout) startWorkout(workout);
	}));
	container.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => {
		const workout = loadWorkouts().find((item) => item.id === Number(button.dataset.edit));
		if (workout) openBuilder(JSON.parse(JSON.stringify(workout)));
	}));
	container.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => {
		saveWorkouts(loadWorkouts().filter((item) => item.id !== Number(button.dataset.delete)));
		renderWorkoutTemplates();
		renderBadges();
		showToast('Workout deleted.');
	}));
	if (typeof renderNextWorkout === 'function') renderNextWorkout();
}

// ---- Builder: name the session, then add each exercise with its own sets, reps and rest ----
function openBuilder(existing) {
	draft = existing || { id: Date.now(), name: '', exercises: [] };
	document.querySelector('#builder-title').textContent = existing ? 'Edit your session' : 'Build your session';
	document.querySelector('#builder-name').value = draft.name;
	renderBuilder();
	showModal('builder-modal');
}

function renderBuilder() {
	document.querySelector('#builder-count').textContent = `${draft.exercises.length} added`;
	const list = document.querySelector('#builder-list');
	if (!draft.exercises.length) {
		list.innerHTML = '<p class="empty-state">Nothing added yet. Use “Add an exercise” to pick from the library.</p>';
	} else {
		list.innerHTML = draft.exercises.map((exercise, index) => `<article class="builder-row" data-index="${index}"><div class="builder-row-top"><span class="exercise-icon emoji">${categoryIcons[exercise.category] || '🏋️'}</span><div><b>${exercise.name}</b><small>${exercise.category} · ${exercise.equipment}</small></div><div class="builder-order"><button type="button" data-move="-1" aria-label="Move up">↑</button><button type="button" data-move="1" aria-label="Move down">↓</button><button type="button" data-remove="1" aria-label="Remove">×</button></div></div><div class="builder-fields"><label>Sets<input type="number" min="1" max="12" value="${exercise.sets}" data-field="sets" /></label><label>Reps<input type="number" min="1" max="100" value="${exercise.reps}" data-field="reps" /></label><label>Rest (s)<input type="number" min="0" max="600" step="15" value="${exercise.rest}" data-field="rest" /></label></div></article>`).join('');
	}
	list.querySelectorAll('.builder-row').forEach((row) => {
		const index = Number(row.dataset.index);
		row.querySelectorAll('input[data-field]').forEach((input) => input.addEventListener('change', () => {
			const value = Number(input.value);
			if (Number.isFinite(value) && value >= 0) draft.exercises[index][input.dataset.field] = value;
		}));
		row.querySelector('[data-remove]').addEventListener('click', () => { draft.exercises.splice(index, 1); renderBuilder(); });
		row.querySelectorAll('[data-move]').forEach((button) => button.addEventListener('click', () => {
			const target = index + Number(button.dataset.move);
			if (target < 0 || target >= draft.exercises.length) return;
			[draft.exercises[index], draft.exercises[target]] = [draft.exercises[target], draft.exercises[index]];
			renderBuilder();
		}));
	});
}

function commitDraftName() { draft.name = document.querySelector('#builder-name').value.trim() || 'Untitled workout'; }

function persistDraft() {
	commitDraftName();
	const list = loadWorkouts();
	const existingIndex = list.findIndex((item) => item.id === draft.id);
	if (existingIndex >= 0) list[existingIndex] = draft; else list.unshift(draft);
	saveWorkouts(list);
	renderWorkoutTemplates();
	renderBadges();
}

document.querySelector('#new-workout').addEventListener('click', () => openBuilder(null));
document.querySelector('#builder-add').addEventListener('click', openLibrary);
document.querySelector('#builder-add-2').addEventListener('click', openLibrary);
document.querySelector('#builder-save').addEventListener('click', () => {
	if (!draft.exercises.length) { showToast('Add at least one exercise first.'); return; }
	persistDraft();
	closeModal();
	showToast(`${draft.name} saved.`);
});
document.querySelector('#builder-start').addEventListener('click', () => {
	if (!draft.exercises.length) { showToast('Add at least one exercise first.'); return; }
	persistDraft();
	startWorkout(draft);
});

// ---- Exercise library: pick exercises into the draft, or define a custom one ----
let libraryFilter = 'All';
function renderLibraryFilters() {
	const cats = ['All', ...new Set(exerciseLibrary.map((exercise) => exercise.category))];
	const row = document.querySelector('#library-filter-row');
	row.innerHTML = cats.map((cat) => `<button type="button" class="filter${cat === libraryFilter ? ' active' : ''}" data-cat="${cat}">${cat}</button>`).join('');
	row.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => { libraryFilter = button.dataset.cat; renderLibraryFilters(); renderLibraryList(); }));
}
function renderLibraryList() {
	const list = document.querySelector('#library-list');
	list.innerHTML = '';
	exerciseLibrary.filter((exercise) => libraryFilter === 'All' || exercise.category === libraryFilter).forEach((exercise) => {
		const added = draft?.exercises.some((item) => item.name === exercise.name);
		const row = document.createElement('button');
		row.type = 'button';
		row.className = 'exercise-row library-row';
		if (added) row.disabled = true;
		row.innerHTML = `<span class="exercise-icon emoji">${categoryIcons[exercise.category]}</span><span><b>${exercise.name}</b><small>${exercise.category} · ${exercise.equipment} · ${exercise.sets}x${exercise.reps}</small></span><span class="${added ? 'check' : 'add'}">${added ? '✓' : '+'}</span>`;
		row.addEventListener('click', () => addToDraft(exercise));
		list.append(row);
	});
}
function addToDraft(exercise) {
	if (!draft) return;
	if (draft.exercises.some((item) => item.name === exercise.name)) { showToast(`${exercise.name} is already in this workout.`); return; }
	draft.exercises.push({ name: exercise.name, category: exercise.category, equipment: exercise.equipment, sets: exercise.sets, reps: exercise.reps, rest: exercise.rest });
	renderBuilder();
	renderLibraryList();
	showToast(`${exercise.name} added.`);
}
function openLibrary() { renderLibraryFilters(); renderLibraryList(); if (currentLanguage !== 'en') applyLanguage(currentLanguage); showModal('library-modal'); }
document.querySelector('#show-custom-form').addEventListener('click', () => document.querySelector('#program-form').classList.toggle('hidden'));
document.querySelector('#program-form').addEventListener('submit', (event) => {
	event.preventDefault();
	addToDraft({
		name: document.querySelector('#program-name').value.trim(),
		category: document.querySelector('#program-muscle').value.trim() || 'Custom',
		equipment: 'Custom',
		sets: Number(document.querySelector('#program-sets').value) || 3,
		reps: Number(document.querySelector('#program-reps').value) || 10,
		rest: Number(document.querySelector('#program-rest').value) || 90,
	});
	event.target.reset();
	event.target.classList.add('hidden');
});
document.querySelector('#library-modal .modal-close').addEventListener('click', () => { if (draft) showModal('builder-modal'); });

// ---- Rest timer: counts down between sets with pause-free +15s / skip controls ----
const restBar = document.querySelector('#rest-timer-bar');
let restInterval = null;
function startRestTimer(seconds, exerciseName) {
	if (!seconds) return;
	clearInterval(restInterval);
	let remaining = seconds;
	const total = seconds;
	const label = restBar.querySelector('.rest-label');
	const fill = restBar.querySelector('.rest-fill');
	const time = restBar.querySelector('.rest-time');
	label.textContent = `Rest · ${exerciseName}`;
	function render() {
		time.textContent = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
		fill.style.width = `${Math.max((remaining / total) * 100, 0)}%`;
	}
	render();
	restBar.classList.add('show');
	restInterval = setInterval(() => {
		remaining -= 1;
		if (remaining <= 0) {
			clearInterval(restInterval);
			restBar.classList.remove('show');
			if (navigator.vibrate) navigator.vibrate([200, 80, 200]);
			showToast('Rest complete — next set!');
			return;
		}
		render();
	}, 1000);
	restBar.querySelector('.rest-add').onclick = () => { remaining += 15; render(); };
	restBar.querySelector('.rest-skip').onclick = () => { clearInterval(restInterval); restBar.classList.remove('show'); };
}

// ---- Personal records: flag a new best and reflect it on the progress stat card ----
function updateTopLift(exerciseName, weight) {
	document.querySelector('#top-lift-weight').innerHTML = `${weight} <small>kg</small>`;
	document.querySelector('#top-lift-name').textContent = `${exerciseName} · new personal best`;
}
function checkPersonalRecord(exerciseName, weight) {
	const prs = JSON.parse(localStorage.getItem(prsKey()) || '{}');
	if (!prs[exerciseName] || weight > prs[exerciseName]) {
		prs[exerciseName] = weight;
		localStorage.setItem(prsKey(), JSON.stringify(prs));
		updateTopLift(exerciseName, weight);
		setTimeout(() => showToast(`🎉 New personal best: ${exerciseName} at ${weight} kg!`), 2300);
	}
}
renderWorkoutTemplates();
refreshStats();

document.querySelector('#add-goal').addEventListener('click', () => showModal('goal-modal'));
function goalsKey() { return `forge-goals-${currentUserKey()}`; }
function loadGoals() { try { return JSON.parse(localStorage.getItem(goalsKey()) || '[]'); } catch (error) { return []; } }
function renderGoals() {
	const goals = loadGoals();
	const list = document.querySelector('#goal-list');
	if (!goals.length) { list.innerHTML = '<p class="empty-state">No goals yet. Create one to give your training a target.</p>'; return; }
	list.innerHTML = goals.map((goal, index) => `<div class="goal-card${goal.done ? ' goal-done' : ''}"><div class="goal-icon${goal.done ? '' : index % 2 ? ' coral' : ''}">${goal.done ? '✓' : String(index + 1).padStart(2, '0')}</div><div><b>${goal.name}</b><span>Target date: ${goal.date || 'not set'}</span><div class="progress-track${index % 2 && !goal.done ? ' coral-track' : ''}"><i style="width:${goal.done ? 100 : 0}%"></i></div><small>${goal.done ? 'Achieved' : 'In progress'}</small><div class="goal-actions"><button type="button" class="goal-toggle" data-toggle="${index}">${goal.done ? 'Reopen' : 'Mark achieved'}</button></div></div><button type="button" class="more-button" data-goal="${index}">×</button></div>`).join('');
	list.querySelectorAll('[data-goal]').forEach((button) => button.addEventListener('click', () => {
		const remaining = loadGoals().filter((item, index) => index !== Number(button.dataset.goal));
		localStorage.setItem(goalsKey(), JSON.stringify(remaining));
		renderGoals();
		renderBadges();
		showToast('Goal removed.');
	}));
	list.querySelectorAll('[data-toggle]').forEach((button) => button.addEventListener('click', () => {
		const all = loadGoals();
		const goal = all[Number(button.dataset.toggle)];
		goal.done = !goal.done;
		localStorage.setItem(goalsKey(), JSON.stringify(all));
		renderGoals();
		renderBadges();
		showToast(goal.done ? `🏆 Goal achieved: ${goal.name}` : 'Goal reopened.');
	}));
}
document.querySelector('#goal-form').addEventListener('submit', (event) => {
	event.preventDefault();
	const goals = loadGoals();
	goals.push({ name: document.querySelector('#goal-name').value, date: document.querySelector('#goal-date').value });
	localStorage.setItem(goalsKey(), JSON.stringify(goals));
	renderGoals();
	renderBadges();
	event.target.reset();
	closeModal();
	showToast('Goal created.');
});
renderGoals();

document.querySelector('#edit-profile').addEventListener('click', () => { document.querySelector('#edit-name').value = document.querySelector('#profile-name').textContent; document.querySelector('#edit-height').value = parseInt(document.querySelector('#profile-height').textContent, 10); document.querySelector('#edit-weight').value = parseInt(document.querySelector('#profile-weight').textContent, 10); document.querySelector('#edit-focus').value = document.querySelector('#profile-focus').textContent; document.querySelector('#edit-gender').value = ['Male','Female','Other'].includes(document.querySelector('#profile-gender').textContent) ? document.querySelector('#profile-gender').textContent : 'Other'; document.querySelector('#edit-target').value = parseInt(document.querySelector('#profile-page-target').textContent, 10) || 4; showModal('profile-modal'); });
document.querySelector('#profile-form').addEventListener('submit', (event) => { event.preventDefault(); const values = { name: document.querySelector('#edit-name').value, height: document.querySelector('#edit-height').value, weight: document.querySelector('#edit-weight').value, focus: document.querySelector('#edit-focus').value, gender: document.querySelector('#edit-gender').value, target: document.querySelector('#edit-target').value }; localStorage.setItem('forge-profile', JSON.stringify(values)); const sessionEmail = localStorage.getItem('forge-session'); if (sessionEmail) { if (authMode === 'server') { fetch('/api/auth/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(values) }).catch((error) => console.error('Could not sync profile to the server:', error)); } else { const accounts = loadAccounts(); if (accounts[sessionEmail]) { accounts[sessionEmail].profile = { ...accounts[sessionEmail].profile, ...values }; saveAccounts(accounts); } } } updateProfile(values); closeModal(); showToast('Profile updated.'); });
function updateProfile(values) { values.target = values.target || 4; const initials = values.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(); document.querySelectorAll('#profile-name, #profile-page-name').forEach((element) => { element.textContent = values.name; }); document.querySelectorAll('#profile-height, #profile-page-height').forEach((element) => { element.textContent = `${values.height} cm`; }); document.querySelectorAll('#profile-weight, #profile-page-weight').forEach((element) => { element.textContent = `${values.weight} kg`; }); document.querySelectorAll('#profile-focus, #profile-page-focus').forEach((element) => { element.textContent = values.focus; }); document.querySelectorAll('#profile-gender, #profile-page-gender').forEach((element) => { element.textContent = values.gender || '—'; }); if (typeof applyAvatar === 'function') applyAvatar(); document.querySelector('#profile-page-target').textContent = `${values.target} sessions`; document.querySelector('h1').innerHTML = `Good morning, ${values.name.split(' ')[0]}<span class="accent">.</span>`; document.querySelectorAll('.avatar, .large-avatar').forEach((element) => { element.textContent = initials; }); }
const savedProfile = JSON.parse(localStorage.getItem('forge-profile') || 'null'); if (savedProfile) updateProfile(savedProfile);

// ---- Calendar: each day can be a training day (with a time), a rest day, or empty ----
function calendarKey() { return `forge-calendar-${currentUserKey()}`; }
const DAYS_IN_MONTH = 30;
const MONTH_LABEL = 'September';
function loadCalendar() {
	try {
		return JSON.parse(localStorage.getItem(calendarKey()) || '{}');
	} catch (error) { return {}; }
}
function saveCalendar(data) { localStorage.setItem(calendarKey(), JSON.stringify(data)); }
let calendar = {};
let selectedDay = null;

function formatClock(time) {
	if (!time) return '';
	const [hours, minutes] = time.split(':').map(Number);
	const suffix = hours >= 12 ? 'PM' : 'AM';
	const display = hours % 12 === 0 ? 12 : hours % 12;
	return `${display}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function renderCalendar() {
	const grid = document.querySelector('#calendar-grid');
	grid.innerHTML = '';
	for (let day = 1; day <= DAYS_IN_MONTH; day += 1) {
		const entry = calendar[day];
		const cell = document.createElement('button');
		cell.type = 'button';
		cell.className = `calendar-day${entry ? ` ${entry.status}` : ''}${entry?.completed ? ' completed' : ''}`;
		cell.innerHTML = `<span class="day-number">${day}</span>${entry?.status === 'training' && entry.time ? `<span class="day-time">${entry.time}</span>` : ''}`;
		cell.addEventListener('click', () => cycleDay(day));
		grid.append(cell);
	}
	renderMonthSummary();
	renderDayDetail();
}

// Tapping walks a day through three states: empty -> training -> rest -> empty.
function cycleDay(day) {
	const entry = calendar[day];
	if (!entry) {
		calendar[day] = { status: 'training', time: '18:00', duration: 60, note: '' };
		showToast(`Training day added: ${MONTH_LABEL} ${day}. Tap the pencil to set the time.`);
	} else if (entry.status === 'training') {
		calendar[day] = { status: 'rest' };
		if (selectedDay === day) selectedDay = null;
		showToast(`${MONTH_LABEL} ${day} marked as a rest day.`);
	} else {
		delete calendar[day];
		if (selectedDay === day) selectedDay = null;
		showToast(`${MONTH_LABEL} ${day} cleared.`);
	}
	saveCalendar(calendar);
	renderCalendar();
}

function renderMonthSummary() {
	const entries = Object.values(calendar);
	const training = entries.filter((entry) => entry.status === 'training');
	const rest = entries.filter((entry) => entry.status === 'rest').length;
	const completed = training.filter((entry) => entry.completed).length;
	const planned = training.length;
	const minutes = training.reduce((sum, entry) => sum + (Number(entry.duration) || 0), 0);
	const rate = planned ? Math.round((completed / planned) * 100) : 0;
	document.querySelector('#month-summary').innerHTML = `<div><b>${planned}</b><span>TRAINING DAYS</span></div><div><b>${rest}</b><span>REST DAYS</span></div><div><b>${completed}/${planned}</b><span>COMPLETED</span></div><div class="summary-bar"><div class="progress-track"><i style="width:${rate}%"></i></div><small>${rate}% of planned sessions done · ${Math.round(minutes / 60)} h scheduled this month</small></div>`;
}

function renderDayDetail() {
	const panel = document.querySelector('#day-detail');
	const days = Object.keys(calendar).map(Number).filter((day) => calendar[day].status === 'training').sort((a, b) => a - b);
	if (!days.length) { panel.innerHTML = '<p class="empty-state">No sessions scheduled yet. Tap a date above to add one.</p>'; return; }
	panel.innerHTML = `<p class="eyebrow schedule-label">SCHEDULED SESSIONS</p>${days.map((day) => {
		const entry = calendar[day];
		return `<div class="day-detail-card${entry.completed ? ' is-done' : ''}"><div><p class="eyebrow">${MONTH_LABEL.toUpperCase()} ${day}</p><b>${formatClock(entry.time)} · ${entry.duration} min</b>${entry.note ? `<small>${entry.note}</small>` : ''}${entry.completed ? '<span class="done-flag">✓ Completed</span>' : ''}</div><button type="button" class="icon-button" data-edit-day="${day}" aria-label="Edit ${MONTH_LABEL} ${day}">✎</button></div>`;
	}).join('')}`;
	panel.querySelectorAll('[data-edit-day]').forEach((button) => button.addEventListener('click', () => openDayModal(Number(button.dataset.editDay))));
}

function openDayModal(day) {
	selectedDay = day;
	const entry = calendar[day] || { time: '18:00', duration: 60, note: '' };
	document.querySelector('#day-modal-eyebrow').textContent = `${MONTH_LABEL.toUpperCase()} ${day}`;
	document.querySelector('#day-modal-title').textContent = 'Set your session time';
	document.querySelector('#day-time').value = entry.time || '18:00';
	document.querySelector('#day-duration').value = entry.duration || 60;
	document.querySelector('#day-note').value = entry.note || '';
	document.querySelector('#day-mark-done').textContent = entry.completed ? 'Mark as not completed' : 'Mark as completed';
	showModal('day-modal');
}

document.querySelector('#day-form').addEventListener('submit', (event) => {
	event.preventDefault();
	calendar[selectedDay] = {
		...calendar[selectedDay],
		status: 'training',
		time: document.querySelector('#day-time').value,
		duration: Number(document.querySelector('#day-duration').value) || 60,
		note: document.querySelector('#day-note').value.trim(),
	};
	saveCalendar(calendar);
	renderCalendar();
	closeModal();
	showToast(`${MONTH_LABEL} ${selectedDay} set for ${formatClock(calendar[selectedDay].time)}.`);
});

document.querySelector('#day-mark-done').addEventListener('click', () => {
	const entry = calendar[selectedDay];
	if (!entry) return;
	entry.completed = !entry.completed;
	saveCalendar(calendar);
	renderCalendar();
	renderBadges();
	closeModal();
	showToast(entry.completed ? `${MONTH_LABEL} ${selectedDay} marked complete.` : `${MONTH_LABEL} ${selectedDay} reopened.`);
});

document.querySelector('#day-clear').addEventListener('click', () => {
	delete calendar[selectedDay];
	selectedDay = null;
	saveCalendar(calendar);
	renderCalendar();
	closeModal();
	showToast('Day cleared.');
});

function initCalendar() { calendar = loadCalendar(); selectedDay = null; renderCalendar(); }
initCalendar();

document.querySelector('#reminder-toggle').addEventListener('click', async (event) => { event.currentTarget.classList.toggle('active'); const enabled = event.currentTarget.classList.contains('active'); if (enabled && 'Notification' in window && Notification.permission === 'default') await Notification.requestPermission(); localStorage.setItem('forge-reminders', String(enabled)); showToast(enabled ? 'Weekly reminders enabled.' : 'Weekly reminders paused.'); });
document.querySelector('#schedule-reminder').addEventListener('click', () => showModal('reminder-modal'));
document.querySelector('#reminder-form').addEventListener('submit', (event) => { event.preventDefault(); const days = document.querySelector('#reminder-days').value; const time = document.querySelector('#reminder-time').value; localStorage.setItem('forge-reminder-settings', JSON.stringify({ days, time })); document.querySelector('#reminder-status').textContent = `Every ${days} at ${time}`; event.target.reset(); closeModal(); showToast('Reminder saved.'); });
const savedReminder = JSON.parse(localStorage.getItem('forge-reminder-settings') || 'null'); if (savedReminder) document.querySelector('#reminder-status').textContent = `Every ${savedReminder.days} at ${savedReminder.time}`;

document.querySelector('#find-friend').addEventListener('click', () => { const query = document.querySelector('#friend-search').value.trim(); const result = document.querySelector('#friend-result'); if (!query) { result.innerHTML = ''; return; } result.innerHTML = `<div class="search-result"><span class="friend-avatar">${query.slice(0, 2).toUpperCase()}</span><span><b>${query}</b><small>Forge member</small></span><button class="invite-button" data-friend="${query}">Add friend</button></div>`; result.querySelector('.invite-button').addEventListener('click', () => { saveFriend(query); result.innerHTML = '<p class="social-confirmation">Friend request sent.</p>'; }); });
function friendsKey() { return `forge-friends-${currentUserKey()}`; }
function loadFriends() { try { return JSON.parse(localStorage.getItem(friendsKey()) || '[]'); } catch (error) { return []; } }
function saveFriend(name, detail) { const friends = loadFriends(); if (!friends.some((item) => item.name === name)) { friends.push({ name, detail: detail || 'Forge member' }); localStorage.setItem(friendsKey(), JSON.stringify(friends)); } renderFriends(); }
function renderFriends() {
	const friends = loadFriends();
	document.querySelector('#friend-count').textContent = `${friends.length} ${friends.length === 1 ? 'FRIEND' : 'FRIENDS'}`;
	const list = document.querySelector('#friend-list');
	if (!friends.length) { list.innerHTML = '<p class="empty-state">No friends yet. Search above to connect with other members.</p>'; return; }
	list.innerHTML = friends.map((friend) => `<div class="friend-row"><span class="friend-avatar">${initials(friend.name)}</span><span><b>${friend.name}</b><small>${friend.detail}</small></span><button type="button" class="invite-button" data-friend="${friend.name}">Invite</button></div>`).join('');
	list.querySelectorAll('.invite-button').forEach((button) => button.addEventListener('click', () => { document.querySelector('#invite-name').value = button.dataset.friend; showModal('invite-modal'); }));
}

document.querySelector('#invite-friend').addEventListener('click', () => showModal('invite-modal'));
document.querySelector('#invite-form').addEventListener('submit', (event) => { event.preventDefault(); const invite = { name: document.querySelector('#invite-name').value, contact: document.querySelector('#invite-contact').value, day: document.querySelector('#invite-day').value }; localStorage.setItem('forge-last-invite', JSON.stringify(invite)); event.target.reset(); closeModal(); showToast(`Invitation sent to ${invite.name}.`); });

// ---- Premium nutrition: goal-driven meal guidance with full recipes ----
const nutritionGoals = {
	muscle: { label: 'Build muscle', icon: '💪', calories: '+300 to +500 kcal above maintenance', protein: '1.8–2.2 g per kg bodyweight', carbs: '4–6 g per kg', fats: '0.8–1 g per kg', advice: 'A modest surplus with high protein gives your body the raw material to repair and grow after training. Spread protein across four or five meals and keep carbohydrates high around your workouts so you can train hard session after session.' },
	lean: { label: 'Lose fat', icon: '🔥', calories: '−300 to −500 kcal below maintenance', protein: '2.0–2.4 g per kg bodyweight', carbs: '2–3 g per kg', fats: '0.6–0.8 g per kg', advice: 'A moderate deficit protects your muscle while body fat comes down. Keep protein high to stay full and preserve lean mass, prioritize high-volume vegetables, and avoid dropping calories so low that your training quality suffers.' },
	endurance: { label: 'Endurance', icon: '🏃', calories: 'At or slightly above maintenance', protein: '1.4–1.6 g per kg bodyweight', carbs: '6–8 g per kg', fats: '0.8–1 g per kg', advice: 'Carbohydrate is your primary fuel for long efforts. Top up glycogen the day before hard sessions, eat a carb-focused meal two to three hours before training, and refuel with carbs plus protein within an hour of finishing.' },
	maintain: { label: 'Stay healthy', icon: '🌿', calories: 'Around maintenance', protein: '1.4–1.8 g per kg bodyweight', carbs: '3–5 g per kg', fats: '0.8–1 g per kg', advice: 'Balance matters more than precision here. Build most meals from whole foods, aim for thirty different plants a week, and keep protein steady so you hold onto muscle as you age.' },
};
const recipes = [
	{ id: 'r1', name: 'Grilled chicken and quinoa bowl', meal: 'Lunch', goals: ['muscle', 'lean', 'maintain'], time: '25 min', icon: '🍗',
		summary: 'A high-protein bowl that keeps you full for hours without feeling heavy.',
		ingredients: ['180 g chicken breast', '80 g dry quinoa', '1 red pepper, sliced', '100 g broccoli florets', '1 tbsp olive oil', 'Juice of half a lemon', 'Salt, pepper, smoked paprika'],
		steps: ['Rinse the quinoa, then simmer in 160 ml water for 15 minutes until the water is absorbed.', 'Season the chicken with salt, pepper and paprika. Grill 5–6 minutes per side until cooked through.', 'Steam or roast the broccoli and pepper for 8 minutes so they keep some bite.', 'Rest the chicken 3 minutes, then slice against the grain.', 'Combine everything in a bowl, dress with olive oil and lemon juice.'],
		nutrition: { calories: 620, protein: 52, carbs: 58, fats: 18, fiber: 9 },
		benefit: 'Complete protein from the chicken plus all nine essential amino acids from quinoa makes this ideal for post-training repair. The fibre from the vegetables slows digestion, so energy releases steadily rather than spiking.' },
	{ id: 'r2', name: 'Overnight oats with berries', meal: 'Breakfast', goals: ['endurance', 'maintain', 'muscle'], time: '5 min + overnight', icon: '🥣',
		summary: 'Zero-effort breakfast prepared the night before, ready when you wake.',
		ingredients: ['70 g rolled oats', '200 ml milk or fortified soy milk', '150 g Greek yogurt', '1 tbsp chia seeds', '100 g mixed berries', '1 tsp honey', 'Pinch of cinnamon'],
		steps: ['Stir the oats, milk, chia seeds and cinnamon together in a jar.', 'Fold in half the yogurt, then seal and refrigerate overnight.', 'In the morning, top with the remaining yogurt, berries and honey.', 'Eat cold, or warm gently for 60 seconds if you prefer.'],
		nutrition: { calories: 510, protein: 28, carbs: 66, fats: 14, fiber: 12 },
		benefit: 'Slow-release oats plus the beta-glucan fibre keep blood sugar level through the morning. The berries add polyphenols that help reduce exercise-induced inflammation, and the yogurt supplies casein protein for sustained amino acid release.' },
	{ id: 'r3', name: 'Salmon, sweet potato and greens', meal: 'Dinner', goals: ['muscle', 'maintain', 'endurance'], time: '35 min', icon: '🐟',
		summary: 'Omega-3 rich dinner that supports recovery and joint health.',
		ingredients: ['170 g salmon fillet', '250 g sweet potato', '100 g spinach', '1 clove garlic, minced', '1 tbsp olive oil', 'Half a lemon', 'Salt and black pepper'],
		steps: ['Heat the oven to 200°C. Cube the sweet potato, toss in half the oil and salt, roast 25 minutes.', 'Season the salmon and add it to the tray for the final 12–14 minutes.', 'Wilt the spinach in the remaining oil with the garlic, about 2 minutes.', 'Plate together and finish with a squeeze of lemon.'],
		nutrition: { calories: 680, protein: 42, carbs: 52, fats: 32, fiber: 8 },
		benefit: 'Salmon delivers EPA and DHA omega-3 fats, which research links to reduced muscle soreness and better joint health in people who train regularly. Sweet potato restocks glycogen, and spinach adds nitrates that support blood flow.' },
	{ id: 'r4', name: 'Turkey and black bean chili', meal: 'Dinner', goals: ['lean', 'muscle'], time: '40 min', icon: '🌶️',
		summary: 'High-volume, high-protein meal that satisfies on lower calories.',
		ingredients: ['400 g lean turkey mince', '1 tin black beans, drained', '1 tin chopped tomatoes', '1 onion, diced', '2 peppers, diced', '2 cloves garlic', '1 tbsp cumin', '1 tsp chili powder', '1 tsp olive oil'],
		steps: ['Soften the onion, peppers and garlic in the oil for 5 minutes.', 'Add the turkey and brown, breaking it up as it cooks.', 'Stir in the spices and cook 1 minute until fragrant.', 'Add the tomatoes and beans, then simmer uncovered for 25 minutes.', 'Season to taste and serve. It improves overnight, so make extra.'],
		nutrition: { calories: 430, protein: 45, carbs: 34, fats: 11, fiber: 13 },
		benefit: 'The combination of lean protein and soluble fibre from the beans produces strong satiety per calorie, which is exactly what you want in a deficit. Batch cooking also removes the decision fatigue that derails most fat loss attempts.' },
	{ id: 'r5', name: 'Pre-workout banana oat pancakes', meal: 'Pre-workout', goals: ['endurance', 'muscle'], time: '15 min', icon: '🥞',
		summary: 'Easy-to-digest carbohydrate about 90 minutes before you train.',
		ingredients: ['1 ripe banana', '50 g oat flour', '2 eggs', '1 scoop whey or 30 g milk powder', 'Half tsp baking powder', 'Pinch of salt', '1 tsp coconut oil'],
		steps: ['Blend everything except the oil until smooth, then rest the batter 3 minutes.', 'Heat the oil in a non-stick pan over medium heat.', 'Cook in small pancakes, roughly 90 seconds per side, until golden.', 'Serve plain or with a little honey if you are training long.'],
		nutrition: { calories: 480, protein: 34, carbs: 58, fats: 13, fiber: 6 },
		benefit: 'The banana provides fast-acting carbohydrate while the oats release more slowly, giving you fuel across a whole session. Low fat and moderate fibre mean it clears the stomach quickly and does not sit heavy while you train.' },
	{ id: 'r6', name: 'Greek yogurt recovery smoothie', meal: 'Post-workout', goals: ['muscle', 'endurance', 'lean'], time: '5 min', icon: '🥤',
		summary: 'Fast protein and carbohydrate in the window right after training.',
		ingredients: ['200 g Greek yogurt', '1 banana', '150 ml milk', '30 g whey protein or 2 tbsp peanut butter', '100 g frozen berries', 'Handful of ice'],
		steps: ['Add the liquid to the blender first so the blades move freely.', 'Add the yogurt, banana, berries and protein.', 'Blend 45 seconds until completely smooth.', 'Drink within 60 minutes of finishing your session.'],
		nutrition: { calories: 450, protein: 41, carbs: 48, fats: 9, fiber: 5 },
		benefit: 'Liquid nutrition digests faster than solid food, so amino acids reach your muscles sooner after training. The carbohydrate replenishes glycogen while the whey drives muscle protein synthesis in the hours that follow.' },
	{ id: 'r7', name: 'Egg and avocado wholegrain toast', meal: 'Breakfast', goals: ['lean', 'maintain'], time: '10 min', icon: '🥑',
		summary: 'Balanced, quick, and genuinely filling for the calories.',
		ingredients: ['2 slices wholegrain bread', '2 eggs', 'Half an avocado', '5 cherry tomatoes', 'Chili flakes', 'Salt, pepper, lemon juice'],
		steps: ['Toast the bread while you bring a small pan of water to a gentle simmer.', 'Poach the eggs for 3 minutes for a soft yolk.', 'Mash the avocado with lemon juice, salt and pepper, then spread on the toast.', 'Top with the eggs, halved tomatoes and a pinch of chili flakes.'],
		nutrition: { calories: 480, protein: 24, carbs: 38, fats: 26, fiber: 11 },
		benefit: 'Monounsaturated fat from the avocado supports hormone production, which matters when you are dieting. Whole eggs supply choline and vitamin D, and the fibre in wholegrain bread blunts the blood sugar response.' },
	{ id: 'r8', name: 'Lentil and vegetable soup', meal: 'Lunch', goals: ['lean', 'maintain', 'endurance'], time: '30 min', icon: '🍲',
		summary: 'Plant-based, high-fibre, and cheap to batch cook.',
		ingredients: ['200 g dry red lentils', '1 onion, 2 carrots, 2 celery sticks, diced', '2 cloves garlic', '1 litre vegetable stock', '1 tin chopped tomatoes', '1 tsp cumin', '1 tbsp olive oil'],
		steps: ['Sweat the onion, carrot and celery in the oil for 8 minutes until soft.', 'Add the garlic and cumin, cook 1 minute more.', 'Stir in the lentils, stock and tomatoes, then bring to a boil.', 'Reduce heat and simmer 20 minutes until the lentils collapse.', 'Blend half the soup for texture, season, and serve.'],
		nutrition: { calories: 340, protein: 21, carbs: 52, fats: 6, fiber: 16 },
		benefit: 'Sixteen grams of fibre per serving feeds your gut bacteria, and the soluble fibre in lentils helps lower LDL cholesterol. Very high volume for the calories, so it fills you up during a deficit.' },
	{ id: 'r9', name: 'Beef stir-fry with rice', meal: 'Dinner', goals: ['muscle', 'endurance'], time: '20 min', icon: '🥩',
		summary: 'Iron-rich, carb-heavy meal for hard training days.',
		ingredients: ['200 g lean beef strips', '150 g dry jasmine rice', '200 g mixed stir-fry vegetables', '2 tbsp soy sauce', '1 tbsp sesame oil', '1 tsp grated ginger', '1 clove garlic'],
		steps: ['Cook the rice according to the packet, then keep it covered.', 'Get a wok very hot. Sear the beef in half the oil for 2 minutes, then set aside.', 'Add the remaining oil, ginger and garlic, then the vegetables. Stir-fry 4 minutes.', 'Return the beef, add the soy sauce, toss for 1 minute and serve over the rice.'],
		nutrition: { calories: 720, protein: 48, carbs: 82, fats: 20, fiber: 6 },
		benefit: 'Red meat supplies heme iron and creatine, both of which support oxygen transport and power output. The generous rice portion refills glycogen, making this a strong choice on your heaviest training days.' },
	{ id: 'r10', name: 'Cottage cheese and fruit bowl', meal: 'Snack', goals: ['lean', 'muscle', 'maintain'], time: '3 min', icon: '🍎',
		summary: 'Slow-digesting protein snack, ideal before bed.',
		ingredients: ['200 g cottage cheese', '1 apple or pear, diced', '20 g walnuts', '1 tsp honey', 'Cinnamon to taste'],
		steps: ['Spoon the cottage cheese into a bowl.', 'Top with the diced fruit and roughly chopped walnuts.', 'Drizzle with honey and dust with cinnamon.'],
		nutrition: { calories: 380, protein: 30, carbs: 30, fats: 16, fiber: 6 },
		benefit: 'Cottage cheese is mostly casein, which digests over several hours and drip-feeds amino acids while you sleep. Eating it in the evening supports overnight recovery without a heavy meal sitting in your stomach.' },
];

let nutritionGoal = localStorage.getItem('forge-nutrition-goal') || 'muscle';
let mealFilter = 'All';

function isPremium() { return localStorage.getItem('forge-premium') === 'active'; }

function renderNutritionLock() {
	const locked = !isPremium();
	document.querySelector('#nutrition-lock').style.display = locked ? 'block' : 'none';
	document.querySelector('#nutrition-content').classList.toggle('locked', locked);
}

function renderGoalPicker() {
	document.querySelector('#nutrition-goal-picker').innerHTML = Object.entries(nutritionGoals).map(([key, goal]) => `<button type="button" class="goal-option${key === nutritionGoal ? ' active' : ''}" data-goal="${key}"><span>${goal.icon}</span><b>${goal.label}</b></button>`).join('');
	document.querySelectorAll('.goal-option').forEach((button) => button.addEventListener('click', () => {
		nutritionGoal = button.dataset.goal;
		localStorage.setItem('forge-nutrition-goal', nutritionGoal);
		renderGoalPicker();
		renderNutritionSummary();
		renderRecipes();
	}));
}

function renderNutritionSummary() {
	const goal = nutritionGoals[nutritionGoal];
	document.querySelector('#nutrition-summary').innerHTML = `<div class="macro-grid"><div><span>CALORIES</span><b>${goal.calories}</b></div><div><span>PROTEIN</span><b>${goal.protein}</b></div><div><span>CARBS</span><b>${goal.carbs}</b></div><div><span>FATS</span><b>${goal.fats}</b></div></div><p class="nutrition-advice">${goal.advice}</p>`;
}

function renderMealFilters() {
	const meals = ['All', ...new Set(recipes.filter((recipe) => recipe.goals.includes(nutritionGoal)).map((recipe) => recipe.meal))];
	if (!meals.includes(mealFilter)) mealFilter = 'All';
	const row = document.querySelector('#meal-filter-row');
	row.innerHTML = meals.map((meal) => `<button type="button" class="filter${meal === mealFilter ? ' active' : ''}" data-meal="${meal}">${meal}</button>`).join('');
	row.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => { mealFilter = button.dataset.meal; renderMealFilters(); renderRecipeList(); }));
}

function renderRecipeList() {
	const matches = recipes.filter((recipe) => recipe.goals.includes(nutritionGoal) && (mealFilter === 'All' || recipe.meal === mealFilter));
	const list = document.querySelector('#recipe-list');
	list.innerHTML = matches.map((recipe) => `<button type="button" class="recipe-row" data-recipe="${recipe.id}"><span class="recipe-icon">${recipe.icon}</span><span class="recipe-copy"><b>${recipe.name}</b><small>${recipe.meal} · ${recipe.time} · ${recipe.nutrition.calories} kcal · ${recipe.nutrition.protein}g protein</small><em>${recipe.summary}</em></span><span class="add">→</span></button>`).join('') || '<p class="empty-state">No recipes match this filter yet.</p>';
	list.querySelectorAll('.recipe-row').forEach((row) => row.addEventListener('click', () => openRecipe(row.dataset.recipe)));
}

function renderRecipes() { renderMealFilters(); renderRecipeList(); }

function openRecipe(id) {
	const recipe = recipes.find((item) => item.id === id);
	if (!recipe) return;
	if (!isPremium()) { showToast('Subscribe to Forge Premium to open full recipes.'); return; }
	document.querySelector('#recipe-eyebrow').textContent = `${recipe.meal.toUpperCase()} · ${recipe.time.toUpperCase()}`;
	document.querySelector('#recipe-title').textContent = `${recipe.icon} ${recipe.name}`;
	document.querySelector('#recipe-body').innerHTML = `<p class="recipe-summary">${recipe.summary}</p>
		<div class="macro-grid tight"><div><span>CALORIES</span><b>${recipe.nutrition.calories}</b></div><div><span>PROTEIN</span><b>${recipe.nutrition.protein} g</b></div><div><span>CARBS</span><b>${recipe.nutrition.carbs} g</b></div><div><span>FATS</span><b>${recipe.nutrition.fats} g</b></div><div><span>FIBRE</span><b>${recipe.nutrition.fiber} g</b></div></div>
		<h3 class="recipe-heading">Ingredients</h3><ul class="recipe-list-ul">${recipe.ingredients.map((item) => `<li>${item}</li>`).join('')}</ul>
		<h3 class="recipe-heading">Method</h3><ol class="recipe-steps">${recipe.steps.map((step) => `<li>${step}</li>`).join('')}</ol>
		<h3 class="recipe-heading">Why this helps</h3><p class="recipe-benefit">${recipe.benefit}</p>`;
	showModal('recipe-modal');
}

renderNutritionLock();
renderGoalPicker();
renderNutritionSummary();
renderRecipes();

// ---- AI Coach ----
// Answers come from a backend endpoint when one is configured. Without a server the app falls
// back to a built-in knowledge base so the feature still works offline and in the preview build.
const COACH_ENDPOINT = window.FORGE_COACH_ENDPOINT || null;
const FREE_DAILY_LIMIT = 3;

// Each topic carries the keywords that should trigger it, a short free answer, and the
// deeper answer premium subscribers get. `calc` lets an answer use the user's own numbers.
const coachTopics = [
	{ id: 'sets', keys: ['sets', 'set', 'volume', 'σετ', 'όγκος'], title: 'Sets and volume',
		free: 'Aim for 10 to 20 hard sets per muscle group per week. Below 10 you mostly maintain; above 20 the extra sets add fatigue faster than muscle. Split them across two sessions per week rather than one.',
		premium: 'Start at the low end and add one or two sets per muscle group every fortnight, but only while performance keeps improving. When your reps at a given weight stall for two sessions running and you feel flat, that is your ceiling for now. Drop volume by a third for a week, then build again. Track this per muscle group, since shoulders and legs recover at different rates.' },
	{ id: 'reps', keys: ['reps', 'rep', 'repetitions', 'range', 'επαναλήψεις'], title: 'Rep ranges',
		free: 'Muscle grows anywhere from 5 to 30 reps as long as the set is taken close to failure. Use 5 to 8 for strength on big lifts, 8 to 15 for most hypertrophy work, and 15 to 25 on isolation exercises.',
		premium: 'Match the range to the exercise rather than applying one rule. Compounds like squats and deadlifts suit lower reps because technique degrades deep into a set. Isolation work such as lateral raises or curls is both safer and more effective high, where the muscle fails before the joint complains. Heavy compounds first, moderate accessories second, high-rep finishers last.' },
	{ id: 'rest', keys: ['rest', 'break', 'between sets', 'ξεκούραση', 'διάλειμμα', 'παύση'], title: 'Rest between sets',
		free: 'Rest 2 to 3 minutes on heavy compounds, 1 to 2 minutes on accessories, and 45 to 90 seconds on isolation work. Cutting rest short lowers the weight you handle next set, which costs more than the time saved.',
		premium: 'The real signal is performance, not the clock. If you cannot get within one or two reps of your previous set, you rested too little. Three full minutes on a heavy squat day is not laziness, it is what lets you accumulate quality volume. To save time, pair unrelated exercises: a set of rows while resting from legs, since they do not compete for recovery.' },
	{ id: 'protein', keys: ['protein', 'πρωτεΐνη', 'πρωτεινη'], title: 'Protein',
		free: 'Aim for 1.6 to 2.2 grams of protein per kilogram of bodyweight daily, spread across three to five meals.',
		premium: 'In a calorie deficit push toward 2.2 to 2.4 g/kg, since protein protects muscle when energy is scarce and keeps you fuller than carbs or fat. Target 25 to 40 g per meal, enough to fully stimulate repair. Daily total matters far more than timing, so hitting your number beats eating immediately after training.',
		calc: (p) => p.weight ? `\n\nAt your logged weight of ${p.weight} kg, that is roughly ${Math.round(p.weight * 1.6)} to ${Math.round(p.weight * 2.2)} grams per day.` : '' },
	{ id: 'calories', keys: ['calories', 'calorie', 'kcal', 'deficit', 'surplus', 'maintenance', 'θερμίδες', 'θερμιδ'], title: 'Calories',
		free: 'To lose fat eat 300 to 500 kcal below maintenance, which gives about half a kilo per week. To build muscle eat 200 to 400 kcal above. Bigger deficits cost muscle; bigger surpluses mostly add fat.',
		premium: 'Estimate maintenance at 30 to 33 kcal per kilogram if you train several times a week, then adjust based on what the scale actually does over two to three weeks. Ignore daily swings, which are water and food weight. If the weekly average has not moved in three weeks, change intake by about 200 kcal. Keep protein fixed and adjust carbs and fat around it.',
		calc: (p) => p.weight ? `\n\nFor you at ${p.weight} kg, maintenance is roughly ${Math.round(p.weight * 31)} kcal. Fat loss around ${Math.round(p.weight * 31 - 400)}, muscle gain around ${Math.round(p.weight * 31 + 300)}.` : '' },
	{ id: 'carbs', keys: ['carbs', 'carbohydrate', 'υδατάνθρακ'], title: 'Carbohydrates',
		free: 'Carbs are your main training fuel. Aim for 3 to 5 g per kilogram on normal days, 5 to 7 if you train hard or long. Cutting them very low usually costs you performance in the gym.',
		premium: 'Concentrate them around training, with a meal two to three hours before and carbs plus protein afterwards. Low-carb diets can work for fat loss because they cut calories, not because carbs are inherently fattening. If your last few sets feel unusually weak and you have been dieting a while, carbs are the first thing to raise.',
		calc: (p) => p.weight ? `\n\nAt ${p.weight} kg that is about ${Math.round(p.weight * 3)} to ${Math.round(p.weight * 5)} grams daily.` : '' },
	{ id: 'fats', keys: ['fat intake', 'fats', 'dietary fat', 'much fat', 'fat should', 'fat do i', 'λιπαρά'], title: 'Dietary fat',
		free: 'Keep fat at 0.6 to 1 g per kilogram of bodyweight. Going much below that for long stretches can affect hormones, sleep and mood. Favour olive oil, nuts, eggs and oily fish.',
		premium: 'Fat is the easiest macro to over-consume because it is calorie dense at 9 kcal per gram, so a splash of oil adds up quickly. When dieting, set protein first, fat second at the lower end of that range, and let carbs fill the remainder, since carbs do more for training performance.' },
	{ id: 'water', keys: ['water', 'hydration', 'drink', 'νερό', 'ενυδάτωση'], title: 'Hydration',
		free: 'Aim for 30 to 35 ml per kilogram of bodyweight daily, plus extra around training. Even mild dehydration measurably reduces strength. Pale straw-coloured urine is a good check.',
		premium: 'During long or hot sessions drink 500 to 700 ml per hour rather than catching up afterwards. If you sweat heavily, a pinch of salt or an electrolyte tablet helps you retain what you drink. Use thirst and urine colour as your guide instead of forcing a fixed number.',
		calc: (p) => p.weight ? `\n\nAt ${p.weight} kg, roughly ${(p.weight * 0.033).toFixed(1)} litres a day.` : '' },
	{ id: 'soreness', keys: ['sore', 'soreness', 'doms', 'aching', 'πιάστηκα', 'πιασμένα'], title: 'Soreness',
		free: 'Soreness peaks 24 to 48 hours after training and is normal, especially with new exercises. It is not a measure of a good session. Light movement, sleep, protein and hydration help more than stretching or ice.',
		premium: 'You can train a sore muscle if the soreness is mild and eases once you warm up. Skip or lighten it if the pain is sharp, one-sided, near a joint, or still there after four days, since that pattern suggests injury rather than muscle damage. Soreness also drops sharply after the first weeks of a new programme, which is adaptation, not lost progress.' },
	{ id: 'frequency', keys: ['how often', 'frequency', 'times a week', 'days a week', 'συχνότητα', 'πόσες φορές'], title: 'Frequency',
		free: 'Three to five sessions a week suits almost everyone. Beginners do well on three full-body days; more experienced lifters usually split across four or five. The schedule you can repeat for months beats the theoretically optimal one.',
		premium: 'Pick frequency from the time you actually have, then fit the split to it. Three days works best full body. Four suits upper/lower twice. Five allows push, pull, legs plus two more. Training each muscle twice weekly beats once, so avoid one-muscle-per-day splits unless you train six days.' },
	{ id: 'split', keys: ['split', 'ppl', 'push pull', 'upper lower', 'full body', 'programme', 'program', 'routine', 'πρόγραμμα'], title: 'Choosing a split',
		free: 'Three days: full body. Four days: upper/lower twice. Five or six days: push, pull, legs. Any of these works. The split matters far less than whether you turn up and add weight over time.',
		premium: 'Build the week around your two hardest sessions and place them when you are most rested, usually after a rest day. Put the exercise you most want to improve first in the session, while you are fresh. Keep a split for at least eight weeks before judging it, because shorter cycles never show whether the progression worked.' },
	{ id: 'overload', keys: ['progressive overload', 'progress', 'add weight', 'increase weight', 'πρόοδο', 'αύξηση βάρους'], title: 'Progressive overload',
		free: 'Progress means doing slightly more over time: more weight, more reps, or better control at the same weight. When you hit the top of your rep range on every set with clean form, add the smallest available increment and work back up.',
		premium: 'Use double progression. Pick a range, say 8 to 12. Add weight only when you reach 12 on all sets. On upper body add 1 to 2.5 kg, on lower body 2.5 to 5 kg. When the jump is too big, add reps instead, or add a set. Progress will not be linear beyond your first few months, so judge it monthly rather than session to session.' },
	{ id: 'failure', keys: ['failure', 'to failure', 'rir', 'how hard', 'μέχρι εξάντληση'], title: 'Training to failure',
		free: 'Stop most sets one to three reps short of failure. That captures nearly all the growth with far less fatigue. Going to true failure occasionally on isolation work is fine; doing it on every set is counterproductive.',
		premium: 'Judge proximity by rep speed. When the bar slows noticeably you are within two or three reps of failure. Reserve genuine failure for machines and isolation exercises where failing is safe, and keep two or three reps in reserve on squats, deadlifts and any free-weight overhead work. Failure on compounds costs you the next several sets.' },
	{ id: 'deload', keys: ['deload', 'rest week', 'overtrain', 'burnt out', 'burned out', 'αποφόρτιση'], title: 'Deloads',
		free: 'Take a lighter week every six to ten weeks, or whenever performance drops for two sessions running. Cut volume by about half and keep the weights moderate. You do not lose muscle in a week.',
		premium: 'Signs you need one: weights feel heavier than they should for several sessions, resting heart rate stays elevated, sleep worsens, motivation drops off a cliff, and small joints start aching. Keep training during a deload rather than stopping, because the movement itself aids recovery. Most people come back stronger within one session.' },
	{ id: 'plateau', keys: ['plateau', 'stuck', 'stall', 'not improving', 'no progress', 'κόλλησα', 'στασιμότητα'], title: 'Plateaus',
		free: 'Most plateaus are recovery problems, not programme problems. Check sleep, calories and protein first, and confirm you are actually tracking your lifts. If those are solid, take a lighter week then rebuild.',
		premium: 'Work through it in order. Confirm you are tracking, since most stalls are invisible without records. Take a deload at two thirds volume. Then change one variable, not everything: adjust the rep range, swap a barbell variation for dumbbells, or add a set. Give any change four to six weeks before judging it.' },
	{ id: 'cardio', keys: ['cardio', 'running', 'run', 'jog', 'cycling', 'τρέξιμο', 'καρδιο'], title: 'Cardio and lifting',
		free: 'Cardio does not ruin muscle growth at sensible volumes. Two or three sessions of 20 to 30 minutes fits comfortably alongside lifting. Keep hard cardio and heavy leg days separate where you can.',
		premium: 'Interference matters mostly at high volumes of intense endurance work, especially running, which shares fatigue with leg training. Cycling and rowing interfere less. If both fall on one day, lift first when strength is the priority. Daily walking is the most underrated tool: it burns energy and aids recovery without competing for it.' },
	{ id: 'steps', keys: ['steps', 'walking', 'walk', 'βήματα', 'περπάτημα'], title: 'Walking and steps',
		free: 'Eight to ten thousand steps a day is a solid target. Walking burns meaningful energy, aids recovery, and unlike hard cardio it does not interfere with lifting at all.',
		premium: 'Steps are the easiest lever to pull when fat loss stalls, because adding two thousand steps costs you nothing in recovery whereas cutting another two hundred calories costs you fullness and training quality. Track the weekly average rather than daily, since one busy day distorts the picture.' },
	{ id: 'supplements', keys: ['supplement', 'supplements', 'pills', 'συμπλήρωμα'], title: 'Supplements',
		free: 'Only a few are worth the money. Creatine monohydrate at 3 to 5 g daily is the best supported. Whey protein is convenient food, not magic. Caffeine helps performance. Nearly everything else is optional.',
		premium: 'Vitamin D is worth checking if you get little sun. Treat protein powder as a convenience for hitting your daily target, not a requirement. Be sceptical of anything promising results that food and training cannot deliver, and of proprietary blends that hide doses. If a product needs a marketing story to justify itself, it usually has no evidence behind it.' },
	{ id: 'creatine', keys: ['creatine', 'κρεατίνη'], title: 'Creatine',
		free: 'Take 3 to 5 grams of creatine monohydrate daily at any time. No loading phase needed; it saturates within about a month. It is one of the most studied supplements there is and it is safe for healthy people.',
		premium: 'The kilo or so you gain early is water drawn into the muscle, not fat, and it makes muscles look fuller rather than softer. Monohydrate is the only form with strong evidence, and it is also the cheapest, so ignore the expensive variants. Consistency beats timing entirely: a missed day matters far less than stopping for a month.' },
	{ id: 'beginner', keys: ['beginner', 'starting', 'start', 'new to', 'first time', 'never trained', 'αρχάριος', 'ξεκινάω'], title: 'Starting out',
		free: 'Do three full-body sessions a week built on a squat, a hinge, a push, a pull and a core exercise. Two or three sets each. Spend the first two months learning the movements and turning up consistently.',
		premium: 'Your first months give the highest returns you will ever get, so do not waste them on complexity. Add weight whenever you complete all reps with good form, which will be almost every session at first. Avoid training to failure while you are still learning patterns. Log your weights from day one, because a training log is the single habit separating people who progress from people who repeat the same year.' },
	{ id: 'warmup', keys: ['warm up', 'warmup', 'warming', 'ζέσταμα', 'προθέρμανση'], title: 'Warming up',
		free: 'Five to ten minutes raising your heart rate, then two or three progressively heavier warm-up sets of your first exercise. Save long static stretches for after training.',
		premium: 'A workable structure: five minutes easy cardio, dynamic movement for the joints you are about to load, then ramp sets. For a 100 kg working weight, do the bar, then 40, 60 and 80 kg for a few reps. Warm-up sets should feel easy and stop well short of failure, since the goal is preparation, not fatigue.' },
	{ id: 'stretching', keys: ['stretch', 'stretching', 'flexibility', 'mobility', 'διατάσεις', 'ευλυγισία'], title: 'Stretching and mobility',
		free: 'Do dynamic movement before training and static stretching after, or on rest days. Static stretching immediately before heavy lifting can temporarily reduce strength. Lifting through a full range of motion already builds a lot of flexibility.',
		premium: 'Target the restrictions that actually limit your lifts rather than stretching everything. If you cannot reach depth in a squat, work ankle and hip mobility. If pressing overhead pinches, work thoracic extension and shoulder rotation. Two or three focused drills done daily beat a long generic routine done occasionally.' },
	{ id: 'form', keys: ['form', 'technique', 'proper', 'correct way', 'τεχνική', 'σωστή εκτέλεση'], title: 'Technique',
		free: 'Control the weight through the range you can manage without pain, keep reps consistent, and add load only once the pattern is stable. If form changes noticeably on the last reps, the weight is too heavy.',
		premium: 'Film a set from the side occasionally, since it shows things you cannot feel, like a hip rising early in a squat or elbows flaring on a press. Choose your ranges based on your own limb lengths rather than copying someone built differently. Sharp, joint-centred or one-sided pain means stop; general muscular burning does not.' },
	{ id: 'pain', keys: ['pain', 'injury', 'injured', 'hurts', 'hurt', 'strain', 'πόνος', 'τραυματισμ'], title: 'Pain and injury',
		free: 'Sharp pain, joint pain, or pain on one side only means stop that exercise and get it looked at. I am not a doctor and cannot diagnose anything. Persistent pain lasting more than a few days deserves a physiotherapist or doctor, not a workaround.',
		premium: 'While you wait to be seen, you can usually keep training everything that does not provoke the symptom, which preserves both fitness and routine. Avoid the common mistake of resting completely for weeks and then returning at your old weights, since that is how people re-injure themselves. A qualified professional who watches you move is worth far more than any general advice here.' },
	{ id: 'sleep', keys: ['sleep', 'sleeping', 'tired', 'recovery', 'ύπνος', 'κούραση'], title: 'Sleep and recovery',
		free: 'Seven to nine hours. Sleep is the single biggest recovery factor, and consistently under six hours reduces strength, appetite control and motivation. One or two full rest days a week is normal and productive.',
		premium: 'If sleep is genuinely limited, lower training volume rather than pushing through, since sets you cannot recover from create fatigue instead of progress. Watch for an elevated resting heart rate, weights feeling heavier for several sessions, and a flat mood. On light days, easy walking or mobility work aids recovery more than doing nothing.' },
	{ id: 'fatloss', keys: ['lose weight', 'lose fat', 'fat loss', 'cutting', 'cut', 'leaner', 'χάσω κιλά', 'αδυνατίσω', 'λίπος'], title: 'Losing fat',
		free: 'Eat in a moderate deficit, keep protein high, keep lifting, and walk more. Half a kilo per week is a sustainable rate. Faster than that and you start losing muscle alongside fat.',
		premium: 'Keep training weights as heavy as you can while dieting, because the signal to retain muscle comes from load, not from high reps or extra cardio. Expect strength to plateau rather than climb, which is normal and not a failure. Weigh yourself several times a week and judge the weekly average, since daily readings swing a kilo on water alone. Diet breaks at maintenance every eight to twelve weeks make long cuts far more sustainable.' },
	{ id: 'muscle', keys: ['build muscle', 'gain muscle', 'bulking', 'bulk', 'mass', 'bigger', 'get big', 'όγκο', 'μυϊκή μάζα'], title: 'Building muscle',
		free: 'Eat slightly above maintenance, get enough protein, train each muscle twice a week, and add weight or reps over time. Realistic gains are half a kilo of muscle a month for beginners, less after the first year.',
		premium: 'Keep the surplus small. Beyond about 400 kcal above maintenance you gain mostly fat, because muscle can only be built so fast regardless of how much you eat. If your waist grows faster than your lifts, the surplus is too big. Track a lift and a measurement together: rising numbers on both means it is working, rising waist alone means cut the surplus.' },
	{ id: 'skinny', keys: ['gain weight', 'skinny', 'hardgainer', 'cant gain', 'underweight', 'πάρω κιλά', 'αδύνατος'], title: 'Struggling to gain weight',
		free: 'Almost always the issue is eating less than you think. Add calorie-dense foods rather than volume: olive oil, nuts, full-fat dairy, dried fruit. Liquid calories are easier than another plate of chicken and rice.',
		premium: 'Track everything honestly for a week before concluding you have a fast metabolism, since most people underestimate intake by a fifth or more. Add 300 kcal, hold for two weeks, and only increase again if the scale has not moved. Cutting cardio back also helps, though do not remove walking. Appetite adapts within a couple of weeks, so the first stretch is the hardest.' },
	{ id: 'abs', keys: ['abs', 'core', 'six pack', 'belly', 'stomach', 'κοιλιακ'], title: 'Abs and core',
		free: 'Abs are built with weighted core work and revealed by lowering body fat. You cannot spot-reduce belly fat. Two or three core sessions a week alongside heavy compounds is plenty.',
		premium: 'Train abs like any muscle, with load and progression, using cable crunches, hanging leg raises and weighted planks in the 8 to 15 rep range. Endless bodyweight crunches stop producing growth once you can do fifty. Visibility for most men needs roughly 10 to 12 percent body fat, for women 18 to 22 percent, and that is a nutrition outcome rather than a training one.' },
	{ id: 'chest', keys: ['chest', 'bench', 'pecs', 'στήθος', 'πάγκο'], title: 'Chest training',
		free: 'Build chest around a horizontal press, an incline press and a fly. Two chest sessions a week, 10 to 16 total sets. Press with a full range and control the lowering rather than bouncing.',
		premium: 'The incline press is worth prioritising because the upper chest is the region most people lack. Keep shoulder blades pulled back and down on every press, which protects the shoulder and puts the chest in a stronger position. If you feel presses mostly in your shoulders, reduce the incline angle and slightly widen your grip.' },
	{ id: 'back', keys: ['back', 'lats', 'pull up', 'pullup', 'row', 'πλάτη'], title: 'Back training',
		free: 'Back needs both vertical pulling, such as pull-ups or pulldowns, and horizontal pulling, such as rows. Ten to twenty sets a week across both. Pull with your elbows rather than your hands.',
		premium: 'Back is the muscle group most commonly undertrained relative to chest, which contributes to rounded posture and shoulder problems. A useful rule is to match or exceed your pressing sets with pulling sets. Let the shoulder blade move at the top and bottom of each rep rather than holding it locked, since the lats and mid-back need that range to work fully.' },
	{ id: 'legs', keys: ['legs', 'squat', 'quads', 'hamstring', 'glutes', 'πόδια', 'γλουτ'], title: 'Leg training',
		free: 'Build legs on a squat pattern, a hinge such as Romanian deadlifts, and single-leg work like lunges or split squats. Ten to twenty sets a week. Depth matters more than load.',
		premium: 'Hamstrings need both a hip hinge and a knee flexion movement, since Romanian deadlifts and leg curls train different parts of the muscle. Glutes respond best to hip thrusts and deep squats. Single-leg work is worth keeping even when it feels unimpressive, because it evens out side-to-side differences that eventually limit your bilateral lifts.' },
	{ id: 'arms', keys: ['arms', 'biceps', 'triceps', 'curl', 'μπράτσα', 'δικέφαλ'], title: 'Arm training',
		free: 'Arms already get work from pressing and pulling, so 6 to 10 direct sets each per week is usually enough. Use 8 to 15 reps and control the lowering. Triceps make up about two thirds of arm size.',
		premium: 'Train triceps with both an overhead movement and a pushdown, since the long head only fully lengthens with the arm overhead. For biceps include one exercise with arms behind the body, such as incline curls. Arms respond well to higher frequency because they recover quickly, so three shorter sessions often beat one long arm day.' },
	{ id: 'shoulders', keys: ['shoulders', 'delts', 'overhead press', 'lateral raise', 'ώμο'], title: 'Shoulder training',
		free: 'Press overhead for the front delts and do plenty of lateral raises for the side delts, which drive shoulder width. Add rear delt work such as face pulls. Twelve to twenty sets a week total.',
		premium: 'Side delts are the region that most changes how your physique looks and they tolerate high frequency and high reps well, so 15 to 20 reps three times a week works. Front delts already get substantial work from any pressing, so they rarely need much direct work. Rear delts and face pulls are worth keeping for shoulder health, not just appearance.' },
	{ id: 'home', keys: ['home', 'no equipment', 'bodyweight', 'no gym', 'σπίτι', 'χωρίς εξοπλισμό'], title: 'Training at home',
		free: 'You can build real muscle at home with push-ups, split squats, rows under a table, hip thrusts and planks. Progress by slowing the tempo, increasing range, or moving to single-limb versions once reps get high.',
		premium: 'The main limitation at home is lower body, which outgrows bodyweight quickly. A pair of adjustable dumbbells or a few resistance bands solves most of it cheaply. Use the same progression logic as the gym: pick a rep range, add reps until you top it, then make the exercise harder rather than just doing more reps forever.' },
	{ id: 'timing', keys: ['meal timing', 'before workout', 'after workout', 'pre workout', 'post workout', 'anabolic window', 'eat before', 'eat after', 'before or after', 'when to eat', 'before training', 'after training', 'πριν την προπόνηση', 'μετά την προπόνηση'], title: 'Meal timing',
		free: 'Eat a meal with carbs and protein one to three hours before training, and another within a few hours after. The so-called anabolic window is far wider than people think. Daily totals matter more than exact timing.',
		premium: 'If you train early and cannot eat beforehand, something small and easy to digest like a banana works better than nothing. After training, the only case where timing genuinely matters is if you train twice in one day or fasted, where getting protein in soon afterwards helps. Otherwise, hitting your daily protein across several meals is the whole game.' },
	{ id: 'fasting', keys: ['fasting', 'fasted', 'intermittent', 'skip breakfast', 'νηστεία'], title: 'Fasted training and fasting',
		free: 'Intermittent fasting works for some people because it makes eating fewer calories easier, not because of anything special about the fasting itself. Training fasted is fine if you feel good doing it, though heavy sessions usually go better fed.',
		premium: 'The main drawback for lifters is fitting enough protein into a short eating window, since you want three or more feedings of 25 to 40 grams. If a fasting protocol makes you underperform in the gym or leaves you ravenous later, it is the wrong tool for you regardless of its popularity. Adherence is the only thing that separates diets that work from diets that do not.' },
	{ id: 'alcohol', keys: ['alcohol', 'drinking', 'beer', 'αλκοόλ', 'ποτό'], title: 'Alcohol',
		free: 'Alcohol impairs sleep quality, recovery and protein synthesis, and adds calories that are easy to forget. Occasional drinking will not undo your training, but regular heavy sessions will slow progress noticeably.',
		premium: 'The recovery hit is largest in the 24 hours after drinking, so keep your hardest session away from the night before. Sleep is where most of the damage happens: you may fall asleep faster but you get less deep sleep, which is exactly what recovery depends on. If you drink, eating protein and hydrating around it reduces the worst of the effect.' },
	{ id: 'motivation', keys: ['motivation', 'motivated', 'lazy', 'consistency', 'give up', 'κίνητρο', 'βαριέμαι'], title: 'Motivation and consistency',
		free: 'Motivation is unreliable, so build the habit instead: same days, same times, low friction. On days you do not feel like it, commit to the warm-up only. Most sessions start badly and end fine.',
		premium: 'Lower the bar on bad days rather than skipping, because a short session preserves the habit while a missed one starts the erosion. Track something visible, since progress you can see is the most reliable motivator there is. And check whether your programme is actually enjoyable, because people quit workouts they dread far more often than workouts that are hard.' },
	{ id: 'age', keys: ['older', 'age', 'too old', 'too late', '40s', '50s', 'im 40', 'im 45', 'im 50', 'im 55', 'im 60', 'at 40', 'at 50', 'at 60', 'ηλικία', 'μεγάλος'], title: 'Training as you get older',
		free: 'You can build muscle and strength at any age. Recovery is slower, so you may need an extra rest day and a longer warm-up, but the principles do not change. Resistance training becomes more important with age, not less.',
		premium: 'Prioritise joint-friendly variations: trap bar over conventional deadlift, machines and dumbbells alongside barbells, and slightly higher reps on the big lifts. Keep some fast, powerful movement in the week, since power declines faster than strength with age. Consistency over decades beats intensity over months by a wide margin.' },
	{ id: 'women', keys: ['women', 'female', 'girl', 'bulky', 'γυναίκ'], title: 'Training for women',
		free: 'The training principles are the same. Lifting heavy will not make you bulky, since that requires far more muscle mass than most people appreciate and years of dedicated eating. Women often recover slightly faster between sets and tolerate higher volumes well.',
		premium: 'Strength gains come at a similar relative rate to men, though absolute numbers differ. Many women find they perform better in the first half of the menstrual cycle and may want to schedule harder sessions there, but this varies enormously between individuals, so track your own pattern rather than assuming. Iron and calcium intake are worth paying more attention to.' },
	{ id: 'measuring', keys: ['track progress', 'measure', 'body fat', 'scale', 'weigh', 'μέτρηση', 'ζυγαριά'], title: 'Measuring progress',
		free: 'Use several markers, not just the scale: strength in the gym, waist measurement, photos every four weeks, and how clothes fit. Weight alone is noisy because water, food and glycogen swing it by a kilo or more daily.',
		premium: 'Weigh yourself at the same time each morning several days a week and compare weekly averages, which removes almost all the noise. Waist measurement at the navel is the most useful single number for fat loss. Photos in the same light and pose beat the mirror, since day-to-day perception is unreliable. Body fat scales and calipers are inconsistent, so use them for trend only.' },
	{ id: 'gymfear', keys: ['nervous', 'anxious', 'intimidated', 'embarrassed', 'gym anxiety', 'ντρέπομαι', 'άγχος'], title: 'Feeling out of place at the gym',
		free: 'Almost everyone feels this at first, and nearly nobody is watching. Go at quieter hours to start, take a written plan so you never stand around wondering what is next, and stick to machines until you feel settled.',
		premium: 'Having a plan on paper removes most of the discomfort, because the anxiety usually comes from not knowing what to do rather than from other people. Learn two or three machines properly and build from there. Most regulars are absorbed in their own session, and the ones who notice a newcomer training seriously tend to respect it.' },
	{ id: 'equipment', keys: ['machines', 'free weights', 'dumbbell vs', 'barbell vs', 'μηχανήματα', 'ελεύθερα βάρη'], title: 'Machines vs free weights',
		free: 'Both build muscle. Free weights carry over better to real movement and train stability; machines are easier to learn, safer to push near failure, and better for isolating a muscle. Most good programmes use both.',
		premium: 'Use free weights for your main strength work early in the session when you are fresh and coordinated, then machines for accessory volume when fatigue makes technique riskier. Machines are particularly useful for training close to failure safely, and for working around a niggle by loading a muscle without loading a painful joint.' },
	{ id: 'duration', keys: ['how long', 'workout length', 'duration', 'πόση ώρα', 'διάρκεια'], title: 'How long a session should be',
		free: 'Forty-five to seventy-five minutes of actual work suits most people. Beyond about ninety minutes quality usually drops. If sessions run long, you likely have too many exercises rather than too much rest.',
		premium: 'Count working sets rather than minutes: fifteen to twenty-five quality sets is a full session for most people. If you are short of time, cut exercises rather than rest periods, since shortened rest lowers the weight on every subsequent set and quietly reduces the whole session. Two focused twenty-minute sessions beat one rushed hour.' },
	{ id: 'besttime', keys: ['best time', 'morning or evening', 'time of day', 'πότε να γυμνάζομαι'], title: 'Best time of day to train',
		free: 'The best time is the one you will actually keep. Strength is slightly higher in the late afternoon for most people, but the difference is small and disappears once you adapt to training at a consistent time.',
		premium: 'If you train early, extend your warm-up, since you are stiffer and core temperature is lower. Training late can affect sleep for some people, particularly with heavy sessions or caffeine within six hours of bed. Consistency of timing matters more than the specific hour, because your body adapts to whenever you regularly train.' },
];

const coachGreetings = [
	{ keys: ['hello', 'hi', 'hey', 'γεια', 'γεια σου', 'καλησπέρα', 'καλημέρα'], reply: 'Hello. Ask me anything about training, nutrition or recovery and I will give you a straight answer.' },
	{ keys: ['thanks', 'thank you', 'cheers', 'ευχαριστώ'], reply: 'Any time. Ask whenever something comes up in your training.' },
	{ keys: ['who are you', 'what are you', 'your name', 'ποιος είσαι'], reply: 'I am the Forge coach. I answer questions about strength training, cardio, nutrition, recovery and technique, using your own training log where it helps.' },
	{ keys: ['what can you do', 'what can you help', 'topics', 'τι μπορείς'], reply: 'Ask me about sets and reps, rest times, how often to train, choosing a split, progressive overload, plateaus, protein, calories, carbs, fat loss, building muscle, supplements, creatine, sleep, soreness, injuries, cardio, technique, training at home, or how to measure progress.' },
];

const coachChips = ['How much protein do I need?', 'How many sets per muscle?', 'How do I lose fat?', "I'm stuck at the same weight", 'How often should I train?', 'Is creatine worth it?', 'What split should I do?'];

function coachKey() { return `forge-coach-${currentUserKey()}`; }
function coachUsageKey() { return `forge-coach-usage-${currentUserKey()}`; }
function todayStamp() { return new Date().toDateString(); }

function loadCoachUsage() {
	try {
		const usage = JSON.parse(localStorage.getItem(coachUsageKey()) || 'null');
		if (!usage || usage.day !== todayStamp()) return { day: todayStamp(), count: 0 };
		return usage;
	} catch (error) { return { day: todayStamp(), count: 0 }; }
}
function bumpCoachUsage() {
	const usage = loadCoachUsage();
	usage.count += 1;
	localStorage.setItem(coachUsageKey(), JSON.stringify(usage));
	renderCoachQuota();
}
function coachRemaining() { return Math.max(0, FREE_DAILY_LIMIT - loadCoachUsage().count); }

function loadCoachThread() { try { return JSON.parse(localStorage.getItem(coachKey()) || '[]'); } catch (error) { return []; } }
function saveCoachThread(thread) { localStorage.setItem(coachKey(), JSON.stringify(thread.slice(-40))); }

function renderCoachQuota() {
	const node = document.querySelector('#coach-quota');
	if (!node) return;
	if (isPremium()) {
		node.className = 'coach-quota premium';
		node.innerHTML = '<span>👑</span><div><b>Unlimited questions</b><small>Premium answers include deeper, more specific guidance.</small></div>';
		return;
	}
	const left = coachRemaining();
	node.className = `coach-quota${left === 0 ? ' spent' : ''}`;
	node.innerHTML = `<span>${left === 0 ? '🔒' : '💬'}</span><div><b>${left} of ${FREE_DAILY_LIMIT} questions left today</b><small>${left === 0 ? 'Your questions reset tomorrow. Premium removes the limit entirely.' : 'Premium gives unlimited questions and more detailed answers.'}</small></div><button type="button" class="quota-upgrade">Upgrade</button>`;
	node.querySelector('.quota-upgrade')?.addEventListener('click', () => { openTab('premium'); setPremiumTab('pricing'); });
}

function renderCoachChips() {
	const node = document.querySelector('#coach-chips');
	if (!node) return;
	node.innerHTML = coachChips.map((chip) => `<button type="button" class="coach-chip">${chip}</button>`).join('');
	node.querySelectorAll('.coach-chip').forEach((button) => button.addEventListener('click', () => {
		document.querySelector('#coach-input').value = button.textContent;
		document.querySelector('#coach-form').requestSubmit();
	}));
}

function renderCoachThread() {
	const node = document.querySelector('#coach-thread');
	if (!node) return;
	const thread = loadCoachThread();
	if (!thread.length) {
		node.innerHTML = '<div class="coach-empty"><span>✦</span><b>Ask me anything about training</b><p>Sets, reps, rest, protein, calories, recovery, technique or plateaus. I only cover fitness and nutrition.</p></div>';
		return;
	}
	node.innerHTML = thread.map((message) => `<div class="coach-msg ${message.role}">${message.role === 'coach' ? '<span class="coach-badge">COACH</span>' : ''}${message.text.split('\n\n').map((part) => `<p>${part}</p>`).join('')}</div>`).join('');
	node.scrollTop = node.scrollHeight;
}

function pushCoachMessage(role, text) {
	const thread = loadCoachThread();
	thread.push({ role, text });
	saveCoachThread(thread);
	renderCoachThread();
}

// Personalises the answer with whatever the user has actually logged.
function coachContext() {
	const reports = loadReports();
	const profile = JSON.parse(localStorage.getItem('forge-profile') || '{}');
	if (!reports.length) return '';
	const weekAgo = Date.now() - 7 * 86400000;
	const thisWeek = reports.filter((report) => new Date(report.date).getTime() >= weekAgo).length;
	const target = Number(profile.target) || 4;
	if (thisWeek >= target) return `\n\nLooking at your log, you have hit ${thisWeek} sessions this week against a target of ${target}. Consistency is not your problem right now, so focus on progressing the load.`;
	if (thisWeek === 0) return `\n\nYour log shows no sessions in the last seven days. Whatever you change, the first priority is getting back to a repeatable schedule.`;
	return `\n\nYour log shows ${thisWeek} of ${target} planned sessions this week, so there is room to add one before changing anything else.`;
}

// Matching works on whole words so that "set" does not fire on "sunset", and a phrase
// keyword like "how often" scores higher than a single word.
function normaliseQuestion(text) {
	return ` ${text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()} `;
}

function scoreTopic(topic, haystack) {
	let score = 0;
	topic.keys.forEach((key) => {
		const needle = ` ${key.toLowerCase()} `;
		if (haystack.includes(needle)) {
			// Phrases are far more specific than single words, so weight them heavily.
			score += key.includes(' ') ? 12 : 5;
		} else if (key.length > 5 && haystack.includes(key.toLowerCase())) {
			// Catches Greek stems and plurals, e.g. "θερμιδ" inside "θερμίδες".
			score += 3;
		}
	});
	return score;
}

function findCoachTopics(question) {
	const haystack = normaliseQuestion(question);
	return coachTopics
		.map((topic) => ({ topic, score: scoreTopic(topic, haystack) }))
		.filter((entry) => entry.score > 0)
		.sort((a, b) => b.score - a.score);
}

function coachProfile() {
	const profile = JSON.parse(localStorage.getItem('forge-profile') || '{}');
	return { weight: Number(profile.weight) || null, height: Number(profile.height) || null, target: Number(profile.target) || 4 };
}

function localCoachAnswer(question) {
	const haystack = normaliseQuestion(question);

	const greeting = coachGreetings.find((item) => item.keys.some((key) => haystack.includes(` ${key} `) || haystack.trim() === key));
	if (greeting) return greeting.reply;

	const matches = findCoachTopics(question);
	if (!matches.length) {
		return 'I could not match that to anything I know well. I cover training and nutrition: sets and reps, rest, how often to train, splits, progressive overload, plateaus, protein, calories, carbs, fat loss, building muscle, supplements, sleep, soreness, injuries, cardio, technique and training at home. Try rephrasing with one of those in it.';
	}

	const profile = coachProfile();
	const premium = isPremium();
	const primary = matches[0].topic;

	let reply = primary.free;
	if (primary.calc) reply += primary.calc(profile);

	if (premium) {
		reply += `\n\n${primary.premium}`;
		// A question like "protein and calories for fat loss" deserves both answers.
		const second = matches[1];
		if (second && second.score >= matches[0].score * 0.6) {
			reply += `\n\nOn ${second.topic.title.toLowerCase()}: ${second.topic.free}`;
			if (second.topic.calc) reply += second.topic.calc(profile);
		}
		reply += coachContext();
	} else {
		reply += '\n\nPremium subscribers get a fuller answer here, with the reasoning, the edge cases and numbers based on their own log.';
	}
	return reply;
}

async function askCoach(question) {
	if (COACH_ENDPOINT) {
		// Real model call. The endpoint must live on your server so the API key is never exposed.
		const response = await fetch(COACH_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ question, premium: isPremium(), history: loadCoachThread().slice(-6) }),
		});
		if (!response.ok) throw new Error(`Coach service returned ${response.status}`);
		const data = await response.json();
		return data.reply;
	}
	// Offline fallback so the feature works without a backend.
	await new Promise((resolve) => setTimeout(resolve, 650));
	return localCoachAnswer(question);
}

document.querySelector('#coach-form').addEventListener('submit', async (event) => {
	event.preventDefault();
	const input = document.querySelector('#coach-input');
	const question = input.value.trim();
	if (!question) return;

	if (!isPremium() && coachRemaining() <= 0) {
		showToast('Daily limit reached. Upgrade for unlimited questions.');
		openTab('premium');
		setPremiumTab('pricing');
		return;
	}

	input.value = '';
	pushCoachMessage('user', question);
	if (!isPremium()) bumpCoachUsage();

	const thread = document.querySelector('#coach-thread');
	thread.insertAdjacentHTML('beforeend', '<div class="coach-msg coach typing" id="coach-typing"><span class="coach-badge">COACH</span><p><i></i><i></i><i></i></p></div>');
	thread.scrollTop = thread.scrollHeight;

	try {
		const reply = await askCoach(question);
		document.querySelector('#coach-typing')?.remove();
		pushCoachMessage('coach', reply);
	} catch (error) {
		document.querySelector('#coach-typing')?.remove();
		pushCoachMessage('coach', 'I could not reach the coaching service just now. Please try again in a moment.');
		console.error(error);
	}
});

document.querySelector('#coach-clear').addEventListener('click', () => {
	localStorage.removeItem(coachKey());
	renderCoachThread();
	showToast('Conversation cleared.');
});

function initCoach() { renderCoachQuota(); renderCoachChips(); renderCoachThread(); }

// ---- Accounts: the Forge server (server/index.js) is the real source of truth. These
// localStorage-backed helpers are only a fallback for when no server is running — e.g. the
// standalone preview.html build — so the auth screen still works without a backend. ----
function loadAccounts() { try { return JSON.parse(localStorage.getItem('forge-accounts') || '{}'); } catch (error) { return {}; } }
function saveAccounts(accounts) { localStorage.setItem('forge-accounts', JSON.stringify(accounts)); }
// A tiny non-cryptographic hash so raw passwords never sit in storage in the fallback path.
// The real server hashes passwords with bcrypt; this is only used when that server is unreachable.
function hashPassword(password) { let hash = 5381; for (let index = 0; index < password.length; index += 1) hash = ((hash << 5) + hash + password.charCodeAt(index)) >>> 0; return `h${hash.toString(36)}`; }

// ---- Derived stats: every number on screen comes from the user's own saved reports ----
function prsKey() { return `forge-prs-${currentUserKey()}`; }
function workoutCountKey() { return `forge-workout-count-${currentUserKey()}`; }
function loadReports() { try { return JSON.parse(localStorage.getItem(`forge-reports-${currentUserKey()}`) || '[]'); } catch (error) { return []; } }

// Consecutive days ending today or yesterday, counted from report dates.
function calculateStreak(reports) {
	if (!reports.length) return 0;
	const days = [...new Set(reports.map((report) => new Date(report.date).toDateString()))]
		.map((value) => new Date(value).setHours(0, 0, 0, 0))
		.sort((a, b) => b - a);
	const today = new Date().setHours(0, 0, 0, 0);
	const dayMs = 86400000;
	if (days[0] !== today && days[0] !== today - dayMs) return 0;
	let streak = 1;
	for (let index = 1; index < days.length; index += 1) {
		if (days[index - 1] - days[index] === dayMs) streak += 1; else break;
	}
	return streak;
}

function refreshStats() {
	const reports = loadReports();
	const prs = JSON.parse(localStorage.getItem(prsKey()) || '{}');
	const profile = JSON.parse(localStorage.getItem('forge-profile') || '{}');
	const target = Number(profile.target) || 4;

	const total = reports.length;
	const streak = calculateStreak(reports);
	const pbCount = Object.keys(prs).length;

	const weekAgo = Date.now() - 7 * 86400000;
	const thisWeek = reports.filter((report) => new Date(report.date).getTime() >= weekAgo).length;

	document.querySelectorAll('#workouts-count, #profile-workouts-count, #profile-page-workouts-count').forEach((element) => { element.textContent = total; });
	document.querySelectorAll('#profile-streak, #profile-page-streak').forEach((element) => { element.textContent = streak; });
	document.querySelectorAll('#profile-pbs, #profile-page-pbs').forEach((element) => { element.textContent = pbCount; });
	const streakNode = document.querySelector('#streak-count');
	if (streakNode) streakNode.innerHTML = `${streak} <span>${streak === 1 ? 'day' : 'days'}</span>`;
	const ring = document.querySelector('#week-ring');
	if (ring) ring.textContent = `${thisWeek}/${target}`;
	const weekSessions = document.querySelector('#week-sessions');
	if (weekSessions) weekSessions.textContent = thisWeek;

	const best = Object.entries(prs).sort((a, b) => b[1] - a[1])[0];
	const liftValue = document.querySelector('#top-lift-weight');
	const liftName = document.querySelector('#top-lift-name');
	if (liftValue && liftName) {
		if (best) { liftValue.innerHTML = `${best[1]} <small>kg</small>`; liftName.textContent = `${best[0]} · personal best`; }
		else { liftValue.textContent = '—'; liftName.textContent = total ? 'Log weights to track your top lift' : 'No sessions logged yet'; }
	}

	const since = document.querySelector('#member-since');
	const sincePage = document.querySelector('#member-since-page');
	const joined = profile.joined ? new Date(profile.joined).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : null;
	[since, sincePage].forEach((node) => { if (node) node.textContent = joined ? `Training since ${joined}` : 'New member'; });

	renderNextWorkout();
}

// The home card mirrors whatever the user has actually built.
function renderNextWorkout() {
	const card = document.querySelector('#next-workout-card');
	const title = document.querySelector('#next-plan-title');
	if (!card || !title) return;
	const workouts = loadWorkouts();
	if (!workouts.length) {
		title.textContent = 'No workout yet';
		card.innerHTML = '<div class="workout-card-top"><span>GET STARTED</span></div><h3>Build your first session</h3><p>Pick your exercises, sets and reps, then run it with the timer.</p><button class="primary-button" id="start-workout">Create a workout <span>+</span></button>';
	} else {
		const next = workouts[0];
		const totalSets = next.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
		title.textContent = next.name;
		card.innerHTML = `<div class="workout-card-top"><span class="status-dot"></span><span>READY TO TRAIN</span><span class="workout-time">${next.exercises.length} EXERCISES</span></div><h3>${next.name}</h3><p>${totalSets} sets planned</p>${next.exercises.slice(0, 3).map((exercise, index) => `<div class="exercise-preview"><div class="exercise-number">${String(index + 1).padStart(2, '0')}</div><div><b>${exercise.name}</b><span>${exercise.sets} sets x ${exercise.reps} reps</span></div><strong>${categoryIcons[exercise.category] || '🏋️'}</strong></div>`).join('')}<button class="primary-button" id="start-workout">Start workout <span>→</span></button>`;
	}
	document.querySelector('#start-workout').addEventListener('click', () => {
		const list = loadWorkouts();
		if (list.length) startWorkout(list[0]); else { openTab('workout'); openBuilder(null); }
	});
}

// ---- Inbox: incoming friend requests and gym invites, per account ----
function requestsKey() { return `forge-requests-${currentUserKey()}`; }
function loadRequests() {
	try {
		return JSON.parse(localStorage.getItem(requestsKey()) || '[]');
	} catch (error) { return []; }
}
function saveRequests(list) { localStorage.setItem(requestsKey(), JSON.stringify(list)); }
function initials(name) { return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }
function renderRequests() {
	const list = loadRequests();
	document.querySelector('#request-count').textContent = `${list.length} PENDING`;
	const container = document.querySelector('#request-list');
	if (!list.length) { container.innerHTML = '<p class="empty-state">Nothing waiting. New friend requests and gym invites land here.</p>'; return; }
	container.innerHTML = list.map((request) => `<article class="request-row" data-id="${request.id}"><span class="friend-avatar${request.type === 'gym' ? ' coral-avatar' : ''}">${initials(request.name)}</span><div class="request-copy"><b>${request.name}</b><span class="request-tag">${request.type === 'gym' ? '🏋️ Gym invite' : '👤 Friend request'}</span><small>${request.detail}</small><em>${request.when}</em></div><div class="request-actions"><button type="button" class="request-accept" data-accept="${request.id}">Accept</button><button type="button" class="request-decline" data-decline="${request.id}">Decline</button></div></article>`).join('');
	container.querySelectorAll('[data-accept]').forEach((button) => button.addEventListener('click', () => resolveRequest(Number(button.dataset.accept), true)));
	container.querySelectorAll('[data-decline]').forEach((button) => button.addEventListener('click', () => resolveRequest(Number(button.dataset.decline), false)));
}
function resolveRequest(id, accepted) {
	const list = loadRequests();
	const request = list.find((item) => item.id === id);
	if (!request) return;
	saveRequests(list.filter((item) => item.id !== id));
	if (accepted) {
		if (request.type === 'friend') {
			saveFriend(request.name, request.detail);
			showToast(`${request.name} added to your friends.`);
		} else {
			showToast(`Gym session with ${request.name} confirmed.`);
		}
	} else {
		showToast(`Declined ${request.name}.`);
	}
	renderRequests();
}
renderRequests();
renderFriends();
initCoach();

const authForm = document.querySelector('#auth-form');
function setAuthMode(signUp) { isSignUp = signUp; document.querySelectorAll('.signup-only').forEach((element) => { element.classList.toggle('visible', isSignUp); element.querySelectorAll('input, select').forEach((field) => { field.required = isSignUp; }); }); document.querySelector('#auth-submit').innerHTML = isSignUp ? 'Create account <span>-></span>' : 'Sign in <span>-></span>'; document.querySelector('#auth-switch').textContent = isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account'; document.querySelector('#auth-message').textContent = ''; }
setAuthMode(false);
document.querySelector('#auth-switch').addEventListener('click', () => setAuthMode(!isSignUp));

const verifyBanner = document.querySelector('#verify-banner');
function updateVerifyBanner(verified) {
	if (!verifyBanner) return;
	verifyBanner.hidden = authMode !== 'server' || verified !== false;
}

function enterApp(email, profile, options = {}) {
	authMode = options.mode || 'local';
	localStorage.setItem('forge-session', email);
	localStorage.setItem('forge-account', JSON.stringify({ email, ...profile }));
	localStorage.setItem('forge-profile', JSON.stringify(profile));
	updateProfile(profile);
	authScreen.classList.add('hidden');
	updateVerifyBanner(options.verified);
	// Per-account data has its own storage key, so refresh anything that reads it.
	renderWorkoutTemplates();
	renderNutritionLock();
	renderRequests();
	initCalendar();
	renderGoals();
	renderFriends();
	refreshStats();
	applyAvatar();
	renderBadges();
	initCoach();
}

function signOut() {
	if (authMode === 'server') fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
	authMode = 'local';
	localStorage.removeItem('forge-session');
	setAuthMode(false);
	authForm.reset();
	authScreen.classList.remove('hidden');
}

authForm.addEventListener('submit', (event) => {
	event.preventDefault();
	handleAuthSubmit().catch((error) => { document.querySelector('#auth-message').textContent = `Something went wrong: ${error.message}`; console.error(error); });
});

// Used only when the Forge server (server/index.js) isn't reachable — e.g. the standalone
// preview.html build, or the static files opened without starting the backend — so the auth
// screen still works, just without cross-device sync or email verification.
function handleAuthSubmitLocal(email, password, message) {
	const accounts = loadAccounts();

	if (isSignUp) {
		if (accounts[email]) { message.textContent = 'That email already has an account. Sign in instead.'; return; }
		const profile = {
			name: document.querySelector('#auth-name').value.trim() || 'Athlete',
			height: document.querySelector('#auth-height').value || 178,
			weight: document.querySelector('#auth-weight').value || 76,
			gender: document.querySelector('#auth-gender').value,
			focus: document.querySelector('#auth-focus').value,
			target: document.querySelector('#auth-target').value || 4,
			joined: new Date().toISOString(),
		};
		accounts[email] = { email, password: hashPassword(password), profile };
		saveAccounts(accounts);
		enterApp(email, profile, { mode: 'local' });
		showToast(`Welcome to Forge, ${profile.name.split(' ')[0]}.`);
		return;
	}

	const account = accounts[email];
	if (!account || account.password !== hashPassword(password)) { message.textContent = 'No matching account. Check your details or create one.'; return; }
	enterApp(email, account.profile, { mode: 'local' });
	showToast(`Welcome back, ${account.profile.name.split(' ')[0]}.`);
}

// Real accounts live on the Forge server: hashed passwords, a session that survives across
// browsers and devices, and a verification email on signup. Falls back to local-only accounts
// automatically if that server can't be reached.
async function handleAuthSubmit() {
	const email = document.querySelector('#auth-email').value.trim().toLowerCase();
	const password = document.querySelector('#auth-password').value;
	const message = document.querySelector('#auth-message');
	message.textContent = '';

	const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';
	const payload = isSignUp
		? {
			email,
			password,
			name: document.querySelector('#auth-name').value.trim(),
			height: document.querySelector('#auth-height').value,
			weight: document.querySelector('#auth-weight').value,
			gender: document.querySelector('#auth-gender').value,
			focus: document.querySelector('#auth-focus').value,
			target: document.querySelector('#auth-target').value,
		}
		: { email, password };

	let response;
	try {
		response = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(payload),
		});
	} catch (networkError) {
		handleAuthSubmitLocal(email, password, message);
		return;
	}

	const data = await response.json().catch(() => ({}));
	if (!response.ok) { message.textContent = data.error || 'Something went wrong.'; return; }

	enterApp(data.user.email, data.user.profile, { mode: 'server', verified: data.user.verified });
	if (isSignUp) {
		showToast(data.user.verified ? `Welcome to Forge, ${data.user.profile.name.split(' ')[0]}.` : `Welcome to Forge. Check ${data.user.email} to verify your account.`);
	} else {
		showToast(`Welcome back, ${data.user.profile.name.split(' ')[0]}.`);
	}
}

document.querySelector('#sign-out').addEventListener('click', signOut);

const verifyResendButton = document.querySelector('#verify-resend');
if (verifyResendButton) {
	verifyResendButton.addEventListener('click', async () => {
		verifyResendButton.disabled = true;
		try {
			const response = await fetch('/api/auth/resend-verification', { method: 'POST', credentials: 'include' });
			const data = await response.json().catch(() => ({}));
			showToast(response.ok ? 'Verification email sent.' : (data.error || 'Could not send the email.'));
		} catch (error) {
			showToast('Could not reach the server.');
		} finally {
			verifyResendButton.disabled = false;
		}
	});
}

const profilePage = document.querySelector('#profile-page');
function openProfilePage() { profilePage.classList.add('open'); profilePage.setAttribute('aria-hidden', 'false'); }
function closeProfilePage() { profilePage.classList.remove('open'); profilePage.setAttribute('aria-hidden', 'true'); }
document.querySelector('[data-profile]').addEventListener('click', openProfilePage);
document.querySelector('#close-profile').addEventListener('click', closeProfilePage);
document.querySelector('#profile-page-edit').addEventListener('click', () => { closeProfilePage(); document.querySelector('#edit-profile').click(); });
document.querySelector('#profile-settings').addEventListener('click', () => { closeProfilePage(); document.querySelector('#edit-profile').click(); });
document.querySelector('#profile-page-sign-out').addEventListener('click', () => { closeProfilePage(); signOut(); });

// ---- Session restore: if someone is already signed in, skip the auth screen entirely ----
(async function restoreSession() {
	// A real server session (httpOnly cookie) takes priority — it's what lets someone reopen
	// the app, or open it on another device, without signing up again.
	try {
		const response = await fetch('/api/auth/me', { credentials: 'include' });
		if (response.ok) {
			const data = await response.json();
			enterApp(data.user.email, data.user.profile, { mode: 'server', verified: data.user.verified });
			return;
		}
	} catch (error) {
		// No server running — fall through to the local-only session below.
	}

	const email = localStorage.getItem('forge-session');
	if (!email) return;
	const account = loadAccounts()[email];
	if (!account) { localStorage.removeItem('forge-session'); return; }
	enterApp(email, account.profile, { mode: 'local' });
})();

// After clicking an email verification link, the server redirects back here with ?verify=...
(function handleVerifyRedirect() {
	const verifyParam = new URLSearchParams(window.location.search).get('verify');
	if (!verifyParam) return;
	if (verifyParam === 'success') { showToast('Email verified. Thanks!'); updateVerifyBanner(true); }
	else if (verifyParam === 'expired') { showToast('That verification link expired or is invalid.'); }
	window.history.replaceState({}, '', window.location.pathname);
})();