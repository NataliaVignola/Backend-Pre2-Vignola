import Product from './models/Product.js';

class ProductManager {
    // Método para agregar un nuevo producto a la base de datos
    async addProduct(product) {
        try {
            const newProduct = new Product(product); // Crear una nueva instancia del modelo Product con los datos proporcionados
            await newProduct.save(); // Guardar el nuevo producto en la base de datos
        } catch (error) {
            console.log('Error adding product:', error.message);
        }
    }

    // Método para actualizar un producto existente por su ID
    async updateProduct(id, fieldsToUpdate) {
        try {
            const updatedProduct = await Product.findByIdAndUpdate(id, fieldsToUpdate, { new: true }); // Buscar y actualizar el producto por su ID
            if (!updatedProduct) {
                console.log('Product not found');
            }
            return updatedProduct; // Retornar el producto actualizado
        } catch (error) {
            console.log('Error updating product:', error.message);
            return null;
        }
    }

    // Método para eliminar un producto existente por su ID
    async deleteProduct(id) {
        try {
            const deletedProduct = await Product.findByIdAndDelete(id); // Buscar y eliminar el producto por su ID
            if (!deletedProduct) {
                console.log('Product not found');
            }
            return deletedProduct; // Retornar el producto eliminado
        } catch (error) {
            console.log('Error deleting product:', error.message);
            return null;
        }
    }

    // Método para obtener todos los productos de la base de datos
    async getProducts() {
        try {
            const products = await Product.find(); // Buscar todos los productos en la base de datos
            return products;
        } catch (error) {
            console.log('Error getting products:', error.message);
            return [];
        }
    }

    // Método para obtener un producto por su ID
    async getProductById(id) {
        try {
            const product = await Product.findById(id); // Buscar un producto por su ID
            return product;
        } catch (error) {
            console.log('Error getting product by ID:', error.message);
            return null;
        }
    }
}

export { ProductManager };