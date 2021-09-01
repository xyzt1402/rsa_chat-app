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
var id = 0

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
		id += 1
		data.id = id
		userList.push(data)
		io.emit('getPublicKey', userList)
	})
	// io.emit('getPublicKey', userList)
})

server.listen(3000, () => {
	console.log('Example app listening on port 3000!')
})
