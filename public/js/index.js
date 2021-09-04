const socket = io();
var rsa = forge.pki.rsa;
var userlist = []
var id = -1
var keyPair = null
var msgList = []

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
    const p_key = document.getElementById('p_key')
    rsa.generateKeyPair({ bits: 4096, workers: -1 }, function (err, keypair) {
        // let enText =  keypair.publicKey.encrypt(forge.util.encodeUtf8("Some text"))
        // console.log(keypair.publicKey.decrypt(enText))
        keyPair = keypair
        socket.emit('sendPublicKey', {
            name: name,
            publicKey: forge.pki.publicKeyToPem(keypair.publicKey)
        })
    });
}

// function outputMessage(message) {
//     const div = document.createElement('div');
//     div.classList.add('message');
//     const p = document.createElement('p');
//     p.classList.add('meta');
//     p.innerText = message.username;
//     p.innerHTML += `<span>${message.time}</span>`;
//     div.appendChild(p);
//     const para = document.createElement('p');
//     para.classList.add('text');
//     para.innerText = message.text;
//     div.appendChild(para);
//     document.querySelector('.chat-messages').appendChild(div);
// }


// send private msg
form.addEventListener('submit', (e) => {
    e.preventDefault()
    if (input.value) {
        msgList.push({
            id: userlistNode.value + '%',
            msg: input.value
        })
        let pem = userlist[userlistNode.value].publicKey
        let publicKey = forge.pki.publicKeyFromPem(pem)
        let encryptMsg = publicKey.encrypt(forge.util.encodeUtf8(input.value))
        socket.emit('privateChat', {
            id,
            encryptMsg,
            receiveID: userlistNode.value,
        })
        input.value = ''
        refreshChat()
    }
})


// received private msg
socket.on("privateMsgFromServer", (data) => {
    let msg = keyPair.privateKey.decrypt(data.encryptMsg)
    msgList.push({
        id: data.sendID,
        msg: msg
    })
    let li = document.createElement('li')
    li.textContent = `${userlist[data.sendID].name} #${data.sendID} : ${msg}`
    msgListNode.appendChild(li)
})

// send msg to group
// form.addEventListener('submit', (e) => {
// 	e.preventDefault()
// 	if (input.value) {
// 		socket.emit('chat', {
// 			id,
// 			name,
// 			value: input.value
// 		})
// 		input.value = ''
// 	}
// })

// received msg from group
const messages = document.querySelector('#messages')
socket.on('chat', (message) => {
    const li = document.createElement('li')
    li.textContent = `${message.name} #${message.id}: ${message.value}`
    messages.appendChild(li)
})

function refreshChat() {
    msgListNode.innerHTML = ""
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