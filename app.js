const API = "https://api.restcountries.com/countries/v5";

const form = document.getElementById("formBuscar");
const mensaje = document.getElementById("mensaje");
const resultados = document.getElementById("resultados");
const selRegion = document.getElementById("selRegion");
const selOrden = document.getElementById("selOrden");

let paisesActuales = [];

async function pedir(url) {
  let respuesta;
  try {
    respuesta = await fetch(url);
  } catch (error) {
    throw new Error("No hay conexión con el servidor. Revisa tu internet.");
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401 || respuesta.status === 403) {
      console.log("Detalle del error:", await respuesta.text());
      throw new Error("La llave de la API no es válida o no tiene permiso.");
    }
    if (respuesta.status === 404) {
      throw new Error("No se encontró ningún país con ese nombre.");
    }
    throw new Error(`Error del servidor (código ${respuesta.status}).`);
  }

  const datos = await respuesta.json();
  const lista = datos.data?.objects ?? datos.data ?? datos;

  if (!Array.isArray(lista) || lista.length === 0) {
    throw new Error("No se encontró ningún país con ese nombre.");
  }
  return lista;
}

function buscarPais(nombre) {
  return pedir(`${API}?q=${encodeURIComponent(nombre)}&api-key=${API_KEY}`);
}

// Reto 1: países de una región
function buscarRegion(region) {
  return pedir(
    `${API}?region=${encodeURIComponent(region)}&limit=100&api-key=${API_KEY}`
  );
}

function ordenar(paises) {
  const copia = [...paises];
  if (selOrden.value === "mayor") {
    copia.sort((a, b) => (b.population ?? 0) - (a.population ?? 0));
  } else if (selOrden.value === "menor") {
    copia.sort((a, b) => (a.population ?? 0) - (b.population ?? 0));
  }
  return copia;
}

function mostrarPaises(paises) {
  resultados.innerHTML = "";

  paises.forEach((pais) => {
    const idiomas =
      pais.languages?.map((l) => l.name).join(", ") || "Sin datos";
    const monedas =
      pais.currencies?.map((m) => `${m.name} (${m.symbol})`).join(", ") ||
      "Sin datos";

    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta";
    tarjeta.innerHTML = `
      <img src="${pais.flag?.url_png ?? ""}" alt="Bandera de ${pais.names.common}">
      <h3>${pais.names.common}</h3>
      <p><b>Capital:</b> ${pais.capitals?.[0]?.name ?? "Sin capital"}</p>
      <p><b>Región:</b> ${pais.region}</p>
      <p><b>Población:</b> ${(pais.population ?? 0).toLocaleString("es-MX")}</p>
      <div class="detalle">
        <p><b>Idiomas:</b> ${idiomas}</p>
        <p><b>Moneda:</b> ${monedas}</p>
      </div>
    `;

    tarjeta.addEventListener("click", () => {
      tarjeta.classList.toggle("abierta");
    });

    resultados.appendChild(tarjeta);
  });
}

function render() {
  mostrarPaises(ordenar(paisesActuales));
}

async function cargar(funcionBusqueda) {
  mensaje.textContent = "Cargando...";
  try {
    paisesActuales = await funcionBusqueda();
    render();
    mensaje.textContent = `${paisesActuales.length} resultado(s)`;
  } catch (error) {
    paisesActuales = [];
    resultados.innerHTML = "";
    mensaje.textContent = error.message;
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = document.getElementById("txtPais").value.trim();
  selRegion.value = "";
  cargar(() => buscarPais(nombre));
});

selRegion.addEventListener("change", () => {
  if (selRegion.value === "") return;
  document.getElementById("txtPais").value = "";
  cargar(() => buscarRegion(selRegion.value));
});

selOrden.addEventListener("change", () => {
  if (paisesActuales.length > 0) render();
});