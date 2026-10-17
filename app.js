// ============================================================================
// CONFIGURACIÓN DE SUPABASE
// Reemplaza con los valores de tu panel en Supabase (Project Settings > API)
// ============================================================================
const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'TU_CLAVE_ANON_PUBLICA';

// Inicialización del cliente Supabase (descomentar cuando ingreses las claves)
// const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================================
// ESTADO LOCAL Y DATOS DEMO
// ============================================================================
let state = {
    activePetId: "pet-1",
    pets: [
        {
            id: "pet-1",
            name: "Max",
            species: "Dog",
            breed: "Golden Retriever",
            age: "3 años",
            weight: 28.5,
            chip: "981020000123456",
            photo: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400",
            vet: {
                clinic: "Veterinaria Central",
                doctor: "Dra. Valeria Gómez",
                phone: "+541144332211",
                emergency: "+541199887766",
                address: "Av. Cabildo 2400, CABA"
            }
        }
    ],
    appointments: [
        { id: "a1", petId: "pet-1", title: "Corte de pelo y Baño", type: "Grooming", date: "2026-10-25", time: "15:00", cost: 12000 },
        { id: "a2", petId: "pet-1", title: "Control Anual y Vacuna", type: "Vet", date: "2026-11-02", time: "10:30", cost: 18000 }
    ],
    expenses: [
        { id: "e1", petId: "pet-1", concept: "Alimento Balanceado 15kg", category: "Food", amount: 45000, date: "2026-10-01" },
        { id: "e2", petId: "pet-1", concept: "Pipeta Antipulgas", category: "Medicine", amount: 8500, date: "2026-10-05" }
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
});

// Guardar/Cargar en LocalStorage (Sincronizable con Supabase)
function saveLocalData() {
    localStorage.setItem("petcare_data", JSON.stringify(state));
}

function loadLocalData() {
    const saved = localStorage.getItem("petcare_data");
    if (saved) state = JSON.parse(saved);
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

    document.getElementById(`sec-${tabName}`).classList.remove("hidden");
    const activeBtn = document.getElementById(`tab-${tabName}`);
    activeBtn.classList.add("active-tab");
    activeBtn.classList.remove("text-slate-500");

    if (tabName === 'health') renderHealthSection();
    if (tabName === 'appointments') renderAppointmentsSection();
    if (tabName === 'finances') renderExpensesSection();
    if (tabName === 'vet') loadVetForm();
}

// ============================================================================
// RENDERIZADO GENERAL Y MASCOTAS
// ============================================================================
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

    // Próximas Citas
    const list = document.getElementById("dashboardAppointmentsList");
    const petAppointments = state.appointments.filter(a => a.petId === pet.id);
    
    if (petAppointments.length === 0) {
        list.innerHTML = `<p class="text-xs text-slate-400 italic py-2">No hay citas pendientes agendadas.</p>`;
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

// ============================================================================
// VETERINARIA DE CABECERA
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
    alert("¡Datos veterinarios guardados exitosamente!");
}

// ============================================================================
// EXPORTACIÓN A CALENDARIO (.ICS)
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

// ============================================================================
// DNI / QR CODE
// ============================================================================
function showQRCode() {
    const pet = getActivePet();
    const qrContainer = document.getElementById("qrcode");
    qrContainer.innerHTML = "";
    
    const info = `Mascota: ${pet.name}\nDueño: Contacto registrado\nUrgencia Vet: ${pet.vet?.emergency || 'Sin registrar'}`;
    new QRCode(qrContainer, { text: info, width: 128, height: 128 });

    document.getElementById("qrModal").classList.remove("hidden");
    document.getElementById("qrModal").classList.add("flex");
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add("hidden");
    document.getElementById(modalId).classList.remove("flex");
}

// ============================================================================
// GRÁFICOS (CHART.JS)
// ============================================================================
function initCharts() {
    // Gráfico de Peso
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

    // Gráfico de Gastos
    const ctxExpenses = document.getElementById("expensesChart")?.getContext("2d");
    if (ctxExpenses) {
        new Chart(ctxExpenses, {
            type: "doughnut",
            data: {
                labels: ["Comida", "Medicina", "Estética", "Veterinaria"],
                datasets: [{
                    data: [45000, 8500, 12000, 18000],
                    backgroundColor: ["#10b981", "#ef4444", "#f59e0b", "#6366f1"]
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}