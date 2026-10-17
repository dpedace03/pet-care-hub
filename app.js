// ============================================================================
// PET CARE HUB - LÓGICA COMPLETA CON CREAR, MODIFICAR Y ELIMINAR (CRUD)
// ============================================================================

let state = {
    googleSheetUrl: "",
    activePetId: "pet-1",
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
    appointments: [
        { id: "a1", petId: "pet-1", title: "Corte de pelo y Baño", type: "Peluquería", date: "2026-10-25", time: "15:00", cost: 12000 },
        { id: "a2", petId: "pet-1", title: "Control Anual y Vacuna", type: "Veterinaria", date: "2026-11-02", time: "10:30", cost: 18000 }
    ],
    expenses: [
        { id: "e1", petId: "pet-1", concept: "Alimento Balanceado 15kg", category: "Comida", amount: 45000, date: "2026-10-01" },
        { id: "e2", petId: "pet-1", concept: "Pipeta Antipulgas", category: "Medicina", amount: 8500, date: "2026-10-05" }
    ]
};

document.addEventListener("DOMContentLoaded", () => {
    loadLocalData();
    renderPetSelector();
    renderDashboard();
    initCharts();

    if (state.googleSheetUrl) {
        const inputUrl = document.getElementById("googleSheetUrlInput");
        if (inputUrl) inputUrl.value = state.googleSheetUrl;
    }
});

function saveLocalData() {
    localStorage.setItem("petcare_data", JSON.stringify(state));
}

function loadLocalData() {
    const saved = localStorage.getItem("petcare_data");
    if (saved) state = JSON.parse(saved);
}

// ============================================================================
// CRUD MASCOTAS (AGREGAR, EDITAR, ELIMINAR)
// ============================================================================
function openPetModal(petToEdit = null) {
    document.getElementById("petModalTitle").innerText = petToEdit ? "Editar Mascota" : "Agregar Nueva Mascota";
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
        // Editar existente
        const pet = state.pets.find(p => p.id === id);
        if (pet) {
            pet.name = name; pet.species = species; pet.breed = breed;
            pet.age = age; pet.weight = weight; pet.chip = chip; pet.photo = photo;
        }
    } else {
        // Crear nueva
        const newId = "pet-" + Date.now();
        state.pets.push({ id: newId, name, species, breed, age, weight, chip, photo, vet: {} });
        state.activePetId = newId;
    }

    saveLocalData();
    renderPetSelector();
    renderDashboard();
    closeModal("petModal");
}

function editCurrentPet() {
    openPetModal(getActivePet());
}

function deleteCurrentPet() {
    const pet = getActivePet();
    if (!pet) return;

    if (state.pets.length === 1) {
        alert("Debe haber al menos una mascota en el sistema.");
        return;
    }

    if (confirm(`¿Estás seguro de que querés eliminar a ${pet.name}?`)) {
        state.pets = state.pets.filter(p => p.id !== pet.id);
        state.appointments = state.appointments.filter(a => a.petId !== pet.id);
        state.expenses = state.expenses.filter(e => e.petId !== pet.id);
        state.activePetId = state.pets[0].id;

        saveLocalData();
        renderPetSelector();
        renderDashboard();
    }
}

// ============================================================================
// CRUD CITAS (AGREGAR Y ELIMINAR)
// ============================================================================
function openAppointmentModal() {
    document.getElementById("appFormDate").value = new Date().toISOString().split("T")[0];
    openModal("appointmentModal");
}

function saveAppointmentForm(e) {
    e.preventDefault();
    const newApp = {
        id: "a-" + Date.now(),
        petId: state.activePetId,
        title: document.getElementById("appFormTitle").value,
        type: document.getElementById("appFormType").value,
        cost: parseFloat(document.getElementById("appFormCost").value) || 0,
        date: document.getElementById("appFormDate").value,
        time: document.getElementById("appFormTime").value
    };

    state.appointments.push(newApp);
    saveLocalData();
    renderDashboard();
    if (!document.getElementById("sec-appointments").classList.contains("hidden")) {
        renderAppointmentsSection();
    }
    closeModal("appointmentModal");
}

function deleteAppointment(id) {
    if (confirm("¿Eliminar esta cita?")) {
        state.appointments = state.appointments.filter(a => a.id !== id);
        saveLocalData();
        renderDashboard();
        renderAppointmentsSection();
    }
}

// ============================================================================
// CRUD GASTOS (AGREGAR Y ELIMINAR)
// ============================================================================
function openExpenseModal() {
    document.getElementById("expFormDate").value = new Date().toISOString().split("T")[0];
    openModal("expenseModal");
}

function saveExpenseForm(e) {
    e.preventDefault();
    const newExpense = {
        id: "e-" + Date.now(),
        petId: state.activePetId,
        concept: document.getElementById("expFormConcept").value,
        category: document.getElementById("expFormCategory").value,
        amount: parseFloat(document.getElementById("expFormAmount").value) || 0,
        date: document.getElementById("expFormDate").value
    };

    state.expenses.push(newExpense);
    saveLocalData();
    renderExpensesSection();
    initCharts();
    closeModal("expenseModal");
}

function deleteExpense(id) {
    if (confirm("¿Eliminar este gasto?")) {
        state.expenses = state.expenses.filter(e => e.id !== id);
        saveLocalData();
        renderExpensesSection();
        initCharts();
    }
}

// ============================================================================
// SINCRONIZACIÓN A GOOGLE SHEETS
// ============================================================================
function saveGoogleSheetUrl() {
    const url = document.getElementById("googleSheetUrlInput").value.trim();
    if (!url) return alert("Ingresá una URL válida de Google Apps Script.");
    state.googleSheetUrl = url;
    saveLocalData();
    alert("¡URL de Google Apps Script guardada correctamente!");
}

async function syncAllToGoogleSheet() {
    const url = state.googleSheetUrl || document.getElementById("googleSheetUrlInput").value.trim();
    if (!url) return alert("Por favor pegá primero la URL de tu Web App de Google Apps Script.");

    const payload = { pets: state.pets, appointments: state.appointments, expenses: state.expenses };

    try {
        alert("Sincronizando datos con Google Sheets...");
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        alert("¡Datos sincronizados exitosamente con Google Sheets!");
    } catch (error) {
        alert("Error al sincronizar: " + error.toString());
    }
}

// ============================================================================
// NAVEGACIÓN Y RENDERIZADO
// ============================================================================
function switchTab(tabName) {
    document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
    document.querySelectorAll(".tab-btn").forEach(el => {
        el.classList.remove("active-tab");
        el.classList.add("text-slate-500");
    });

    document.getElementById(`sec-${tabName}`).classList.remove("hidden");
    const activeBtn = document.getElementById(`tab-${tabName}`);
    activeBtn.classList.add("active-tab");
    activeBtn.classList.remove("text-slate-500");

    if (tabName === 'appointments') renderAppointmentsSection();
    if (tabName === 'finances') renderExpensesSection();
    if (tabName === 'vet') loadVetForm();
}

function getActivePet() {
    return state.pets.find(p => p.id === state.activePetId) || state.pets[0];
}

function renderPetSelector() {
    const selector = document.getElementById("petSelector");
    selector.innerHTML = state.pets.map(p =>
        `<option value="${p.id}" ${p.id === state.activePetId ? 'selected' : ''}>${p.name}</option>`
    ).join("");
}

function changeActivePet(petId) {
    state.activePetId = petId;
    saveLocalData();
    renderDashboard();
}

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
        petAppointments.map(a => `
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div class="flex items-center space-x-3">
                    <span class="p-2 bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold">${a.type}</span>
                    <div>
                        <h4 class="font-bold text-sm text-slate-800">${a.title}</h4>
                        <p class="text-xs text-slate-500"><i class="fa-regular fa-calendar mr-1"></i>${a.date} - ${a.time} hs</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="downloadICS('${a.title}', '${a.date}', '${a.time}')" class="text-xs bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded text-slate-700">.ics</button>
                    <button onclick="deleteAppointment('${a.id}')" class="text-xs text-red-500 hover:text-red-700"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `).join("");
}

function renderAppointmentsSection() {
    document.getElementById("fullAppointmentsList").innerHTML = state.appointments.map(a => {
        const pet = state.pets.find(p => p.id === a.petId);
        return `
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 relative">
                <div class="flex justify-between items-center">
                    <span class="text-xs font-bold px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full">${a.type}</span>
                    <span class="text-xs text-slate-400">Mascota: ${pet ? pet.name : 'N/A'}</span>
                </div>
                <h4 class="font-bold text-base text-slate-800">${a.title}</h4>
                <p class="text-xs text-slate-600">${a.date} a las ${a.time} hs</p>
                <div class="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span class="text-xs font-bold text-emerald-600">Costo: $${a.cost}</span>
                    <button onclick="deleteAppointment('${a.id}')" class="text-xs text-red-500 hover:text-red-700"><i class="fa-solid fa-trash mr-1"></i> Eliminar</button>
                </div>
            </div>
        `;
    }).join("");
}

function renderExpensesSection() {
    document.getElementById("expensesList").innerHTML = state.expenses.map(e => {
        const pet = state.pets.find(p => p.id === e.petId);
        return `
            <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                    <h4 class="font-bold text-sm text-slate-800">${e.concept}</h4>
                    <span class="text-xs text-slate-400">${e.category} • ${pet ? pet.name : 'N/A'} • ${e.date}</span>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="font-bold text-slate-800">$${e.amount}</span>
                    <button onclick="deleteExpense('${e.id}')" class="text-xs text-red-500 hover:text-red-700"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join("");
}

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

function downloadICS(title, date, time) {
    const start = new Date(`${date}T${time}:00`).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const icsData = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title}\nDTSTART:${start}\nEND:VEVENT\nEND:VCALENDAR`;
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
    new QRCode(qrContainer, { text: `Mascota: ${pet.name}\nEspecie: ${pet.species}`, width: 128, height: 128 });
    openModal("qrModal");
}

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

function initCharts() {
    const ctxWeight = document.getElementById("weightChart")?.getContext("2d");
    if (ctxWeight) {
        new Chart(ctxWeight, {
            type: "line",
            data: { labels: ["Ene", "Mar", "May", "Jul", "Sep", "Oct"], datasets: [{ label: "Peso (kg)", data: [26.0, 26.8, 27.2, 27.9, 28.1, 28.5], borderColor: "#6366f1" }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
    const ctxExpenses = document.getElementById("expensesChart")?.getContext("2d");
    if (ctxExpenses) {
        new Chart(ctxExpenses, {
            type: "doughnut",
            data: { labels: ["Comida", "Medicina", "Juguetes"], datasets: [{ data: [45000, 8500, 22000], backgroundColor: ["#10b981", "#ef4444", "#f59e0b"] }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}