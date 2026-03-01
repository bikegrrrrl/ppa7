// public/provider.js
// Provider calendar UI for PPA 5
// GET and POST only


const now = new Date();
let currentMonth = now.getMonth() + 1;
let currentYear = now.getFullYear();


// Run once when the page loads
refreshCalendar();


// Highlight today functionality
// Puts blue square around current date on calendar
function highlightToday() {
  const today = new Date();
  
  // Format as YYYY-MM-DD
  const formattedToday = today.toISOString().split("T")[0];

  const allDays = document.querySelectorAll(".dayCell");

  allDays.forEach(day => {
    if (day.dataset.date === formattedToday) {
      day.classList.add("today");
    }
  });
}


// Show a user facing message
/* function showMessage(text, kind) {
    const el = document.getElementById("message");
    el.textContent = text;
    el.className = kind;
}
*/

let messageTimeout = null;

function showMessage(text, kind) {
    const el = document.getElementById("message");

    // Clear any previous timeout
    if (messageTimeout) {
        clearTimeout(messageTimeout);
        messageTimeout = null;
    }

    el.textContent = text;
    el.className = kind + " show"; // add show class to fade in

    // After 15 seconds, fade out
    messageTimeout = setTimeout(function () {
        el.classList.remove("show");

        // After fade completes, clear text
        setTimeout(function () {
            el.textContent = "";
            el.className = "";
        }, 800); // matches CSS transition duration
    }, 15000); // 15 seconds
}


// GET all slots then re render the month view
function refreshCalendar() {

    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/appointments");
    //xhr.open("GET", "/api/slots");

    xhr.onload = function () {
        if (xhr.status === 200) {
            const rawSlots = JSON.parse(xhr.responseText);
            renderCalendar(rawSlots);

        } else {

            showMessage("GET failed " + String(xhr.status), "error");

        }
    };

    xhr.send();
}


// Render the month grid, then insert slot items into each day cell
function renderCalendar(rawSlots) {

    setMonthTitle(currentMonth, currentYear);

    const grid = document.getElementById("calendarGrid");
    grid.innerHTML = "";

    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const startWeekday = firstDay.getDay();  // 0 Sunday to 6 Saturday
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    for (let i = 0; i < 42; i += 1) {
        const dayNumber = i - startWeekday + 1;

        const cell = document.createElement("div");
        cell.className = "dayCell";

        if (dayNumber >= 1 && dayNumber <= daysInMonth) {

            // Get the date into each cell to pick up and highlight today
            if (dayNumber >= 1 && dayNumber <= daysInMonth) {

                const fullDate = new Date(currentYear, currentMonth - 1, dayNumber);

                const year = fullDate.getFullYear();
                const month = String(fullDate.getMonth() + 1).padStart(2, "0");
                const day = String(fullDate.getDate()).padStart(2, "0");

                const formattedDate = `${year}-${month}-${day}`;

                cell.dataset.date = formattedDate;
            };


            //Day label at the top of the cell
            const label = document.createElement("div");
            label.className = "dayNumber";
            label.textContent = String(dayNumber);
            cell.appendChild(label);

            // Insert all matching slots for this day
            for (let j = 0; j < rawSlots.length; j += 1) {
                const slot = rawSlots[j];

                const slotDate = new Date(slot.startTime);
                //Extract yyyy-mm-dd and compare the day number AND THE MONTH
                const datePart = slot.startTime.split("T")[0];
                //const slotDay = Number(datePart.split("-")[2]);
                const slotDay = slotDate.getDate();
                const slotMonth = slotDate.getMonth() + 1; 

                if (slotDay === dayNumber &&
                    slotMonth === currentMonth
                ) {
                    //const item = document.createElement("div");
                    //item.className = "slotItem";
                    const item = document.createElement("div");

                    // Base class
                    item.classList.add("slotItem");

                    // Add color class based on status
                    if (slot.myStatus === "Booked") {
                        item.classList.add("booked");
                    } else if (slot.myStatus === "Available") {
                        item.classList.add("available");
                    }



                    // inside renderCalendar(), after creating the slot item
                    item.addEventListener("click", function() {
                        openModal(slot); // pass the slot object
                    });

                    // Display just the clock times to keep it 
                    const startClock = slot.startTime.split("T")[1];
                    if (slot.myName === '') {
                        slotName = "[Open]";    
                    } else {
                        slotName = slot.myName;
                    }
                    //const endClock = slot.endTime.split("T")[1];

                    const text = document.createElement("span");
                    text.textContent = startClock + " - " + slotName;

                    item.appendChild(text);
                    cell.appendChild(item);

                }
            }
        } else {
            
            // Cells outside the current month remian empty
            cell.className += " empty";

        }

        grid.appendChild(cell);
    }

   // highlight today
    highlightToday();

}


// Audit time
// Before send, if inputs are empty, send message
function auditTimeInputs(startTime, endTime) {
    if ( startTime == undefined ) {
        console.log('Please enter an appointment start time');
    } else if (endTime == undefined ) {
        console.log ("Please enter an appointment end time");
    } else {
        console.log('both times ok');
    };
}


// Send POST the new timeslot then refresh the calendar on success
function sendCreateSlot(startTime, endTime, myStatus, myName) {

    const xhr = new XMLHttpRequest();

    xhr.open("POST", "/appointments");
    // added for server
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = function () {

        if (xhr.status === 201) {

            showMessage("Slot created", "ok");
            refreshCalendar();

        } else {

            const data = JSON.parse(xhr.responseText || "{}");
            showMessage(data.error || "Create failed", "error");
        }
    };

    // added for JSON.parse(body) in server
    xhr.send(JSON.stringify({
        startTime,
        endTime,
        myStatus,
        myName
    }));

}


// Update the month title header
function setMonthTitle(month, year) {

    const names = [
        "January","February","March","April","May","June",
    "July","August","September","October","November","December"
    ];
    
    document.getElementById("monthTitle").textContent =
        names[month - 1] + " " + String(year);

}


// Button click creates a slot
document.getElementById("createSlotButton").addEventListener("click", function () {

    const startTime = document.getElementById("startTimeInput").value;
    const endTime = document.getElementById("endTimeInput").value;
    const myStatus = document.getElementById("myStatus").value;
    const myName = document.getElementById("myName").value;

    sendCreateSlot(startTime, endTime, myStatus, myName);

});

// Listener to modify the endTime after a startTime is selected
// auto-adds 30 minutes to start time
document.getElementById("startTimeInput").addEventListener("change", function () {

    const startInput = document.getElementById("startTimeInput");
    const endInput = document.getElementById("endTimeInput");

    if (!startInput.value) return;

    const startDate = new Date(startInput.value);

    // Add 30 minutes
    startDate.setMinutes(startDate.getMinutes() + 30);

    // Remove 5 hours - somehow it's in UTC time, this fixes that 
    startDate.setHours(startDate.getHours() - 6);

    // Format correctly for datetime-local
    const formatted = startDate.toISOString().slice(0, 16);

    endInput.value = formatted;

});

// format date for modal
function formatDateTime(isoString) {
    const date = new Date(isoString);
    if (isNaN(date)) return isoString; // fallback if invalid
    // options for friendly formatting
    const options = {
        weekday: "short",   // e.g., "Tue"
        year: "numeric",    // e.g., 2026
        month: "short",     // e.g., "Feb"
        day: "numeric",     // e.g., 28
        hour: "2-digit",
        minute: "2-digit",
        hour12: true        // e.g., 2:30 PM
    };
    return date.toLocaleString(undefined, options);
}

const modal = document.getElementById("appointmentModal");
const modalClose = document.getElementById("modalClose");

function openModal(slot) {
    document.getElementById("modalStartTime").textContent = formatDateTime(slot.startTime);
    document.getElementById("modalEndTime").textContent = formatDateTime(slot.endTime);
    document.getElementById("modalStatus").textContent = slot.myStatus;
    document.getElementById("modalName").textContent = slot.myName;

    modal.style.display = "block";
}

modalClose.addEventListener("click", function() {
    modal.style.display = "none";
});

// Close modal if clicking outside content
window.addEventListener("click", function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});


// Delete button logic
const modalDeleteButton = document.getElementById("modalDeleteButton");

let currentSlot = null; // track which slot is currently open

function openModal(slot) {
    currentSlot = slot; // store for deletion

    document.getElementById("modalStartTime").textContent = formatDateTime(slot.startTime);
    document.getElementById("modalEndTime").textContent = formatDateTime(slot.endTime);
    document.getElementById("modalStatus").textContent = slot.myStatus;
    document.getElementById("modalName").textContent = slot.myName;

    modal.style.display = "block";
}

// Delete the appointment
modalDeleteButton.addEventListener("click", function() {
    if (!currentSlot || !currentSlot.id) {
        showMessage("Error: cannot delete, slot ID missing", "error");
        return;
    }

    const confirmDelete = confirm("Are you sure you want to delete this appointment?");
    if (!confirmDelete) return;

    // Send DELETE request to server
    const xhr = new XMLHttpRequest();
    console.log(currentSlot.id);
    xhr.open("DELETE", `/appointments/${Number(currentSlot.id)}`);
    console.log("after open");
    xhr.onload = function() {
        console.log("status:", xhr.status)
        if (xhr.status === 200) {
            showMessage("Appointment deleted", "ok");
            refreshCalendar();
            modal.style.display = "none";
        } else {
            let data = {};
            try { data = JSON.parse(xhr.responseText); } catch {}
            showMessage(data.error || "Delete failed else", "error");
        }
    };
    xhr.send();
});



