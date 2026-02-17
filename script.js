// ========================================
// Cart Management System
// ========================================

class Cart {
    constructor() {
        this.items = this.loadFromLocalStorage() || [];
        this.initializeCart();
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('swiftcart_items');
        return saved ? JSON.parse(saved) : [];
    }

    saveToLocalStorage() {
        localStorage.setItem('swiftcart_items', JSON.stringify(this.items));
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }
        
        this.saveToLocalStorage();
        this.updateUI();
        this.showNotification(`${product.name} added to cart!`);
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveToLocalStorage();
        this.updateUI();
        this.showNotification('Item removed from cart');
    }

    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
    }

    getCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    updateUI() {
        this.updateCartCount();
        this.updateCartSummary();
    }

    updateCartCount() {
        const cartBadges = document.querySelectorAll('[data-cart-count]');
        const count = this.getCount();
        
        cartBadges.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-block' : 'none';
        });

        // Update subtotal in dropdown
        const subtotalElements = document.querySelectorAll('[data-cart-subtotal]');
        subtotalElements.forEach(el => {
            el.textContent = `$${this.getTotal()}`;
        });

        // Update items count text
        const itemCountElements = document.querySelectorAll('[data-items-count]');
        itemCountElements.forEach(el => {
            el.textContent = `${count} ${count === 1 ? 'Item' : 'Items'}`;
        });
    }

    updateCartSummary() {
        const cartModal = document.getElementById('cartModal');
        if (!cartModal) return;

        const cartItems = cartModal.querySelector('[data-cart-items]');
        const cartTotal = cartModal.querySelector('[data-cart-total]');

        if (this.items.length === 0) {
            cartItems.innerHTML = '<p class="text-center text-gray-500 py-8">Your cart is empty</p>';
            cartTotal.textContent = '$0.00';
            return;
        }

        let html = '';
        this.items.forEach(item => {
            html += `
                <div class="flex justify-between items-start p-3 bg-gray-50 rounded-lg mb-3" data-cart-item="${item.id}">
                    <div class="flex-1">
                        <p class="font-semibold text-sm">${item.name}</p>
                        <p class="text-xs text-gray-600">$${item.price.toFixed(2)} x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <button onclick="cart.removeItem('${item.id}')" class="btn btn-xs btn-error">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });

        cartItems.innerHTML = html;
        cartTotal.textContent = `$${this.getTotal()}`;
    }

    showNotification(message) {
        // Remove existing notification
        const existing = document.querySelector('[data-notification]');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.setAttribute('data-notification', '');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-bounce';
        notification.innerHTML = `<i class="fas fa-check-circle mr-2"></i>${message}`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    initializeCart() {
        this.updateUI();
    }
}


// API Service

class ProductAPI {
    constructor() {
        this.baseUrl = 'https://fakestoreapi.com/products';
        this.categoriesUrl = 'https://fakestoreapi.com/products/categories';
        this.products = [];
        this.categories = [];
        this.selectedCategory = 'All';
    }

    async getCategories() {
        try {
            const response = await fetch(this.categoriesUrl);
            const data = await response.json();
            
            this.categories = ['All', ...data.map(cat => 
                cat.charAt(0).toUpperCase() + cat.slice(1)
            )];
            
            return this.categories;
        } catch (error) {
            console.error('Error fetching categories:', error);
            return ['All'];
        }
    }

    async getProducts(category = 'All') {
        try {
            showLoadingSpinner();
            
            let url = this.baseUrl;
            if (category !== 'All') {
                const categorySlug = category.toLowerCase();
                url = `${this.baseUrl}/category/${categorySlug}`;
            }
            
            const response = await fetch(url);
            const data = await response.json();
            
            this.products = data.map((product) => ({
                id: `product_${product.id}`,
                apiId: product.id,
                title: product.title,
                name: product.title.substring(0, 35),
                price: parseFloat(product.price),
                fullDescription: product.description,
                description: product.description.substring(0, 60) + '...',
                image: product.image,
                category: this.formatCategory(product.category),
                rating: Math.floor(Math.random() * 2) + 4,
                ratingHalf: Math.random() > 0.5,
                originalCategory: product.category
            }));

            this.selectedCategory = category;
            hideLoadingSpinner();
            return this.products;
        } catch (error) {
            console.error('Error fetching products:', error);
            hideLoadingSpinner();
            return [];
        }
    }

    formatCategory(category) {
        const categoryMap = {
            'electronics': 'Electronics',
            'jewelery': 'Jewelry',
            'men\'s clothing': 'Men\'s Clothing',
            'women\'s clothing': 'Women\'s Clothing'
        };
        return categoryMap[category] || category;
    }

    filterByCategory(category) {
        if (category === 'All') return this.products;
        return this.products.filter(p => p.category === category);
    }

    getProductById(productId) {
        return this.products.find(p => p.id === productId);
    }
}

// Global Instances

const cart = new Cart();
const productAPI = new ProductAPI();

// DOM Utilities

function showLoadingSpinner() {
    let spinner = document.getElementById('loadingSpinner');
    if (!spinner) {
        spinner = document.createElement('div');
        spinner.id = 'loadingSpinner';
        spinner.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        spinner.innerHTML = `
            <div class="bg-white p-8 rounded-lg shadow-xl">
                <div class="flex flex-col items-center gap-4">
                    <div class="animate-spin">
                        <i class="fas fa-spinner text-4xl text-purple-600"></i>
                    </div>
                    <p class="text-gray-600 font-semibold">Loading products...</p>
                </div>
            </div>
        `;
        document.body.appendChild(spinner);
    } else {
        spinner.style.display = 'flex';
    }
}

function hideLoadingSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

// Event Listeners

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on products page
    if (document.querySelector('[data-category-buttons]')) {
        initializeProductsPage();
    }

    // Initialize Add to Cart buttons (event delegation)
    initializeAddToCartButtons();
    
    // Initialize Details buttons (event delegation)
    initializeDetailsButtons();
});

function initializeProductsPage() {
    // Load categories first
    productAPI.getCategories().then((categories) => {
        renderCategoryButtons(categories);
        
        // Load all products initially
        productAPI.getProducts('All').then(() => {
            displayProducts(productAPI.products);
        });
    });
}

function renderCategoryButtons(categories) {
    const filterContainer = document.querySelector('[data-category-buttons]');
    if (!filterContainer) return;

    filterContainer.innerHTML = '';
    
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = category === 'All' ? 'btn btn-primary rounded-full px-8' : 'btn btn-outline rounded-full px-8';
        button.textContent = category;
        button.setAttribute('data-category-filter', category);
        
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active state
            document.querySelectorAll('[data-category-filter]').forEach(btn => {
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-outline');
            });
            this.classList.remove('btn-outline');
            this.classList.add('btn-primary');

            // Load products for this category
            productAPI.getProducts(category).then(() => {
                displayProducts(productAPI.products);
            });
        });
        
        filterContainer.appendChild(button);
    });
}

function displayProducts(products) {
    showLoadingSpinner();

    // Local images with matching product names and descriptions
    const localImagesData = [
        { image: 'Assets/bag combo.jpg', name: 'Bag Combo', description: 'Premium bag collection with multiple compartments' },
        { image: 'Assets/blue-shoes.jpg', name: 'Blue Shoes', description: 'Stylish blue casual shoes for everyday wear' },
        { image: 'Assets/brown bag.jpg', name: 'Brown Bag', description: 'Elegant brown leather bag for all occasions' },
        { image: 'Assets/brownshoes.jpg', name: 'Brown Shoes', description: 'Classic brown shoes for formal and casual settings' },
        { image: 'Assets/handbag.jpg', name: 'Handbag', description: 'Fashionable handbag with premium design' },
        { image: 'Assets/men-gift-combo.jpg', name: 'Men Gift Combo', description: 'Complete gift set perfect for men' },
        { image: 'Assets/nudehills.jpg', name: 'Nude Hills', description: 'Comfortable nude-colored hill walking shoes' },
        { image: 'Assets/overcoat-1.jpg', name: 'Overcoat Classic', description: 'Timeless classic overcoat for winter' },
        { image: 'Assets/overcoat-2.jpg', name: 'Overcoat Premium', description: 'Premium quality overcoat with warm lining' },
        { image: 'Assets/overcoat-3.jpg', name: 'Overcoat Elegant', description: 'Elegant overcoat for special occasions' },
        { image: 'Assets/overcoat-4.jpg', name: 'Overcoat Luxury', description: 'Luxury overcoat with fine craftsmanship' },
        { image: 'Assets/overcoat-5.jpg', name: 'Overcoat Modern', description: 'Modern style overcoat for contemporary look' },
        { image: 'Assets/overcoat-6.jpg', name: 'Overcoat Stylish', description: 'Stylish overcoat perfect for winter season' },
        { image: 'Assets/overcoat-7.jpg', name: 'Overcoat Deluxe', description: 'Deluxe overcoat with premium materials' },
        { image: 'Assets/trending-1.jpg', name: 'Trending Item 1', description: 'Latest trending fashion item of the season' },
        { image: 'Assets/trending-2.jpg', name: 'Trending Item 2', description: 'Hot trending product everyone loves' },
        { image: 'Assets/trending-3.jpg', name: 'Trending Item 3', description: 'Must-have trending item for fashion enthusiasts' },
        { image: 'Assets/watch-1.jpg', name: 'Watch Classic', description: 'Classic wristwatch with elegant design' },
        { image: 'Assets/watch-2.jpg', name: 'Watch Premium', description: 'Premium quality watch with precision movement' },
        { image: 'Assets/watch-3.jpg', name: 'Watch Luxury', description: 'Luxury timepiece with premium finishing' },
        { image: 'Assets/watch-4.jpg', name: 'Watch Elegant', description: 'Elegant watch for formal occasions' },
        { image: 'Assets/watch-5.jpg', name: 'Watch Modern', description: 'Modern watch design with advanced features' }
    ];

    setTimeout(() => {
        const productContainers = document.querySelectorAll('[data-product-container]');
        productContainers.forEach(container => container.remove());

        // Create new grid
        const productsSection = document.querySelector('[data-products-section]');
        if (productsSection) {
            const gridWrapper = document.createElement('div');
            gridWrapper.setAttribute('data-product-container', '');
            gridWrapper.className = 'max-w-6xl mx-auto px-6';

            // Split products into rows of 4
            const rows = [];
            for (let i = 0; i < products.length; i += 4) {
                rows.push(products.slice(i, i + 4));
            }

            let productIndex = 0;
            rows.forEach(row => {
                const grid = document.createElement('div');
                grid.className = 'grid grid-cols-1 md:grid-cols-4 gap-8 mb-8';

                row.forEach(product => {
                    const stars = generateStarHTML(product.rating, product.ratingHalf);
                    const imageData = localImagesData[productIndex % localImagesData.length];
                    productIndex++;
                    
                    grid.innerHTML += `
                        <div class="card bg-gray-100 shadow-md rounded-lg overflow-hidden flex flex-col" data-product-card data-product-id="${product.id}">
                            <img src="${imageData.image}" alt="${imageData.name}" class="w-full h-48 object-cover">
                            <div class="card-body p-4 flex flex-col flex-grow">
                                <h3 class="text-lg font-semibold mb-2 text-center line-clamp-2" data-product-name title="${imageData.name}">${imageData.name}</h3>
                                <p class="text-gray-600 text-center text-sm mb-3 line-clamp-2">${imageData.description}</p>
                                <div class="flex justify-between items-center mb-3">
                                    <span class="text-2xl font-bold text-purple-600" data-product-price>$${product.price.toFixed(2)}</span>
                                    <div class="flex gap-1">
                                        ${stars}
                                    </div>
                                </div>
                                <div class="flex gap-2 mt-auto w-full">
                                    <button class="btn btn-outline flex-1 flex items-center justify-center gap-2" data-details-btn data-product-api-id="${product.apiId}">
                                        <i class="fas fa-info-circle"></i>
                                        Details
                                    </button>
                                    <button class="btn btn-primary flex-1 flex items-center justify-center gap-2" data-add-to-cart>
                                        <i class="fas fa-shopping-cart"></i>
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });

                gridWrapper.appendChild(grid);
            });

            productsSection.appendChild(gridWrapper);
            
            // Re-initialize event listeners for new elements
            initializeAddToCartButtons();
            initializeDetailsButtons();
        }

        hideLoadingSpinner();
    }, 500);
}

function initializeAddToCartButtons() {
    // Remove old listener to avoid duplicates
    document.removeEventListener('click', handleAddToCart);
    // Add new delegated listener
    document.addEventListener('click', handleAddToCart);
}

function handleAddToCart(e) {
    if (e.target.closest('[data-add-to-cart]')) {
        e.preventDefault();
        
        const button = e.target.closest('[data-add-to-cart]');
        const productCard = button.closest('[data-product-card]');
        
        if (productCard) {
            const productData = {
                id: productCard.dataset.productId,
                name: productCard.querySelector('[data-product-name]').textContent,
                price: parseFloat(productCard.querySelector('[data-product-price]').textContent.replace('$', '')),
                image: productCard.querySelector('img').src
            };

            cart.addItem(productData);
            
            // Add visual feedback
            button.classList.add('animate-pulse');
            setTimeout(() => {
                button.classList.remove('animate-pulse');
            }, 1000);
        }
    }
}

function initializeDetailsButtons() {
    // Remove old listener to avoid duplicates
    document.removeEventListener('click', handleDetailsClick);
    // Add new delegated listener
    document.addEventListener('click', handleDetailsClick);
}

function handleDetailsClick(e) {
    if (e.target.closest('[data-details-btn]')) {
        e.preventDefault();
        
        const button = e.target.closest('[data-details-btn]');
        const productCard = button.closest('[data-product-card]');
        const productId = button.dataset.productApiId;
        const cardImage = productCard.querySelector('img').src;
        
        // Fetch detailed product from API
        fetch(`https://fakestoreapi.com/products/${productId}`)
            .then(res => res.json())
            .then(product => {
                // Use the card image instead of API image
                product.image = cardImage;
                showProductDetailsModal(product);
            })
            .catch(err => console.error('Error fetching product details:', err));
    }
}

function showProductDetailsModal(product) {
    let modal = document.getElementById('detailsModal');
    
    // Create modal if it doesn't exist
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'detailsModal';
        modal.className = 'hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        document.body.appendChild(modal);
    }

    // Generate stars
    const rating = Math.ceil(Math.random() * 5);
    const stars = generateStarHTML(rating, false);

    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <!-- Header -->
            <div class="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
                <h3 class="text-2xl font-bold text-purple-600">Product Details</h3>
                <button onclick="closeDetailsModal()" class="btn btn-sm btn-ghost">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Content -->
            <div class="overflow-y-auto flex-1 p-6">
                <div class="grid md:grid-cols-2 gap-6">
                    <!-- Image -->
                    <div class="flex items-center justify-center bg-gray-50 p-4 rounded-lg">
                        <img src="${product.image}" alt="${product.title}" class="h-64 object-contain">
                    </div>

                    <!-- Details -->
                    <div>
                        <h2 class="text-2xl font-bold mb-2">${product.title}</h2>
                        <p class="text-sm bg-purple-100 text-purple-700 rounded-full px-3 py-1 inline-block mb-4">
                            ${product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                        </p>
                        
                        <p class="text-gray-600 text-sm mb-4 leading-relaxed">${product.description}</p>
                        
                        <div class="space-y-3 mb-6">
                            <div class="flex items-center gap-3">
                                <span class="font-semibold">Price:</span>
                                <span class="text-3xl font-bold text-purple-600">$${product.price.toFixed(2)}</span>
                            </div>
                            
                            <div class="flex items-center gap-3">
                                <span class="font-semibold">Rating:</span>
                                <div class="flex gap-1">${stars}</div>
                                <span class="text-sm text-gray-600">(${rating}/5)</span>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <button class="btn btn-primary w-full" onclick="addProductToCart('${product.id}', '${product.title.replace(/'/g, "\\'")}', ${product.price}, '${product.image}')">
                                <i class="fas fa-shopping-cart mr-2"></i> Add to Cart
                            </button>
                            <button class="btn btn-outline w-full" onclick="closeDetailsModal()">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function closeDetailsModal() {
    const modal = document.getElementById('detailsModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function addProductToCart(productId, title, price, image) {
    const productData = {
        id: `product_${productId}`,
        name: title.substring(0, 50),
        price: parseFloat(price),
        image: image
    };

    cart.addItem(productData);
    closeDetailsModal();
}

function generateStarHTML(rating, hasHalf = false) {
    let html = '';
    for (let i = 0; i < rating; i++) {
        html += '<i class="fas fa-star text-yellow-400"></i>';
    }
    if (hasHalf) {
        html += '<i class="fas fa-star-half text-yellow-400"></i>';
    }
    return html;
}

function toggleCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.classList.toggle('hidden');
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('cartModal');
    if (modal && e.target === modal) {
        modal.classList.add('hidden');
    }
    
    const detailsModal = document.getElementById('detailsModal');
    if (detailsModal && e.target === detailsModal) {
        closeDetailsModal();
    }
});
