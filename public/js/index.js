const socket = io();
const rsa = forge.pki.rsa;

var userlist = []
var id = -1
var keyPair = null
var msgList = []
var groupMsgList = []

var name = prompt('Bạn tên gì?')
var nameSpan = document.querySelector('#name')
nameSpan.innerText = name

const form = document.querySelector('#form')
const input = document.querySelector('#input')
const publicKeyListNode = document.getElementById("publicKeyList")
const userlistNode = document.getElementById("userOption")
const msgListNode = document.getElementById("yourMsg")

generateKeyPair()

function generateKeyPair() {
    rsa.generateKeyPair({ bits: 4096, workers: -1 }, function (err, keypair) {
        keyPair = keypair
        socket.emit('sendPublicKey', {
            name: name,
            publicKey: forge.pki.publicKeyToPem(keypair.publicKey)
        })
    });
}

// send msg
form.addEventListener('submit', (e) => {
    e.preventDefault()
    if (input.value) {
        if (userlistNode.value == 'all') {
            socket.emit('groupChat', {
                id,
                msg: input.value
            })
        } else {
            msgList.push({
                id: userlistNode.value + '%',
                msg: input.value
            })
            let pem = userlist[userlistNode.value].publicKey
            let publicKey = forge.pki.publicKeyFromPem(pem)
            let encryptMsg = publicKey.encrypt(forge.util.encodeUtf8(input.value))

            let md = forge.md.sha256.create();
            md.update(encryptMsg);
            let signedMsg = keyPair.privateKey.sign(md)
            socket.emit('privateChat', {
                id,
                encryptMsg,
                receiveID: userlistNode.value,
                signedMsg,
            })
        }
        input.value = ''
        refreshChat()
    }
})


// received private msg
socket.on("privateMsgFromServer", (data) => {
    let pem = userlist[data.sendID].publicKey
    let publicKey = forge.pki.publicKeyFromPem(pem)

    let md = forge.md.sha256.create();
    md.update(data.encryptMsg)
    let hashedMsg = md.digest().bytes();

    try {
        if (publicKey.verify(hashedMsg, data.signedMsg)) {
            let msg = keyPair.privateKey.decrypt(data.encryptMsg)
            msgList.push({
                id: data.sendID,
                msg: msg
            })
            refreshChat()
        } else {
            console.log(data.sendID)
            alert("tin nhan ko hop le")
        }
    } catch (error) {
        alert(error)
    }
})

// received msg from group
socket.on('groupChatFromServer', (data) => {
    groupMsgList.push({
        id: data.id,
        msg: data.msg
    })
    refreshChat()
})


// update chat msg
function refreshChat() {
    msgListNode.innerHTML = ""
    if (userlistNode.value == "all") {
        groupMsgList.forEach(data => {
            let li = document.createElement('li')
            if (data.id == id) {
                li.textContent = `you : ${data.msg}`
            } else {
                li.textContent = `${userlist[data.id].name} #${data.id} : ${data.msg}`
            }
            msgListNode.appendChild(li)
        })
    } else {
        msgList.forEach(data => {
            if (data.id == userlistNode.value | data.id == userlistNode.value + "%") {
                let li = document.createElement('li')

                if (data.id == userlistNode.value + "%") {
                    li.textContent = `you : ${data.msg}`
                } else {
                    li.textContent = `${userlist[data.id].name} #${data.id} : ${data.msg}`
                }
                msgListNode.appendChild(li)
            }
        });
    }
}


// received publicKey
socket.on('getPublicKey', (userList) => {
    console.log(userList)
    userlist = userList
    publicKeyListNode.innerHTML = ""
    userlistNode.innerHTML = ""

    if (id == -1) {
        id = userList.length - 1
        nameSpan.innerText = `${name} #${id}`
    }

    // group chat option
    const opt = document.createElement('option')
    opt.value = "all"
    opt.textContent = "all"
    userlistNode.appendChild(opt)

    // update user option
    for (let i = 0; i < userList.length; i++) {
        let user = userList[i]
        if (i != id) {
            const li = document.createElement('li')
            li.textContent = `${user.name} #${i}`
            publicKeyListNode.appendChild(li)

            const opt = document.createElement('option')
            opt.value = i
            opt.textContent = `${user.name} #${i}`
            userlistNode.appendChild(opt)
        }
    }
})