const N = Neutralino;

const HostsFileLocation =
  NL_OS == "Windows"
    ? "C:/Windows/System32/drivers/etc/hosts"
    : "/etc/hosts";

const TestComment = "# Hostsmanager Test Comment";

const Global = {
    Notify_About_Tray: true,
};

const Setup = async () => {
    N.init();
    // Get Sites from Hosts File
    const HostsFile = await N.filesystem.readFile(HostsFileLocation);
    const HostsFileLines = HostsFile.split("\n");
    // Filter Sites based on comments
    const HostsSites = HostsFileLines.filter((line) => {
        if (line.startsWith("#N ")) {
            return line;
        } else if (line.startsWith("#")) {
            return null;
        } else {
            return line;
        }
    });
    console.log(HostsSites);
    // Map Sites to Objects
    const Sites = HostsSites.map((site) => {
        if (site) {
            let active = true;
            if (site.startsWith("#N ")) {
                site = site.replace("#N ", "");
                active = false;
            }
            const siteData = site.split(/\s+/);
            const ip = siteData[0];
            const fqdn = siteData[1];
            const comments = siteData[2] || "";
            if (ip && fqdn) {
                return {
                    ip,
                    fqdn,
                    comments,
                    active,
                };
            }
        }
    });
    Global.Sites = Sites.filter(Boolean);
    // Set Tray
    let tray = {
        icon: "/resources/icons/trayIcon.png",
        menuItems: [
            { id: "GUI", text: "Show GUI" },
            { id: "SEP", text: "-" },
            { id: "VERSION", text: "Get version" },
            { id: "FIXETC", text: "Fix /etc/hosts" },
            { id: "SEP", text: "-" },
        ],
    };
    tray.menuItems.push({ id: "QUIT", text: "Quit" });
    N.os.setTray(tray);
    // Set Links
    document.getElementById("AddBtn").addEventListener("click", () => {OpenOverlay();});
    document.getElementById("SaveBtn").addEventListener("click", () => {SaveHosts();});
    document.getElementById("OpenHostsFileBtn").addEventListener("click", () => {OpenHostsFile();});
    document.getElementById("OpenSettingsBtn").addEventListener("click", () => {OpenSettings();});
    // Set Overlay Links
    document.getElementById("AddEntryBtn").addEventListener("click", () => {AddEntry();});
    document.getElementById("CancelEntryBtn").addEventListener("click", () => {CloseOverlay();});
    // Set up Event Handlers
    N.events.on("trayMenuItemClicked", onTrayMenuItemClicked);
    N.events.on("windowClose", onWindowClose);
    // Hide Spinner and Open UI
    document.querySelector(".loading").classList.add("hidden");
    document.querySelector("#Main").classList.remove("hidden");
    document.querySelector(".NewEntryForm").classList.remove("hidden");
    document.querySelector("#OptionsBar").classList.remove("hidden");
    document.querySelector("#OverlayContainer").classList.add("hidden");
    refresh();
};
const refresh = () => {
  // Clear out Main
  document.querySelector("#Main").innerHTML = "";
  // Generate new list of sites
  Global.Sites.forEach((site) => {
    const row = document.createElement("div");
    row.classList.add("row");
    const address = document.createElement("div");
    address.classList.add("address");
    const hosts = document.createElement("div");
    hosts.classList.add("alias");
    const comments = document.createElement("div");
    comments.classList.add("comments");
    const options = document.createElement("div");
    options.classList.add("options");
    // Switch Generation
    const switchLabel = document.createElement("label");
    const switchInput = document.createElement("input");
    const switchSpan = document.createElement("span");
    switchLabel.classList.add("switch");
    switchSpan.classList.add("slider", "round");
    switchInput.classList.add("isActive");
    switchInput.setAttribute("type", "checkbox");
    switchLabel.appendChild(switchInput);
    switchLabel.appendChild(switchSpan);
    options.appendChild(switchLabel);
    // Populate
    address.innerHTML = site.ip;
    hosts.innerHTML = site.fqdn;
    comments.innerHTML = site.nickname;
    switchInput.checked = site.active;
    // Options need to happen
    row.appendChild(address);
    row.appendChild(hosts);
    row.appendChild(options);
    row.addEventListener("contextmenu", (e) => {
        e.preventDefault();
      const confirmDelete = confirm(
        "Are you sure you want to delete this item?"
      );
      if (confirmDelete) {
        // Remove the item from the array
        const index = Global.Sites.findIndex(
          (s) => s.ip === site.ip
        );
        if (index !== -1) {
            Global.Sites.splice(index, 1);
        }
        console.log(index);
        // Reload the page
        refresh();
      }
    });
    document.querySelector("main").appendChild(row);
  });
};
async function onTrayMenuItemClicked(event) {
    switch(event.detail.id) {
        case "GUI":
            await N.window.show();
            await N.window.focus();
            await N.window.setAlwaysOnTop(true);
            await N.window.setAlwaysOnTop(false);
            console.log(N.window.isVisible());
            // Need to figure out a good way to do this
            break;
        case "VERSION":
            Neutralino.os.showMessageBox("Version information",
                `Neutralinojs server: v${NL_VERSION} | Neutralinojs client: v${NL_CVERSION}`);
            break;
        case "FIXETC":
            await backend.fixHostsFilePermission(N);
            break;
        case "QUIT":
            Neutralino.app.exit(0);
            break;
    }
}
async function onWindowClose() {
    await N.window.hide();
    if(Global.Notify_About_Tray) {
        N.os.showMessageBox("Hostsmanager is still running","Hostsmanager is still running in the background. You can access it from the tray icon.");
        Notify_About_Tray = false;
    }
}
const AddEntry = () => {
    const ip = document.querySelector("#ipInput").value;
    const fqdn = document.querySelector("#fqdnInput").value;
    const active = document.querySelector("#active").checked;
    if(ip.length < 1 || fqdn.length < 1) {
        N.os.showMessageBox("Error","You must have an IP and Host to add an entry to the Hosts File.");
        return;
    }
    Global.Sites.push({
        ip,
        fqdn,
        active
    });
    ResetForm();
    refresh();
    CloseOverlay();
}
const OpenHostsFile = async () => {
    switch(NL_OS) {
        case "Windows":
            await N.os.execCommand(`start notepad ${HostsFileLocation}`);
            break;
        case "Linux":
            await N.os.execCommand(`xdg-open ${HostsFileLocation}`);
            break;
        case "Darwin":
            await N.os.execCommand(`open ${HostsFileLocation}`);
            break;
    }
}
const OpenOverlay = () => {
    document.querySelector("#OverlayContainer").classList.remove("hidden");
}
const OpenSettings = async () => {
    N.os.showMessageBox("Settings","This Feature is a work in progress, sorry for the delay!");   
}
const ResetForm = async () => {
    document.querySelectorAll('input[type=text]').forEach(el=>el.value ="");
    document.querySelector("#active").checked = true;
}
const SaveHosts = async () => {
    // Generate Hosts File Text
    let hostsFileText = "# Managed By HostsManager\n";
    Global.Sites.forEach((site)=>{
        if (!site.active) {
            hostsFileText += "#N ";
        }
        hostsFileText += `${site.ip} ${site.fqdn}\n`;
    });
    console.log(hostsFileText);
    console.log(NL_CWD);
    // Write the file to the local filesystem
    await N.filesystem.writeFile(
        NL_CWD + "/hosts",
        hostsFileText
    );
    // Write Hosts File
    switch(NL_OS) {
        case "Windows":
            const command = `powershell -Command "Start-Process powershell.exe -ArgumentList '-NoProfile -ExecutionPolicy Bypass -Command Move-Item -Path ${NL_CWD}/hosts -Destination ${HostsFileLocation} -Force' -Verb RunAs"`;
            console.log(command);
            await N.os.execCommand(command)
                .then((d) => {
                    console.log(d);
                    console.log(d);
                });
            break;
        case "Linux":
        case "Darwin":
            await N.os.execCommand(`echo "${hostsFileText}" | sudo tee ${HostsFileLocation}`)
                .then((d) => {
                    console.log(d);
                });
            break;
    }

}
const CloseOverlay = () => {
    document.querySelector("#OverlayContainer").classList.add("hidden");
}
Setup();
