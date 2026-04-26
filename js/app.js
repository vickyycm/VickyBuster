let peliculas = [];

let filtros = {
  estado: 'todos',
  genero: 'todos'
};

let idEditando = null;

/*localstorage*/ 
const STORAGE_KEY = 'cinelog_peliculas';

function guardarEnStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(peliculas, null, 2));
}

function cargarDesdeStorage() {
  const datos = localStorage.getItem(STORAGE_KEY);
  return datos ? JSON.parse(datos) : [];
}


/*filtros*/
function aplicarFiltros() {
  let resultado = peliculas.filter(function(pelicula) {
    if (filtros.estado === 'todos') return true;
    return pelicula.estado === filtros.estado;
  });

  resultado = resultado.filter(function(pelicula) {
    if (filtros.genero === 'todos') return true;
    return pelicula.genero === filtros.genero;
  });

  return resultado;
}

/*funciones filtros*/ 
function actualizarFiltroGeneros() {
  const select = document.getElementById('filtro-genero');
  const valorActual = select.value;

  const generosUnicos = peliculas
    .map(function(p) { return p.genero; })
    .filter(function(genero, indice, arr) {
      return arr.indexOf(genero) === indice;
    })
    .sort();

  select.innerHTML = '<option value="todos">Todos los géneros</option>';

  generosUnicos.forEach(function(genero) {
    const option = document.createElement('option');
    option.value = genero;
    option.textContent = genero;
    if (genero === valorActual) option.selected = true;
    select.appendChild(option);
  });
}



/*metricas de peliculas*/
function actualizarMetricas() {
  const total = peliculas.length;

  const acumulado = peliculas.reduce(function(acc, pelicula) {
    if (pelicula.estado === 'vista') acc.vistas++;
    if (pelicula.puntaje > 0) acc.sumaPuntaje += pelicula.puntaje;
    return acc;
  }, { vistas: 0, sumaPuntaje: 0 });

  const conPuntaje = peliculas.filter(function(p) { return p.puntaje > 0; });
  const promedio = conPuntaje.length > 0
    ? (acumulado.sumaPuntaje / conPuntaje.length).toFixed(1)
    : '—';

  document.getElementById('met-total').textContent = total;
  document.getElementById('met-vistas').textContent = acumulado.vistas;
  document.getElementById('met-promedio').textContent = promedio;

  const badge = document.getElementById('header-count');
  if (total > 0) {
    badge.textContent = `Viste ${acumulado.vistas} de ${total} película${total !== 1 ? 's' : ''}`;
  } else {
    badge.textContent = '0';
  }
}


/*edicion de card pelicula*/
function renderPeliculas() {
  const container  = document.getElementById('movies-container');
  const emptyState = document.getElementById('empty-state');
  const countLabel = document.getElementById('resultado-count');

  const peliculasFiltradas = aplicarFiltros();

  container.innerHTML = '';

  if (peliculasFiltradas.length === 0) {
    emptyState.classList.remove('hidden');
    countLabel.textContent   = peliculas.length > 0
      ? 'Sin resultados para los filtros aplicados'
      : '';
  } else {
    emptyState.classList.add('hidden');
    countLabel.textContent   = `${peliculasFiltradas.length} película${peliculasFiltradas.length !== 1 ? 's' : ''}`;
  }

  peliculasFiltradas.forEach(function(pelicula) {
    const card = crearTarjeta(pelicula);
    container.appendChild(card);
  });

  actualizarMetricas();
  actualizarFiltroGeneros();
}

function crearTarjeta(pelicula) {
  const card = document.createElement('div');
  card.classList.add('movie-card');
  card.dataset.id = pelicula.id;

  const header = document.createElement('div');
  header.classList.add('card-header');

  const titulo = document.createElement('h3');
  titulo.classList.add('card-title');
  titulo.textContent = pelicula.titulo;

  const puntaje = document.createElement('span');
  puntaje.classList.add('card-score');
  puntaje.textContent = pelicula.puntaje > 0 ? pelicula.puntaje + '★' : '—';

  header.appendChild(titulo);
  header.appendChild(puntaje);

  const meta = document.createElement('div');
  meta.classList.add('card-meta');

  const tagGenero = document.createElement('span');
  tagGenero.classList.add('tag-genero');
  tagGenero.textContent = pelicula.genero;

  const tagEstado = document.createElement('span');
  tagEstado.classList.add(
    'tag-estado',
    pelicula.estado === 'vista' ? 'tag-estado--vista' : 'tag-estado--pendiente'
  );
  tagEstado.textContent = pelicula.estado === 'vista' ? '✓ Vista' : '◷ Pendiente';

  meta.appendChild(tagGenero);
  meta.appendChild(tagEstado);

  const actions = document.createElement('div');
  actions.classList.add('card-actions');

  const btnEditar = document.createElement('button');
  btnEditar.classList.add('btn-icon');
  btnEditar.textContent = '✎ Editar';
  btnEditar.addEventListener('click', function(e) {
    e.stopPropagation(); 
    abrirModalEdicion(pelicula.id);
  });

  const btnEliminar = document.createElement('button');
  btnEliminar.classList.add('btn-icon', 'btn-icon--danger');
  btnEliminar.textContent = '✕ Eliminar';
  btnEliminar.addEventListener('click', function() {
    eliminarPelicula(pelicula.id);
  });

  actions.appendChild(btnEditar);
  actions.appendChild(btnEliminar);

  card.appendChild(header);
  card.appendChild(meta);
  card.appendChild(actions);

  return card;
}

/*toma de datos formulario*/ 
function generarId() {
  if (peliculas.length === 0) return 1;
  const maxId = peliculas.reduce(function(max, p) {
    return p.id > max ? p.id : max;
  }, 0);
  return maxId + 1;
}

function leerFormulario() {
  const titulo   = document.getElementById('input-titulo').value.trim();
  const genero   = document.getElementById('input-genero').value;
  const estadoEl = document.querySelector('input[name="estado"]:checked');
  const estado   = estadoEl ? estadoEl.value : null;
  const errorEl  = document.getElementById('form-error');

  const puntajeRaw = document.getElementById('input-puntaje').value;
  const puntaje    = puntajeRaw !== '' ? parseInt(puntajeRaw, 10) : 0;

  if (!titulo) {
    errorEl.textContent = 'El título es obligatorio.';
    return null;
  }
  if (!genero) {
    errorEl.textContent = 'Seleccioná un género.';
    return null;
  }
  if (!estado) {
    errorEl.textContent = 'Seleccioná un estado.';
    return null;
  }
  if (estado === 'vista' && (isNaN(puntaje) || puntaje < 1 || puntaje > 10)) {
    errorEl.textContent = 'Las películas vistas requieren un puntaje entre 1 y 10.';
    return null;
  }
  if (puntajeRaw !== '' && (isNaN(puntaje) || puntaje < 1 || puntaje > 10)) {
    errorEl.textContent = 'El puntaje debe ser un número entre 1 y 10.';
    return null;
  }

  errorEl.textContent = '';
  return { titulo, genero, puntaje, estado };
}

function limpiarFormulario() {
  document.getElementById('input-titulo').value  = '';
  document.getElementById('input-genero').value  = '';
  document.getElementById('input-puntaje').value = '';
  document.querySelector('input[name="estado"][value="pendiente"]').checked = true;
  document.getElementById('form-error').textContent = '';
}

function agregarPelicula() {
  const datos = leerFormulario();
  if (!datos) return;

  const nueva = {
    id:      generarId(),
    titulo:  datos.titulo,
    genero:  datos.genero,
    puntaje: datos.puntaje,
    estado:  datos.estado
  };

  peliculas.push(nueva);
  guardarEnStorage();
  limpiarFormulario();
  renderPeliculas();
}

function eliminarPelicula(id) {
  peliculas = peliculas.filter(function(p) { return p.id !== id; });
  guardarEnStorage();
  renderPeliculas();
}

function abrirModalEdicion(id) {
  const pelicula = peliculas.find(function(p) { return p.id === id; });
  if (!pelicula) return;

  idEditando = id;

  document.getElementById('edit-titulo').value  = pelicula.titulo;
  document.getElementById('edit-genero').value  = pelicula.genero;
  document.getElementById('edit-puntaje').value = pelicula.puntaje > 0 ? pelicula.puntaje : '';

  const radioEditar = document.querySelector(
    `input[name="edit-estado"][value="${pelicula.estado}"]`
  );
  if (radioEditar) radioEditar.checked = true;

  setTimeout(function() {
    const overlay = document.getElementById('edit-modal');
    const modalInner = overlay.querySelector('.edit-modal-box');
    
    overlay.style.display = 'grid';
    overlay.style.placeItems = 'center';
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1';
    
    modalInner.style.display = 'block';
    modalInner.style.visibility = 'visible';
    modalInner.style.opacity = '1';
    modalInner.style.minWidth = '300px';
    modalInner.style.maxWidth = '450px';
    modalInner.style.width = 'auto';
  }, 0);
}

function cerrarModal() {
  const overlay = document.getElementById('edit-modal');
  overlay.style.display = 'none';
  overlay.style.visibility = 'hidden';
  overlay.style.opacity = '0';
  idEditando = null;
}

function guardarEdicion() {
  if (!idEditando) return;

  const titulo   = document.getElementById('edit-titulo').value.trim();
  const genero   = document.getElementById('edit-genero').value;
  const estadoEl = document.querySelector('input[name="edit-estado"]:checked');
  const estado   = estadoEl ? estadoEl.value : null;

  const puntajeRaw = document.getElementById('edit-puntaje').value;
  const puntaje    = puntajeRaw !== '' ? parseInt(puntajeRaw, 10) : 0;

  if (!titulo || !genero || !estado) {
    alert('Título, género y estado son obligatorios.');
    return;
  }
  if (estado === 'vista' && (isNaN(puntaje) || puntaje < 1 || puntaje > 10)) {
    alert('Las películas vistas requieren un puntaje entre 1 y 10.');
    return;
  }
  if (puntajeRaw !== '' && (isNaN(puntaje) || puntaje < 1 || puntaje > 10)) {
    alert('El puntaje debe ser un número entre 1 y 10.');
    return;
  }

  peliculas = peliculas.map(function(p) {
    if (p.id === idEditando) {
      return { ...p, titulo, genero, puntaje, estado };
    }
    return p;
  });

  guardarEnStorage();
  cerrarModal();
  renderPeliculas();
}


/*registro de eventos*/
function registrarEventos() {
  document.getElementById('btn-agregar')
    .addEventListener('click', agregarPelicula);

  document.getElementById('input-titulo')
    .addEventListener('keydown', function(e) {
      if (e.key === 'Enter') agregarPelicula();
    });

  document.getElementById('filtro-estado')
    .addEventListener('change', function(e) {
      filtros.estado = e.target.value;
      renderPeliculas();
    });

  document.getElementById('filtro-genero')
    .addEventListener('change', function(e) {
      filtros.genero = e.target.value;
      renderPeliculas();
    });

  document.getElementById('btn-limpiar-filtros')
    .addEventListener('click', function() {
      filtros.estado = 'todos';
      filtros.genero = 'todos';
      document.getElementById('filtro-estado').value = 'todos';
      document.getElementById('filtro-genero').value = 'todos';
      renderPeliculas();
    });

  document.getElementById('edit-modal-close')
    .addEventListener('click', cerrarModal);

  document.getElementById('edit-modal')
    .addEventListener('click', function(e) {
      if (e.target.id === 'edit-modal') cerrarModal();
    });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') cerrarModal();
  });

  document.getElementById('btn-guardar-edicion')
    .addEventListener('click', guardarEdicion);
}


/*inicializa*/
function init() {
  peliculas = cargarDesdeStorage();
  registrarEventos();
  actualizarFiltroGeneros();
  renderPeliculas();
}

document.addEventListener('DOMContentLoaded', init);