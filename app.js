var express = require("express"), 
http = require("http"),
app = express(),
server = http.createServer(app),
path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

app.set("views",__dirname + "/views");
app.configure(function(){
	app.use(express.static(__dirname));
});

app.get("/", function(req,res){
	res.render("index.jade", {title : "Chat con NodeJS, Express, Socket.IO y jQuery"});
});

server.listen(3000);

//objecto para guardar en la sesión del socket a los que se vayan conectando
var usuariosOnline = {};

var io = require("socket.io").listen(server);

//al conectar un usuario||socket, este evento viene predefinido por socketio
io.sockets.on('connection', function(socket) 
{
	//cuando el usuario conecta al chat comprobamos si está logueado
	//el parámetro es la sesión login almacenada con sessionStorage
	socket.on("loginUser", function(username)
	{
		//si existe el nombre de usuario en el chat
		if(usuariosOnline[username])
		{
			socket.emit("userInUse");
			return;
		}
		//Guardamos el nombre de usuario en la sesión del socket para este cliente
		socket.username = username;
		//añadimos al usuario a la lista global donde almacenamos usuarios
		usuariosOnline[username] = socket.username;
		//mostramos al cliente como que se ha conectado
		socket.emit("refreshChat", "yo", "Bienvenido " + socket.username + ", te has conectado correctamente.");
		//mostramos de forma global a todos los usuarios que un usuario
		//se acaba de conectar al chat
		socket.broadcast.emit("refreshChat", "conectado", "El usuario " + socket.username + " se ha conectado al chat.");
		//actualizamos la lista de usuarios en el chat del lado del cliente
		io.sockets.emit("updateSidebarUsers", usuariosOnline);
	});

	//cuando un usuario envia un nuevo mensaje, el parámetro es el 
	//mensaje que ha escrito en la caja de texto
	socket.on('addNewMessage', function(message) 
	{
		//pasamos un parámetro, que es el mensaje que ha escrito en el chat, 
		//ésto lo hacemos cuando el usuario pulsa el botón de enviar un nuevo mensaje al chat

		//con socket.emit, el mensaje es para mi
		socket.emit("refreshChat", "msg", "Yo : " + message + ".");
		//con socket.broadcast.emit, es para el resto de usuarios
		socket.broadcast.emit("refreshChat", "msg", socket.username + " dice: " + message + ".");
	});

	//cuando el usuario cierra o actualiza el navegador
	socket.on("disconnect", function()
	{
		//si el usuario, por ejemplo, sin estar logueado refresca la
		//página, el typeof del socket username es undefined, y el mensaje sería 
		//El usuario undefined se ha desconectado del chat, con ésto lo evitamos
		if(typeof(socket.username) == "undefined")
		{
			return;
		}
		//en otro caso, eliminamos al usuario
		delete usuariosOnline[socket.username];
		//actualizamos la lista de usuarios en el chat, zona cliente
		io.sockets.emit("updateSidebarUsers", usuariosOnline);
		//emitimos el mensaje global a todos los que están conectados con broadcasts
		socket.broadcast.emit("refreshChat", "desconectado", "El usuario " + socket.username + " se ha desconectado del chat.");
	});
});
