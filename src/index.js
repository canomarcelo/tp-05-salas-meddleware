const express = require("express");
const path = require("node:path");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");
const { leerJson } = require("./archivos");

const port = 3500;
let numeroDeSolicitud = 0;

const rutaSalas = path.join(__dirname, "..", "datos", "salas.json");
const rutaReservas = path.join(__dirname, "..", "datos", "reservas.json");

function identificarSolicitud(req, res, next) {
  numeroDeSolicitud += 1;
  res.locals.solicitudId = `SOL-${String(numeroDeSolicitud).padStart(4, "0")}`;
  next();
}

function medirDuracion(req, res, next) {

  const inicio = process.hrtime.bigint();
  res.on("finish", () => {
    const fin = process.hrtime.bigint();
    const milisegundos = Number(fin - inicio) / 1_000_000;
    console.log(`[${res.locals.solicitudId}] ${req.method} ${req.originalUrl} ${res.statusCode} ${milisegundos.toFixed(2)} ms`);
  });
  next();
}

function prepararAreaReservas(req, res, next) {

  res.locals.seccion = "Reservas de salas";
  next();
}

function validarReserva(req, res, next) {

  const nombre = String(req.body.nombre ?? "").trim();
  const fecha = String(req.body.fecha ?? "").trim();
  const horario = String(req.body.horario ?? "").trim();
  const sala = String(req.body.sala ?? "").trim();
  const participantes = Number(req.body.participantes);
  const descripcion = String(req.body.descripcion ?? "").trim();

  if (!nombre || !fecha || !horario || !sala || !Number.isFinite(participantes) || participantes <= 0 || !descripcion) {
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva reserva",
      error: "Completá todos los campos con valores válidos.",
      valores: req.body,
    });
  }

  req.reservaValidada = { nombre, fecha, horario, sala, participantes, descripcion };
  next();
}

async function main() {
  
  const salas = await leerJson(rutaSalas);
  const reservas = await leerJson(rutaReservas);
  const app = express();

  function crearReserva(req, res) {
    const ultimoId = reservas.reduce((mayorId, reserva) => Math.max(mayorId, reserva.id), 0);
    reservas.push({ id: ultimoId + 1, ...req.reservaValidada });
    res.redirect("/reservas");
  }

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "views"));

  app.use(expressLayouts);
  app.use(express.static(path.join(__dirname, "..", "public")));
  app.set("layout", "layouts/main");
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(morgan("dev"));
  app.use(identificarSolicitud);
  app.use(medirDuracion);
  app.use(prepararAreaReservas);

  app.get("/", (req, res) => {
    res.render("inicio", { titulo: "Sistema de reservas" });
  });

  app.get("/api/reservas", (req, res) => {
    res.json(reservas);
  });

  const reservasRouter = express.Router();
  reservasRouter.use(prepararAreaReservas);

  reservasRouter.get("/", (req, res) => {
    res.render("reservas/lista", {
      titulo: "Reservas de salas",
      reservas,
    });
  });

  reservasRouter.get("/nueva", (req, res) => {
    res.render("reservas/nueva", {
      titulo: "Nueva reserva",
      error: null,
      valores: {},
      salas,
    });
  });

  reservasRouter.get("/:id", (req, res) => {
    const id = Number(req.params.id);
    const reserva = reservas.find((elemento) => elemento.id === id);

    if (!reserva) {
      return res.status(404).render("no-encontrado", {
        titulo: "Reserva no encontrada",
        mensaje: "No existe una reserva con ese identificador.",
      });
    }

    res.render("reservas/detalle", {
      titulo: reserva.nombre,
      reserva,
    });
  });

  reservasRouter.post("/", validarReserva, crearReserva);

  app.use("/reservas", reservasRouter);

  app.use((req, res) => {
    res.status(404).render("no-encontrado", {
      titulo: "Página no encontrada",
      mensaje: "La página que estás buscando no existe.",
    });
  });

  app.listen(port, () => {
    console.log(`Aplicación disponible en http://localhost:${port}`);
  });
}

main().catch((error) => {
  console.error("No se pudo iniciar la aplicación:", error);
  process.exitCode = 1;
});
