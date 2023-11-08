//* Hostsmanager 2.0 using Neutralino *//
const N = Neutralino;
let Notify_About_Tray = true;
const Links = document.querySelectorAll("li[data-link]")

import { frontend } from "./modules/frontend.js";
import { backend } from "./modules/backend.js";
import { wm } from "./modules/window.js";

async function start() {
    N.init();
    // Backend Setup (sync)
    await backend.checkHostsFilePermission(N)
        .catch(async (errMsg)=>{
            await N.os.showMessageBox("Error",errMsg + "\n\n Attempting to fix the hosts file now. You will need to provide your Administrative Password for this.");
            await backend.fixHostsFilePermission();
        })
    let sites = await backend.readHostsFile(N);
    sites = backend.hostsStringToObj(sites);
    await setSitesPromise(sites).catch((err)=>console.error(err));
    // Backend Setup (async);
    backend.setTray(N);
    generateProfiles();
    // Frontend Setup
    frontend.setLinks();
    frontend.changePage('profiles-list');
    // Set Page Triggers
    document.getElementById("profileForm").addEventListener("submit", formHandler);
    // Set Events
    N.events.on("trayMenuItemClicked", onTrayMenuItemClicked);
    N.events.on("windowClose", onWindowClose);
    // Set running alert
    try {
        if(await N.storage.getData("Tray_notify") == "false") {
            Notify_About_Tray = false;
        } else {
            Notify_About_Tray = true;
            backend.fixHostsFilePermission();
        }
    } catch {
        Notify_About_Tray = true;
    }
    N.window.show();
}
// Data Functions
function getSitesPromise() {
    return new Promise((res) => {
        N.storage.getData("sites")
        .then((sites)=> {
            res(JSON.parse(sites));
        })
        .catch((err)=>{
            res([]);
        })
    })
}
function setSitesPromise(sites) {
    return new Promise((res,rej)=> {
        console.log(1)
        N.storage.setData("sites", JSON.stringify(sites))
        .then(async()=>{
            try {
                let test = JSON.parse(await N.storage.getData("sites"))
                if(JSON.stringify(test) == JSON.stringify(sites)) res(true);
                else rej("There was an error saving the sites to the local database. Please reach out to cmkrist with this message.")
            } catch {
                console.log("A");
                rej("There was an error parsing the JSON in your storage data after saving, Please reach out to cmkrist with this message.")
            }
        }).catch(async (err)=>{
            console.error(err);
        })
    })
}
// Window Management
async function onTrayMenuItemClicked(event) {
    switch(event.detail.id) {
        case "GUI":
            N.window.show();
            break;
        case "VERSION":
            Neutralino.os.showMessageBox("Version information",
                `Neutralinojs server: v${NL_VERSION} | Neutralinojs client: v${NL_CVERSION}`);
            break;
        case "FIXETC":
            await backend.fixHostsFilePermission();
            break;
        case "QUIT":
            Neutralino.app.exit(0);
            break;
    }
}
async function onWindowClose() {
    await N.window.hide();
    if(Notify_About_Tray) {
        N.os.showMessageBox("Hostsmanager is still running","Hostsmanager is still running in the background. You can access it from the tray icon.");
        Notify_About_Tray = false;
        await N.storage.setData("Tray_notify", "false");
    }
}
const formHandler = (e) => {
    e.preventDefault();
    const fqdn = document.getElementById('fqdn').value;
    const ip = document.getElementById('ip').value;
    const nickname = document.getElementById('nickname').value || fqdn;
    const update = document.getElementById('updateExisting').checked;
    const profile = {
        fqdn,
        ip,
        nickname
    };
    if (update) {
        const response = confirm(`Are you sure you want to update ${nickname} (${fqdn})?`);
        if (response) {
            updateProfile(profile);
        }
        else {
            return;
        }
    } else {
        addProfile(profile);
    }
    document.querySelector("#profileForm").reset();
    pageChange('profiles-list');
}

const addProfile = async (profile) => {
    console.log(profile);
    let sites = await getSitesPromise();
    console.log(sites);
    sites.push(profile);
    setSitesPromise(sites)
    .then(()=>{
        console.log("Sites Saved");
        generateProfiles();
    }).catch((err)=>{
        console.err(err);
    })

}
const updateProfile = (profile) => {
    Neutralino.storage.getData("sites", (data) => {
        let sites = JSON.parse(data);
        let index = sites.findIndex(site => site.fqdn === profile.fqdn);
        sites[index] = profile;
        Neutralino.storage.setData("sites", JSON.stringify(sites));
    }).catch(() => {
        Neutralino.os.showMessageBox("Error: Sites does not exist", "The site you are trying to update does not exist. You may need to re-add it.");
    });
}

const generateProfiles = async () => {
    console.log("Generating Profiles");
    let sites = await getSitesPromise();
    let table = document.querySelector("#profileTable tbody");
    // Clear out all rows in current table
    while (table.firstChild) {
        table.removeChild(table.firstChild);
    }
    console.log(sites);
    for (let i in sites) {
        console.log(sites[i])
        // Push each site to the table
        let row = document.createElement("tr");
        let name = document.createElement("td");
        let ip = document.createElement("td");
        let fqdn = document.createElement("td");
        let actions = document.createElement("td");
        let edit = document.createElement("button");
        let del = document.createElement("button");
        edit.classList.add("btn", "btn-primary", "btn-sm");
        del.classList.add("btn", "btn-danger", "btn-sm");
        edit.innerHTML = "Edit";
        del.innerHTML = "Delete";
        edit.addEventListener("click", () => {
            document.getElementById("fqdn").value = sites[i].fqdn;
            document.getElementById("ip").value = sites[i].ip;
            document.getElementById("nickname").value = sites[i].nickname;
            document.getElementById("updateExisting").checked = true;
            pageChange("add");
        });
        del.addEventListener("click", () => {
            let response = confirm(`Are you sure you want to delete ${sites[i].nickname} (${sites[i].fqdn})?`);
            if(response) {
                sites.splice(i, 1);
                Neutralino.storage.setData("sites", JSON.stringify(sites));
                generateProfiles();
            }
        });
        name.innerHTML = sites[i].nickname;
        ip.innerHTML = sites[i].ip;
        fqdn.innerHTML = sites[i].fqdn;
        actions.appendChild(edit);
        actions.appendChild(del);
        row.appendChild(fqdn);
        row.appendChild(ip);
        row.appendChild(name);
        row.appendChild(actions);
        table.appendChild(row);
    };
    
}

start();