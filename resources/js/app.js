const N = Neutralino;
import { frontend } from "./modules/frontend.js";
import { backend } from "./modules/backend.js";
// NL_OS : ["Windows", "Darwin", "Linux"] -> String
const Global = {
    sites: new Array(),
    showTrayNotification: true,
    OS: NL_OS,
    HostsFileLocation: (NL_OS == "Windows" ? "C:\\Windows\\System32\\drivers\\etc\\hosts" : "/etc/hosts"),
}
Global.sites.push()
function setEventHandlers() {
    // Top Icon Navigation
    document.querySelector("#AddItem").addEventListener("click",()=>{
        frontend.openOverlay();
    })
    document.querySelector("#SaveButton").addEventListener("click",()=>{
        backend.writeHostsFile(N,Global.sites)
        .then(()=>{
            N.os.showMessageBox("Success!","Your hosts file was modified successfully.");
        }).catch((err)=>{
            N.os.showMessageBox("Error!","Something broke...");
        })
    });

    // Overlay Buttons
    document.getElementById("AddEntry").addEventListener("click",async ()=>{
        console.log("OK");
        // Check the IP and hosts inputs have values
        const address = document.querySelector('input[name="address"]').value
        const hosts = document.querySelector('input[name="hosts"]').value
        const comments = document.querySelector('input[name="comments"]').value
        if(address.length < 1 || hosts.length < 1) {
            await N.os.showMessageBox("Error","You must have an IP and Host to add an entry to the Hosts File.")
            return;
        }
        addSite({
            address,
            hosts,
            comments
        }, Global)
        frontend.resetForm();
    })
    document.getElementById("CancelEntry").addEventListener("click",()=>{
        frontend.closeOverlay();
    })

}
const addSite = (s) => {
    Global.sites.push(s);
    frontend.refreshSites(Global.sites);
}
const deleteSite = (s) => {
    
}
const editSite = (s) => {

}
const appSetup = async () => {
    await N.init();
    const os = await N.os.getOs();
    if (os === "Windows") {
        const isAdmin = await N.os.isAdmin();
        if (!isAdmin) {
            await N.app.runAsAdmin();
            return;
        }
    }
    await backend.checkHostsFilePermission(N)
        .catch(async (errMsg) => {
            await N.os.showMessageBox("Error", errMsg + "\n\n Attempting to fix the hosts file now. You will need to provide your Administrative Password for this.");
            await backend.fixHostsFilePermission(N);
        });
};
const Setup = async () => {
    // 1. Check OS, run as admin if Windows
    if(NL_OS == "Windows") {
        // Try to modify hosts file
        // If fail, show error and exit
        // If success, continue

    }
    // 2. Check Hosts File Permissions
    // 3. Load Hosts File
    // 4. Load Settings File
    // 5. Load UI
    // 6. Set Event Handlers
    // 7. Set Tray



}  


const init = async () => {
    await N.init();
    const canEditHostsFile = await backend.checkHostsFilePermission(N, Global.HostsFileLocation);
    if (canEditHostsFile) {
        // User has permission to edit the hosts file
        // Continue with the rest of the initialization logic
    } else {
        // User does not have permission to edit the hosts file
        // Display an error message or handle it accordingly
    }
};
init();