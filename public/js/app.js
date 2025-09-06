// Simulação de banco de dados (localStorage)
const DB = {
    init: function() {
        // Inicializar tabelas se não existirem
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify([]));
        }
        if (!localStorage.getItem('products')) {
            localStorage.setItem('products', JSON.stringify([]));
        }
        if (!localStorage.getItem('favorites')) {
            localStorage.setItem('favorites', JSON.stringify([]));
        }
        if (!localStorage.getItem('currentUser')) {
            localStorage.setItem('currentUser', JSON.stringify(null));
        }
    },
    getUsers: function() {
        return JSON.parse(localStorage.getItem('users'));
    },
    getProducts: function() {
        return JSON.parse(localStorage.getItem('products'));
    },
    getFavorites: function() {
        return JSON.parse(localStorage.getItem('favorites'));
    },
    getCurrentUser: function() {
        return JSON.parse(localStorage.getItem('currentUser'));
    },
    saveUsers: function(users) {
        localStorage.setItem('users', JSON.stringify(users));
    },
    saveProducts: function(products) {
        localStorage.setItem('products', JSON.stringify(products));
    },
    saveFavorites: function(favorites) {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    },
    saveCurrentUser: function(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    },
    addUser: function(user) {
        const users = this.getUsers();
        user.id = Date.now().toString();
        users.push(user);
        this.saveUsers(users);
        return user;
    },
    addProduct: function(product) {
        const products = this.getProducts();
        product.id = Date.now().toString();
        product.createdAt = new Date().toISOString();
        products.push(product);
        this.saveProducts(products);
        return product;
    },
    addFavorite: function(userId, productId) {
        const favorites = this.getFavorites();
        const favorite = {
            id: Date.now().toString(),
            userId,
            productId
        };
        favorites.push(favorite);
        this.saveFavorites(favorites);
        return favorite;
    },
    removeFavorite: function(userId, productId) {
        const favorites = this.getFavorites();
        const updatedFavorites = favorites.filter(fav => !(fav.userId === userId && fav.productId === productId));
        this.saveFavorites(updatedFavorites);
    },
    isFavorite: function(userId, productId) {
        const favorites = this.getFavorites();
        return favorites.some(fav => fav.userId === userId && fav.productId === productId);
    },
    getUserFavorites: function(userId) {
        const favorites = this.getFavorites();
        const products = this.getProducts();
        const userFavorites = favorites.filter(fav => fav.userId === userId);
        return userFavorites.map(fav => products.find(product => product.id === fav.productId));
    },
    getUserById: function(id) {
        const users = this.getUsers();
        return users.find(user => user.id === id);
    },
    getProductById: function(id) {
        const products = this.getProducts();
        return products.find(product => product.id === id);
    }
};

// Inicializar banco de dados
DB.init();

// Função para melhorar o efeito de rolagem snap
function setupSnapScroll() {
    const mainContent = document.querySelector('.main-content');
    let isScrolling;
    
    mainContent.addEventListener('scroll', () => {
        // Limpar o timeout anterior
        window.clearTimeout(isScrolling);
        
        // Definir um timeout para detectar quando a rolagem parou
        isScrolling = setTimeout(() => {
            const scrollTop = mainContent.scrollTop;
            const cardHeight = document.querySelector('.product-card').offsetHeight;
            
            // Calcular para qual card deve rolar
            const targetCard = Math.round(scrollTop / cardHeight);
            
            // Rolar suavemente para o card alvo
            mainContent.scrollTo({
                top: targetCard * cardHeight,
                behavior: 'smooth'
            });
        }, 100);
    });
}

// Search and Filter functionality
let currentFilters = {
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    distance: 50,
    sort: 'recent'
};

let userLocation = null;

let allProducts = [];
let filteredProducts = [];

function initSearchAndFilters() {
    const searchInput = document.getElementById('search-input');
    const voiceSearchBtn = document.getElementById('voice-search');
    const filterToggle = document.getElementById('filter-toggle');
    const filtersPanel = document.getElementById('filters-panel');
    const categoryFilter = document.getElementById('category-filter');
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    const locationFilter = document.getElementById('location-filter');
    const distanceRange = document.getElementById('distance-range');
    const distanceValue = document.getElementById('distance-value');
    const sortFilter = document.getElementById('sort-filter');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const applyFiltersBtn = document.getElementById('apply-filters');

    // Search input event
    searchInput.addEventListener('input', (e) => {
        currentFilters.search = e.target.value.toLowerCase();
        debounceSearch();
    });

    // Filter toggle
    filterToggle.addEventListener('click', () => {
        filtersPanel.classList.toggle('active');
    });

    // Filter inputs
    categoryFilter.addEventListener('change', (e) => {
        currentFilters.category = e.target.value;
    });

    minPriceInput.addEventListener('input', (e) => {
        currentFilters.minPrice = e.target.value;
    });

    maxPriceInput.addEventListener('input', (e) => {
        currentFilters.maxPrice = e.target.value;
    });

    locationFilter.addEventListener('input', (e) => {
        currentFilters.location = e.target.value.toLowerCase();
    });

    distanceRange.addEventListener('input', (e) => {
        currentFilters.distance = parseInt(e.target.value);
        distanceValue.textContent = e.target.value;
    });

    sortFilter.addEventListener('change', (e) => {
        currentFilters.sort = e.target.value;
    });

    // Clear filters
    clearFiltersBtn.addEventListener('click', () => {
        clearAllFilters();
    });

    // Apply filters
    applyFiltersBtn.addEventListener('click', () => {
        applyFilters();
        filtersPanel.classList.remove('active');
    });

    // Voice search (Web Speech API)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        voiceSearchBtn.addEventListener('click', startVoiceSearch);
    } else {
        voiceSearchBtn.style.display = 'none';
    }
}

// Debounce search to avoid too many calls
let searchTimeout;
function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        applyFilters();
    }, 300);
}

// Voice search functionality
function startVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    const voiceBtn = document.getElementById('voice-search');
    const searchInput = document.getElementById('search-input');
    
    voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    voiceBtn.style.color = '#ff4757';
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        searchInput.value = transcript;
        currentFilters.search = transcript.toLowerCase();
        applyFilters();
    };
    
    recognition.onend = () => {
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceBtn.style.color = '#666';
    };
    
    recognition.onerror = () => {
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceBtn.style.color = '#666';
        alert('Erro no reconhecimento de voz. Tente novamente.');
    };
    
    recognition.start();
}

// Apply all filters
function applyFilters() {
    allProducts = DB.getProducts();
    filteredProducts = allProducts.filter(product => {
        // Search filter
        if (currentFilters.search && 
            !product.name.toLowerCase().includes(currentFilters.search) &&
            !product.description.toLowerCase().includes(currentFilters.search)) {
            return false;
        }
        
        // Category filter
        if (currentFilters.category && product.category !== currentFilters.category) {
            return false;
        }
        
        // Price filters
        if (currentFilters.minPrice && product.price < parseFloat(currentFilters.minPrice)) {
            return false;
        }
        
        if (currentFilters.maxPrice && product.price > parseFloat(currentFilters.maxPrice)) {
            return false;
        }
        
        // Location filter
        if (currentFilters.location && 
            !product.location.toLowerCase().includes(currentFilters.location)) {
            return false;
        }
        
        return true;
    });
    
    // Sort products
    sortProducts();
    
    // Update feed
    updateProductFeed();
    
    // Show search results info
    showSearchResults();
}

// Sort products based on selected criteria
function sortProducts() {
    switch (currentFilters.sort) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'recent':
        default:
            filteredProducts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            break;
    }
}

// Update product feed with filtered results
function updateProductFeed() {
    const feedContainer = document.getElementById('feed-container');
    
    if (filteredProducts.length === 0) {
        feedContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>Nenhum produto encontrado</h3>
                <p>Tente ajustar os filtros ou buscar por outros termos.</p>
            </div>
        `;
        return;
    }
    
    feedContainer.innerHTML = '';
    
    filteredProducts.forEach(product => {
        const seller = DB.getUserById(product.sellerId);
        const currentUser = DB.getCurrentUser();
        const isFavorited = currentUser ? DB.isFavorite(currentUser.id, product.id) : false;
        
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-media">
                ${product.video ? 
                    `<video class="product-video" controls>
                        <source src="${product.video}" type="video/mp4">
                    </video>` :
                    `<div class="product-images">
                        <img src="${product.images[0]}" alt="${product.name}" class="product-image">
                    </div>`
                }
            </div>
            
            <div class="product-info">
                <div class="seller-info">
                    <img src="${seller.photo}" alt="${seller.name}" class="seller-avatar">
                    <div class="seller-details">
                        <span class="seller-name">${seller.name}</span>
                        <span class="product-location">${product.location}</span>
                    </div>
                </div>
                
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">R$ ${product.price.toFixed(2).replace('.', ',')}</div>
                <div class="product-category">${getCategoryName(product.category)}</div>
            </div>
            
            <div class="side-actions">
                <button class="side-action favorite-btn ${isFavorited ? 'favorited' : ''}" data-product-id="${product.id}">
                    <i class="${isFavorited ? 'fas' : 'far'} fa-heart"></i>
                </button>
                <button class="side-action comment-btn">
                    <i class="far fa-comment"></i>
                </button>
                <button class="side-action share-btn" data-product-id="${product.id}">
                    <i class="fas fa-share"></i>
                </button>
            </div>
        `;
        
        // Event listeners
        productCard.addEventListener('click', (e) => {
            if (!e.target.closest('.side-actions')) {
                openProductModal(product.id);
            }
        });
        
        feedContainer.appendChild(productCard);
    });
    
    // Add event listeners for side actions
    addProductEventListeners();
}

// Show search results information
function showSearchResults() {
    let existingInfo = document.querySelector('.search-results-info');
    if (existingInfo) {
        existingInfo.remove();
    }
    
    if (currentFilters.search || currentFilters.category || currentFilters.minPrice || currentFilters.maxPrice) {
        const resultsInfo = document.createElement('div');
        resultsInfo.className = 'search-results-info';
        resultsInfo.textContent = `${filteredProducts.length} produto(s) encontrado(s)`;
        
        const mainContent = document.querySelector('.main-content');
        mainContent.insertBefore(resultsInfo, document.getElementById('feed-container'));
    }
}

// Clear all filters
function clearAllFilters() {
    currentFilters = {
        search: '',
        category: '',
        minPrice: '',
        maxPrice: '',
        location: '',
        distance: 50,
        sort: 'recent'
    };
    
    document.getElementById('search-input').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';
    document.getElementById('location-filter').value = '';
    document.getElementById('distance-range').value = '50';
    document.getElementById('distance-value').textContent = '50';
    document.getElementById('sort-filter').value = 'recent';
    
    applyFilters();
}

// Add event listeners for product actions
function addProductEventListeners() {
    // Favorite buttons
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.dataset.productId;
            toggleFavorite(productId);
        });
    });
    
    // Share buttons
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.dataset.productId;
            const product = DB.getProductById(productId);
            shareProduct(product);
        });
    });
}

// Adicionar alguns dados de exemplo se não houver nenhum
function addSampleData() {
    const users = DB.getUsers();
    const products = DB.getProducts();
    
    if (users.length === 0) {
        DB.addUser({
            name: 'João Silva',
            email: 'joao@example.com',
            phone: '(11) 98765-4321',
            location: 'São Paulo, SP',
            password: '123456', // Em um app real, isso seria criptografado
            photo: 'https://randomuser.me/api/portraits/men/1.jpg'
        });
        
        DB.addUser({
            name: 'Maria Oliveira',
            email: 'maria@example.com',
            phone: '(21) 98765-4321',
            location: 'Rio de Janeiro, RJ',
            password: '123456',
            photo: 'https://randomuser.me/api/portraits/women/1.jpg'
        });
    }
    
    if (products.length === 0) {
        const user1 = DB.getUsers()[0];
        const user2 = DB.getUsers()[1];
        
        DB.addProduct({
            name: 'iPhone 13 Pro',
            description: 'iPhone 13 Pro Max 256GB, cor grafite, em perfeito estado. Acompanha carregador e caixa original.',
            price: 5999.99,
            category: 'eletronicos',
            location: 'São Paulo, SP',
            sellerId: user1.id,
            images: [
                'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
            ],
            video: null
        });
        
        DB.addProduct({
            name: 'Bicicleta Mountain Bike',
            description: 'Bicicleta Mountain Bike aro 29, 21 marchas, freio a disco, suspensão dianteira. Usada apenas 3 vezes.',
            price: 1299.99,
            category: 'esportes',
            location: 'Rio de Janeiro, RJ',
            sellerId: user2.id,
            images: [
                'https://images.unsplash.com/photo-1485965120184-e220f721d03e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
            ],
            video: null
        });
        
        DB.addProduct({
            name: 'Sofá 3 lugares',
            description: 'Sofá retrátil e reclinável, 3 lugares, tecido suede, cor cinza. Pouco tempo de uso, em ótimo estado.',
            price: 1899.99,
            category: 'casa',
            location: 'São Paulo, SP',
            sellerId: user1.id,
            images: [
                'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
            ],
            video: null
        });
    }
}

addSampleData();

// Elementos DOM
const feedContainer = document.getElementById('feed-container');
const loginButton = document.getElementById('login-button');
const registerButton = document.getElementById('register-button');
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const productModal = document.getElementById('product-modal');
const addProductModal = document.getElementById('add-product-modal');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const addProductForm = document.getElementById('add-product-form');
const closeButtons = document.querySelectorAll('.close');
const addButton = document.querySelector('.add-button');
const navItems = document.querySelectorAll('.nav-item');

// Carregar feed de produtos
function loadProductFeed() {
    feedContainer.innerHTML = '';
    const products = DB.getProducts();
    
    // Ordenar produtos por data de criação (mais recentes primeiro)
    products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    products.forEach(product => {
        const seller = DB.getUserById(product.sellerId);
        const currentUser = DB.getCurrentUser();
        const isFavorite = currentUser ? DB.isFavorite(currentUser.id, product.id) : false;
        
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.dataset.id = product.id;
        
        // Verificar se tem vídeo ou imagem
        if (product.video) {
            productCard.innerHTML = `
                <video class="product-video" autoplay loop muted>
                    <source src="${product.video}" type="video/mp4">
                </video>
            `;
        } else if (product.images && product.images.length > 0) {
            productCard.innerHTML = `
                <img class="product-image" src="${product.images[0]}" alt="${product.name}">
            `;
        }
        
        // Informações do produto
        const productInfo = document.createElement('div');
        productInfo.className = 'product-info';
        productInfo.innerHTML = `
            <div class="product-name">${product.name}</div>
            <div class="product-price">R$ ${product.price.toFixed(2)}</div>
            <div class="product-location"><i class="fas fa-map-marker-alt"></i> ${product.location}</div>
            <div class="product-actions">
                <button class="whatsapp-button"><i class="fab fa-whatsapp"></i> Falar no WhatsApp</button>
                <div class="action-buttons">
                    <button class="action-button favorite ${isFavorite ? 'active' : ''}"><i class="fas fa-heart"></i></button>
                    <button class="action-button share"><i class="fas fa-share"></i></button>
                </div>
            </div>
        `;
        
        productCard.appendChild(productInfo);
        
        // Botões laterais
        const sideActions = document.createElement('div');
        sideActions.className = 'side-actions';
        sideActions.innerHTML = `
            <div class="side-action favorite ${isFavorite ? 'active' : ''}"><i class="fas fa-heart"></i></div>
            <div class="side-action comment"><i class="fas fa-comment"></i></div>
            <div class="side-action share"><i class="fas fa-share"></i></div>
        `;
        
        productCard.appendChild(sideActions);
        
        // Adicionar ao feed
        feedContainer.appendChild(productCard);
        
        // Event listener para abrir modal de produto
        productCard.addEventListener('click', (e) => {
            // Não abrir modal se clicou em botões de ação
            if (!e.target.closest('.product-actions') && !e.target.closest('.side-actions')) {
                openProductModal(product.id);
            }
        });
        
        // Event listener para botão de WhatsApp
        const whatsappButton = productCard.querySelector('.whatsapp-button');
        whatsappButton.addEventListener('click', (e) => {
            e.stopPropagation();
            openWhatsApp(seller.phone, product.name);
        });
        
        // Event listener para botão de favorito
        const favoriteButtons = productCard.querySelectorAll('.favorite');
        favoriteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(product.id);
            });
        });
        
        // Event listener para botão de compartilhar
        const shareButtons = productCard.querySelectorAll('.share');
        shareButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                shareProduct(product);
            });
        });
    });
}

// Abrir modal de produto
function openProductModal(productId) {
    const product = DB.getProductById(productId);
    const seller = DB.getUserById(product.sellerId);
    const currentUser = DB.getCurrentUser();
    const isFavorite = currentUser ? DB.isFavorite(currentUser.id, product.id) : false;
    
    const productDetails = document.querySelector('.product-details');
    
    let imagesHTML = '';
    if (product.video) {
        imagesHTML = `
            <div class="product-images">
                <video class="product-image-main" controls>
                    <source src="${product.video}" type="video/mp4">
                </video>
            </div>
        `;
    } else if (product.images && product.images.length > 0) {
        imagesHTML = `
            <div class="product-images">
                <img class="product-image-main" src="${product.images[0]}" alt="${product.name}">
            </div>
        `;
        
        if (product.images.length > 1) {
            imagesHTML += `
                <div class="product-thumbnails">
                    ${product.images.map((img, index) => `
                        <img class="product-thumbnail ${index === 0 ? 'active' : ''}" 
                             src="${img}" 
                             alt="Thumbnail ${index + 1}">
                    `).join('')}
                </div>
            `;
        }
    }
    
    productDetails.innerHTML = `
        ${imagesHTML}
        <div class="product-info-detailed">
            <h2 class="product-name-detailed">${product.name}</h2>
            <div class="product-price-detailed">R$ ${product.price.toFixed(2)}</div>
            <div class="product-description">${product.description}</div>
            <div class="product-meta">
                <div><strong>Categoria:</strong> ${getCategoryName(product.category)}</div>
                <div><strong>Localização:</strong> ${product.location}</div>
            </div>
            
            <div class="seller-info">
                <img class="seller-photo" src="${seller.photo}" alt="${seller.name}">
                <div class="seller-details">
                    <div class="seller-name">${seller.name}</div>
                    <div class="seller-location"><i class="fas fa-map-marker-alt"></i> ${seller.location}</div>
                </div>
            </div>
            
            <div class="contact-seller">
                <button class="contact-button whatsapp"><i class="fab fa-whatsapp"></i> Falar no WhatsApp</button>
            </div>
            
            <div class="product-actions-detailed">
                <button class="btn ${isFavorite ? 'primary' : ''}">
                    <i class="fas ${isFavorite ? 'fa-heart' : 'fa-heart-o'}"></i> 
                    ${isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                </button>
            </div>
        </div>
    `;
    
    // Event listeners para thumbnails
    const thumbnails = productDetails.querySelectorAll('.product-thumbnail');
    const mainImage = productDetails.querySelector('.product-image-main');
    
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', () => {
            mainImage.src = thumbnail.src;
            thumbnails.forEach(t => t.classList.remove('active'));
            thumbnail.classList.add('active');
        });
    });
    
    // Event listener para botão de WhatsApp
    const whatsappButton = productDetails.querySelector('.contact-button.whatsapp');
    whatsappButton.addEventListener('click', () => {
        openWhatsApp(seller.phone, product.name);
    });
    
    // Event listener para botão de favorito
    const favoriteButton = productDetails.querySelector('.product-actions-detailed .btn');
    favoriteButton.addEventListener('click', () => {
        toggleFavorite(product.id);
        openProductModal(product.id); // Recarregar modal para atualizar botão
    });
    
    productModal.style.display = 'block';
}

// Abrir WhatsApp
function openWhatsApp(phone, productName) {
    const currentUser = DB.getCurrentUser();
    if (!currentUser) {
        alert('Você precisa estar logado para entrar em contato com o vendedor.');
        loginModal.style.display = 'block';
        return;
    }
    
    // Formatar número de telefone (remover caracteres não numéricos)
    const formattedPhone = phone.replace(/\D/g, '');
    
    // Criar mensagem
    const message = `Olá! Vi seu anúncio do produto "${productName}" no Vapt e gostaria de mais informações.`;
    
    // Abrir WhatsApp
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Toggle favorito
function toggleFavorite(productId) {
    const currentUser = DB.getCurrentUser();
    if (!currentUser) {
        alert('Você precisa estar logado para favoritar produtos.');
        loginModal.style.display = 'block';
        return;
    }
    
    const isFavorite = DB.isFavorite(currentUser.id, productId);
    
    if (isFavorite) {
        DB.removeFavorite(currentUser.id, productId);
    } else {
        DB.addFavorite(currentUser.id, productId);
    }
    
    // Atualizar UI
    loadProductFeed();
}

// Compartilhar produto
function shareProduct(product) {
    if (navigator.share) {
        navigator.share({
            title: product.name,
            text: `Confira este produto no Vapt: ${product.name} - R$ ${product.price.toFixed(2)}`,
            url: window.location.href
        })
        .catch(error => console.log('Erro ao compartilhar:', error));
    } else {
        alert(`Compartilhe este link: ${window.location.href}`);
    }
}

// Obter nome da categoria
function getCategoryName(categoryId) {
    const categories = {
        'eletronicos': 'Eletrônicos',
        'moda': 'Moda',
        'casa': 'Casa e Decoração',
        'esportes': 'Esportes',
        'outros': 'Outros'
    };
    
    return categories[categoryId] || categoryId;
}

// Event Listeners

// Abrir modais
loginButton.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

registerButton.addEventListener('click', () => {
    registerModal.style.display = 'block';
});

addButton.addEventListener('click', () => {
    const currentUser = DB.getCurrentUser();
    if (!currentUser) {
        alert('Você precisa estar logado para anunciar produtos.');
        loginModal.style.display = 'block';
        return;
    }
    
    addProductModal.style.display = 'block';
});

// Fechar modais
closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        loginModal.style.display = 'none';
        registerModal.style.display = 'none';
        productModal.style.display = 'none';
        addProductModal.style.display = 'none';
    });
});

// Fechar modal ao clicar fora
window.addEventListener('click', (e) => {
    if (e.target === loginModal) loginModal.style.display = 'none';
    if (e.target === registerModal) registerModal.style.display = 'none';
    if (e.target === productModal) productModal.style.display = 'none';
    if (e.target === addProductModal) addProductModal.style.display = 'none';
});

// Navegação inferior
navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(navItem => navItem.classList.remove('active'));
        item.classList.add('active');
        
        // Implementar navegação entre telas
        if (item.querySelector('i').classList.contains('fa-heart')) {
            showFavorites();
        } else if (item.querySelector('i').classList.contains('fa-home')) {
            loadProductFeed();
        } else if (item.querySelector('i').classList.contains('fa-user')) {
            showProfile();
        }
    });
});

// Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const users = DB.getUsers();
    const user = users.find(u => (u.email === email || u.phone === email) && u.password === password);
    
    if (user) {
        DB.saveCurrentUser(user);
        loginModal.style.display = 'none';
        updateUIForLoggedInUser();
        loadProductFeed(); // Recarregar feed para atualizar botões de favorito
    } else {
        alert('Email/telefone ou senha incorretos.');
    }
});

// Registro
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const location = document.getElementById('register-location').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const photoInput = document.getElementById('profile-photo');
    
    // Validações
    if (password !== confirmPassword) {
        alert('As senhas não coincidem.');
        return;
    }
    
    const users = DB.getUsers();
    if (users.some(u => u.email === email)) {
        alert('Este email já está em uso.');
        return;
    }
    
    // Foto de perfil (usar URL padrão se não fornecida)
    let photoUrl = 'https://randomuser.me/api/portraits/lego/1.jpg';
    
    if (photoInput.files && photoInput.files[0]) {
        // Em um app real, faríamos upload da imagem para um servidor
        // Aqui vamos simular usando URL.createObjectURL
        photoUrl = URL.createObjectURL(photoInput.files[0]);
    }
    
    const newUser = {
        name,
        email,
        phone,
        location,
        password,
        photo: photoUrl
    };
    
    const user = DB.addUser(newUser);
    DB.saveCurrentUser(user);
    
    registerModal.style.display = 'none';
    updateUIForLoggedInUser();
});

// Adicionar produto
addProductForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const currentUser = DB.getCurrentUser();
    if (!currentUser) {
        alert('Você precisa estar logado para anunciar produtos.');
        addProductModal.style.display = 'none';
        loginModal.style.display = 'block';
        return;
    }
    
    const name = document.getElementById('product-name').value;
    const description = document.getElementById('product-description').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const category = document.getElementById('product-category').value;
    const location = document.getElementById('product-location').value;
    const photosInput = document.getElementById('product-photos');
    const videoInput = document.getElementById('product-video');
    
    // Validações
    if (!name || !description || isNaN(price) || !category || !location) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    // Processar imagens (em um app real, faríamos upload para um servidor)
    const images = [];
    if (photosInput.files && photosInput.files.length > 0) {
        for (let i = 0; i < Math.min(photosInput.files.length, 5); i++) {
            images.push(URL.createObjectURL(photosInput.files[i]));
        }
    } else {
        alert('Por favor, adicione pelo menos uma foto do produto.');
        return;
    }
    
    // Processar vídeo (opcional)
    let video = null;
    if (videoInput.files && videoInput.files[0]) {
        video = URL.createObjectURL(videoInput.files[0]);
    }
    
    const newProduct = {
        name,
        description,
        price,
        category,
        location,
        sellerId: currentUser.id,
        images,
        video
    };
    
    DB.addProduct(newProduct);
    
    addProductModal.style.display = 'none';
    loadProductFeed();
    alert('Produto anunciado com sucesso!');
});

// Preview de fotos e vídeos
document.getElementById('product-photos').addEventListener('change', function(e) {
    const photoPreview = document.getElementById('photo-preview');
    photoPreview.innerHTML = '';
    
    if (this.files) {
        for (let i = 0; i < Math.min(this.files.length, 5); i++) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <img src="${event.target.result}" alt="Preview">
                    <button class="remove-preview">×</button>
                `;
                photoPreview.appendChild(previewItem);
                
                // Remover preview
                previewItem.querySelector('.remove-preview').addEventListener('click', function() {
                    previewItem.remove();
                    // Em um app real, precisaríamos atualizar o input de arquivo também
                });
            };
            reader.readAsDataURL(this.files[i]);
        }
    }
});

document.getElementById('product-video').addEventListener('change', function(e) {
    const videoPreview = document.getElementById('video-preview');
    videoPreview.innerHTML = '';
    
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <video controls>
                    <source src="${event.target.result}" type="video/mp4">
                </video>
                <button class="remove-preview">×</button>
            `;
            videoPreview.appendChild(previewItem);
            
            // Remover preview
            previewItem.querySelector('.remove-preview').addEventListener('click', function() {
                previewItem.remove();
                document.getElementById('product-video').value = '';
            });
        };
        reader.readAsDataURL(this.files[0]);
    }
});

// Mostrar favoritos
function showFavorites() {
    const currentUser = DB.getCurrentUser();
    if (!currentUser) {
        alert('Você precisa estar logado para ver seus favoritos.');
        loginModal.style.display = 'block';
        return;
    }
    
    feedContainer.innerHTML = '<h2 class="section-title">Seus Favoritos</h2>';
    
    const favorites = DB.getUserFavorites(currentUser.id);
    
    if (favorites.length === 0) {
        feedContainer.innerHTML += '<p class="empty-state">Você ainda não tem produtos favoritos.</p>';
        return;
    }
    
    favorites.forEach(product => {
        const seller = DB.getUserById(product.sellerId);
        
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.dataset.id = product.id;
        
        // Verificar se tem vídeo ou imagem
        if (product.video) {
            productCard.innerHTML = `
                <video class="product-video" autoplay loop muted>
                    <source src="${product.video}" type="video/mp4">
                </video>
            `;
        } else if (product.images && product.images.length > 0) {
            productCard.innerHTML = `
                <img class="product-image" src="${product.images[0]}" alt="${product.name}">
            `;
        }
        
        // Informações do produto
        const productInfo = document.createElement('div');
        productInfo.className = 'product-info';
        productInfo.innerHTML = `
            <div class="product-name">${product.name}</div>
            <div class="product-price">R$ ${product.price.toFixed(2)}</div>
            <div class="product-location"><i class="fas fa-map-marker-alt"></i> ${product.location}</div>
            <div class="product-actions">
                <button class="whatsapp-button"><i class="fab fa-whatsapp"></i> Falar no WhatsApp</button>
                <div class="action-buttons">
                    <button class="action-button favorite active"><i class="fas fa-heart"></i></button>
                    <button class="action-button share"><i class="fas fa-share"></i></button>
                </div>
            </div>
        `;
        
        productCard.appendChild(productInfo);
        
        // Botões laterais
        const sideActions = document.createElement('div');
        sideActions.className = 'side-actions';
        sideActions.innerHTML = `
            <div class="side-action favorite active"><i class="fas fa-heart"></i></div>
            <div class="side-action comment"><i class="fas fa-comment"></i></div>
            <div class="side-action share"><i class="fas fa-share"></i></div>
        `;
        
        productCard.appendChild(sideActions);
        
        // Adicionar ao feed
        feedContainer.appendChild(productCard);
        
        // Event listener para abrir modal de produto
        productCard.addEventListener('click', (e) => {
            // Não abrir modal se clicou em botões de ação
            if (!e.target.closest('.product-actions') && !e.target.closest('.side-actions')) {
                openProductModal(product.id);
            }
        });
        
        // Event listener para botão de WhatsApp
        const whatsappButton = productCard.querySelector('.whatsapp-button');
        whatsappButton.addEventListener('click', (e) => {
            e.stopPropagation();
            openWhatsApp(seller.phone, product.name);
        });
        
        // Event listener para botão de favorito
        const favoriteButtons = productCard.querySelectorAll('.favorite');
        favoriteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(product.id);
            });
        });
        
        // Event listener para botão de compartilhar
        const shareButtons = productCard.querySelectorAll('.share');
        shareButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                shareProduct(product);
            });
        });
    });
}

// Mostrar perfil
function showProfile() {
    const currentUser = DB.getCurrentUser();
    if (!currentUser) {
        alert('Você precisa estar logado para ver seu perfil.');
        loginModal.style.display = 'block';
        return;
    }
    
    feedContainer.innerHTML = `
        <div class="profile-container">
            <div class="profile-header">
                <img class="profile-photo" src="${currentUser.photo}" alt="${currentUser.name}">
                <div class="profile-info">
                    <h2>${currentUser.name}</h2>
                    <p><i class="fas fa-map-marker-alt"></i> ${currentUser.location}</p>
                    <p><i class="fas fa-phone"></i> ${currentUser.phone}</p>
                    <p><i class="fas fa-envelope"></i> ${currentUser.email}</p>
                </div>
            </div>
            
            <div class="profile-actions">
                <button id="logout-button" class="btn">Sair</button>
            </div>
            
            <h3>Meus Anúncios</h3>
            <div id="user-products" class="user-products"></div>
        </div>
    `;
    
    // Carregar produtos do usuário
    const userProducts = DB.getProducts().filter(product => product.sellerId === currentUser.id);
    const userProductsContainer = document.getElementById('user-products');
    
    if (userProducts.length === 0) {
        userProductsContainer.innerHTML = '<p class="empty-state">Você ainda não tem produtos anunciados.</p>';
    } else {
        userProducts.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.innerHTML = `
                <img src="${product.images[0]}" alt="${product.name}">
                <div class="product-item-info">
                    <h4>${product.name}</h4>
                    <p>R$ ${product.price.toFixed(2)}</p>
                </div>
            `;
            
            userProductsContainer.appendChild(productItem);
            
            // Event listener para abrir modal de produto
            productItem.addEventListener('click', () => {
                openProductModal(product.id);
            });
        });
    }
    
    // Event listener para botão de logout
    document.getElementById('logout-button').addEventListener('click', () => {
        DB.saveCurrentUser(null);
        updateUIForLoggedInUser();
        loadProductFeed();
    });
}

// Atualizar UI para usuário logado/deslogado
function updateUIForLoggedInUser() {
    const currentUser = DB.getCurrentUser();
    
    if (currentUser) {
        loginButton.style.display = 'none';
        registerButton.innerHTML = `<img src="${currentUser.photo}" alt="${currentUser.name}" class="user-avatar"> ${currentUser.name.split(' ')[0]}`;
        registerButton.classList.add('logged-in');
        registerButton.onclick = () => {
            showProfile();
        };
    } else {
        loginButton.style.display = 'inline-block';
        registerButton.innerHTML = 'Cadastrar';
        registerButton.classList.remove('logged-in');
        registerButton.onclick = () => {
            registerModal.style.display = 'block';
        };
    }
}

// Inicializar app
function initApp() {
    loadProductFeed();
    updateUIForLoggedInUser();
    initSearchAndFilters();
    
    // Adicionar estilos para avatar de usuário logado
    const style = document.createElement('style');
    style.textContent = `
        .user-avatar {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            margin-right: 5px;
        }
        
        .nav-button.logged-in {
            display: flex;
            align-items: center;
            background-color: #f1f1f1;
        }
        
        .profile-container {
            padding: 20px;
            background-color: white;
            border-radius: 10px;
            margin: 10px;
        }
        
        .profile-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .profile-photo {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            object-fit: cover;
            margin-right: 20px;
        }
        
        .profile-info h2 {
            margin-bottom: 10px;
        }
        
        .profile-info p {
            margin-bottom: 5px;
            color: #777;
        }
        
        .profile-actions {
            margin-bottom: 20px;
        }
        
        .user-products {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .product-item {
            background-color: #f9f9f9;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .product-item:hover {
            transform: translateY(-3px);
        }
        
        .product-item img {
            width: 100%;
            height: 100px;
            object-fit: cover;
        }
        
        .product-item-info {
            padding: 10px;
        }
        
        .product-item-info h4 {
            margin-bottom: 5px;
            font-size: 14px;
        }
        
        .product-item-info p {
            color: #ff4757;
            font-weight: bold;
        }
        
        .section-title {
            margin: 10px 0 20px;
            text-align: center;
            color: #333;
        }
        
        .empty-state {
            text-align: center;
            color: #777;
            margin: 30px 0;
        }
    `;
    document.head.appendChild(style);
}

// Iniciar o app quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupSnapScroll();
});