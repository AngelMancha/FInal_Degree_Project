// cliente.js
const socket = io.connect();

const username = document.getElementById("username");
username.textContent = localStorage.getItem("username");

const project_name = document.getElementById("project_name");
const user = localStorage.getItem("username");




// Function to fetch repository contents
function fetchRepoContents(owner, repo, path = '') {
  let apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents${path}`;
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      displayRepoContents(data, owner, repo, path);
    })
    .catch(error => {
      console.error('Error fetching repository contents:', error);
    });
}



// Function to fetch file content
function fetchFileContent(file) {
  fetch(file.download_url)
    .then(response => response.text())
    .then(data => {
      displayFileContent(data);
    })
    .catch(error => {
      console.error('Error fetching file content:', error);
    });
}

// Function to display repository contents in the github container

function displayRepoContents(contents, owner, repo, path) {
  const githubContainer = document.getElementById('github');
  githubContainer.innerHTML = '';

  // Add navigation buttons if not at root level
  if (path !== '') {
    const backButton = document.createElement('button');
    backButton.classList.add('back-button');
    backButton.textContent = 'Back';
    backButton.addEventListener('click', () => navigateBack(owner, repo, path));
    githubContainer.appendChild(backButton);
    const space = document.createElement('br');
    githubContainer.appendChild(space);

  }


  contents.forEach(item => {
    const space = document.createElement('br');
    githubContainer.appendChild(space);
    const element = document.createElement('div');
    const icon = document.createElement('span');
    const itemName = document.createElement('span');
    itemName.textContent = item.name;
    itemName.classList.add('repo-item-name');

    if (item.type === 'file') {
      icon.textContent = '📄'; // File icon
      icon.classList.add('file-icon');
      element.addEventListener('click', () => fetchFileContent(item));
    } else if (item.type === 'dir') {
      icon.textContent = '📁'; // Directory icon
      icon.classList.add('dir-icon');
      element.addEventListener('click', () => fetchRepoContents(owner, repo, `${path}/${item.name}`));
    }

    element.classList.add('repo-item');
    element.appendChild(icon);
    element.appendChild(itemName);
    githubContainer.appendChild(element);
  });
}

// Function to navigate back to the previous directory
function navigateBack(owner, repo, path) {
  const lastSlashIndex = path.lastIndexOf('/');
  const parentPath = path.substring(0, lastSlashIndex); // Get parent directory path
  fetchRepoContents(owner, repo, parentPath);
}
// Function to navigate back to the previous directory
function navigateBack(owner, repo, path) {
  const lastSlashIndex = path.lastIndexOf('/');
  const parentPath = path.substring(0, lastSlashIndex); // Get parent directory path
  fetchRepoContents(owner, repo, parentPath);
}


// Function to display file content in githubContents container
function displayFileContent(content) {
  const githubContentsContainer = document.getElementById('githubContents');
  
  // Set inner HTML of container with formatted code
  githubContentsContainer.innerHTML = `<pre><code class="language-${detectLanguage(content)}">${escapeHtml(content)}</code></pre>`;
  
  // Highlight code
  hljs.highlightAll();
}

// Function to detect the programming language of the code
function detectLanguage(code) {
  // Here you can implement your own logic to detect the language, or use a library
  // For simplicity, let's assume it's JavaScript
  return 'javascript';
}

function escapeHtml(html) {
  return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function gitHub(){
const owner = localStorage.getItem("username");
const repo = localStorage.getItem("single_project");
fetchRepoContents(owner, repo);
}

function display_project() {
  
  const message_tasks = {
    operation: "SINGLE",
    username: localStorage.getItem("username"),
    project_name: localStorage.getItem("single_project")
  };
  socket.emit('message', JSON.stringify(message_tasks));


};

function renderizar_porcentaje(hechos, total) {
  let porcentajeCompletado = 0;
  if (total !== 0) {
    porcentajeCompletado = (hechos / total) * 100;
  }

  // Actualiza el valor del progreso
  const progress_bar = document.getElementById("progress_bar");
  progress_bar.style.width = porcentajeCompletado + "%";
  progress_bar.setAttribute("aria-valuenow", porcentajeCompletado);
  progress_bar.style.backgroundColor = "#00ac69";
  // Actualiza el porcentaje al lado de la barra de progreso
  const project_tareas = document.getElementById("circle_porcentaje");
  project_tareas.textContent = porcentajeCompletado.toFixed(0) + "%";
  project_tareas.style.fontSize = "1.5em";


  //funcion que renderiza la fase del proyecto
  renderizar_fase(porcentajeCompletado);

}

function renderizar_miembros(miembros) {
  const membersContainer = document.getElementById("members-container");

    // Crear un div para cada miembro único y agregarlo al contenedor
    miembros.forEach(member => {
        const memberDiv = document.createElement("div");
          memberDiv.id = member;
          memberDiv.classList.add("members_lists");

        // Crear un elemento de imagen para el avatar
          const avatar = document.createElement("img");
          // avatar.src = `${member}.png`;
          avatar.src = "../RESOURCES/SVG/male_avatar.svg";
          avatar.style.borderRadius = '50%';
          avatar.width = 50;
          avatar.height = 50;
          memberDiv.appendChild(avatar);

          const member_name = document.createElement("h2");
          member_name.classList.add("member_name");
          member_name.textContent = member;
        memberDiv.appendChild(member_name);
        

        // Agregar el nuevo div al contenedor
        membersContainer.appendChild(memberDiv);
        //añadir espacio en blanco
        const space = document.createElement("br");
        membersContainer.appendChild(space);


        memberDiv.addEventListener('click', function() {
          window.location.href = "../chat/chat.html";
          localStorage.setItem("destinatario", memberDiv.id);
        });
    });
}

function done_task(task_name, task_deadline, task_members, previous_state) {
  let project_name = localStorage.getItem("single_project")
  let due_date = task_deadline;
  let members = task_members; 
  let task = task_name;
  let state = "1";
  if (previous_state == "1") {
     state = "0";
  }

  var username = localStorage.getItem("username");
  // Crear un objeto con los dos campos
  const message = {
    operation: "EDIT_TASK",
    username: username,
    project_name: project_name,
    task: task,
    state: state,
    due_date: due_date,
    members: members,
  };
  
  // Convierte el objeto a una cadena JSON antes de enviarlo
  socket.emit('message', JSON.stringify(message));
  
}

function renderizar_fase(porcentajeCompletado) {
  //funcion que renderiza la fase del proyecto
  //Si el porcentaje es 0, la fase es 1
  if (porcentajeCompletado == 0) {
    varaible = 1;
  }

  //Si el porcentaje es menor o igual que 80, la fase es 2
  if (porcentajeCompletado > 0 && porcentajeCompletado <= 80) {
    varaible = 2;
  }
  //Si el porcentaje es mayor o igual que 80 la fase es 3
  if (porcentajeCompletado >80 && porcentajeCompletado <= 100) {
    varaible = 3;

  }

  if (varaible == 1) {
    const fases = document.querySelectorAll(".phase");
    fases[0].style.backgroundColor = "#0061f2";
    fases[0].style.color = "white";
    fases[0].style.fontSize = "1.5em";
    fases[1].style.backgroundColor = "#f4a30059";
    fases[1].style.color = "gray";
    fases[1].style.fontSize = "1em";
    fases[2].style.backgroundColor = "#00ac6a7a";
    fases[2].style.color = "gray";
    fases[2].style.fontSize = "1em";
    fases[3].style.backgroundColor = "#e813006b";
    fases[3].style.color = "gray";
    fases[3].style.fontSize = "1em";

  }
  if (varaible == 2) {
    const fases = document.querySelectorAll(".phase");
    fases[0].style.backgroundColor = "#0061f252";
    fases[0].style.color = "gray";
    fases[0].style.fontSize = "1em";
    fases[1].style.backgroundColor = "#f4a100";
    fases[1].style.color = "white";
    fases[1].style.fontSize = "1.5em";
    fases[2].style.backgroundColor = "#00ac6a7a";
    fases[2].style.color = "gray";
    fases[2].style.fontSize = "1em";
    fases[3].style.backgroundColor = "#e813006b";
    fases[3].style.color = "gray";
    fases[3].style.fontSize = "1em";
}
  if (varaible == 3) {
    const fases = document.querySelectorAll(".phase");
    fases[0].style.backgroundColor = "#0061f252";
    fases[0].style.color = "gray";
    fases[0].style.fontSize = "1em";
    fases[1].style.backgroundColor = "#f4a30059";
    fases[1].style.color = "gray";
    fases[1].style.fontSize = "1em";
    fases[2].style.backgroundColor = "#00ac69";
    fases[2].style.color = "white";
    fases[2].style.fontSize = "1.5em";
    fases[3].style.backgroundColor = "#e813006b";
    fases[3].style.color = "gray";
    fases[3].style.fontSize = "1em";
  }
  if (varaible == 4) {
    const fases = document.querySelectorAll(".phase");
    fases[0].style.backgroundColor = "#0061f252";
    fases[0].style.color = "gray";
    fases[0].style.fontSize = "1em";
    fases[1].style.backgroundColor = "#f4a30059";
    fases[1].style.color = "gray";
    fases[1].style.fontSize = "1em";
    fases[2].style.backgroundColor = "#00ac6a7a";
    fases[2].style.color = "gray";
    fases[2].style.fontSize = "1em";
    fases[3].style.backgroundColor = "#e81500";
    fases[3].style.color = "white";
    fases[3].style.fontSize = "1.5em";
  }
}

function renderizar_tareas(tareas) {
  console.log(`LLEGAAA: ${tareas}`);
  const projectGallery_deadline = document.getElementById("proyect_deadline");
  const projectGallery_tareas = document.getElementById("proyect_tareas");
  const projectGallery_complexity = document.getElementById("project_complexity");
  const tasksContainer = document.getElementById("tasks-container");

  // Limpiar los contenedores antes de renderizar las tareas
  projectGallery_deadline.innerHTML = "";
  projectGallery_tareas.innerHTML = "";
  projectGallery_complexity.innerHTML = "";
  tasksContainer.innerHTML = "";

  let total = 0;
  let hechos = 0;

  tareas.forEach(tarea => {
    console.log(`DEADLINE: ${tarea.due_date}`);
    if (tarea.done == 1) {
      hechos++;
      total++;
    } else {
      total++;
    }
  });

  const header_project = document.getElementById("header_project");
  header_project.textContent = localStorage.getItem("single_project");

  const project_deadline = document.createElement("h2");
  project_deadline.textContent = localStorage.getItem("single_project_date");

  const project_tareas = document.createElement("h2");
  project_tareas.textContent = `${hechos} de ${total}`;

  const project_complexity = document.createElement("h2");
  project_complexity.textContent = localStorage.getItem("single_project_complexity");

  // Agregar elementos al widget de tareas
  const space1 = document.createElement("br");
  projectGallery_deadline.appendChild(project_deadline);
  projectGallery_deadline.appendChild(space1);
  
  const space2 = document.createElement("br");
  projectGallery_tareas.appendChild(project_tareas);
  projectGallery_tareas.appendChild(space2);

  const space3 = document.createElement("br");
  projectGallery_complexity.appendChild(project_complexity);
  projectGallery_complexity.appendChild(space3);

  //Tabla de tareas

  tareas.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  // Crear la tabla
  const table = document.createElement("table");
  table.classList.add("table", "table-bordered", "rounded-table");
  

  // Crear encabezados de columna
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const headers = ["Task", "Deadline", "Members", "Done"];
  headers.forEach(headerText => {
      const th = document.createElement("th");
      th.textContent = headerText;
      headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Crear el cuerpo de la tabla
  const tbody = document.createElement("tbody");

  // Iterar sobre las tareas y crear una fila para cada una
  tareas.forEach(tarea => {
      const taskRow = document.createElement("tr");

      // Columna para el nombre de la tarea
      const nameCell = document.createElement("td");
      nameCell.textContent = tarea.task;
      nameCell.classList.add("task_font");
      if (tarea.done == 1) {
          nameCell.style.textDecoration = "line-through";
      }
      taskRow.appendChild(nameCell);

      // Columna para el deadline
      const deadlineCell = document.createElement("td");
      deadlineCell.textContent = tarea.due_date;
      deadlineCell.classList.add("task_font");
      if (tarea.done == 1) {
          deadlineCell.style.textDecoration = "line-through";
      }
      taskRow.appendChild(deadlineCell);

      // Columna para los miembros
      const membersCell = document.createElement("td");
      membersCell.textContent = tarea.members;
      membersCell.classList.add("task_font");
      if (tarea.done == 1) {
          membersCell.style.textDecoration = "line-through";
      }
      taskRow.appendChild(membersCell);

      // Columna para marcar como hecho
      const doneCell = document.createElement("td");
      const avatar = document.createElement("img");
      avatar.classList.add("avatar_hover");
      if (tarea.done == 1) {
          avatar.src = "../RESOURCES/SVG/check_circle.svg";
          avatar.alt = "Hecho";
          avatar.addEventListener('click', function() {
              done_task(tarea.task, tarea.due_date, tarea.members, tarea.done); 
              location.reload();
          });
      } else {
          avatar.src = "../RESOURCES/SVG/empty_circle.svg";
          avatar.alt = "No hecho";
          avatar.addEventListener('click', function() {
              done_task(tarea.task, tarea.due_date, tarea.members, tarea.done); 
              location.reload();
          });
      }
      avatar.width = 30;
      avatar.height = 30;
      doneCell.appendChild(avatar);
      taskRow.appendChild(doneCell);

      // Agregar fila a la tabla
      tbody.appendChild(taskRow);
  });

  table.appendChild(tbody);

  // Agregar la tabla al contenedor de tareas
  tasksContainer.appendChild(table);
  // Llama a la función para renderizar la barra de progreso
  renderizar_porcentaje(hechos, total);

}



renderizar_calendario = (tareas) => {
  var calendarEl = document.getElementById('calendar');
  console.log("hola puta")

  // Crear un array de eventos a partir de estadisticas
  var eventos = tareas.map(tarea => {
      return {
          title: tarea.task, // Asume que cada proyecto tiene una propiedad 'nombre'
          start: tarea.due_date, // Asume que cada proyecto tiene una propiedad 'fechaInicio'
          
      };
  });

  var calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      events: eventos
  });

  calendar.render();
};



function assign_members(members) {
  // Get the select element
  var select = document.getElementById("members");
  // Clear the select options
  select.innerHTML = "";
  // Add the default option
  var option = document.createElement("option");
  option.text = "Select a member";
  option.value = "";
  select.add(option);
  // Add the members as options
  members.forEach(member => {
      var option = document.createElement("option");
      option.text = member;
      option.value = member;
      select.add(option);
  });


}

//Funcionaliad de modal para agregar tareas y miembros
add_task = document.getElementById("add_task");
modal_task= document.getElementById("myModal");
var span_task = document.getElementById("close_task");

add_task.addEventListener('click', function() {
  //function that displays the available members to which tasks can be assigned to.


  modal_task.style.display = "block";
});


add_member= document.getElementById("add_member");
modal_member= document.getElementById("myModal_member");
var span_member = document.getElementById("close_member");

add_member.addEventListener('click', function() {
  modal_member.style.display = "block";
});


span_task.onclick = function() {
  modal_task.style.display = "none";
}

span_member.onclick = function() {
  modal_member.style.display = "none";
}



document.getElementById('newTaskForm').addEventListener('submit', (event) => {
    event.preventDefault();
    window.location.href = "single_proyect.html";
    let project_name = localStorage.getItem("single_project")
    var username = localStorage.getItem("username");
    let task = document.getElementById('taskName').value;
    let due_date = document.getElementById('dueDate').value;
    let member = document.getElementById('members').value;
    
    // Crear un objeto con los dos campos
    const message = {
      operation: "ADD_TASK",
      username: username,
      project_name: project_name,
      task: task,
      due_date: due_date,
      members: member,
      };

    // Convierte el objeto a una cadena JSON antes de enviarlo
    socket.emit('message', JSON.stringify(message));
});


document.getElementById('newMemberForm').addEventListener('submit', (event) => {
  event.preventDefault();
  window.location.href = "single_proyect.html";
  let project_name = localStorage.getItem("single_project")
  var username = localStorage.getItem("username");
  let member = document.getElementById('memberName').value;

  
  // Crear un objeto con los dos campos
  const message = {
    operation: "ADD_MEMBER",
    username: username,
    project_name: project_name,
    member: member,
    };

  // Convierte el objeto a una cadena JSON antes de enviarlo
  socket.emit('message', JSON.stringify(message));
});



document.addEventListener("DOMContentLoaded", function() {
  // La página se ha cargado completamente, ejecutar funciones aquí

  // Escuchar el evento después de que se haya establecido la conexión
  socket.on("single", function(data) {
    console.log("Evento 'test' recibido:", data);
    const datos = JSON.parse(new TextDecoder().decode(data));
    const tareas = datos.tareas;
    const miembros = datos.members;
    renderizar_tareas(tareas);
    renderizar_miembros(miembros);
    //function that displays the available members to which tasks can be assigned to.
    assign_members(miembros);
    renderizar_calendario(tareas);
  });

  socket.on("single_no_user", function(data) {

    console.log(data)
    alert("THe member you are trying to add is not registered in the platform");
  }
  );

  // socket.on("single_member", function(data) {
  //   console.log("Evento 'test' recibido:", data);
  //   const tareas = JSON.parse(new TextDecoder().decode(data));
  //   renderizar_miembros(tareas);
  // }
  // );
  // Emitir el evento SINGLE_CONNECTED después de la conexión
  socket.emit("SINGLE_CONNECTED");

  // Llamar a display_project después de la conexión para solicitar al servidor 
  //la información del proyecto
  // renderizar_fase();
  display_project();
  gitHub();
  
});

