// Frontend Functions
class frontendManager {
    changePage(page) {
        return new Promise((resolve, reject) => {
            if(page == null || page == undefined) return;
            // Page Management
            document.querySelectorAll(".page").forEach((p) => {
                p.classList.add("hidden");
            });
            document.getElementById(page).classList.remove("hidden");
            // Link Management
            document.querySelectorAll("li[data-link]").forEach((link) => {
                link.classList.remove("active");
            });
            document.querySelector(`li[data-link="${page}"]`).classList.add("active");

            resolve();
        });
    }
    setLinks() {
        const Links = document.querySelectorAll("li[data-link]");
        Links.forEach((link) => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const link = e.target.closest("li[data-link]");
                const page = link.dataset.link;
                this.changePage(page);
            });
        });
    }
    refreshSites(sites) {
        document.querySelector("main").innerHTML = ""
        sites.forEach(site => {
            const row = document.createElement("div")
            row.classList.add("row");
            const address = document.createElement("div")
            address.classList.add("address");
            const hosts = document.createElement("div")
            hosts.classList.add("alias");
            const comments = document.createElement("div")
            comments.classList.add("comments");
            const options = document.createElement("div")
            options.classList.add("options");
            // Switch Generation
            const switchLabel = document.createElement("label");
            const switchInput = document.createElement("input");
            const switchSpan = document.createElement("span");
            switchLabel.classList.add("switch");
            switchSpan.classList.add("slider","round");
            switchInput.classList.add("isActive");
            switchInput.setAttribute("type","checkbox");
            switchLabel.appendChild(switchInput);
            switchLabel.appendChild(switchSpan);
            options.appendChild(switchLabel);
            // Populate
            address.innerHTML = site.address
            hosts.innerHTML = site.hosts
            comments.innerHTML = site.comments
            // Options need to happen
            row.appendChild(address);
            row.appendChild(hosts);
            row.appendChild(options);
            row.addEventListener("contextmenu", () => {
                const confirmDelete = confirm("Are you sure you want to delete this item?");
                if (confirmDelete) {
                    // Remove the item from the array
                    const index = sites.findIndex(site => site.address === address.innerHTML);
                    if (index !== -1) {
                        sites.splice(index, 1);
                    }
                    // Reload the page
                    frontend.refreshSites(sites);
                }
            });
            document.querySelector("main").appendChild(row);
        })        
    }
    resetForm() {
        document.querySelectorAll('input[type=text]').forEach(el=>el.value ="")
        document.querySelector("#active").checked = true;
        this.closeOverlay();
    }
    openOverlay() {
        document.querySelector("#OverlayContainer").classList.remove("hidden");
    }
    closeOverlay() {
        document.querySelector("#OverlayContainer").classList.add("hidden");
    }
}

export const frontend = new frontendManager();