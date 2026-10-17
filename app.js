// ============================================================================
// PET CARE HUB - LÓGICA GENERAL Y SINCRONIZACIÓN GOOGLE SHEETS
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
            vet: {
                clinic: "Veterinaria San Antón",
                doctor: "Dra. Valeria Gómez",
                phone: "+541144332211",
                emergency: "+541199887766",
                address: "Av. Cabildo 2400, CABA"
            }
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
            vet: {
                clinic: "Clínica Felina",
                doctor: "Dr. Martín Rossi",
                phone: "+541155667788",
                emergency: "+541188776655",
                address: "Av. Santa Fe 1200, CABA"
            }
        }
    ],
    appointments: [
        { id: "a1", petId: "pet-1", title: "Corte de pelo y Baño", type: "Peluquería", date: "2026-10-25", time: "15:00", cost: 12000 },
        { id: "a2", petId: "pet-1", title: "Control Anual y Vacuna", type: "Veterinaria", date: "2026-11-02", time: "10:30", cost: 18000 },
        { id: "a3", petId: "pet-2", title: "Desparasitaciones", type: "Veterinaria", date: "2026-10-28", time: "11:00", cost: 8500 }
    ],
    expenses: [
        { id: "e1", petId: "pet-1", concept: "Alimento Balanceado 15kg", category: "Comida", amount: 45000, date: "2026-10-01" },
        { id: "e2", petId: "pet-1", concept: "Pipeta Antipulgas", category: "Medicina", amount: 8500, date: "2026-10-05" },
        { id: "e3", petId: "pet-2", concept: "Rascador Torre", category: "Juguetes", amount: 22000, date: "2026-10-10" }
    ]
};

// ============================================================================
// INICIALIZACIÓN
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
    loadLocalData();
    renderPetSelector();
    renderDashboard();
    initCharts();

    // Cargar URL guardada si existe
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
    if (saved) {
        state = JSON.parse(saved);
    }
}

function saveGoogleSheetUrl() {
    const url = document.getElementById("googleSheetUrlInput").value.trim();
    if (!url) {
        alert("Por favor ingresá una URL válida de Google Apps Script.");
        return;
    }
    state.googleSheetUrl = url;
    saveLocalData();
    alert("¡URL de Google Apps Script guardada correctamente!");
}

// ============================================================================
// SINCRONIZACIÓN A GOOGLE SHEETS
// ============================================================================
async function syncAllToGoogleSheet() {
    const url = state.googleSheetUrl || document.getElementById("googleSheetUrlInput").value.trim();

    if (!url) {
        alert("Por favor pegá primero la URL de tu Web App de Google Apps Script.");
        return;
    }

    const payload = {
        pets: state.pets,
        appointments: state.appointments,
        expenses: state.expenses
    };

    try {
        alert("Enviando todos los datos a Google Sheets... Aguardá unos segundos.");

        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        alert("¡Sincronización enviada con éxito! Revisá tu planilla de Google Sheets. Las pestañas 'Mascotas', 'Citas' y 'Gastos' fueron actualizadas.");
    } catch (error) {
        console.error("Error al sincronizar con Google Sheets:", error);
        alert("Hubo un error al intentar sincronizar: " + error.toString());
    }
}

// ============================================================================
// NAVEGACIÓN Y TABS
// ============================================================================
function switchTab(tabName) {
    document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
    document.querySelectorAll(".tab-btn").forEach(el => {
        el.classList.remove("active-tab");
        el.classList.add("text-slate-500");
    });

    const activeSec = document.getElementById(`sec-${tabName}`);
    if (activeSec) activeSec.classList.remove("hidden");

    const activeBtn = document.getElementById(`tab-${tabName}`);
    if (activeBtn) {
        activeBtn.classList.add("active-tab");
        activeBtn.classList.remove("text-slate-500");
    }

    if (tabName === 'appointments') renderAppointmentsSection();
    if (tabName === 'finances') renderExpensesSection();
    if (tabName === 'vet') loadVetForm();
}

// ============================================================================
// RENDERIZADO Y MASCOTAS
// ============================================================================
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
    if (!list) return;

    const petAppointments = state.appointments.filter(a => a.petId === pet.id);

    if (petAppointments.length === 0) {
        list.innerHTML = `<p class="text-xs text-slate-400 italic py-2">No hay citas agendadas.</p>`;
    } else {
        list.innerHTML = petAppointments.map(a => `
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div class="flex items-center space-x-3">
                    <span class="p-2 bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold">${a.type}</span>
                    <div>
                        <h4 class="font-bold text-sm text-slate-800">${a.title}</h4>
                        <p class="text-xs text-slate-500"><i class="fa-regular fa-calendar mr-1"></i>${a.date} - ${a.time} hs</p>
                    </div>
                </div>
                <button onclick="downloadICS('${a.title}', '${a.date}', '${a.time}')" class="text-xs bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded text-slate-700">
                    <i class="fa-solid fa-download mr-1"></i>.ics
                </button>
            </div>
        `).join("");
    }
}

function renderAppointmentsSection() {
    const list = document.getElementById("fullAppointmentsList");
    if (!list) return;

    list.innerHTML = state.appointments.map(a => {
        const pet = state.pets.find(p => p.id === a.petId);
        return `
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div class="flex justify-between items-center">
                    <span class="text-xs font-bold px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full">${a.type}</span>
                    <span class="text-xs text-slate-400">Mascota: ${pet ? pet.name : 'N/A'}</span>
                </div>
                <h4 class="font-bold text-base text-slate-800">${a.title}</h4>
                <p class="text-xs text-slate-600"><i class="fa-regular fa-clock mr-1"></i>${a.date} a las ${a.time} hs</p>
                <p class="text-xs font-bold text-emerald-600">Costo: $${a.cost}</p>
            </div>
        `;
    }).join("");
}

function renderExpensesSection() {
    const list = document.getElementById("expensesList");
    if (!list) return;

    list.innerHTML = state.expenses.map(e => {
        const pet = state.pets.find(p => p.id === e.petId);
        return `
            <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                    <h4 class="font-bold text-sm text-slate-800">${e.concept}</h4>
                    <span class="text-xs text-slate-400">${e.category} • ${pet ? pet.name : 'N/A'} • ${e.date}</span>
                </div>
                <span class="font-bold text-slate-800">$${e.amount}</span>
            </div>
        `;
    }).join("");
}

// ============================================================================
// DATOS VETERINARIOS
// ============================================================================
function loadVetForm() {
    const pet = getActivePet();
    const vet = pet.vet || {};
    document.getElementById("vetClinicName").value = vet.clinic || "";
    document.getElementById("vetDoctorName").value = vet.doctor || "";
    document.getElementById("vetPhone").value = vet.phone || "";
    document.getElementById("vetEmergencyPhone").value = vet.emergency || "";
    document.getElementById("vetAddress").value = vet.address || "";
}

function saveVetInfo(e) {
    e.preventDefault();
    const pet = getActivePet();
    pet.vet = {
        clinic: document.getElementById("vetClinicName").value,
        doctor: document.getElementById("vetDoctorName").value,
        phone: document.getElementById("vetPhone").value,
        emergency: document.getElementById("vetEmergencyPhone").value,
        address: document.getElementById("vetAddress").value
    };
    saveLocalData();
    alert("¡Datos veterinarios guardados con éxito!");
}

// ============================================================================
// UTILIDADES (EXPORTAR ICS Y CÓDIGO QR)
// ============================================================================
function downloadICS(title, date, time) {
    const start = new Date(`${date}T${time}:00`).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const icsData = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title}\nDTSTART:${start}\nDESCRIPTION:Recordatorio de Pet Care Hub\nEND:VEVENT\nEND:VCALENDAR`;
    
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
    if (!qrContainer) return;
    
    qrContainer.innerHTML = "";
    const info = `Mascota: ${pet.name}\nEspecie: ${pet.species}\nRaza: ${pet.breed}\nUrgencia Vet: ${pet.vet?.emergency || 'N/A'}`;
    new QRCode(qrContainer, { text: info, width: 128, height: 128 });
    
    const modal = document.getElementById("qrModal");
    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}

// ============================================================================
// GRÁFICOS (CHART.JS)
// ============================================================================
function initCharts() {
    const ctxWeight = document.getElementById("weightChart")?.getContext("2d");
    if (ctxWeight) {
        new Chart(ctxWeight, {
            type: "line",
            data: {
                labels: ["Ene", "Mar", "May", "Jul", "Sep", "Oct"],
                datasets: [{
                    label: "Peso (kg)",
                    data: [26.0, 26.8, 27.2, 27.9, 28.1, 28.5],
                    borderColor: "#6366f1",
                    tension: 0.3,
                    fill: false
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    const ctxExpenses = document.getElementById("expensesChart")?.getContext("2d");
    if (ctxExpenses) {
        new Chart(ctxExpenses, {
            type: "doughnut",
            data: {
                labels: ["Comida", "Medicina", "Juguetes"],
                datasets: [{
                    data: [45000, 8500, 22000],
                    backgroundColor: ["#10b981", "#ef4444", "#f59e0b"]
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}