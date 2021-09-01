const express = require('express')
const http = require('http')
const {
	Server
} = require('socket.io')
const delay = require('delay')

const app = express()
const server = http.createServer(app)
const io = new Server(server)
var userList = []

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html')
})

io.on('connection', (socket) => {
	console.log('user connect')
	console.log(io.sockets.allSockets())
	socket.on('chat', message => {
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
