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
	console.log(io.sockets.allSockets())
	socket.on('groupChat', message => {
		console.log(message)
		io.emit('chat', message)
	})
	socket.on('sendPublicKey', data => {
		data.socket_id = socket.id
		userList.push(data)
		io.emit('getPublicKey', userList)
		console.log(data)
	})
	socket.on('privateChat', data=>{
		let id = data.receiveID
		io.to(userList[id].socket_id).emit('privateMsgFromServer', {
			sendID: data.id,
			encryptMsg: data.encryptMsg
		})
	})
})

server.listen(3000, () => {
	console.log('Example app listening on port 3000!')
})
