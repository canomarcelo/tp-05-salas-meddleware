const express = require("express");
const path = require("node:path");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");

const port = 3500;
let numeroDeSolicitud = 0;

const salasPermitidas = ["Sala Norte", "Sala Sur", "Sala Multimedia"];
const turnosPermitidos = ["Mañana", "Tarde", "Noche"];
const reservas = [
  {
    id: 1,
    estudiante: "Lucía Fernández",
    email: "lucia.fernandez@example.com",
    sala: "Sala Norte",
    fecha: "2026-10-06",
    turno: "Mañana",
    personas: 2,
  },
  {
    id: 2,
    estudiante: "Mateo González",
    email: "mateo.gonzalez@example.com",
    sala: "Sala Sur",
    fecha: "2026-10-06",
    turno: "Tarde",
    personas: 4,
  },
  {
    id: 3,
    estudiante: "Sofía Ramírez",
    email: "sofia.ramirez@example.com",
    sala: "Sala Multimedia",
    fecha: "2026-10-07",
    turno: "Noche",
    personas: 6,
  },
  {
    id: 4,
    estudiante: "Tomás Pérez",
    email: "tomas.perez@example.com",
    sala: "Sala Norte",
    fecha: "2026-10-08",
    turno: "Mañana",
    personas: 1,
  },
];

function identificarSolicitud(req, res, next) {
  numeroDeSolicitud += 1;
  res.locals.solicitudId = `BIB-${String(numeroDeSolicitud).padStart(4, "0")}`;
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
  const estudiante = String(req.body.estudiante ?? "").trim();
  const email = String(req.body.email ?? "").trim();
  const sala = String(req.body.sala ?? "").trim();
  const fecha = String(req.body.fecha ?? "").trim();
  const turno = String(req.body.turno ?? "").trim();
  const personas = Number(req.body.personas);

  if (
    !estudiante ||
    !email ||
    !email.includes("@") ||
    !sala ||
    !salasPermitidas.includes(sala) ||
    !fecha ||
    !turno ||
    !turnosPermitidos.includes(turno) ||
    !Number.isInteger(personas) ||
    personas < 1 ||
    personas > 6
  ) {
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva reserva",
      error: "Completá todos los campos con valores permitidos.",
      valores: req.body,
      salas: salasPermitidas,
      turnos: turnosPermitidos,
    });
  }

  req.reservaValidada = { estudiante, email, sala, fecha, turno, personas };
  next();
}

function main() {
  const app = express();

  function crearReserva(req, res) {
    const ultimoId = reservas.reduce((mayorId, reserva) => Math.max(mayorId, reserva.id), 0);
    reservas.push({ id: ultimoId + 1, ...req.reservaValidada });
    res.redirect("/reservas");
  }

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "views"));
  app.set("layout", "layouts/main");

  app.use(morgan("dev"));
  app.use(identificarSolicitud);
  app.use(medirDuracion);
  app.use(expressLayouts);
  app.use(express.static(path.join(__dirname, "..", "public")));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.get("/", (req, res) => {
    res.render("inicio", { titulo: "Sistema de reservas" });
  });

  app.get("/estado", (req, res) => {
    res.json({
      servicio: "activo",
      cantidad: reservas.length,
      solicitudId: res.locals.solicitudId,
    });
  });

  const reservasRouter = express.Router();
  reservasRouter.use(prepararAreaReservas);

  reservasRouter.get("/nueva", (req, res) => {
    res.render("reservas/nueva", {
      titulo: "Nueva reserva",
      error: null,
      valores: {},
      salas: salasPermitidas,
      turnos: turnosPermitidos,
    });
  });

  reservasRouter.get("/", (req, res) => {
    res.render("reservas/lista", {
      titulo: res.locals.seccion,
      reservas,
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
      titulo: reserva.estudiante,
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

main();
