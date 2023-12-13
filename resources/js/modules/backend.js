class backendManager {
    // Hosts File Management
    constructor() {
      this.hfl = (NL_OS == "Windows" ? "C:\\Windows\\System32\\drivers\\etc\\hosts" : "/etc/hosts")
    }
    readHostsFile(N) {
        return new Promise((resolve, reject)=> {
            N.filesystem.readFile(this.hfl)
            .then((data)=>{
                resolve(data);
            })
            .catch((err)=>reject(err));
        })
    }
    writeHostsFile(N, content) {
        return new Promise((resolve, reject)=> {
            console.log(content);
            N.filesystem.writeFile(this.hfl, content)
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
            N.os.execCommand(`stat ${this.hfl}`)
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
                    quit
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
        
    }
}
export const backend = new backendManager();