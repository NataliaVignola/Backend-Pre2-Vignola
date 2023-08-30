const fs = import('fs');

class CartManager {
    //Constructor que recibe la ruta del archivo de carrito
    constructor(path) {
        this.path = path;
        this.loadCarts();
    }

    //Carga los carritos desde el archivo especificado en el constructor
    //Si hay un error: inicializa el array de carritos vacío
    loadCarts() {
        try {
            const data = fs.readFileSync(this.path, 'utf-8');
            this.carts = JSON.parse(data);
        } catch (error) {
            console.log('Error loading carts:', error.message);
            this.carts = [];
        }
    }

    //Guarda los carritos.
    //Si hay un error: mensaje de error
    saveCarts() {
        try {
            const data = JSON.stringify(this.carts, null, 2);
            fs.writeFileSync(this.path, data, 'utf-8');
        } catch (error) {
            console.log('Error saving carts:', error.message);
        }
    }

    //Agrega un nuevo carrito al array de carritos
    //Asigna un nuevo ID al carrito basado en el último ID existente
    addCart(cart) {
        const newCart = {
            ...cart,
            id: this.getLastCartId() + 1 //Generando nuevo ID para el carrito
        };

        this.carts.push(newCart);
        this.saveCarts();
    }

    //Obtiene el último ID existente en el array de carritos
    getLastCartId() {
        if (this.carts.length === 0) {
            return 0;
        }
        return this.carts[this.carts.length - 1].id;
    }

    //Obtiene un carrito por su ID
    getCartById(id) {
        const cart = this.carts.find((cart) => cart.id === id);
        return cart;
    }

    // Método para actualizar la cantidad de un producto en el carrito
    updateProductQuantity(cartId, productId, quantity) {
        const cart = this.getCartById(cartId);
        if (!cart) {
            console.log('Cart not found');
            return;
        }

        const productToUpdate = cart.products.find((product) => product.product === productId);
        if (!productToUpdate) {
            console.log('Product not found in the cart');
            return;
        }

        productToUpdate.quantity = quantity;
        this.saveCarts();
    }


    //Agrega un producto al carrito seleccionado
    addProductToCart(cartId, productToAdd, quantity) {
        const cart = this.getCartById(cartId);
        if (!cart) {
            console.log('Cart not found');
            return;
        }

        const existingProductIndex = cart.products.findIndex((product) => product.product === productToAdd);
        if (existingProductIndex !== -1) {
            //Si el producto ya existe en el carrito, entonces: incrementar la cantidad
            cart.products[existingProductIndex].quantity += quantity;
        } else {
            //Si el producto no existe en el carrito, entonces: agregarlo
            cart.products.push({
                product: productToAdd,
                quantity
            });
        }

        this.saveCarts();
    }

    //Obtiene los productos que pertenecen al carrito con el ID proporcionado
    getProductsInCart(cartId) {
        const cart = this.getCartById(cartId);
        if (cart) {
            return cart.products;
        }
        return [];
    }
}

module.exports = CartManager;
