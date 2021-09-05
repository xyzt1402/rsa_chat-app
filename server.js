const express = require('express')
const path = require('path');
const http = require('http')
const {
	Server
} = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = new Server(server)
var userList = []

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {

	console.log('user connect')

	socket.on('groupChat', data => {
		console.log(data)
		io.emit('groupChatFromServer', data)
	})
	socket.on('sendPublicKey', data => {
		data.socket_id = socket.id
		userList.push(data)
		io.emit('getPublicKey', userList)
		console.log(data)
	})
	socket.on('privateChat', data=>{
		let id = data.receiveID
		console.log(data)
		io.to(userList[id].socket_id).emit('privateMsgFromServer', {
			sendID: data.id,
			encryptMsg: data.encryptMsg,
			signedMsg: data.signedMsg,
		})
	})
})

server.listen(3000, () => {
	console.log('Example app listening on port 3000!')
})
