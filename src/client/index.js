const http = require('http');
const express = require('express');
const net = require('net');
const app = express();
const path = require('path');
const httpServer = http.createServer(app); // Usar http.createServer para el servidor HTTP
const io = require('socket.io')(httpServer);
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { register } = require('module');

app.use('/', express.static(path.join(__dirname, 'www')));


let chatSockets = [];
let clientSockets = [];
let singleSockets = [];
let taskSockets = [];
let mainSockets = [];
let registerSockets = [];



let clientIdCounter = 0; // Contador de IDs de clientes

// Crear el servidor TCP
const tcpServer = net.createServer((socket) => {


  socket.on('data', (data) => {
      //pasar el mensaje a json
      data_json = JSON.parse(data);
      //coger el campo client_id del mensaje json
      client_id = data_json.client_id;
      console.log(`Mensaje recibido del cliente TCP ${client_id}`);

      const chatSocket = chatSockets[client_id];
      if (chatSocket) chatSocket.emit("chat", data);
  });

  socket.on('end', () => {
    
      console.log(`Conexión cerrada por el cliente TCP ${socket.id}`);
  });
});


io.on('connection', (socket) => {
  // Assign a unique ID to the client
  socket.id = clientIdCounter++;

  socket.on("REGISTER_CONNECTED", () => {
    //Store the chat socket reference using the client ID as the key
    registerSockets[socket.id] = socket;
    const registerSocket = registerSockets[socket.id];

    console.log("REGISTER CONECTADO");
  });

  socket.on("CLIENT_CONNECTED", () => {
    //Store the chat socket reference using the client ID as the key
    clientSockets[socket.id] = socket;
    const clientSocket = clientSockets[socket.id];

    console.log("CLIENTE CONECTADO");
  });

  socket.on("MAIN_CONNECTED", () => {
    //Store the chat socket reference using the client ID as the key
    mainSockets[socket.id] = socket;
    const mainSocket = mainSockets[socket.id];

    console.log("MAIN CONECTADO");
  });

  socket.on("SINGLE_CONNECTED", () => {
    //Store the chat socket reference using the client ID as the key
    singleSockets[socket.id] = socket;
    const singleSocket = singleSockets[socket.id];

    console.log("SINGLE CONECTADO");
  });

  socket.on("TASK_CONNECTED", () => {
    //Store the chat socket reference using the client ID as the key
    taskSockets[socket.id] = socket; 
    const taskSocket = taskSockets[socket.id];

    console.log("TASK CONECTADO");
  });

  socket.on("CHAT_CONNECTED", () => {
    //Store the chat socket reference using the client ID as the key
    chatSockets[socket.id] = socket;
    const chatSocket = chatSockets[socket.id];

    //Send the client ID to the chat server so that then it can be stored in the database
    console.log(`Cliente conectado con ID: ${socket.id}`);
    if (chatSocket) chatSocket.emit("client_id", socket.id);

    console.log("CHAT CONECTADO");
  });


  // Si recibe el evento 'message', envía los datos al servidor en C
  socket.on('message', (message) => {
    enviar(message, socket.id);
  });

  socket.on("disconnect", () => {
    if (socket === mainSockets[socket.id]) {
      mainSockets[socket.id] = null;
      console.log("MAIN DESCONECTADO");
    }
    if (socket === singleSockets[socket.id]) {
      singleSockets[socket.id] = null;
      console.log("SINGLE DESCONECTADO");
    }
    if (socket === taskSockets[socket.id]) {
      taskSockets[socket.id] = null;
      console.log("TASK DESCONECTADO");
    }
    if (socket === chatSockets[socket.id]) {
      chatSockets[socket.id] = null;
      console.log("CHAT DESCONECTADO");
    }
    if (socket === clientSockets[socket.id]) {
      clientSockets[socket.id] = null;
      console.log("CLIENTE DESCONECTADO");
    }
    if (socket === registerSockets[socket.id]) {
      registerSockets[socket.id] = null;
      console.log("REGISTER DESCONECTADO");
    }
  });
});


function enviar(message, socketId) {
  const serverAddress = "servidor-service";
  const serverPort = 8888;

  const client = new net.Socket();

  client.connect(serverPort, serverAddress, () => {
    client.write(message);
  });

  client.on('data', (data) => {
    //comprobar si el mensaje recibido es un json
    
    try { 
      var comprobacion_json= JSON.parse(data.toString());
       //comprobamos si el se trata de una lista de objetos json o un único objeto json
      if (Array.isArray(comprobacion_json)){
          var comprobacion_json_objeto = comprobacion_json[0];
          var comprobacion_json_clave = Object.keys(comprobacion_json_objeto)[0];

          //si el json es una lista, comprobamos con el primer objeto si es un json de predicciones.
          if (comprobacion_json_clave == "ID" ){
            const mainSocket = mainSockets[socketId];
            if (mainSocket) mainSocket.emit("prediccion", data);
          }
          else {
            const mainSocket = mainSockets[socketId];
            if (mainSocket) mainSocket.emit("login", data);
          }

      }

      const singleSocket = singleSockets[socketId];
      if (singleSocket) singleSocket.emit("single", data);
      const taskSocket = taskSockets[socketId];
      if (taskSocket) taskSocket.emit("tareas", data);
      const chatSocket = chatSockets[socketId];
      if (chatSockets) chatSocket.emit("chat_inicial", data);

    } catch (error) { // si no es un json, se captura el error y se procesa como un string
      if (data == "Usuario_autenticado"){ 
        console.log("Usuario autenticado");
        const clientSocket = clientSockets[socketId];
        if (clientSocket) clientSocket.emit("login_success", data);
      }
      else if (data == "Contraseña_incorrecta"){
        console.log("Usuario no autenticado");
        const clientSocket = clientSockets[socketId];
        if (clientSocket) clientSocket.emit("login_fail_password", data);
      }    
      else if (data == "Usuario_no_existe"){
        console.log("Usuario no autenticado");
        const clientSocket = clientSockets[socketId];
        if (clientSocket) clientSocket.emit("login_fail_user", data);
      }
      else if (data == "Miembro no existe"){
        
        const singleSocket = singleSockets[socketId];
        if (singleSocket) singleSocket.emit("single_no_user", data);
        console.log("Miembro no existe");
      }
    }
  
    client.end();
  });

  client.on('close', () => {
    console.log('Conexión cerrada por el servidor HTTP');
    client.destroy();
  });
}

httpServer.listen(3000, '0.0.0.0', () => {
  console.log("Servidor HTTP escuchando en el puerto 3000 en", httpServer.address().address);
});


tcpServer.listen(5000, '0.0.0.0', () => {
  console.log('Servidor TCP escuchando en el puerto 5000 en', tcpServer.address().address);


});