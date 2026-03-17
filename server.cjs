// server.js
// Appointment scheduling server
// Uses Node.js http module only (no frameworks)
// Sequential POST handling: parameters are passed in the URL query string
"use strict";


const http = require("http");
// const url = require("url");
const fs = require("fs");


const DATA_FILE = "appointments.json";
let appointments = [];

function loadAppointments() {
    // TODO list: decide what should happen if the file does not exist.
    // TODO list: decide what should happen if the JSON is invalid.
    // TODO list: decide whether to log errors to the console or stay silent.
    try {
        const text = fs.readFileSync(DATA_FILE, "utf8");
        appointments = JSON.parse(text);
        if (!Array.isArray(appointments)) {
            appointments = [];
        return {ok: true };
        }
    } catch (error) {
        // Logging errors to console for now
        console.log("ERROR loading appts");
        appointments = [];
        return {ok: false, message: "Error loading appointments"};
    }
    
}

function saveAppointments() {
    // TODO list: decide how you want the JSON formatted (pretty vs compact).
    try {
        const text = JSON.stringify(appointments, null, 2);
            fs.writeFileSync(DATA_FILE, text, "utf8");
            return {ok: true};
    } catch (error) {
        return {ok: false, message: "Could not save appointment"};

    }
}
 

function sendJson(response, statusCode, data) {

    response.writeHead(statusCode, { "Content-Type": "application/json" });
    response.end(JSON.stringify(data));

}


function sendText(response, statusCode, message) {
    response.writeHead(statusCode, {"Content-Type": "text/plain"});
    response.end(message);
}

loadAppointments();



function serveHtml(res, filePath) {
    fs.readFile(filePath, function (err, content) {
        if (err) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Server error");
            return;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(content);
    });
}



/* what i don't like about this is that if you start deleting timeslots, there's
a chance the id numbers get corrupted */
/*function nextId() {

    return slots.length + 1;

}
*/

/*
function validateSlotStatus(myName, myStatus) {
    if (myStatus === 'Booked' && myName == '' ) {
        return false; //{ok: false, message: "A booked appointment must have a student name"};
    } else {
        return true; //{ok: true, message: "" };
    }
}
*/


function validateSlotTimes(startTime, endTime) {
    
    if (typeof startTime !== "string" || startTime.trim().length === 0) {
        return { ok: false, message: "startTime is required" };
    }

    if (typeof endTime !== "string" || endTime.trim().length === 0) {
        return { ok: false, message: "endTime is required" };
    }
    // (bonus): verify endTime is after startTime
    if (endTime <= startTime) {
        return {ok: false, message: "startTime must be before endTime"}
    }

    // Check for duplicate - tried this here, and is added to the server, further down
    //const duplicate = isDuplicate(startTime, endTime);
    //if (duplicate === true)  {
    //    return {ok: false, message: "The time slot entered is a duplicate"}
    //    }
    return { ok: true, message: "" };
}


function isDuplicate(startTime, endTime) {
   // return true if a slot with the same times already exists return false;
    for (const s in appointments) {
        if (appointments[s].startTime === startTime && appointments[s].endTime === endTime) {
            console.log ('>>> Dupe found')
            return true;
        }
    }
    // Entered time is not duplicate
    return false;
}

// Check time overlap
function isOverlap(reqStartTime, reqEndTime) {
    // return true if timeslot overlaps any other timeslot
    for (const s in appointments) {
        // Scenario: overlap where new timeslot overlaps beginning of another
        if ((appointments[s].startTime < reqEndTime) && (appointments[s].endTime > reqStartTime)) {
            console.log("Requested timeslot overlaps on existing timeslot");
            return true;
        }
    }
    // else return false, no overlap found
    return false;
}

// Check time isn't duplicate
function isZeroDuration(reqStartTime, reqEndTime) {
    // return true if timeslot overlaps any other timeslot
    // Scenario: overlap where new timeslot overlaps beginning of another
    if (reqStartTime === reqEndTime) {
        console.log("Appointments must be at least 1 minute long");
        return true;
    }
    // else return false, no overlap found
    return false;
}

function validateAppt(startTime, endTime) {
    const result = validateSlotTimes(startTime, endTime);

    if (!result.ok) {
        //return {res, 400, { error: result.message });
        return {ok: false, message: result.message };
    }
    if (isDuplicate(startTime, endTime))
        return { ok: false, message: "This is a duplicate slot"
    };
    if (isOverlap(startTime, endTime)) 
        return { ok: false, message: "Timeslot overlaps another"
    };
    if (isZeroDuration(startTime, endTime))
        return { ok: false, message: "Appointments must be at least 1 minute long"
    };
    //if (!validateSlotStatus(myName, myStatus))
    //    return {ok: false, message: "Booked appointments must have a student name"
    //}

    return {ok: true};
}

const server = http.createServer(function (req, res) {
    
    const parsedUrl = new URL(req.url, "http://localhost:3000");
    const path = parsedUrl.pathname;
    const query = Object.fromEntries(parsedUrl.searchParams.entries());

    let filePath = "./public/index.html";

    if (req.url === "/index") { filePath = "./public/index.html"; }
    if (req.url === "/provider") { filePath = "./public/provider.html"; }
    if (req.url === "/client") { filePath = "./public/client.html"; }
    
   /*if (req.method === "GET" && path === "/api/slots") {
    // check if query.id is provided
    if (query.id) {
        const slotId = parseInt(query.id, 10);
        const slot = slots.find(s => s.id === slotId);
        if (!slot) {
            sendJson(res, 404, { error: "Slot not found" });
            return;
        }
        sendJson(res, 200, slot);
        return;
    }

    // if no id, return all slots
    sendJson(res, 200, slots);
    return;
}
    */

            // Serve stylesheet
    if (req.url === "/style.css") {
        fs.readFile("./public/style.css", function(err, content) {
            if (err) {
                res.writeHead(500);
                res.end("File not found");
                return;
            }
            res.writeHead(200, { "Content-Type": "text/css" });
            res.end(content);
        });
        return;
    }

    // Serve  utils
    if (req.url === "/utils.js") {
        fs.readFile("./public/utils.js", function(err, content) {
            if (err) {
                res.writeHead(500);
                res.end("File not found");
                return;
            }
            res.writeHead(200, { "Content-Type": "application/javascript" });
            res.end(content);
        });
        return;
    }

    // serve provider.js
    if (path === "/provider.js") {
    fs.readFile("./public/provider.js", function(err, content) {
        if (err) {
            res.writeHead(404);
            res.end("File not found");
            return;
        }
        res.writeHead(200, { "Content-Type": "application/javascript" });
        res.end(content);
    });
    return;
}

    if (path === "/provider") {
        serveHtml(res, "./public/provider.html");
        console.log("provider served up")
        return;
    }

    if (path === "/client") {
        serveHtml(res, "./public/client.html");
        return;
    }

    // Serve up index.html for / or /index
    if (path === "/" || path === "/index") {
        serveHtml(res, "./public/index.html");
        return;
    }

    if (req.method === "GET" && parsedUrl.pathname === "/appointments") {
        sendJson(res, 200, appointments);
    }
    else if (req.method === "POST" && parsedUrl.pathname === "/appointments") {
        // NOTE: reading the request body is event driven, but your file operations are synchronous.
        let body = "";
        
        req.on("data", function(chunk) {
            body += chunk;
        });

        req.on("end", function() {
            try {
                const newAppointment = JSON.parse(body);
                newAppointment.id = Date.now(); // TODO use another number?
                const validation = validateAppt(newAppointment.startTime, newAppointment.endTime);
                if (!validation.ok) {
                    res.writeHead(400, {"Content-Type": "application/json"});
                    res.end(JSON.stringify({ error: validation.message }));
                    return;
                }
                appointments.push(newAppointment);
                saveAppointments();
                // 
                res.writeHead(201, {"Content-Type": "application/json"});
                res.end(JSON.stringify(newAppointment));
            } catch(err) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Invalid JSON" }));
            }
        });
    }
    else if (req.method === "DELETE") {
        deleteAppointment(req, res, parsedUrl);
        console.log('deleting with del function');
        return;
    } else if (req.method === "PUT" && parsedUrl.pathname.startsWith("/appointments/")) {
        console.log('calling updateAppointmentFull');
        updateAppointmentFull(req, res, parsedUrl);
        return;
        
    } else if (req.method === "PATCH" && parsedUrl.pathname.startsWith("/appointments/")) {
        console.log('calling updateAppointmentPartial');
        updateAppointmentPartial(req, res, parsedUrl);
        return;
    }
});

function updateAppointmentPartial(req, res, parsedUrl) {
    console.log('in updateapptpartial');
    const parts = parsedUrl.pathname.split("/");
    const id = Number(parts[2]);
    let body = "";
    
    req.on("data", chunk => {
        body += chunk;
    });
    
    req.on("end", () => {

        try {
            const updates = JSON.parse(body);
            // TODO: locate the appointment by id
            const index = appointments.findIndex(a => a.id === id);

            if (index !== -1) {

                // TODO: merge provided fields
                appointments[index] = {
                    ...appointments[index],
                    ...updates
                };

                // TODO: validate the result

                // TODO: save to appointments.json
                saveAppointments();

                console.log("Patched appointment:", appointments[index]);

                sendJson(res, 200, appointments[index]);

            } else {
                sendJson(res, 404, { error: "Appointment not found" });
            }

        } catch (err) {
            sendJson(res, 400, { error: "Invalid JSON" });
        }

    });
}




function updateAppointmentFull(req, res, parsedUrl) {
    // PUT /appointments/:id
    console.log('in updateapptfull');
    const parts = parsedUrl.pathname.split("/");
        const id = Number(parts[2]);
        let body = "";
        req.on("data", chunk => {
            body += chunk;
        });
        req.on("end", () => {
            try {
                const updated = JSON.parse(body);
                const index = appointments.findIndex(a => a.id === id);
                if (index !== -1) {
                    appointments[index] = updated;
                    saveAppointments();
                    console.log("Updated appointment:", updated);
                    sendJson(res, 200, updated);

                } else {
                    sendJson(res, 404, { error: "Appointment not found" });
                }

            } catch (err) {
                sendJson(res, 400, { error: "Invalid JSON" });
            }

        });
    
    
    
    
    // TODO: locate the appointment by id
    const index = appointments.findIndex(a => a.id === id);
    
    // TODO: validate appointment object
    // TODO: replace the object
    
    // TODO: save to appointments.json
    saveAppointments();  
}

function deleteAppointment(req, res, parsedUrl) {
    if (req.method === "DELETE" && parsedUrl.pathname.startsWith("/appointments/")) {
        // get id from url
        const parts = parsedUrl.pathname.split("/");
        const id = Number(parts[2]);
        console.log("ID from URL:", id);
        if (Number.isNaN(id)) {
            sendJson(res, 400, { error: "Invalid appointment id" });
            return;
        }
        // get appointment from id
        const index = appointments.findIndex(a => a.id === id);
        if (index !== -1) {
            const deleted = appointments.splice(index, 1)[0];
            saveAppointments();
            console.log("Deleted appointment in appts.JSON:", deleted);
            sendJson(res, 200, deleted);

        } else {
            console.log("Appointment not found");
            sendJson(res, 404, { error: "Appointment not found" });
        }
    }
}


server.listen(3000);
console.log("Server running on 3000");
