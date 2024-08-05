

// cliente.js
const socket = io.connect();

const send_button = document.getElementById('send_button');
const username = document.getElementById("username");
let account_name;
const receptor_name = document.getElementById("receptor_name");

username.textContent = localStorage.getItem("username");
account_name = localStorage.getItem("username");
receptor_name.textContent = localStorage.getItem("destinatario");
client_id = localStorage.getItem("port");

function write_client_id(){
  let message = {
    operation: "WRITE_CLIENT_ID",
    username: account_name,
    client_id: localStorage.getItem("client_id")
  };
  
  socket.emit('message', JSON.stringify(message));
}


function bring_sender_chat() {
  
  const message = {
    operation: "CHAT_INICIAL_SENDER",
    sender: localStorage.getItem("username"),
    receiver: localStorage.getItem("destinatario"),
  };
  socket.emit('message', JSON.stringify(message));

  
};

function compararFechas(a, b) {
  return new Date(a.date) - new Date(b.date);
}

function renderizar_chat(todosLosMensajes){

  const mensajesDestinatario = document.getElementById('chat');
  mensajesDestinatario.innerHTML = "";


  // Renderiza los mensajes en el orden correcto
  for (let i = 0; i < todosLosMensajes.length; i++){
    const nuevoMensaje = document.createElement('div');
    nuevoMensaje.textContent = todosLosMensajes[i].message;
    // nuevoMensaje.className = todosLosMensajes[i].sender === 'usuario' ? 'mensaje-usuario' : 'mensaje-destinatario';
    if (todosLosMensajes[i].sender === localStorage.getItem("username")){
      nuevoMensaje.className = 'mensaje-usuario';
      mensajesDestinatario.appendChild(nuevoMensaje);

    } else {
        nuevoMensaje.className = 'mensaje-destinatario';
        mensajesDestinatario.appendChild(nuevoMensaje);
      
      }
  }
  chat.scrollTop = chat.scrollHeight;
};

document.addEventListener("DOMContentLoaded", function() {
  // La página se ha cargado completamente, ejecutar funciones aquí

  socket.on("chat", function(data){
    const jsonData = JSON.parse(new TextDecoder("utf-8").decode(data));
    console.log(jsonData.message);
  
    // Añadir el mensaje a la columna del destinatario
    const mensajesDestinatario = document.getElementById('chat');
    const nuevoMensaje = document.createElement('div');
    nuevoMensaje.textContent = jsonData.message;
    nuevoMensaje.className = 'mensaje-destinatario';
    mensajesDestinatario.appendChild(nuevoMensaje);
    chat.scrollTop = chat.scrollHeight;
  });

  socket.on("client_id", function(data){
    localStorage.setItem("client_id", data);
    console.log(data);
    write_client_id();
  });

  socket.on("chat_inicial", function(data){
    console.log("HOLAAAAAAAAAAAAAA")
    const jsonData = JSON.parse(new TextDecoder("utf-8").decode(data));
    console.log(jsonData);
    
    jsonData.sender.sort(compararFechas);

    // Ordenar los mensajes de receiver
    jsonData.receiver.sort(compararFechas);

    // Imprimir los mensajes ordenados
    console.log("Mensajes de sender ordenados por fecha:");
    console.log(jsonData.sender);
    console.log("\nMensajes de receiver ordenados por fecha:");
    console.log(jsonData.receiver);

    let json_combined = jsonData.sender.concat(jsonData.receiver);
    json_combined.sort(compararFechas);


    
    renderizar_chat(json_combined);
  });


  socket.emit("CHAT_CONNECTED");


  bring_sender_chat();
});

//FUNCIONES PARA LOS BOTONES

send_button.addEventListener('click', () => {
  const message = {
    operation: "NEW_MESSAGE",
    sender: localStorage.getItem("username"),
    receiver: localStorage.getItem("destinatario"),
    message: document.getElementById('message_input').value,
    date: new Date().toISOString().slice(0, 19).replace('T', ' ')
  };
  socket.emit('message', JSON.stringify(message));

  // Añadir el mensaje a la columna del sender
  const mensajesDestinatario = document.getElementById('chat');
  const nuevoMensaje = document.createElement('div');
  nuevoMensaje.textContent = document.getElementById('message_input').value;
  nuevoMensaje.className = 'mensaje-usuario';
  mensajesDestinatario.appendChild(nuevoMensaje);
  chat.scrollTop = chat.scrollHeight;

  //eliminar el texto del input
  document.getElementById('message_input').value = "";
  document.getElementById('message_input').focus();

});

