//* Hostsmanager 2.0 using Neutralino *//
const N = Neutralino;
const Options = {
    debug: false,
    isAdmin: false,
    Notify_About_Tray: true
}
let {debug, isAdmin, Notify_About_Tray} = Options;
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
            await backend.fixEtcFile();
        })
    // Backend Setup (async);
    backend.setTray(N);
    // Frontend Setup
    frontend.setLinks();
    // Show Screen
    let sites = await backend.readHostsFile(N);
    sites = backend.hostsStringToArray(sites);
    await N.os.showMessageBox("Success!",JSON.stringify(sites));
    console.log(sites);
    await setSitesPromise(sites).catch((err)=>console.error(err));
    console.log("Sites Saved");
    // Set Page Triggers
    document.getElementById("profileForm").addEventListener("submit", formHandler);
    // Set Events
    N.events.on("trayMenuItemClicked", onTrayMenuItemClicked);
    N.events.on("windowClose", onWindowClose);
    // Set Page
    frontend.changePage('profiles-list');
    // Generate Sites
    generateProfiles();
    // Set running alert
    try {
        if(await N.storage.getData("Tray_notify") == "false") {
            Notify_About_Tray = false;
        } else {
            Notify_About_Tray = true;
            fixEtcFile();
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
            await fixEtcFile();
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
const setTray = async () => {
    let tray = {
        icon: "/resources/icons/trayIcon.png",
        menuItems: [
            {id: "GUI", text: "Show GUI"},
            {id: "SEP", text: "-"},
            {id: "VERSION", text: "Get version"},
            {id: "FIXETC", text: "Fix /etc/hosts"},
            {id: "SEP", text: "-"},
        ]
    };
    tray.menuItems.push({id: "QUIT", text: "Quit"});
    N.os.setTray(tray);
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
    for(i in sites) {
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
    }
    
}
function runCommand(cmd) {
    return new Promise((res,rej)=>{
        N.os.execCommand(cmd)
        .then(data=>{
            res(data);
        })
        .catch(err=>{
            handleError(err)
            rej(err);
        })
    })
}
async function updateHostsFileOLD() {
    let sites = await getSitesPromise();
    console.log(sites);
    // Generate hosts file line by line
    let sites_file = ""
    sites.forEach((site)=>{
        sites_file += site.ip + "\t" + site.fqdn + "\n"
    })
    console.log(sites_file);
    N.filesystem.writeFile("./hosts",sites_file)
    .then(async (data)=>{
        console.log(data);
        if(debug) await N.os.showMessageBox("Success!","Your debug hosts file was created");
        else {
            N.os.execCommand("mv ./hosts /etc/hosts")
            .then((data)=>{
                console.log("Success");
                console.log(data);
            }).catch((err)=>{
                console.log("Error");
                console.log(err);
            })
        }
    }).catch((err)=>{
        console.log(err);
    })
}
async function updateHostsFile() {
    let sites = await getSitesPromise();
    // Generate file line by line
    let sites_file = ""
    sites.forEach((site)=>{
        sites_file += site.ip + "\t" + site.fqdn + "\n"
    })
    console.log(sites_file);
    N.filesystem.writeFile("./hosts",sites_file)
    .then(async (data)=>{
        console.log(data);
        await N.os.showMessageBox("Success!","Your debug hosts file was created");
        N.os.execCommand(`echo "${sites_file}" > /etc/hosts`)
        .then((data)=>{
            console.log("Success");
            console.log(data);
        }).catch((err)=>{
            console.log("Error");
            console.log(err);
        }).finally(()=>{
            N.os.showMessageBox("Success!","Your hosts file was updated");
        })
    }).catch((err)=>{
        cconsole.log(err);
    })

}

function generateInitialSites() {
    return new Promise((res, rej)=>{
        N.filesystem.readFile("/etc/hosts")
        .then((data)=>{
            console.log(data);
            let rows = data.split("\n");
            let sites = [];
            rows.forEach(row => {
                if(row[0] == "#") return;
                let site = row.split("\t");
                if(site.length < 2) return;
                sites.push({
                    ip: site[0],
                    fqdn: site[1],
                    nickname: site[2]? site[2] : site[1]
                })
            })
            res(sites);
        })
        .catch((data)=>{
            console.log(data);
            rej(data);
        })
    })    
}

start();