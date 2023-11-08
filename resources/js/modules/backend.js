class backendManager {
    // Hosts File Management
    readHostsFile(N) {
        return new Promise((resolve, reject)=> {
            N.filesystem.readFile("/etc/hosts")
            .then((data)=>{
                resolve(data);
            })
            .catch((err)=>reject(err));
        })
    }
    writeHostsFile(N, content) {
        return new Promise((resolve, reject)=> {
            console.log(content);
            N.filesystem.writeFile("/etc/hosts", content)
            .then((data)=>{
                resolve(data);
            })
            .catch((err)=>reject(err));
        })
    }
    // Hosts File Permissions
    checkHostsFilePermission(N) {
        return new Promise( async (resolve,reject)=>{
            const user = await N.os.getEnv("USER");
            N.os.execCommand("stat /etc/hosts")
            .then(async (res)=>{
                if(res.stdErr) {
                    reject(res.stdErr);
                } else {
                    const outputLines = res.stdOut.split('\n');
                    const fileOwnerLine = outputLines.find((line) => line.includes(user));
                    if (!fileOwnerLine) {
                        reject('Unable to determine hosts file owner and permissions.');
                        return;
                    }
                    // User was found to have permissions
                    resolve();
                }
            })
        })
    }
    fixHostsFilePermission(N) {
        return new Promise(async res=>{
            const user = await N.os.getEnv("USER");
            N.os.execCommand(`
                osascript -e 'tell application "Terminal"
                    activate
                    set newTab to do script "sudo chown ${user} /etc/hosts && sudo chmod 744 /etc/hosts"
                    -- Wait for the sudo command to finish
                    repeat
                        delay 1
                        if not busy of newTab then exit repeat
                    end repeat
                    
                    -- Close the Terminal window
                    close window 1
                end tell'
                `).then((data)=>{
                    console.log(data);
                    N.os.showMessageBox("Success!","Your hosts file was modified successfully.");
                    res(true);
                })
                .catch((err)=>console.error(err) && res(false))
        })
    }
    // General Utility Functions
    hostsStringToObj(hostsString) {
        let outputArr = new Array();
        let resArr = new Array();

        hostsString.split('\n').forEach((line)=>{
            if(line.includes('#')) return;
            if(line == '') return;
            outputArr.push(line.split("\t"));
        });

        outputArr.forEach((line)=>{
            let res = {}
            if(line.length == 2) {
                res.fqdn = line[1];
                res.ip = line[0];
                res.nickname = "";
            } else if(line.length == 3) {
                res.fqdn = line[2];
                res.ip = line[0];
                res.nickname = line[1];
            }
            resArr.push(res);
        });
        return resArr;
    }
    // System Utility Functions
    setTray(N) {
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
}
export const backend = new backendManager();