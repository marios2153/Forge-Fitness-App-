const tabs = document.querySelectorAll('[data-tab]');
const navItems = document.querySelectorAll('.nav-item');
const contents = document.querySelectorAll('.tab-content');
const toast = document.querySelector('#toast');
const authScreen = document.querySelector('#auth-screen');
let isSignUp = false;

function openTab(name) { if (name === 'menu') return; contents.forEach((content) => content.classList.toggle('active', content.id === `${name}-tab`)); navItems.forEach((item) => item.classList.toggle('active', item.dataset.tab === name)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function showToast(message) { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2200); }
function showModal(id) { document.querySelector('#modal-backdrop').classList.add('open'); document.querySelectorAll('.modal-panel').forEach((panel) => panel.classList.toggle('open', panel.id === id)); }
function closeModal() { document.querySelector('#modal-backdrop').classList.remove('open'); }

// The runner owns one guided session from start to report. It deliberately keeps report data separate per account.
document.querySelector('#modal-backdrop').insertAdjacentHTML('afterbegin', '<section class="modal-panel runner-modal" id="runner-modal"><div class="runner-head"><div><p class="eyebrow">ACTIVE WORKOUT</p><h2 id="runner-title">Push strength</h2></div><button class="modal-close">×</button></div><div class="runner-meta"><span id="runner-progress">Exercise 1 of 1</span><div class="timer-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="ring-track" cx="60" cy="60" r="52"/><circle class="ring-fill" id="runner-ring" cx="60" cy="60" r="52"/></svg><strong id="runner-timer">00:00</strong></div></div><div id="hydration-banner" class="hydration-banner"><span class="hydration-icon">💧</span><div><b>Halfway there — drink some water</b><span>A few sips now keeps your strength up for the rest of the session.</span></div><button type="button" class="hydration-close" aria-label="Dismiss">×</button></div><div id="runner-exercise-list"></div><p class="runner-status" id="runner-status"></p><button class="secondary-button full" id="runner-finish">Finish workout</button></section><section class="modal-panel report-modal" id="report-modal"><button class="modal-close">×</button><p class="eyebrow">WORKOUT REPORT</p><h2>Session complete</h2><div class="report-summary" id="report-summary"></div><button class="primary-button full" id="report-done">Done</button></section><section class="modal-panel reports-modal" id="reports-modal"><button class="modal-close">×</button><p class="eyebrow">SAVED REPORTS</p><h2>Your workout history</h2><div id="reports-list"></div></section>');
document.body.insertAdjacentHTML('beforeend', '<div class="menu-sheet" id="menu-sheet"><button class="menu-close" id="menu-close">×</button><p class="eyebrow">FORGE MENU</p><h2>More sections</h2><div class="menu-grid"><button data-menu-tab="social">♧ <span>Social</span></button><button data-menu-tab="goals">◎ <span>Goals</span></button><button data-menu-tab="premium">◆ <span>Premium</span></button><button id="open-reports">▤ <span>Reports</span></button><button data-menu-tab="profile">● <span>Profile</span></button></div></div>');
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
	const count = Number(localStorage.getItem('forge-workout-count') || '14') + 1;
	localStorage.setItem('forge-workout-count', String(count));
	document.querySelectorAll('#workouts-count, #profile-workouts-count, #profile-page-workouts-count').forEach((element) => { element.textContent = count; });
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
document.querySelector('#payment-form').addEventListener('submit', (event) => { event.preventDefault(); const plan = localStorage.getItem('forge-billing') || 'monthly'; localStorage.setItem('forge-premium', 'active'); localStorage.setItem('forge-subscription', JSON.stringify({ status: 'active', plan, started: new Date().toISOString(), lastFour: document.querySelector('#card-number').value.replace(/\D/g, '').slice(-4) })); event.target.reset(); closeModal(); updateSubscriptionButton(); renderNutritionLock(); showToast('Payment accepted. Premium is active.'); });
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
		showToast('Workout deleted.');
	}));
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
	const prs = JSON.parse(localStorage.getItem('forge-prs') || '{}');
	if (!prs[exerciseName] || weight > prs[exerciseName]) {
		prs[exerciseName] = weight;
		localStorage.setItem('forge-prs', JSON.stringify(prs));
		updateTopLift(exerciseName, weight);
		setTimeout(() => showToast(`🎉 New personal best: ${exerciseName} at ${weight} kg!`), 2300);
	}
}
const savedPrs = JSON.parse(localStorage.getItem('forge-prs') || '{}');
const bestPr = Object.entries(savedPrs).sort((a, b) => b[1] - a[1])[0];
if (bestPr) updateTopLift(bestPr[0], bestPr[1]);

const savedWorkoutCount = localStorage.getItem('forge-workout-count');
if (savedWorkoutCount) document.querySelectorAll('#workouts-count, #profile-workouts-count, #profile-page-workouts-count').forEach((element) => { element.textContent = savedWorkoutCount; });

renderWorkoutTemplates();
// The home-screen button jumps to the Workout tab so the user picks or builds a session.
document.querySelector('#start-workout').addEventListener('click', () => {
	const list = loadWorkouts();
	if (list.length === 1) { startWorkout(list[0]); return; }
	openTab('workout');
	if (!list.length) openBuilder(null);
});

document.querySelector('#add-goal').addEventListener('click', () => showModal('goal-modal'));
document.querySelector('#goal-form').addEventListener('submit', (event) => { event.preventDefault(); const goal = { name: document.querySelector('#goal-name').value, date: document.querySelector('#goal-date').value }; const goals = JSON.parse(localStorage.getItem('forge-goals') || '[]'); goals.push(goal); localStorage.setItem('forge-goals', JSON.stringify(goals)); addGoalCard(goal, goals.length + 2); event.target.reset(); closeModal(); showToast('Goal created.'); });
function addGoalCard(goal, number) { const card = document.createElement('div'); card.className = 'goal-card'; card.innerHTML = `<div class="goal-icon">${String(number).padStart(2, '0')}</div><div><b>${goal.name}</b><span>Target: ${goal.date}</span><div class="progress-track"><i style="width:4%"></i></div><small>4% complete</small></div><button class="more-button">...</button>`; document.querySelector('#goals-tab .secondary-button').before(card); }
JSON.parse(localStorage.getItem('forge-goals') || '[]').forEach((goal, index) => addGoalCard(goal, index + 3));
document.querySelector('#edit-profile').addEventListener('click', () => { document.querySelector('#edit-name').value = document.querySelector('#profile-name').textContent; document.querySelector('#edit-height').value = parseInt(document.querySelector('#profile-height').textContent, 10); document.querySelector('#edit-weight').value = parseInt(document.querySelector('#profile-weight').textContent, 10); document.querySelector('#edit-focus').value = document.querySelector('#profile-focus').textContent; document.querySelector('#edit-gender').value = ['Male','Female','Other'].includes(document.querySelector('#profile-gender').textContent) ? document.querySelector('#profile-gender').textContent : 'Other'; document.querySelector('#edit-target').value = parseInt(document.querySelector('#profile-page-target').textContent, 10) || 4; showModal('profile-modal'); });
document.querySelector('#profile-form').addEventListener('submit', (event) => { event.preventDefault(); const values = { name: document.querySelector('#edit-name').value, height: document.querySelector('#edit-height').value, weight: document.querySelector('#edit-weight').value, focus: document.querySelector('#edit-focus').value, gender: document.querySelector('#edit-gender').value, target: document.querySelector('#edit-target').value }; localStorage.setItem('forge-profile', JSON.stringify(values)); const sessionEmail = localStorage.getItem('forge-session'); if (sessionEmail) { const accounts = loadAccounts(); if (accounts[sessionEmail]) { accounts[sessionEmail].profile = { ...accounts[sessionEmail].profile, ...values }; saveAccounts(accounts); } } updateProfile(values); closeModal(); showToast('Profile updated.'); });
function updateProfile(values) { values.target = values.target || 4; const initials = values.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(); document.querySelectorAll('#profile-name, #profile-page-name').forEach((element) => { element.textContent = values.name; }); document.querySelectorAll('#profile-height, #profile-page-height').forEach((element) => { element.textContent = `${values.height} cm`; }); document.querySelectorAll('#profile-weight, #profile-page-weight').forEach((element) => { element.textContent = `${values.weight} kg`; }); document.querySelectorAll('#profile-focus, #profile-page-focus').forEach((element) => { element.textContent = values.focus; }); document.querySelectorAll('#profile-gender, #profile-page-gender').forEach((element) => { element.textContent = values.gender || '—'; }); document.querySelector('#profile-page-target').textContent = `${values.target} sessions`; document.querySelector('h1').innerHTML = `Good morning, ${values.name.split(' ')[0]}<span class="accent">.</span>`; document.querySelectorAll('.avatar, .large-avatar').forEach((element) => { element.textContent = initials; }); }
const savedProfile = JSON.parse(localStorage.getItem('forge-profile') || 'null'); if (savedProfile) updateProfile(savedProfile);

// ---- Calendar: each day can be a training day (with a time), a rest day, or empty ----
function calendarKey() { return `forge-calendar-${currentUserKey()}`; }
const DAYS_IN_MONTH = 30;
const MONTH_LABEL = 'September';
function loadCalendar() {
	try {
		const stored = localStorage.getItem(calendarKey());
		if (stored === null) {
			const seed = {};
			[2, 4, 7, 9, 14, 16].forEach((day) => { seed[day] = { status: 'training', time: '18:00', duration: 60, note: '' }; });
			[6, 13, 20].forEach((day) => { seed[day] = { status: 'rest' }; });
			localStorage.setItem(calendarKey(), JSON.stringify(seed));
			return seed;
		}
		return JSON.parse(stored);
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
function saveFriend(name) { const friends = JSON.parse(localStorage.getItem('forge-friends') || '[]'); if (!friends.includes(name)) { friends.push(name); localStorage.setItem('forge-friends', JSON.stringify(friends)); document.querySelector('#friend-count').textContent = `${friends.length + 2} FRIENDS`; } showToast(`Friend request sent to ${name}.`); }
document.querySelectorAll('.invite-button').forEach((button) => button.addEventListener('click', () => { document.querySelector('#invite-name').value = button.dataset.friend; showModal('invite-modal'); }));
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

// ---- Accounts: many accounts can live side by side, and the session survives a reload ----
function loadAccounts() { try { return JSON.parse(localStorage.getItem('forge-accounts') || '{}'); } catch (error) { return {}; } }
function saveAccounts(accounts) { localStorage.setItem('forge-accounts', JSON.stringify(accounts)); }
// A tiny non-cryptographic hash so raw passwords never sit in storage. Real apps hash on the server.
function hashPassword(password) { let hash = 5381; for (let index = 0; index < password.length; index += 1) hash = ((hash << 5) + hash + password.charCodeAt(index)) >>> 0; return `h${hash.toString(36)}`; }

// ---- Inbox: incoming friend requests and gym invites, per account ----
function requestsKey() { return `forge-requests-${currentUserKey()}`; }
const seedRequests = [
	{ id: 1, type: 'friend', name: 'Jamie Diaz', detail: 'Trains 5x a week · 82.5 kg bench', when: '24 minutes ago' },
	{ id: 2, type: 'gym', name: 'Sam Kim', detail: 'Leg day at Iron Works · Saturday 10:00', when: '2 hours ago' },
	{ id: 3, type: 'friend', name: 'Nadia Petrou', detail: 'Found you by email', when: 'Yesterday' },
];
function loadRequests() {
	try {
		const stored = localStorage.getItem(requestsKey());
		if (stored === null) { localStorage.setItem(requestsKey(), JSON.stringify(seedRequests)); return [...seedRequests]; }
		return JSON.parse(stored);
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
			saveFriend(request.name);
			addFriendRow(request.name, request.detail);
		} else {
			showToast(`Gym session with ${request.name} confirmed.`);
		}
	} else {
		showToast(`Declined ${request.name}.`);
	}
	renderRequests();
}
function addFriendRow(name, detail) {
	const row = document.createElement('div');
	row.className = 'friend-row';
	row.innerHTML = `<span class="friend-avatar">${initials(name)}</span><span><b>${name}</b><small>${detail}</small></span><button class="invite-button" data-friend="${name}">Invite</button>`;
	row.querySelector('.invite-button').addEventListener('click', () => { document.querySelector('#invite-name').value = name; showModal('invite-modal'); });
	document.querySelector('#friend-list').append(row);
}
renderRequests();

const authForm = document.querySelector('#auth-form');
function setAuthMode(signUp) { isSignUp = signUp; document.querySelectorAll('.signup-only').forEach((element) => { element.classList.toggle('visible', isSignUp); element.querySelectorAll('input, select').forEach((field) => { field.required = isSignUp; }); }); document.querySelector('#auth-submit').innerHTML = isSignUp ? 'Create account <span>-></span>' : 'Sign in <span>-></span>'; document.querySelector('#auth-switch').textContent = isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account'; document.querySelector('#auth-message').textContent = ''; }
setAuthMode(false);
document.querySelector('#auth-switch').addEventListener('click', () => setAuthMode(!isSignUp));

function enterApp(email, profile) {
	localStorage.setItem('forge-session', email);
	localStorage.setItem('forge-account', JSON.stringify({ email, ...profile }));
	localStorage.setItem('forge-profile', JSON.stringify(profile));
	updateProfile(profile);
	authScreen.classList.add('hidden');
	// Per-account data has its own storage key, so refresh anything that reads it.
	renderWorkoutTemplates();
	renderNutritionLock();
	renderRequests();
	initCalendar();
}

function signOut() {
	localStorage.removeItem('forge-session');
	setAuthMode(false);
	authForm.reset();
	authScreen.classList.remove('hidden');
}

authForm.addEventListener('submit', (event) => {
	event.preventDefault();
	const email = document.querySelector('#auth-email').value.trim().toLowerCase();
	const password = document.querySelector('#auth-password').value;
	const message = document.querySelector('#auth-message');
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
		enterApp(email, profile);
		showToast(`Welcome to Forge, ${profile.name.split(' ')[0]}.`);
		return;
	}

	const account = accounts[email];
	if (!account || account.password !== hashPassword(password)) { message.textContent = 'No matching account. Check your details or create one.'; return; }
	enterApp(email, account.profile);
	showToast(`Welcome back, ${account.profile.name.split(' ')[0]}.`);
});

document.querySelector('#sign-out').addEventListener('click', signOut);

const profilePage = document.querySelector('#profile-page');
function openProfilePage() { profilePage.classList.add('open'); profilePage.setAttribute('aria-hidden', 'false'); }
function closeProfilePage() { profilePage.classList.remove('open'); profilePage.setAttribute('aria-hidden', 'true'); }
document.querySelector('[data-profile]').addEventListener('click', openProfilePage);
document.querySelector('#close-profile').addEventListener('click', closeProfilePage);
document.querySelector('#profile-page-edit').addEventListener('click', () => { closeProfilePage(); document.querySelector('#edit-profile').click(); });
document.querySelector('#profile-settings').addEventListener('click', () => { closeProfilePage(); document.querySelector('#edit-profile').click(); });
document.querySelector('#profile-page-sign-out').addEventListener('click', () => { closeProfilePage(); signOut(); });

// ---- Session restore: if someone is already signed in, skip the auth screen entirely ----
(function restoreSession() {
	const email = localStorage.getItem('forge-session');
	if (!email) return;
	const account = loadAccounts()[email];
	if (!account) { localStorage.removeItem('forge-session'); return; }
	enterApp(email, account.profile);
})();