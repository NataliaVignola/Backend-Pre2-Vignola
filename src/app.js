import express from 'express';
import http from 'http';
import path from 'path';
import exphbs from 'express-handlebars';
import mongoose from 'mongoose';
import { ProductManager } from './ProductManager.js';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = 8080;

// Conectar a la base de datos MongoDB
mongoose.connect('mongodb://localhost:27017/cultura_cafe', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(error => console.error('Error connecting to MongoDB:', error));

// Obtener la ruta del archivo actual
const currentFileUrl = import.meta.url;
const __dirname = path.dirname(new URL(currentFileUrl).pathname);

// Instancia del ProductManager
const productManager = new ProductManager(path.join(__dirname, 'data/products.json'));

// Configurar el motor de plantillas Handlebars
const hbs = exphbs.create(); // Configura el motor de plantillas
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// Middleware
app.use(express.json());

// Ruta para la página de inicio
app.get('/', (req, res) => {
    const products = productManager.getProducts();
    res.render('home', { products });
});

// Ruta para obtener los productos en formato JSON con filtros, paginación y ordenamiento
app.get('/api/products', async (req, res) => {
    const { limit = 10, page = 1, sort, query, category, availability } = req.query;

    const skip = (page - 1) * limit;
    const sortOptions = sort === 'asc' ? { price: 1 } : sort === 'desc' ? { price: -1 } : {};

    const filter = {};
    if (query) {
        filter.$or = [{ title: { $regex: query, $options: 'i' } }, { description: { $regex: query, $options: 'i' } }];
    }
    if (category) {
        filter.category = category;
    }
    if (availability) {
        filter.stock = { $gt: 0 };
    }

    try {
        const totalProducts = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const totalPages = Math.ceil(totalProducts / limit);
        const hasPrevPage = page > 1;
        const hasNextPage = page < totalPages;

        const prevPage = hasPrevPage ? page - 1 : null;
        const nextPage = hasNextPage ? page + 1 : null;

        res.json({
            status: 'success',
            payload: products,
            totalPages,
            prevPage,
            nextPage,
            page: parseInt(page),
            hasPrevPage,
            hasNextPage,
            prevLink: hasPrevPage
                ? `/api/products?limit=${limit}&page=${prevPage}&sort=${sort}&query=${query}&category=${category}&availability=${availability}`
                : null,
            nextLink: hasNextPage
                ? `/api/products?limit=${limit}&page=${nextPage}&sort=${sort}&query=${query}&category=${category}&availability=${availability}`
                : null,
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'An error occurred while fetching products' });
    }
})

// Endpoint para obtener los productos
app.get('/api/products', (req, res) => {
    const { limit } = req.query;
    let products = productManager.getProducts();

    if (limit) {
        const limitNum = parseInt(limit);
        products = products.slice(0, limitNum);
    }

    res.json(products);
});

// Endpoint para obtener los producto por su ID
app.get('/api/products/:pid', (req, res) => {
    const productId = parseInt(req.params.pid);
    const product = productManager.getProductById(productId);

    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});

// Ruta POST para agregar un nuevo producto
app.post('/api/products', (req, res) => {
    const newProduct = req.body;
    productManager.addProduct(newProduct);
    
    // Emitir evento de nuevo producto a través de sockets
    io.emit('productoCreado', newProduct);

    res.json(newProduct);
});

// Ruta PUT para actualizar un producto por su ID
app.put('/api/products/:pid', (req, res) => {
    const productId = parseInt(req.params.pid);
    const fieldsToUpdate = req.body;
    productManager.updateProduct(productId, fieldsToUpdate);
    
    // Emitir evento de actualización a través de sockets
    io.emit('productoActualizado', productId);

    res.json({ message: 'Product updated successfully' });
});

// Ruta DELETE para eliminar un producto por su ID
app.delete('/api/products/:pid', (req, res) => {
    const productId = parseInt(req.params.pid);
    productManager.deleteProduct(productId);
    
    // Emitir evento de eliminación a través de sockets
    io.emit('productoEliminado', productId);

    res.json({ message: 'Product deleted successfully' });
});


// Servir archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para la vista en tiempo real utilizando Handlebars y WebSockets
app.get('/realtimeproducts', (req, res) => {
    const products = productManager.getProducts();
    res.render('realTimeProducts', { products });
});

// Manejar conexiones de socket.io
io.on('connection', (socket) => {
    console.log('Usuario conectado por WebSocket');

    socket.on('productoCreado', (newProduct) => {
        // Manejar evento de nuevo producto
        console.log('Nuevo producto:', newProduct);
    });

    socket.on('productoActualizado', (productId) => {
        // Manejar evento de producto actualizado
        console.log('Producto actualizado:', productId);
    });

    socket.on('productoEliminado', (productId) => {
        // Manejar evento de producto eliminado
        console.log('Producto eliminado:', productId);
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado por WebSocket');
    });
});


// Iniciar el servidor
server.listen(port, () => {
    console.log(`Servidor Express corriendo en http://localhost:${port}`);
});
