// cliente.js
const socket = io.connect();
const crear_proyecto = document.getElementById('crear_proyecto');
const dashboard = document.getElementById('dashboard');
const editar_proyecto = document.getElementById('editar_proyecto');
const boton_ia = document.getElementById('boton_ia');
const username = document.getElementById('username');

username.textContent = localStorage.getItem("username");

function calcular_estadisticas(){
  const message = {
    operation: "ESTADISTICAS",
    username: localStorage.getItem("username")
  };
  socket.emit('message', JSON.stringify(message));
};

function ia(){
  const message = {
    operation: "IA",
    username: localStorage.getItem("username")
  };
  socket.emit('message', JSON.stringify(message));
};


function handleClickOnProject(projectName, date, complexity, state) {
  // Esta función se ejecutará al hacer clic en un proyecto
  localStorage.setItem("single_project", projectName);
  localStorage.setItem("single_project_date", date);
  localStorage.setItem("single_project_complexity", complexity);
  localStorage.setItem("single_project_state", state);
  console.log(`Se hizo clic en el proyecto: ${projectName}`);
  window.location.href = "../single_proyect/single_proyect.html";

}





function renderizar_proyectos(estadisticas, searchInput) {
  console.log(searchInput)
  // Ordenar los proyectos por los días restantes de menos a más
  estadisticas.sort((a, b) => {
      const hoy = new Date();
      const projectDateA = new Date(a.date);
      const projectDateB = new Date(b.date);
      const daysRemainingA = Math.round((projectDateA - hoy) / (24 * 60 * 60 * 1000));
      const daysRemainingB = Math.round((projectDateB - hoy) / (24 * 60 * 60 * 1000));
      return daysRemainingA - daysRemainingB;
  });

  const projectGallery = document.getElementById("proyect_gallery");

  // Elimina todos los elementos existentes en el contenedor
  projectGallery.innerHTML = "";

  // Colores disponibles para la línea vertical, el nombre del proyecto y la barra de progreso
  const colors = ['#0061f2', '#f4a100', '#00ac69', '#e81500', '#440ca5'];
  let colorIndex = 0;

  // Resto del código para renderizar los proyectos...
  estadisticas.forEach(project => {
    console.log(project.name)
    if (searchInput === "" || project.name.toLowerCase().includes(searchInput.toLowerCase())) {
        console.log("hola")
        const projectElement = document.createElement("div");
        projectElement.classList.add("col-xl-3", "col-md-6", "mb-4");
        projectElement.classList.add("project");
        

        const cardElement = document.createElement("div");
        cardElement.classList.add("card", "shadow", "h-100", "py-2");
        // Color de la línea vertical
        cardElement.style.borderLeftColor = colors[colorIndex]; 
        // Grosor de la línea vertical
        cardElement.style.borderLeftWidth = "5px";

        const cardBodyElement = document.createElement("div");
        cardBodyElement.classList.add("card-body");

        const rowElement = document.createElement("div");
        rowElement.classList.add("row", "no-gutters", "align-items-center");

        const colElement = document.createElement("div");
        colElement.classList.add("col", "mr-2");

        const textElement1 = document.createElement("div");
        textElement1.classList.add("text-m", "font-weight-bold", "text-uppercase", "mb-1");
        textElement1.textContent = project.name;
        textElement1.style.color = colors[colorIndex]; // Color del nombre del proyecto

        const progressContainer = document.createElement("div");
        progressContainer.classList.add("progress");

        const progressBar = document.createElement("div");
        progressBar.classList.add("progress-bar", "progress-bar-animated"); // Cambiar el color aquí
        progressBar.setAttribute("role", "progressbar");
        progressBar.style.width = "0%"; // Barra de progreso inicialmente vacía
        progressBar.setAttribute("aria-valuenow", "0");
        progressBar.setAttribute("aria-valuemin", "0");
        progressBar.setAttribute("aria-valuemax", "100");
        progressBar.style.backgroundColor = colors[colorIndex]; // Color de la barra de progreso
        progressBar.style.tabSize = "rem";


        const progressBarText = document.createElement("span");
        progressBarText.textContent = `${project.porcentaje}% `;
        progressBarText.style.fontSize = "1rem";

        progressBar.appendChild(progressBarText);
        progressContainer.appendChild(progressBar);

        const textElement2 = document.createElement("div");
        textElement2.classList.add("h5", "mb-0", "font-weight-bold", "text-gray-800");
        textElement2.appendChild(progressContainer);

        

        
        const textElement3 = document.createElement("div");
        textElement3.classList.add("text", "mb-1", "text-center", "fs-3");
        textElement3.style.paddingTop = "20px"; // Agrega un padding en la parte superior
        textElement3.style.fontSize = "1.2rem";
        textElement3.style.fontWeight = "bold";
        
        // Días que quedan para el deadline
        const unDiaEnMilisegundos = 24 * 60 * 60 * 1000;
        const hoy = new Date();
        const projectDate = new Date(project.date);
        const daysRemaining = Math.round((projectDate - hoy) / unDiaEnMilisegundos);
        
        // Crear elemento para el número de días
        const daysNumberElement = document.createElement("span");
        daysNumberElement.textContent = daysRemaining;
        daysNumberElement.style.marginRight = "5px"; // Espacio entre el número y la palabra "días"
        
        // Crear elemento para la palabra "días"
        const daysTextElement = document.createElement("span");
        daysTextElement.textContent = "days";
        
        // Agregar elementos al contenedor principal
        textElement3.appendChild(daysNumberElement); 
        textElement3.appendChild(daysTextElement); 
        
        textElement3.style.color = colors[colorIndex];
        
        const minWidth = `${daysTextElement.offsetWidth + daysNumberElement.offsetWidth + 5}px`; 
        textElement3.style.minWidth = minWidth; 
        
        colElement.appendChild(textElement1);
        colElement.appendChild(textElement2);
        colElement.appendChild(textElement3);
        rowElement.appendChild(colElement);
        cardBodyElement.appendChild(rowElement);
        cardElement.appendChild(cardBodyElement);
        projectElement.appendChild(cardElement);

        projectGallery.appendChild(projectElement);

        colorIndex = (colorIndex + 1) % colors.length;

        setTimeout(() => {
          progressBar.style.width = `${project.porcentaje}%`;
          progressBar.setAttribute("aria-valuenow", project.porcentaje);
        }, 100);

        projectElement.addEventListener('click', function() {
          console.log(`Se hizo clic en el proyecto: ${project.date}`);
          handleClickOnProject(project.name, project.date, project.complexity, project.state);
        });
      }
      

  }
  );
  
}


function renderizar_prediccion(predicciones) {
  console.log("RENDERIZANDO PREDICCIONES");
  const prediccionGallery = document.getElementById("predicciones");
  prediccionGallery.innerHTML = "";
  
  // Ocultar la imagen gradualmente con una clase CSS
  let img = document.getElementById("img_prediccion");
  img.classList.add("pulse");

  // Ordenar las predicciones por criticidad de mayor a menor
  predicciones.sort((a, b) => b.criticidad - a.criticidad);

  // Crear una tabla
  const table = document.createElement("table");
  table.classList.add("table"); // Agregar clases de Bootstrap si es necesario

  // Crear encabezado de la tabla
  const headerRow = table.createTHead().insertRow();
  const idHeader = document.createElement("th");
  idHeader.textContent = "ID Proyecto";
  headerRow.appendChild(idHeader);
  const criticidadHeader = document.createElement("th");
  criticidadHeader.textContent = "Criticidad";
  headerRow.appendChild(criticidadHeader);

  // Iterar sobre las predicciones y agregar filas a la tabla
  predicciones.forEach(prediccion => {
    const row = table.insertRow();
    const idCell = row.insertCell();
    idCell.textContent = prediccion.ID;
    const criticidadCell = row.insertCell();
    criticidadCell.textContent = prediccion.Criticidad;
  });

  setTimeout(function() {
    img.style.display = "none"; // Ocultar completamente la imagen si es necesario
    prediccionGallery.appendChild(table);
  }, 1500);
  // Agregar la tabla al contenedor en el HTML
  

}

function contarProyectosPorMes(estadisticas) {
  const proyectosPorMes = [];

  // Inicializar el array de objetos con 0 proyectos para cada mes
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  meses.forEach(mes => {
    proyectosPorMes.push({ mes: mes, cantidad: 0 });
  });

  // Contar proyectos por mes
  estadisticas.forEach(proyecto => {
    const mesIndex = new Date(proyecto.date).getMonth();
    proyectosPorMes[mesIndex].cantidad++;
  });
  console.log(proyectosPorMes);

  return proyectosPorMes;
}



renderizar_distribucion_proyectos = (estadisticas) => {

  const ctx = document.getElementById('proyectosPorMesChart').getContext('2d');
      const proyectosPorMes = contarProyectosPorMes(estadisticas);
      const cantidades = proyectosPorMes.map(proyecto => proyecto.cantidad);
  
      // Crear el gráfico de barras
      new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            datasets: [{
              label: "Número de Proyectos",
              data: cantidades,
              fill: true, // Rellenar el área debajo de la curva
              backgroundColor: 'rgba(78, 115, 223, 0.05)', // Color del área debajo de la curva
              borderColor: '#0061f2', // Color de la línea
              borderWidth: 2, // Ancho de la línea
              pointRadius: 3, // Tamaño de los puntos
              pointBackgroundColor: '#0061f2', // Color de los puntos
              pointBorderColor: '#0061f2', // Color del borde de los puntos
              pointHoverRadius: 3, // Tamaño de los puntos al pasar el mouse sobre ellos
              pointHoverBackgroundColor: '#0061f2', // Color de los puntos al pasar el mouse sobre ellos
              pointHoverBorderColor: '#0061f2', // Color del borde de los puntos al pasar el mouse sobre ellos
              pointHitRadius: 10, // Área de detección de clics/hover sobre los puntos
              pointBorderWidth: 2 // Ancho del borde de los puntos
            }]
          },
          options: {
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true
                },
                gridLines: {
                  display: false // Deshabilita las líneas de la cuadrícula horizontales
                }
              }],
              xAxes: [{
                gridLines: {
                  display: false // Deshabilita las líneas de la cuadrícula verticales
                }
              }]
            },
            legend: {
              display: false, // Esto asegura que la leyenda se muestre
              labels: {
                fontColor: '#333', // Cambia aquí el color de la fuente de la leyenda
                fontSize: 12, // Cambia aquí el tamaño de la fuente de la leyenda
                fontStyle: 'normal' // Cambia aquí el estilo de la fuente de la leyenda (normal, italic, bold)
              }
            },
            elements: {
              line: {
                tension: 0.4
              }
            }
          }
        });
};

renderizar_calendario = (estadisticas) => {
  var calendarEl = document.getElementById('calendar');

  // Crear un array de eventos a partir de estadisticas
  var eventos = estadisticas.map(proyecto => {
      return {
          title: proyecto.name, // Asume que cada proyecto tiene una propiedad 'nombre'
          start: proyecto.date, // Asume que cada proyecto tiene una propiedad 'fechaInicio'
          
      };
  });

  var calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      events: eventos
  });

  calendar.render();
};


// Función para mostrar los proyectos en la página
document.querySelector('.btn.btn-primary').addEventListener('click', function() {
  var searchInput = document.querySelector('.form-control.bg-light.border-0.small').value;
  localStorage.setItem("searchInput", searchInput);
  //recargar la pagina
  location.reload();
  // var filteredProjects = projects.filter(function(project) {
  //   return project.name.includes(searchInput);
  // });
  // displayProjects(filteredProjects);
});


document.addEventListener("DOMContentLoaded", function() {
  // La página se ha cargado completamente, ejecutar funciones aquí
  
  // Escuchar el evento test después de que se haya establecido la conexión
  socket.on("login", function(data){  
      const estadisticas = JSON.parse(new TextDecoder().decode(data));
      searchInput = localStorage.getItem("searchInput");
      
      if (searchInput === null) {
          searchInput = "";
      }
      renderizar_proyectos(estadisticas, searchInput);
      localStorage.setItem("searchInput", "");  

      renderizar_distribucion_proyectos(estadisticas);
      renderizar_calendario(estadisticas);
  });

  socket.on("prediccion", function(data){
    console.log("PREDICCION RECIBIDA");    
    const prediccion = JSON.parse(new TextDecoder().decode(data));
    console.log(prediccion);
    renderizar_prediccion(prediccion);
  
  });

  // Emitir el evento SINGLE_CONNECTED después de la conexión
  socket.emit("MAIN_CONNECTED");

  // Llamar a que calcula las estadísticas después de la conexión para solicitar al servidor la información del proyecto
  calcular_estadisticas();
});



// Funcionalidad boton ia
boton_ia.addEventListener('click', function() {
  console.log("Has hecho clic en el botón de IA");
  ia();

});


