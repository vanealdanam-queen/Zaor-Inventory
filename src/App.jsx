import { useState, useEffect } from 'react';
import { inventario } from './data/Inventario';
import './App.css';

function App() {
  const [productos, setProductos] = useState(() => {
    const guardado = localStorage.getItem('inventario');
    return guardado ? JSON.parse(guardado) : inventario;
  });

  useEffect(() => {
    localStorage.setItem('inventario', JSON.stringify(productos));
  }, [productos]);

  return (
    <div className="App">
      <h1>Catálogo Zaor</h1>

      <div className="catalogo">
        {productos.map((producto) => (
          <div key={producto.id} className="producto-card">
            <h3>{producto.nombre}</h3>
            <p>Talla: {producto.talla}</p>
            <p>Marca: {producto.marca}</p>
            <p>Estado: {producto.estado}</p>
            <p>Precio: ${producto.precio}</p>

            {producto.cantidadDisponible > 0 ? (
              <p className="disponible">
                Disponible ({producto.cantidadDisponible} en stock)
              </p>
            ) : (
              <p className="agotado">Agotado</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;