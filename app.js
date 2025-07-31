// Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAwNsZFIlbkdce8z74HxEHPRmu2X26J3yo",
    authDomain: "dbismi.firebaseapp.com",
    databaseURL: "https://dbismi-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "dbismi",
    storageBucket: "dbismi.firebasestorage.app",
    messagingSenderId: "327228156495",
    appId: "1:327228156495:web:6f2c144f7af40610f7183a"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM Elements
const productsContainer = document.getElementById('products');
const productModal = document.getElementById('productModal');
const modalMainImage = document.getElementById('modalMainImage');
const thumbnailsContainer = document.getElementById('thumbnails');
const modalProductTitle = document.getElementById('modalProductTitle');
const modalProductDescription = document.getElementById('modalProductDescription');
const modalProductCategory = document.getElementById('modalProductCategory');
const shopeeBtn = document.getElementById('shopeeBtn');
const waBtn = document.getElementById('waBtn');
const closeModal = document.querySelector('.close');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const prevSlideBtn = document.getElementById('prevSlide');
const nextSlideBtn = document.getElementById('nextSlide');
const slideDotsContainer = document.getElementById('slideDots');
const categoryDropdown = document.getElementById('categoryDropdown');
const categoryDropdownMenu = document.getElementById('categoryDropdownMenu');
const selectedCategory = document.getElementById('selectedCategory');

// Variabel global
let allProducts = [];
let filteredProducts = [];
let visibleProducts = 8;
const productsPerLoad = 4;
let currentCategory = '';
let currentSearchTerm = '';
let currentSlide = 0;
let slideInterval;

// Fungsi untuk memuat produk
function fetchProducts() {
    console.log("Memulai pengambilan data produk...");
    
    // Tampilkan loading spinner
    productsContainer.innerHTML = '<div class="loading-spinner"></div>';
    
    // Ambil produk dan kategori sekaligus
    Promise.all([
        database.ref('products').once('value'),
        database.ref('categories').once('value')
    ]).then(([productsSnapshot, categoriesSnapshot]) => {
        console.log("Data produk diterima:", productsSnapshot.val());
        
        const products = productsSnapshot.val();
        const categories = categoriesSnapshot.val();
        
        if (products) {
            allProducts = Object.entries(products).map(([id, product]) => ({ 
                id, 
                ...product,
                category: product.category || '' 
            }));
            
            console.log("Produk yang diproses:", allProducts);
            
            filteredProducts = [...allProducts];
            renderProducts();
            renderCategoryDropdown(categories);
        } else {
            console.log("Tidak ada produk ditemukan");
            productsContainer.innerHTML = '<p class="no-products">Tidak ada produk yang tersedia saat ini.</p>';
        }
    }).catch((error) => {
        console.error("Error mengambil data:", error);
        productsContainer.innerHTML = '<p class="no-products">Gagal memuat produk. Silakan refresh halaman.</p>';
    });
}

// Fungsi untuk merender produk
function renderProducts() {
    console.log("Merender produk...", filteredProducts.length);
    
    productsContainer.innerHTML = '';
    
    const productsToShow = filteredProducts.slice(0, visibleProducts);
    
    if (productsToShow.length === 0) {
        let message = 'Tidak ada produk yang cocok.';
        if (currentCategory) message += ` Kategori: ${currentCategory}`;
        if (currentSearchTerm) message += ` Pencarian: "${currentSearchTerm}"`;
        
        productsContainer.innerHTML = `<p class="no-products">${message}</p>`;
        loadMoreBtn.style.display = 'none';
        return;
    }
    
    productsToShow.forEach(product => {
        const firstImage = product.images && product.images.length > 0 ? 
                          product.images[0] : 
                          'https://via.placeholder.com/300?text=No+Image';
        
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.dataset.id = product.id;
        
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${firstImage}" alt="${product.title || 'Produk'}" loading="lazy">
            </div>
            <div class="product-info">
                <h3>${product.title || 'Tanpa Judul'}</h3>
                <p>${product.description || 'Tidak ada deskripsi'}</p>
                ${product.category ? `<span class="product-category">${product.category}</span>` : ''}
            </div>
        `;
        
        productCard.addEventListener('click', () => openProductModal(product.id, product));
        productsContainer.appendChild(productCard);
    });
    
    loadMoreBtn.style.display = visibleProducts >= filteredProducts.length ? 'none' : 'inline-block';
}

// Fungsi untuk merender dropdown kategori
function renderCategoryDropdown(categories) {
    console.log("Merender dropdown kategori...", categories);
    
    categoryDropdownMenu.innerHTML = '';
    
    // Tambahkan opsi "Semua Kategori"
    const allCategoriesOption = document.createElement('div');
    allCategoriesOption.className = 'dropdown-item';
    allCategoriesOption.textContent = 'Semua Kategori';
    allCategoriesOption.addEventListener('click', () => {
        selectedCategory.textContent = 'Semua Kategori';
        currentCategory = '';
        filterProducts();
        categoryDropdownMenu.classList.remove('show');
    });
    categoryDropdownMenu.appendChild(allCategoriesOption);
    
    // Tambahkan kategori dari database
    if (categories) {
        Object.values(categories).forEach(category => {
            const categoryOption = document.createElement('div');
            categoryOption.className = 'dropdown-item';
            categoryOption.textContent = category.name;
            categoryOption.addEventListener('click', () => {
                selectedCategory.textContent = category.name;
                currentCategory = category.name;
                filterProducts();
                categoryDropdownMenu.classList.remove('show');
            });
            categoryDropdownMenu.appendChild(categoryOption);
        });
    }
}

// Fungsi untuk memfilter produk
function filterProducts() {
    console.log("Memfilter produk...", {
        currentCategory, 
        currentSearchTerm,
        allProductsCount: allProducts.length
    });
    
    filteredProducts = allProducts.filter(product => {
        // Filter kategori
        const categoryMatch = !currentCategory || 
                            (product.category && 
                             product.category.toLowerCase() === currentCategory.toLowerCase());
        
        // Filter pencarian
        const searchMatch = !currentSearchTerm || 
                          (product.title && product.title.toLowerCase().includes(currentSearchTerm.toLowerCase())) || 
                          (product.description && product.description.toLowerCase().includes(currentSearchTerm.toLowerCase())) ||
                          (product.category && product.category.toLowerCase().includes(currentSearchTerm.toLowerCase()));
        
        return categoryMatch && searchMatch;
    });
    
    console.log("Produk setelah filter:", filteredProducts.length);
    
    // Reset visible products
    visibleProducts = 8;
    renderProducts();
}

// Fungsi untuk membuka modal produk
function openProductModal(productId, product) {
    modalProductTitle.textContent = product.title || 'Tanpa Judul';
    modalProductDescription.textContent = product.description || 'Tidak ada deskripsi';
    
    // Set kategori produk
    if (product.category) {
        modalProductCategory.textContent = product.category;
        modalProductCategory.style.display = 'inline-block';
    } else {
        modalProductCategory.style.display = 'none';
    }
    
    // Set link Shopee dan WhatsApp
    shopeeBtn.href = product.shopeeLink || '#';
    shopeeBtn.style.display = product.shopeeLink ? 'inline-flex' : 'none';
    
    if (product.waNumber) {
        waBtn.href = `https://wa.me/${product.waNumber}?text=Saya%20tertarik%20dengan%20produk%20${encodeURIComponent(product.title || '')}`;
        waBtn.style.display = 'inline-flex';
    } else {
        waBtn.style.display = 'none';
    }
    
    // Set gambar utama dan thumbnail
    thumbnailsContainer.innerHTML = '';
    if (product.images && product.images.length > 0) {
        modalMainImage.src = product.images[0];
        
        product.images.forEach((image, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            if (index === 0) thumbnail.classList.add('active');
            
            const img = document.createElement('img');
            img.src = image;
            img.alt = `Thumbnail ${index + 1}`;
            img.loading = 'lazy';
            
            thumbnail.appendChild(img);
            thumbnail.addEventListener('click', () => {
                modalMainImage.src = image;
                document.querySelectorAll('.thumbnail').forEach(thumb => thumb.classList.remove('active'));
                thumbnail.classList.add('active');
            });
            
            thumbnailsContainer.appendChild(thumbnail);
        });
    } else {
        modalMainImage.src = 'https://via.placeholder.com/500?text=No+Image';
    }
    
    productModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Fungsi untuk slider banner
function startSlider() {
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.dot');
    
    slideInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        updateSlider(slides, dots);
    }, 5000);
}

function updateSlider(slides, dots) {
    document.querySelector('.slides-container').style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

function resetSliderTimer() {
    clearInterval(slideInterval);
    startSlider();
}

// Event Listeners
closeModal.addEventListener('click', () => {
    productModal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

window.addEventListener('click', (e) => {
    if (e.target === productModal) {
        productModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Pencarian produk
searchBtn.addEventListener('click', () => {
    currentSearchTerm = searchInput.value.trim();
    filterProducts();
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        currentSearchTerm = searchInput.value.trim();
        filterProducts();
    }
});

// Tombol load more
loadMoreBtn.addEventListener('click', function() {
    this.classList.add('clicked');
    setTimeout(() => this.classList.remove('clicked'), 500);
    
    visibleProducts += productsPerLoad;
    renderProducts();
    
    // Scroll halus ke produk baru
    const lastProduct = document.querySelector('.product-card:last-child');
    if (lastProduct) {
        lastProduct.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
});

// Event listeners untuk slider
prevSlideBtn.addEventListener('click', () => {
    const slides = document.querySelectorAll('.banner-slide');
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateSlider(slides, document.querySelectorAll('.dot'));
    resetSliderTimer();
});

nextSlideBtn.addEventListener('click', () => {
    const slides = document.querySelectorAll('.banner-slide');
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlider(slides, document.querySelectorAll('.dot'));
    resetSliderTimer();
});

// Event listeners untuk dots
document.querySelectorAll('.dot').forEach((dot, index) => {
    dot.addEventListener('click', () => {
        currentSlide = index;
        updateSlider(document.querySelectorAll('.banner-slide'), document.querySelectorAll('.dot'));
        resetSliderTimer();
    });
});

// Dropdown kategori
categoryDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
    categoryDropdownMenu.classList.toggle('show');
});

// Tutup dropdown saat klik di luar
window.addEventListener('click', () => {
    categoryDropdownMenu.classList.remove('show');
});

// Error handling global
window.addEventListener('error', function(event) {
    console.error("Error global:", event.error);
    productsContainer.innerHTML = '<p class="no-products">Terjadi kesalahan. Silakan refresh halaman.</p>';
});

// Load produk dan mulai slider saat halaman dimuat
window.addEventListener('DOMContentLoaded', () => {
    try {
        fetchProducts();
        startSlider();
    } catch (error) {
        console.error("Error inisialisasi:", error);
        productsContainer.innerHTML = '<p class="no-products">Gagal memuat data. Silakan refresh halaman.</p>';
    }
});
// Pencarian produk
searchBtn.addEventListener('click', () => {
    currentSearchTerm = searchInput.value.trim();
    filterProducts();
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        currentSearchTerm = searchInput.value.trim();
        filterProducts();
    }
});

// Tombol load more
loadMoreBtn.addEventListener('click', function() {
    this.classList.add('clicked');
    setTimeout(() => this.classList.remove('clicked'), 500);
    
    visibleProducts += productsPerLoad;
    renderProducts();
    
    // Scroll halus ke produk baru
    const lastProduct = document.querySelector('.product-card:last-child');
    if (lastProduct) {
        lastProduct.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
});

// Event listeners untuk slider
prevSlideBtn.addEventListener('click', () => {
    const slides = document.querySelectorAll('.banner-slide');
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateSlider(slides, document.querySelectorAll('.dot'));
    resetSliderTimer();
});

nextSlideBtn.addEventListener('click', () => {
    const slides = document.querySelectorAll('.banner-slide');
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlider(slides, document.querySelectorAll('.dot'));
    resetSliderTimer();
});

// Event listeners untuk dots
document.querySelectorAll('.dot').forEach((dot, index) => {
    dot.addEventListener('click', () => {
        currentSlide = index;
        updateSlider(document.querySelectorAll('.banner-slide'), document.querySelectorAll('.dot'));
        resetSliderTimer();
    });
});

// Error handling global
window.addEventListener('error', function(event) {
    console.error("Error global:", event.error);
    productsContainer.innerHTML = '<p class="no-products">Terjadi kesalahan. Silakan refresh halaman.</p>';
});

// Load produk dan mulai slider saat halaman dimuat
window.addEventListener('DOMContentLoaded', () => {
    try {
        fetchProducts();
        startSlider();
    } catch (error) {
        console.error("Error inisialisasi:", error);
        productsContainer.innerHTML = '<p class="no-products">Gagal memuat data. Silakan refresh halaman.</p>';
    }
});
// Category Navigation
const categoryTags = document.querySelector('.category-tags');
const prevCategoryBtn = document.createElement('div');
const nextCategoryBtn = document.createElement('div');

prevCategoryBtn.className = 'category-nav prev';
prevCategoryBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
nextCategoryBtn.className = 'category-nav next';
nextCategoryBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';

document.querySelector('.category-tags-container').prepend(prevCategoryBtn);
document.querySelector('.category-tags-container').append(nextCategoryBtn);

// Check if navigation buttons are needed
function checkCategoryNav() {
    const tags = categoryTags;
    const containerWidth = tags.parentElement.clientWidth;
    const tagsWidth = tags.scrollWidth;
    
    prevCategoryBtn.classList.toggle('hidden', tags.scrollLeft <= 10);
    nextCategoryBtn.classList.toggle('hidden', 
        tags.scrollLeft >= (tagsWidth - containerWidth - 10));
}

// Navigation handlers
prevCategoryBtn.addEventListener('click', () => {
    categoryTags.scrollBy({ left: -200, behavior: 'smooth' });
});

nextCategoryBtn.addEventListener('click', () => {
    categoryTags.scrollBy({ left: 200, behavior: 'smooth' });
});

// Check on scroll
categoryTags.addEventListener('scroll', checkCategoryNav);

// Initial check
window.addEventListener('load', checkCategoryNav);
window.addEventListener('resize', checkCategoryNav);