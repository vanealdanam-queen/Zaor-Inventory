
import { useEffect, useState } from 'react';
import { inventario } from './data/Inventario';
import './App.css';

// Después cambia este número por tu WhatsApp.
// Formato: código de país + número, sin + ni espacios.
const WHATSAPP_NUMBER = '523325100719';

function App() {
  const [productos, setProductos] = useState(() => {
    try {
      const guardado = localStorage.getItem('inventario');
      return guardado ? JSON.parse(guardado) : inventario;
    } catch {
      return inventario;
    }
  });

  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [marcaFiltro, setMarcaFiltro] = useState('Todas');
  const [vista, setVista] = useState('catalogo');
  const [editando, setEditando] = useState(null);
  const [formulario, setFormulario] = useState({
    nombre: '',
    talla: 'M',
    marca: '',
    estado: 'Nueva',
    precio: '',
    cantidadDisponible: ''
  });

  useEffect(() => {
    localStorage.setItem('inventario', JSON.stringify(productos));
  }, [productos]);

  const marcas = [
    'Todas',
    ...new Set(productos.map((p) => p.marca).filter(Boolean))
  ];

  const productosFiltrados = productos.filter((p) => {
    const coincideTexto =
      `${p.nombre} ${p.marca} ${p.talla}`
        .toLowerCase()
        .includes(busqueda.toLowerCase());

    const coincideMarca =
      marcaFiltro === 'Todas' || p.marca === marcaFiltro;

    return coincideTexto && coincideMarca;
  });

  const totalUnidades = productos.reduce(
    (total, p) => total + Number(p.cantidadDisponible || 0),
    0
  );

  const totalCarrito = carrito.reduce(
    (total, item) => total + item.precio * item.cantidad,
    0
  );

  function agregarAlCarrito(producto) {
    const enCarrito = carrito.find((item) => item.id === producto.id);
    const cantidadActual = enCarrito ? enCarrito.cantidad : 0;

    if (cantidadActual >= Number(producto.cantidadDisponible)) {
      alert('No hay más existencias disponibles de este producto.');
      return;
    }

    setCarrito((actual) => {
      const existe = actual.find((item) => item.id === producto.id);

      if (existe) {
        return actual.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }

      return [...actual, { ...producto, cantidad: 1 }];
    });
  }

  function cambiarCantidad(id, cantidad) {
    const producto = productos.find((p) => p.id === id);
    const nuevaCantidad = Number(cantidad);

    if (!producto) return;

    if (nuevaCantidad <= 0) {
      setCarrito((actual) => actual.filter((item) => item.id !== id));
      return;
    }

    if (nuevaCantidad > Number(producto.cantidadDisponible)) {
      alert('La cantidad supera las existencias disponibles.');
      return;
    }

    setCarrito((actual) =>
      actual.map((item) =>
        item.id === id ? { ...item, cantidad: nuevaCantidad } : item
      )
    );
  }

  function enviarPedido() {
    if (carrito.length === 0) {
      alert('Agrega productos al carrito antes de continuar.');
      return;
    }
    


    if (!/^52\d{10}$/.test(WHATSAPP_NUMBER)) {
      alert(
        'Primero configura tu número de WhatsApp en App.jsx. ' +
        'Busca la variable WHATSAPP_NUMBER al principio del archivo.'
      );
      return;
    }

    const detalle = carrito
      .map(
        (item) =>
          `• ${item.nombre} (talla ${item.talla}) x ${item.cantidad}: ` +
          `$${(item.precio * item.cantidad).toFixed(2)}`
      )
      .join('\n');

    const mensaje =
      `Hola, quiero realizar un pedido en ZAOR:\n\n${detalle}\n\n` +
      `Total: $${totalCarrito.toFixed(2)}\n\n` +
      '¿Me pueden confirmar la disponibilidad y la entrega?';

    const url =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  }

 // NUEVA FUNCIÓN: COMPRA SIMULADA
  function comprarSimulado() {
    if (carrito.length === 0) {
      alert('El carrito está vacío.');
      return;
    }

    const compraValida = carrito.every((item) => {
      const producto = productos.find((p) => p.id === item.id);

      return (
        producto &&
        Number(producto.cantidadDisponible) >= item.cantidad
      );
    });

    if (!compraValida) {
      alert('No hay suficientes existencias para completar la compra.');
      return;
    }

    setProductos((actuales) =>
      actuales.map((producto) => {
        const comprado = carrito.find(
          (item) => item.id === producto.id
        );

        if (!comprado) return producto;

        return {
          ...producto,
          cantidadDisponible:
            Number(producto.cantidadDisponible) - comprado.cantidad
        };
      })
    );

    setCarrito([]);

    alert('¡Compra simulada realizada correctamente!');
  }
  
  function limpiarFormulario() {
    setEditando(null);
    setFormulario({
      nombre: '',
      talla: 'M',
      marca: '',
      estado: 'Nueva',
      precio: '',
      cantidadDisponible: ''
    });
  }

  function guardarProducto(e) {
    e.preventDefault();

    const nombre = formulario.nombre.trim();
    const marca = formulario.marca.trim();
    const precio = Number(formulario.precio);
    const cantidad = Number(formulario.cantidadDisponible);

    if (
      !nombre ||
      !marca ||
      formulario.precio === '' ||
      formulario.cantidadDisponible === '' ||
      !Number.isFinite(precio) ||
      precio < 0 ||
      !Number.isInteger(cantidad) ||
      cantidad < 0
    ) {
      alert('Revisa el nombre, la marca, el precio y la cantidad.');
      return;
    }

    if (editando !== null) {
      setProductos((actuales) =>
        actuales.map((p) =>
          p.id === editando
            ? {
                ...p,
                ...formulario,
                nombre,
                marca,
                precio,
                cantidadDisponible: cantidad
              }
            : p
        )
      );
    } else {
      const nuevoProducto = {
        ...formulario,
        id: Math.max(0, ...productos.map((p) => Number(p.id) || 0)) + 1,
        nombre,
        marca,
        precio,
        cantidadDisponible: cantidad
      };

      setProductos((actuales) => [...actuales, nuevoProducto]);
    }

    limpiarFormulario();
    alert('Producto guardado correctamente.');
  }

  function prepararEdicion(producto) {
    setEditando(producto.id);
    setFormulario({
      nombre: producto.nombre,
      talla: producto.talla,
      marca: producto.marca,
      estado: producto.estado,
      precio: String(producto.precio),
      cantidadDisponible: String(producto.cantidadDisponible)
    });
  }

  function eliminarProducto(id) {
    if (!window.confirm('¿Seguro que quieres eliminar este producto?')) {
      return;
    }

    setProductos((actuales) => actuales.filter((p) => p.id !== id));
    setCarrito((actuales) => actuales.filter((item) => item.id !== id));

    if (editando === id) limpiarFormulario();
  }

  return (
    <div className="App">
      <header className="encabezado">
        <div>
          <p className="marca-zaor">ZAOR</p>
          <h1>Ropa deportiva</h1>
          <p>Encuentra tu próximo favorito.</p>
        </div>

        <nav className="navegacion">
          <button
            className={vista === 'catalogo' ? 'activo' : ''}
            onClick={() => setVista('catalogo')}
          >
            Catálogo
          </button>

          <button
            className={vista === 'carrito' ? 'activo' : ''}
            onClick={() => setVista('carrito')}
          >
            Carrito ({carrito.reduce((s, p) => s + p.cantidad, 0)})
          </button>

          <button
            className={vista === 'admin' ? 'activo' : ''}
            onClick={() => setVista('admin')}
          >
            Administrar
          </button>
        </nav>
      </header>

      <main className="contenido">
        {vista === 'catalogo' && (
          <>
            <section className="bienvenida">
              <p className="etiqueta">CATÁLOGO ZAOR</p>
              <h2>Muévete a tu manera</h2>
              <p>Explora los productos deportivos disponibles.</p>
            </section>

            <section className="filtros">
              <input
                type="search"
                placeholder="Buscar por producto, marca o talla..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />

              <select
                value={marcaFiltro}
                onChange={(e) => setMarcaFiltro(e.target.value)}
                aria-label="Filtrar por marca"
              >
                {marcas.map((marca) => (
                  <option key={marca} value={marca}>{marca}</option>
                ))}
              </select>
            </section>

            <p className="resultado">
              {productosFiltrados.length} productos · {totalUnidades} unidades
              disponibles en inventario
            </p>

            <section className="catalogo">
              {productosFiltrados.map((producto) => (
                <article className="producto-card" key={producto.id}>
                  <div className="producto-icono" aria-hidden="true">✦</div>
                  <p className="producto-marca">{producto.marca}</p>
                  <h3>{producto.nombre}</h3>
                  <p>Talla: {producto.talla}</p>
                  <p>Estado: {producto.estado}</p>
                  <p className="precio">${Number(producto.precio).toFixed(2)}</p>

                  {producto.cantidadDisponible > 0 ? (
                    <>
                      <p className="disponible">
                        Disponible: {producto.cantidadDisponible}
                      </p>
                      <button
                        className="boton-principal"
                        onClick={() => agregarAlCarrito(producto)}
                      >
                        Agregar al carrito
                      </button>
                    </>
                  ) : (
                    <p className="agotado">Agotado</p>
                  )}
                </article>
              ))}

              {productosFiltrados.length === 0 && (
                <p>No se encontraron productos con esos filtros.</p>
              )}
            </section>
          </>
        )}

        {vista === 'carrito' && (
          <section className="seccion">
            <h2>Tu carrito</h2>

            {carrito.length === 0 ? (
              <p>Tu carrito está vacío. Explora el catálogo para agregar productos.</p>
            ) : (
              <>
                {carrito.map((item) => (
                  <article className="fila-carrito" key={item.id}>
                    <div className="datos-carrito">
                      <h3>{item.nombre}</h3>
                      <p>{item.marca} · Talla {item.talla}</p>
                      <p>${Number(item.precio).toFixed(2)} por unidad</p>
                    </div>

                    <div className="controles-cantidad">
                      <button
                        aria-label={`Quitar una unidad de ${item.nombre}`}
                        onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                      >−</button>
                      <span>{item.cantidad}</span>
                      <button
                        aria-label={`Agregar una unidad de ${item.nombre}`}
                        onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                      >+</button>
                    </div>

                    <strong>${(item.precio * item.cantidad).toFixed(2)}</strong>

                    <button
                      className="boton-texto"
                      onClick={() => cambiarCantidad(item.id, 0)}
                    >
                      Eliminar
                    </button>
                  </article>
                ))}

                <div className="total-carrito">
                  <span>Total del pedido</span>
                  <strong>${totalCarrito.toFixed(2)}</strong>
                </div>

                <p className="nota">
                  El pedido se enviará por WhatsApp para confirmar disponibilidad
                  y entrega. El envío no está incluido en este total.
                </p>

                <button className="boton-principal" onClick={enviarPedido}>
                  Continuar por WhatsApp
                </button>

                <button className="boton-principal" onClick={comprarSimulado}>
  Confirmar compra simulada
</button>

                <button
                  className="boton-secundario"
                  onClick={() => setVista('catalogo')}
                >
                  Seguir comprando
                </button>
              </>
            )}
          </section>
        )}

        {vista === 'admin' && (
          <section className="seccion">
            <h2>Administración del inventario</h2>
            <p>
              Productos registrados: {productos.length} · Unidades en stock: {totalUnidades}
            </p>

            <form className="form-producto" onSubmit={guardarProducto}>
              <h3>{editando !== null ? 'Editar producto' : 'Agregar producto'}</h3>

              <label>
                Nombre
                <input
                  required
                  value={formulario.nombre}
                  onChange={(e) => setFormulario({
                    ...formulario, nombre: e.target.value
                  })}
                />
              </label>

              <label>
                Marca
                <input
                  required
                  value={formulario.marca}
                  onChange={(e) => setFormulario({
                    ...formulario, marca: e.target.value
                  })}
                />
              </label>

              <label>
                Talla
                <select
                  value={formulario.talla}
                  onChange={(e) => setFormulario({
                    ...formulario, talla: e.target.value
                  })}
                >
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Unitalla'].map((talla) => (
                    <option key={talla}>{talla}</option>
                  ))}
                </select>
              </label>

              <label>
                Estado
                <select
                  value={formulario.estado}
                  onChange={(e) => setFormulario({
                    ...formulario, estado: e.target.value
                  })}
                >
                  {['Nueva', 'Buen estado', 'Usada'].map((estado) => (
                    <option key={estado}>{estado}</option>
                  ))}
                </select>
              </label>

              <label>
                Precio
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formulario.precio}
                  onChange={(e) => setFormulario({
                    ...formulario, precio: e.target.value
                  })}
                />
              </label>

              <label>
                Cantidad disponible
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={formulario.cantidadDisponible}
                  onChange={(e) => setFormulario({
                    ...formulario, cantidadDisponible: e.target.value
                  })}
                />
              </label>

              <button className="boton-principal" type="submit">
                {editando !== null ? 'Guardar cambios' : 'Agregar producto'}
              </button>

              {editando !== null && (
                <button
                  className="boton-secundario"
                  type="button"
                  onClick={limpiarFormulario}
                >
                  Cancelar edición
                </button>
              )}
            </form>

            <h3>Productos registrados</h3>

            <div className="tabla-contenedor">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Marca</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => (
                    <tr key={producto.id}>
                      <td>{producto.nombre}</td>
                      <td>{producto.marca}</td>
                      <td>${Number(producto.precio).toFixed(2)}</td>
                      <td>{producto.cantidadDisponible}</td>
                      <td>
                        <button
                          className="boton-texto"
                          onClick={() => prepararEdicion(producto)}
                        >
                          Editar
                        </button>
                        <button
                          className="boton-texto peligro"
                          onClick={() => eliminarProducto(producto.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      <footer className="pie">
        <strong>ZAOR</strong>
        <p>Inventario y catálogo de ropa deportiva.</p>
      </footer>
    </div>
  );
}

export default App;
