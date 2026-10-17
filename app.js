// ============================================================================
// PET CARE HUB - AUTO-SINCRONIZACIÓN CON GOOGLE SHEETS
// ============================================================================

const themes = {
    indigo: { primary: "bg-indigo-600", activeTabBg: "bg-indigo-600", activeTabFg: "text-white" },
    emerald: { primary: "bg-emerald-600", activeTabBg: "bg-emerald-600", activeTabFg: "text-white" },
    rose: { primary: "bg-rose-600", activeTabBg: "bg-rose-600", activeTabFg: "text-white" },
    amber: { primary: "bg-amber-500", activeTabBg: "bg-amber-500", activeTabFg: "text-white" },
    sky: { primary: "bg-sky-600", activeTabBg: "bg-sky-600", activeTabFg: "text-white" },
    slate: { primary: "bg-slate-800", activeTabBg: "bg-slate-800", activeTabFg: "text-white" }
};

const bgColors = {
    slate: "bg-slate-100 text-slate-800",
    blue: "bg-blue-50 text-slate-800",
    emerald: "bg-emerald-50 text-slate-800",
    amber: "bg-amber-50 text-slate-800",
    purple: "bg-purple-50 text-slate-800",
    dark: "bg-slate-900 text-slate-100"
};

const cardColors = {
    white: "bg-white text-slate-800 border-slate-200",
    slate: "bg-slate-50 text-slate-800 border-slate-300",
    indigo: "bg-indigo-50/80 text-slate-900 border-indigo-200",
    emerald: "bg-emerald-50/80 text-slate-900 border-emerald-200",
    amber: "bg-amber-50/80 text-slate-900 border-amber-200",
    dark: "bg-slate-800 text-slate-100 border-slate-700"
};

let weightChartInstance = null;
let expensesChartInstance = null;

let state = {
    theme: "indigo",
    bgColor: "slate",
    cardColor: "white",
    googleSheetUrl: "",
    googleSheetDirectUrl: "",
    activePetId: "pet-1",
    currentTab: "dashboard",
    pets: [
        {
            id: "pet-1",
            name: "Max",
            species: "Perro",
            breed: "Golden Retriever",
            age: "3 años",
            weight: 28.5,
            chip: "981020000123456",
            photo: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400",
            vet: { clinic: "Veterinaria San Antón", doctor: "Dra. Valeria Gómez", phone: "+541144332211", emergency: "+541199887766", address: "Av. Cabildo 2400, CABA" }
        },
        {
            id: "pet-2",
            name: "Luna",
            species: "Gato",
            breed: "Siamesa",
            age: "2 años",
            weight: 4.2,
            chip: "981020000987654",
            photo: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400",
            vet: { clinic: "Clínica Felina", doctor: "Dr. Martín Rossi", phone: "+541155667788", emergency: "+541188776655", address: "Av. Santa Fe 1200, CABA" }
        }
    ],
    weightHistory: [
        { petId: "pet-1", weight: 26.0, date: "2026-05-10" },
        { petId: "pet-1", weight: 26.8, date: "2026-06-12" },
        { petId: "pet-1", weight: 27.2, date: "2026-07-15" },
        { petId: "pet-1", weight: 27.9, date: "2026-08-20" },
        { petId: "pet-1", weight: 28.1, date: "2026-09-10" },
        { petId: "pet-1", weight: 28.5, date: "2026-10-01" }
    ],
    healthRecords: [
        { id: "h1", petId: "pet-1", title: "Vacuna Antirrábica", type: "Vacuna", date: "2026-03-15", notes: "Refuerzo anual ok" },
        { id: "h2", petId: "pet-1", title: "Pipeta Antipulgas", type: "Desparasitación", date: "2026-09-10", notes: "Aplicada correctamente" }
    ],
    appointments: [
        { id: "a1", petId: "pet-1", title: "Corte de pelo y Baño", type: "Peluquería", date: "2026-10-25", time: "15:00", cost: 12000, status: "Nuevo", notes: "Llevar su propio champú hipoalergénico" },
        { id: "a2", petId: "pet-1", title: "Control Anual y Vacuna", type: "Veterinaria", date: "2026-11-02", time: "10:30", cost: 18000, status: "Nuevo", notes: "Ayuno de 6 horas" }
    ],
    expenses: [
        { id: "e1", petId: "pet-1", concept: "Alimento Balanceado 15kg", category: "Comida", amount: 45000, date: "2026-10-01" },
        { id: "e2", petId: "pet-1", concept: "Pipeta Antipulgas", category: "Medicina", amount: 8500, date: "2026-10-05" }
    ]
};

document.addEventListener("DOMContentLoaded", () => {
    loadLocalData();
    applyAllThemeStyles();
    renderPetSelector();
    switchTab(state.currentTab || "dashboard");
});

function saveLocalData() {
    localStorage.setItem("petcare_data_v5", JSON.stringify(state));
    syncAllToGoogleSheet(false); // Sincronización automática silenciosa
}

function loadLocalData() {
    const saved = localStorage.getItem("petcare_data_v5");
    if (saved) state = JSON.parse(saved);
}

// ============================================================================
// TEMAS Y COLORES DINÁMICOS
// ============================================================================
function setTheme(themeName) {
    state.theme = themeName;
    saveLocalData();
    applyAllThemeStyles();
}

function setBgColor(bgColorName) {
    state.bgColor = bgColorName;
    saveLocalData();
    applyAllThemeStyles();
}

function setCardColor(cardColorName) {
    state.cardColor = cardColorName;
    saveLocalData();
    applyAllThemeStyles();
}

function applyAllThemeStyles() {
    const t = themes[state.theme] || themes.indigo;
    const bgClass = bgColors[state.bgColor] || bgColors.slate;
    const cardClass = cardColors[state.cardColor] || cardColors.white;

    const header = document.getElementById("appHeader");
    if (header) {
        header.className = `text-white shadow-lg sticky top-0 z-50 transition-colors duration-300 ${t.primary}`;
    }

    const body = document.getElementById("appBody");
    if (body) {
        body.className = `font-sans min-h-screen pb-12 transition-colors duration-300 ${bgClass}`;
    }

    document.querySelectorAll(".custom-card").forEach(el => {
        el.className = `custom-card p-6 rounded-2xl shadow-sm border ${cardClass}`;
    });

    document.querySelectorAll(".theme-bg").forEach(el => {
        el.className = el.className.replace(/bg-\w+-\d+/g, "");
        el.classList.add(t.primary);
    });

    switchTab(state.currentTab || "dashboard");
}

function openConfigModal() {
    document.getElementById("googleSheetUrlInput").value = state.googleSheetUrl || "";
    document.getElementById("googleSheetDirectUrlInput").value = state.googleSheetDirectUrl || "";
    openModal("configModal");
}

function saveConfig() {
    state.googleSheetUrl = document.getElementById("googleSheetUrlInput").value.trim();
    state.googleSheetDirectUrl = document.getElementById("googleSheetDirectUrlInput").value.trim();
    saveLocalData();
    closeModal("configModal");
    alert("¡Configuración guardada!");
}

function openGoogleSheetDirect() {
    const url = document.getElementById("googleSheetDirectUrlInput").value.trim() || state.googleSheetDirectUrl;
    if (url) {
        window.open(url, '_blank');
    } else {
        alert("Por favor ingresá la URL de tu planilla de Google Sheets primero.");
    }
}

// ============================================================================
// NAVEGACIÓN Y TABS
// ============================================================================
function switchTab(tabName) {
    state.currentTab = tabName;
    localStorage.setItem("petcare_data_v5", JSON.stringify(state));

    document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
    
    const t = themes[state.theme] || themes.indigo;

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.className = "tab-btn py-3 px-3 rounded-xl font-bold text-sm shadow-sm flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 transition bg-white text-slate-600 hover:bg-slate-50";
    });

    const activeSec = document.getElementById(`sec-${tabName}`);
    if (activeSec) activeSec.classList.remove("hidden");

    const activeBtn = document.getElementById(`tab-${tabName}`);
    if (activeBtn) {
        activeBtn.className = `tab-btn py-3 px-3 rounded-xl font-bold text-sm shadow flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 transition ${t.activeTabBg} ${t.activeTabFg}`;
    }

    if (tabName === 'dashboard') renderDashboard();
    if (tabName === 'health') {
        renderHealthSection();
        renderWeightChart();
    }
    if (tabName === 'appointments') renderAppointmentsSection();
    if (tabName === 'finances') {
        renderExpensesSection();
        renderExpensesChart();
    }
    if (tabName === 'vet') loadVetForm();
}

function getActivePet() {
    return state.pets.find(p => p.id === state.activePetId) || state.pets[0];
}

function renderPetSelector() {
    const selector = document.getElementById("petSelector");
    if (!selector) return;
    selector.innerHTML = state.pets.map(p =>
        `<option value="${p.id}" ${p.id === state.activePetId ? 'selected' : ''}>${p.name}</option>`
    ).join("");
}

function changeActivePet(petId) {
    state.activePetId = petId;
    localStorage.setItem("petcare_data_v5", JSON.stringify(state));
    switchTab(state.currentTab);
}

// ============================================================================
// DASHBOARD
// ============================================================================
function renderDashboard() {
    const pet = getActivePet();
    if (!pet) return;

    document.getElementById("petName").innerText = pet.name;
    document.getElementById("petBreed").innerText = pet.breed;
    document.getElementById("petAge").innerText = pet.age;
    document.getElementById("petWeight").innerText = `${pet.weight} kg`;
    document.getElementById("petChip").innerText = pet.chip || "N/A";
    document.getElementById("petSpecies").innerText = pet.species;
    document.getElementById("petAvatar").src = pet.photo;

    const list = document.getElementById("dashboardAppointmentsList");
    const petAppointments = state.appointments.filter(a => a.petId === pet.id);

    list.innerHTML = petAppointments.length === 0 ? `<p class="text-xs text-slate-400 italic">No hay citas agendadas.</p>` :
        petAppointments.map(a => renderAppointmentCard(a)).join("");
}

// ============================================================================
// REGISTRO DE PESO (HISTORIAL Y GRÁFICO)
// ============================================================================
function openWeightModal() {
    const pet = getActivePet();
    document.getElementById("weightFormValue").value = pet ? pet.weight : "";
    document.getElementById("weightFormDate").value = new Date().toISOString().split("T")[0];
    openModal("weightModal");
}

function saveWeightForm(e) {
    e.preventDefault();
    const weightVal = parseFloat(document.getElementById("weightFormValue").value) || 0;
    const weightDate = document.getElementById("weightFormDate").value;

    const pet = getActivePet();
    if (pet) {
        pet.weight = weightVal;
    }

    if (!state.weightHistory) state.weightHistory = [];
    state.weightHistory.push({
        petId: state.activePetId,
        weight: weightVal,
        date: weightDate
    });

    saveLocalData();
    closeModal("weightModal");
    switchTab(state.currentTab);
}

function renderWeightChart() {
    const ctx = document.getElementById("weightChart")?.getContext("2d");
    if (!ctx) return;

    if (weightChartInstance) {
        weightChartInstance.destroy();
    }

    const history = (state.weightHistory || [])
        .filter(w => w.petId === state.activePetId)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const labels = history.length ? history.map(w => w.date) : ["Actual"];
    const data = history.length ? history.map(w => w.weight) : [getActivePet().weight || 0];

    weightChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Peso (kg)",
                data: data,
                borderColor: "#6366f1",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

// ============================================================================
// GRÁFICO DE GASTOS POR CATEGORÍA
// ============================================================================
function renderExpensesChart() {
    const ctx = document.getElementById("expensesChart")?.getContext("2d");
    if (!ctx) return;

    if (expensesChartInstance) {
        expensesChartInstance.destroy();
    }

    const petExpenses = state.expenses.filter(e => e.petId === state.activePetId);
    
    const totals = {};
    petExpenses.forEach(e => {
        totals[e.category] = (totals[e.category] || 0) + e.amount;
    });

    const labels = Object.keys(totals);
    const data = Object.values(totals);

    if (labels.length === 0) {
        labels.push("Sin Gastos");
        data.push(1);
    }

    expensesChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ["#10b981", "#ef4444", "#f59e0b", "#6366f1", "#8b5cf6", "#ec4899"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
            }
        }
    });
}

// ============================================================================
// CRUD MASCOTAS
// ============================================================================
function openPetModal(petToEdit = null) {
    document.getElementById("petModalTitle").innerText = petToEdit ? "Editar Mascota" : "Agregar Mascota";
    document.getElementById("petFormId").value = petToEdit ? petToEdit.id : "";
    document.getElementById("petFormName").value = petToEdit ? petToEdit.name : "";
    document.getElementById("petFormSpecies").value = petToEdit ? petToEdit.species : "Perro";
    document.getElementById("petFormBreed").value = petToEdit ? petToEdit.breed : "";
    document.getElementById("petFormAge").value = petToEdit ? petToEdit.age : "";
    document.getElementById("petFormWeight").value = petToEdit ? petToEdit.weight : "";
    document.getElementById("petFormChip").value = petToEdit ? petToEdit.chip : "";
    document.getElementById("petFormPhoto").value = petToEdit ? petToEdit.photo : "";

    openModal("petModal");
}

function savePetForm(e) {
    e.preventDefault();
    const id = document.getElementById("petFormId").value;
    const name = document.getElementById("petFormName").value;
    const species = document.getElementById("petFormSpecies").value;
    const breed = document.getElementById("petFormBreed").value;
    const age = document.getElementById("petFormAge").value;
    const weight = parseFloat(document.getElementById("petFormWeight").value) || 0;
    const chip = document.getElementById("petFormChip").value;
    const photo = document.getElementById("petFormPhoto").value || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400";

    if (id) {
        const pet = state.pets.find(p => p.id === id);
        if (pet) Object.assign(pet, { name, species, breed, age, weight, chip, photo });
    } else {
        const newId = "pet-" + Date.now();
        state.pets.push({ id: newId, name, species, breed, age, weight, chip, photo, vet: {} });
        state.activePetId = newId;
    }

    saveLocalData();
    renderPetSelector();
    switchTab(state.currentTab);
    closeModal("petModal");
}

function editCurrentPet() { openPetModal(getActivePet()); }

function deleteCurrentPet() {
    const pet = getActivePet();
    if (!pet) return;

    if (state.pets.length === 1) {
        alert("Debe haber al menos una mascota registrada.");
        return;
    }

    if (confirm(`¿Eliminar a ${pet.name}? Se borrarán también sus citas y gastos.`)) {
        state.pets = state.pets.filter(p => p.id !== pet.id);
        state.appointments = state.appointments.filter(a => a.petId !== pet.id);
        state.expenses = state.expenses.filter(e => e.petId !== pet.id);
        state.healthRecords = state.healthRecords.filter(h => h.petId !== pet.id);
        state.activePetId = state.pets[0].id;

        saveLocalData();
        renderPetSelector();
        switchTab(state.currentTab);
    }
}

// ============================================================================
// CRUD CITAS
// ============================================================================
function openAppointmentModal(appToEdit = null) {
    document.getElementById("appModalTitle").innerText = appToEdit ? "Editar Cita" : "Agendar Cita";
    document.getElementById("appFormId").value = appToEdit ? appToEdit.id : "";
    document.getElementById("appFormTitle").value = appToEdit ? appToEdit.title : "";
    document.getElementById("appFormType").value = appToEdit ? appToEdit.type : "Veterinaria";
    document.getElementById("appFormStatus").value = appToEdit ? appToEdit.status : "Nuevo";
    document.getElementById("appFormDate").value = appToEdit ? appToEdit.date : new Date().toISOString().split("T")[0];
    document.getElementById("appFormTime").value = appToEdit ? appToEdit.time : "10:00";
    document.getElementById("appFormCost").value = appToEdit ? appToEdit.cost : "";
    document.getElementById("appFormNotes").value = appToEdit ? appToEdit.notes : "";

    openModal("appointmentModal");
}

function saveAppointmentForm(e) {
    e.preventDefault();
    const id = document.getElementById("appFormId").value;
    const title = document.getElementById("appFormTitle").value;
    const type = document.getElementById("appFormType").value;
    const status = document.getElementById("appFormStatus").value;
    const date = document.getElementById("appFormDate").value;
    const time = document.getElementById("appFormTime").value;
    const cost = parseFloat(document.getElementById("appFormCost").value) || 0;
    const notes = document.getElementById("appFormNotes").value;

    if (id) {
        const app = state.appointments.find(a => a.id === id);
        if (app) Object.assign(app, { title, type, status, date, time, cost, notes });
    } else {
        state.appointments.push({ id: "a-" + Date.now(), petId: state.activePetId, title, type, status, date, time, cost, notes });
    }

    saveLocalData();
    switchTab(state.currentTab);
    closeModal("appointmentModal");
}

function editAppointment(id) {
    const app = state.appointments.find(a => a.id === id);
    if (app) openAppointmentModal(app);
}

function deleteAppointment(id) {
    if (confirm("¿Eliminar esta cita?")) {
        state.appointments = state.appointments.filter(a => a.id !== id);
        saveLocalData();
        switchTab(state.currentTab);
    }
}

function renderAppointmentCard(a) {
    const statusColors = {
        Nuevo: "bg-blue-100 text-blue-800 border-blue-200",
        Cumplida: "bg-emerald-100 text-emerald-800 border-emerald-200",
        Cancelada: "bg-red-100 text-red-800 border-red-200"
    };

    return `
        <div class="p-4 bg-slate-50/50 rounded-xl border border-slate-200 space-y-2">
            <div class="flex justify-between items-center">
                <span class="text-xs font-bold px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full">${a.type}</span>
                <span class="text-xs font-bold px-2 py-0.5 rounded-md border ${statusColors[a.status] || statusColors.Nuevo}">${a.status}</span>
            </div>
            <h4 class="font-bold text-base text-slate-800">${a.title}</h4>
            <p class="text-xs text-slate-600"><i class="fa-regular fa-calendar mr-1"></i>${a.date} - ${a.time} hs</p>
            ${a.notes ? `<p class="text-xs text-slate-500 bg-white/80 p-2 rounded border border-slate-100"><i class="fa-solid fa-comment mr-1 text-slate-400"></i>${a.notes}</p>` : ''}
            <div class="flex justify-between items-center pt-2 border-t border-slate-200">
                <span class="text-xs font-bold text-emerald-600">Costo: $${a.cost}</span>
                <div class="flex items-center space-x-2">
                    <button onclick="downloadICS('${a.title}', '${a.date}', '${a.time}')" class="text-xs bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded text-slate-700" title="Descargar Calendario">.ics</button>
                    <button onclick="editAppointment('${a.id}')" class="text-xs text-indigo-600 hover:text-indigo-800"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="deleteAppointment('${a.id}')" class="text-xs text-red-500 hover:text-red-700"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        </div>
    `;
}

function renderAppointmentsSection() {
    const list = document.getElementById("fullAppointmentsList");
    const petAppointments = state.appointments.filter(a => a.petId === state.activePetId);
    list.innerHTML = petAppointments.length === 0 ? `<p class="text-xs text-slate-400 italic">No hay citas registradas para esta mascota.</p>` :
        petAppointments.map(a => renderAppointmentCard(a)).join("");
}

// ============================================================================
// CRUD SALUD Y VACUNAS
// ============================================================================
function openHealthModal(recordToEdit = null) {
    document.getElementById("healthModalTitle").innerText = recordToEdit ? "Editar Registro" : "Nuevo Registro de Salud";
    document.getElementById("healthFormId").value = recordToEdit ? recordToEdit.id : "";
    document.getElementById("healthFormTitle").value = recordToEdit ? recordToEdit.title : "";
    document.getElementById("healthFormType").value = recordToEdit ? recordToEdit.type : "Vacuna";
    document.getElementById("healthFormDate").value = recordToEdit ? recordToEdit.date : new Date().toISOString().split("T")[0];
    document.getElementById("healthFormNotes").value = recordToEdit ? recordToEdit.notes : "";

    openModal("healthModal");
}

function saveHealthForm(e) {
    e.preventDefault();
    const id = document.getElementById("healthFormId").value;
    const title = document.getElementById("healthFormTitle").value;
    const type = document.getElementById("healthFormType").value;
    const date = document.getElementById("healthFormDate").value;
    const notes = document.getElementById("healthFormNotes").value;

    if (id) {
        const h = state.healthRecords.find(item => item.id === id);
        if (h) Object.assign(h, { title, type, date, notes });
    } else {
        state.healthRecords.push({ id: "h-" + Date.now(), petId: state.activePetId, title, type, date, notes });
    }

    saveLocalData();
    renderHealthSection();
    closeModal("healthModal");
}

function editHealthRecord(id) {
    const h = state.healthRecords.find(item => item.id === id);
    if (h) openHealthModal(h);
}

function deleteHealthRecord(id) {
    if (confirm("¿Eliminar este registro de salud?")) {
        state.healthRecords = state.healthRecords.filter(item => item.id !== id);
        saveLocalData();
        renderHealthSection();
    }
}

function renderHealthSection() {
    const list = document.getElementById("healthRecordsList");
    const records = state.healthRecords.filter(h => h.petId === state.activePetId);
    list.innerHTML = records.length === 0 ? `<p class="text-xs text-slate-400 italic">No hay registros cargados.</p>` :
        records.map(h => `
            <div class="flex justify-between items-center p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                <div>
                    <span class="text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded">${h.type}</span>
                    <h4 class="font-bold text-sm text-slate-800 mt-1">${h.title}</h4>
                    <p class="text-xs text-slate-400">${h.date} - ${h.notes}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="editHealthRecord('${h.id}')" class="text-xs text-indigo-600 hover:text-indigo-800"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="deleteHealthRecord('${h.id}')" class="text-xs text-red-500 hover:text-red-700"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `).join("");
}

// ============================================================================
// CRUD GASTOS
// ============================================================================
function openExpenseModal(expToEdit = null) {
    document.getElementById("expModalTitle").innerText = expToEdit ? "Editar Gasto" : "Registrar Gasto";
    document.getElementById("expFormId").value = expToEdit ? expToEdit.id : "";
    document.getElementById("expFormConcept").value = expToEdit ? expToEdit.concept : "";
    document.getElementById("expFormCategory").value = expToEdit ? expToEdit.category : "Comida";
    document.getElementById("expFormAmount").value = expToEdit ? expToEdit.amount : "";
    document.getElementById("expFormDate").value = expToEdit ? expToEdit.date : new Date().toISOString().split("T")[0];

    openModal("expenseModal");
}

function saveExpenseForm(e) {
    e.preventDefault();
    const id = document.getElementById("expFormId").value;
    const concept = document.getElementById("expFormConcept").value;
    const category = document.getElementById("expFormCategory").value;
    const amount = parseFloat(document.getElementById("expFormAmount").value) || 0;
    const date = document.getElementById("expFormDate").value;

    if (id) {
        const ex = state.expenses.find(item => item.id === id);
        if (ex) Object.assign(ex, { concept, category, amount, date });
    } else {
        state.expenses.push({ id: "e-" + Date.now(), petId: state.activePetId, concept, category, amount, date });
    }

    saveLocalData();
    renderExpensesSection();
    renderExpensesChart();
    closeModal("expenseModal");
}

function editExpense(id) {
    const ex = state.expenses.find(item => item.id === id);
    if (ex) openExpenseModal(ex);
}

function deleteExpense(id) {
    if (confirm("¿Eliminar este gasto?")) {
        state.expenses = state.expenses.filter(e => e.id !== id);
        saveLocalData();
        renderExpensesSection();
        renderExpensesChart();
    }
}

function renderExpensesSection() {
    const list = document.getElementById("expensesList");
    const petExpenses = state.expenses.filter(e => e.petId === state.activePetId);
    list.innerHTML = petExpenses.length === 0 ? `<p class="text-xs text-slate-400 italic">No hay gastos registrados.</p>` :
        petExpenses.map(e => `
            <div class="flex justify-between items-center p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                <div>
                    <h4 class="font-bold text-sm text-slate-800">${e.concept}</h4>
                    <span class="text-xs text-slate-400">${e.category} • ${e.date}</span>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="font-bold text-slate-800">$${e.amount}</span>
                    <button onclick="editExpense('${e.id}')" class="text-xs text-indigo-600 hover:text-indigo-800"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="deleteExpense('${e.id}')" class="text-xs text-red-500 hover:text-red-700"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `).join("");
}

// ============================================================================
// VETERINARIA DE CABECERA
// ============================================================================
function loadVetForm() {
    const vet = getActivePet().vet || {};
    document.getElementById("vetClinicName").value = vet.clinic || "";
    document.getElementById("vetDoctorName").value = vet.doctor || "";
    document.getElementById("vetPhone").value = vet.phone || "";
    document.getElementById("vetEmergencyPhone").value = vet.emergency || "";
    document.getElementById("vetAddress").value = vet.address || "";
}

function saveVetInfo(e) {
    e.preventDefault();
    getActivePet().vet = {
        clinic: document.getElementById("vetClinicName").value,
        doctor: document.getElementById("vetDoctorName").value,
        phone: document.getElementById("vetPhone").value,
        emergency: document.getElementById("vetEmergencyPhone").value,
        address: document.getElementById("vetAddress").value
    };
    saveLocalData();
    alert("¡Datos veterinarios guardados!");
}

// ============================================================================
// SINCRONIZACIÓN GOOGLE SHEETS (AUTOMÁTICA Y MANUAL)
// ============================================================================
async function syncAllToGoogleSheet(isManual = false) {
    const url = state.googleSheetUrl;
    if (!url) {
        if (isManual) {
            alert("Por favor configurá la URL Web App de Google Apps Script en la Configuración (⚙️).");
            openConfigModal();
        }
        return;
    }

    const payload = { pets: state.pets, appointments: state.appointments, expenses: state.expenses };

    try {
        if (isManual) alert("Sincronizando datos con Google Sheets...");
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (isManual) alert("¡Datos sincronizados exitosamente con Google Sheets!");
    } catch (error) {
        if (isManual) alert("Error al sincronizar: " + error.toString());
    }
}

// ============================================================================
// MODALES Y UTILIDADES
// ============================================================================
function openModal(id) {
    const el = document.getElementById(id);
    el.classList.remove("hidden");
    el.classList.add("flex");
}

function closeModal(id) {
    const el = document.getElementById(id);
    el.classList.add("hidden");
    el.classList.remove("flex");
}

function downloadICS(title, date, time) {
    const start = new Date(`${date}T${time}:00`).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${title}
DTSTART:${start}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `${title}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showQRCode() {
    const pet = getActivePet();
    const qrContainer = document.getElementById("qrcode");
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, { text: `Mascota: ${pet.name}
Especie: ${pet.species}`, width: 128, height: 128 });
    openModal("qrModal");
}
