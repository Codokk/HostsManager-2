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
}

export const frontend = new frontendManager();