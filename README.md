# Trabajo práctico 05
## Descripción
Este proyecto consiste en una aplicacion web para gestionar reservas de salas
## Instalación
Abrir la terminal en la carpeta del proyecto.
Ejecutar:
npm install
## Ejecución
Para iniciar la aplicacion:
npm start
La aplicacion queda disponible en: http://localhost:3500
## Rutas

GET `/` → muestra la pantalla de inicio.
GET `/reservas` → lista todas las reservas.
GET `/reservas/nueva` → muestra el formulario para crear una reserva.
POST `/reservas` → recibe los datos del formulario y crea una nueva reserva.
GET `/reservas/:id` → muestra el detalle de una reserva en particular.
GET `/api/reservas` → devuelve el listado de reservas en formato JSON.
Cualquier otra ruta → responde con una vista 404.
## Pipeline de middleware
El flujo de la aplicacion se organiza aso:

express.urlencoded({ extended: false }): Permite leer los datos enviados por formularios HTML.
express.json(): Permite leer datos enviados en formato JSON.
morgan("dev"): Registra cada solicitud en la consola.
identificarSolicitud: Genera un identificador unico para cada request.
medirDuracion: Mide el tiempo que tarda en procesarse la request.
prepararAreaReservas: Define el contexto de la seccion actual para la vista.
reservasRouter:  Agrupa las rutas relacionadas con reservas y les aplica comportamiento especifico.
validarReserva: Evalua que los campos del formulario sean correctos antes de guardar.
crearReserva: Guarda la reserva y redirige al listado.
## Alcance de cada función

identificarSolicitud(req, res, next): Asigna un identificador por peticion para poder distinguir cada solicitud en los log.
medirDuracion(req, res, next): Calcula cuanto tarda una peticion y muestra el resultado cuando termina la respuesta con finish.
prepararAreaReservas(req, res, next): Agrega informacion al contexto local para que las vistas sepan que estan dentro del area de reservas.
validarReserva(req, res, next): Revisa que los campos sean obligatorios y validos antes de continuar con la creacian.
crearReserva(req, res):  Genera un nuevo id y agrega la reserva al array en memoria.
reservasRouter : Agrupa las rutas /reservas, /reservas/nueva, /reservas/:id y aplica middleware comun a todas ellas.
## Validación
La validacion se realiza en validarReserva antes de crear la reserva. Se revisan estos puntos:
nombre no vacio;
fecha no vacia;
horario no vacio;
sala seleccionada;
cantidad de participantes valida y mayor a 0;
descripcion no vacia.

Si algun dato es invalido, la aplicacion renderiza otra vez la vista reservas/nueva con un mensaje de error y conserva los valores ingresados en el formulario para evitar perder la informacion.

## Pruebas manuales
Se pueden probar estas situaciones de forma manual en el navegador:

Abrir la home en `/` y verificar que carga bien la vista principal.
Entrar a `/reservas` y comprobar que se muestran las reservas cargadas.
Ir a `/reservas/nueva` y completar el formulario con datos válidos.
Confirmar que al guardar se redirige a `/reservas`.
Intentar enviar un formulario vacío o con datos inválidos y verificar el mensaje de error.
Acceder a `/reservas/999` para comprobar que se renderiza la vista 404.
Consultar `/api/reservas` para corroborar que la API devuelve JSON.

## Persistencia temporal
La persistencia en este ejercicio es temporal porque los datos se leen desde archivos JSON al iniciar la aplicacion y se almacenan en memoria en variables del servidor. 

## Explicar con palabras propias

 Diferencia entre middleware incorporado, de terceros y personalizado:
  incorporado: viene con Express y se usa directamente, por ejemplo express.urlencoded() o express.json()
  de terceros: es un paquete instalado desde npm, por ejemplo morgan
  personalizado: es una funcion creada por nosotros para una tarea especifica, como identificarSolicitud o validarReserva.

 Cuando se utiliza next():
  se usa cuando un middleware quiere continuar con la siguiente funcion. Si no llama a next() la peticion queda detenida y no pasa a la siguiente etapa.

Por que los parsers aparecen antes de la validación:
  porque la validacion necesita leer los datos del cuerpo y sin parsear req.body no tendria el formato correcto.

Diferencia entre alcance global, de router y de ruta:
  global: aplica a todas las solicitudes de la app, usando app.use();
  de router: aplica a todas las rutas que esten montadas dentro de ese router;
  de ruta: solo se ejecuta en una ruta concreta, por ejemplo app.get('/reservas', ...) o router.post('/', validarReserva, crearReserva).

Motivo del evento finish:
 permite ejecutar logica justo cuando la respuesta ya fue terminada, por ejemplo para medir el tiempo total de la peticion y registrar el resultado.

Resultado del montaje del router:
 el router encapsula rutas relacionadas y luego se monta con app.use('/reservas', reservasRouter). Eso hace que todas las rutas internas del router queden disponibles bajo el prefijo /reservas.

Diferencia entre el POST 302 y el GET posterior:
  el POST con estado 302 indica que la respuesta redirige al cliente a otra URL luego el navegador hace un GET a esa nueva URL, que es la vista final que se muestra.

Motivo por el cual las altas desaparecen al reiniciar:
  porque la aplicación guarda la información solo en memoria y no persiste en una base de datos ni en un archivo de escritura real para cada alta. Al reiniciar, el server vuelve a cargar el JSON inicial.
