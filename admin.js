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
const productForm = document.getElementById('productForm');
const productIdInput = document.getElementById('productId');
const productTitleInput = document.getElementById('productTitle');
const productDescriptionInput = document.getElementById('productDescription');
const productCategoryInput = document.getElementById('productCategory');
const shopeeLinkInput = document.getElementById('shopeeLink');
const waNumberInput = document.getElementById('waNumber');
const imageInputsContainer = document.getElementById('imageInputs');
const addImageBtn = document.getElementById('addImageBtn');
const resetFormBtn = document.getElementById('resetFormBtn');
const productListContainer = document.getElementById('productList');
const newCategoryNameInput = document.getElementById('newCategoryName');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const categoryListContainer = document.getElementById('categoryList');

// SweetAlert Configuration
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

// Tambah input gambar
addImageBtn.addEventListener('click', () => {
    const imageCount = document.querySelectorAll('.image-input').length;
    if (imageCount >= 5) {
        Toast.fire({
            icon: 'warning',
            title: 'Maksimal 5 gambar per produk'
        });
        return;
    }
    
    const imageInput = document.createElement('div');
    imageInput.className = 'image-input';
    imageInput.innerHTML = `
        <input type="url" class="imageUrl" placeholder="https://example.com/image.jpg">
        <button type="button" class="remove-image-btn"><i class="fas fa-times"></i></button>
    `;
    
    imageInputsContainer.appendChild(imageInput);
    
    // Tambahkan event listener untuk tombol hapus
    imageInput.querySelector('.remove-image-btn').addEventListener('click', () => {
        imageInput.remove();
    });
});

// Reset form
resetFormBtn.addEventListener('click', resetForm);

function resetForm() {
    productForm.reset();
    productIdInput.value = '';
    imageInputsContainer.innerHTML = `
        <div class="image-input">
            <input type="url" class="imageUrl" placeholder="https://example.com/image1.jpg">
            <button type="button" class="remove-image-btn"><i class="fas fa-times"></i></button>
        </div>
    `;
    
    // Tambahkan event listener untuk tombol hapus yang baru
    document.querySelector('.remove-image-btn').addEventListener('click', function() {
        this.parentElement.remove();
    });
}

// Submit form produk
productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Kumpulkan URL gambar
    const imageUrls = [];
    document.querySelectorAll('.imageUrl').forEach(input => {
        if (input.value.trim() !== '') {
            imageUrls.push(input.value.trim());
        }
    });
    
    if (imageUrls.length === 0) {
        Toast.fire({
            icon: 'error',
            title: 'Harap masukkan minimal 1 gambar produk'
        });
        return;
    }
    
    // Validasi kategori
    if (!productCategoryInput.value) {
        Toast.fire({
            icon: 'error',
            title: 'Harap pilih kategori produk'
        });
        return;
    }
    
    // Buat objek produk
    const product = {
        title: productTitleInput.value.trim(),
        description: productDescriptionInput.value.trim(),
        category: productCategoryInput.value,
        shopeeLink: shopeeLinkInput.value.trim(),
        waNumber: waNumberInput.value.trim(),
        images: imageUrls,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    // Simpan ke Firebase
    const productId = productIdInput.value;
    const loadingSwal = Swal.fire({
        title: 'Menyimpan data...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    if (productId) {
        // Update produk yang ada
        database.ref(`products/${productId}`).update(product)
            .then(() => {
                loadingSwal.close();
                Toast.fire({
                    icon: 'success',
                    title: 'Produk berhasil diperbarui!'
                });
                resetForm();
                fetchProducts();
            })
            .catch(error => {
                loadingSwal.close();
                console.error('Error updating product: ', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal memperbarui produk',
                    text: error.message
                });
            });
    } else {
        // Tambah produk baru
        database.ref('products').push(product)
            .then(() => {
                loadingSwal.close();
                Toast.fire({
                    icon: 'success',
                    title: 'Produk berhasil ditambahkan!'
                });
                resetForm();
                fetchProducts();
            })
            .catch(error => {
                loadingSwal.close();
                console.error('Error adding product: ', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal menambahkan produk',
                    text: error.message
                });
            });
    }
});

// Tambah kategori baru
addCategoryBtn.addEventListener('click', () => {
    const categoryName = newCategoryNameInput.value.trim();
    
    if (!categoryName) {
        Toast.fire({
            icon: 'error',
            title: 'Harap masukkan nama kategori'
        });
        return;
    }
    
    const loadingSwal = Swal.fire({
        title: 'Menambahkan kategori...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    // Cek apakah kategori sudah ada
    database.ref('categories').orderByChild('name').equalTo(categoryName).once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                loadingSwal.close();
                Toast.fire({
                    icon: 'error',
                    title: 'Kategori sudah ada'
                });
                return;
            }
            
            // Tambahkan kategori baru
            database.ref('categories').push({
                name: categoryName,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            })
            .then(() => {
                loadingSwal.close();
                Toast.fire({
                    icon: 'success',
                    title: 'Kategori berhasil ditambahkan!'
                });
                newCategoryNameInput.value = '';
                fetchCategories();
            })
            .catch(error => {
                loadingSwal.close();
                console.error('Error adding category: ', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal menambahkan kategori',
                    text: error.message
                });
            });
        })
        .catch(error => {
            loadingSwal.close();
            console.error('Error checking category: ', error);
            Swal.fire({
                icon: 'error',
                title: 'Terjadi kesalahan',
                text: error.message
            });
        });
});

// Hapus kategori
function deleteCategory(categoryId) {
    Swal.fire({
        title: 'Apakah Anda yakin?',
        text: "Kategori yang dihapus akan dihapus dari semua produk terkait!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            const loadingSwal = Swal.fire({
                title: 'Menghapus kategori...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Dapatkan nama kategori untuk referensi
            database.ref(`categories/${categoryId}`).once('value')
                .then(snapshot => {
                    const categoryName = snapshot.val().name;
                    
                    // Hapus kategori
                    database.ref(`categories/${categoryId}`).remove()
                        .then(() => {
                            // Update semua produk yang memiliki kategori ini
                            database.ref('products').orderByChild('category').equalTo(categoryName).once('value')
                                .then(snapshot => {
                                    const updates = {};
                                    snapshot.forEach(childSnapshot => {
                                        updates[`products/${childSnapshot.key}/category`] = '';
                                    });
                                    
                                    if (Object.keys(updates).length > 0) {
                                        return database.ref().update(updates);
                                    }
                                    return Promise.resolve();
                                })
                                .then(() => {
                                    loadingSwal.close();
                                    Toast.fire({
                                        icon: 'success',
                                        title: 'Kategori berhasil dihapus!'
                                    });
                                    fetchCategories();
                                    fetchProducts();
                                })
                                .catch(error => {
                                    loadingSwal.close();
                                    console.error('Error updating products: ', error);
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Gagal memperbarui produk',
                                        text: error.message
                                    });
                                });
                        })
                        .catch(error => {
                            loadingSwal.close();
                            console.error('Error deleting category: ', error);
                            Swal.fire({
                                icon: 'error',
                                title: 'Gagal menghapus kategori',
                                text: error.message
                            });
                        });
                })
                .catch(error => {
                    loadingSwal.close();
                    console.error('Error getting category: ', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal mendapatkan data kategori',
                        text: error.message
                    });
                });
        }
    });
}

// Ambil data produk untuk ditampilkan di list
function fetchProducts() {
    const loadingSwal = Swal.fire({
        title: 'Memuat data...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    database.ref('products').once('value', (snapshot) => {
        loadingSwal.close();
        const products = snapshot.val();
        productListContainer.innerHTML = '';
        
        if (products) {
            Object.keys(products).forEach(key => {
                const product = products[key];
                const firstImage = product.images ? product.images[0] : '';
                
                const productItem = document.createElement('div');
                productItem.className = 'product-item';
                productItem.innerHTML = `
                    <div class="product-info">
                        <h3>${product.title}</h3>
                        <p>${product.description}</p>
                        ${product.category ? `<span class="product-category">${product.category}</span>` : ''}
                    </div>
                    <div class="product-actions">
                        <button class="edit-btn" data-id="${key}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" data-id="${key}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                productListContainer.appendChild(productItem);
            });
            
            // Tambahkan event listener untuk tombol edit dan hapus
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => editProduct(btn.dataset.id));
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
            });
        } else {
            productListContainer.innerHTML = '<p>Tidak ada produk yang tersedia.</p>';
        }
    }).catch(error => {
        loadingSwal.close();
        Swal.fire({
            icon: 'error',
            title: 'Gagal memuat produk',
            text: error.message
        });
    });
}

// Ambil data kategori
function fetchCategories() {
    database.ref('categories').once('value', (snapshot) => {
        const categories = snapshot.val();
        categoryListContainer.innerHTML = '';
        productCategoryInput.innerHTML = '<option value="">Pilih Kategori</option>';
        
        if (categories) {
            Object.keys(categories).forEach(key => {
                const category = categories[key];
                
                // Tambahkan ke dropdown kategori
                const option = document.createElement('option');
                option.value = category.name;
                option.textContent = category.name;
                productCategoryInput.appendChild(option);
                
                // Tambahkan ke daftar kategori
                const categoryItem = document.createElement('div');
                categoryItem.className = 'category-item';
                categoryItem.innerHTML = `
                    <div class="category-info">
                        <h4>${category.name}</h4>
                    </div>
                    <div class="category-actions">
                        <button class="delete-category-btn" data-id="${key}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                categoryListContainer.appendChild(categoryItem);
            });
            
            // Tambahkan event listener untuk tombol hapus kategori
            document.querySelectorAll('.delete-category-btn').forEach(btn => {
                btn.addEventListener('click', () => deleteCategory(btn.dataset.id));
            });
        } else {
            categoryListContainer.innerHTML = '<p>Tidak ada kategori yang tersedia.</p>';
        }
    }).catch(error => {
        console.error('Error fetching categories: ', error);
        Toast.fire({
            icon: 'error',
            title: 'Gagal memuat kategori'
        });
    });
}

// Edit produk
function editProduct(productId) {
    const loadingSwal = Swal.fire({
        title: 'Memuat data produk...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    database.ref(`products/${productId}`).once('value', (snapshot) => {
        loadingSwal.close();
        const product = snapshot.val();
        
        if (product) {
            productIdInput.value = productId;
            productTitleInput.value = product.title || '';
            productDescriptionInput.value = product.description || '';
            productCategoryInput.value = product.category || '';
            shopeeLinkInput.value = product.shopeeLink || '';
            waNumberInput.value = product.waNumber || '';
            
            // Set gambar
            imageInputsContainer.innerHTML = '';
            if (product.images && product.images.length > 0) {
                product.images.forEach((imageUrl, index) => {
                    const imageInput = document.createElement('div');
                    imageInput.className = 'image-input';
                    imageInput.innerHTML = `
                        <input type="url" class="imageUrl" value="${imageUrl}" placeholder="https://example.com/image${index + 1}.jpg">
                        <button type="button" class="remove-image-btn"><i class="fas fa-times"></i></button>
                    `;
                    
                    imageInputsContainer.appendChild(imageInput);
                    
                    // Tambahkan event listener untuk tombol hapus
                    imageInput.querySelector('.remove-image-btn').addEventListener('click', () => {
                        imageInput.remove();
                    });
                });
            } else {
                imageInputsContainer.innerHTML = `
                    <div class="image-input">
                        <input type="url" class="imageUrl" placeholder="https://example.com/image1.jpg">
                        <button type="button" class="remove-image-btn"><i class="fas fa-times"></i></button>
                    </div>
                `;
                
                // Tambahkan event listener untuk tombol hapus yang baru
                document.querySelector('.remove-image-btn').addEventListener('click', function() {
                    this.parentElement.remove();
                });
            }
            
            // Scroll ke form
            document.querySelector('.product-form').scrollIntoView({ behavior: 'smooth' });
        }
    }).catch(error => {
        loadingSwal.close();
        Swal.fire({
            icon: 'error',
            title: 'Gagal memuat produk',
            text: error.message
        });
    });
}

// Hapus produk
function deleteProduct(productId) {
    Swal.fire({
        title: 'Apakah Anda yakin?',
        text: "Produk yang dihapus tidak dapat dikembalikan!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            const loadingSwal = Swal.fire({
                title: 'Menghapus produk...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            database.ref(`products/${productId}`).remove()
                .then(() => {
                    loadingSwal.close();
                    Toast.fire({
                        icon: 'success',
                        title: 'Produk berhasil dihapus!'
                    });
                    fetchProducts();
                })
                .catch(error => {
                    loadingSwal.close();
                    console.error('Error deleting product: ', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal menghapus produk',
                        text: error.message
                    });
                });
        }
    });
}

// Load produk dan kategori saat halaman dimuat
window.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    fetchCategories();
    
    // Inisialisasi tombol hapus untuk input gambar pertama
    document.querySelector('.remove-image-btn').addEventListener('click', function() {
        this.parentElement.remove();
    });
});