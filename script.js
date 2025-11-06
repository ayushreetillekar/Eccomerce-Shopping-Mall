let categories = []
let products = [];
let currentUser = {
    name: "",
    email: "",
    phone: "",
    address: "",
};
let recentlyViewed = [];
let filteredProducts = [];
let cart = [];
let orders = [];
let currentOrdersSteps = 1;


async function loadData() {
    try {
        const response = await fetch("data.json");
        if (!response.ok) {
            throw new Error("failed to load resource");
        }
        else {
            const data = await response.json();
            categories = data.categories;
            products = data.products;

            InitializeApp();
        }
    } catch (error) {
        console.log("Error loading data", error);
        document.body.innerHTML = `<div style="text-align : center; margin-top
                                  :50px;"> <h2> Error loading data. Please refresh </h2></div>`
    }
}

function InitializeApp() {
    loadUserData();
    loadCartData();
    loadOrdersData();
    loadRecentlyViewed();
    renderCategories();
    showPage("home");
}

document.addEventListener("DOMContentLoaded", function () {
    loadData();
})

function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.add("hidden"));

    const targetpage = document.getElementById(pageId + "Page");
    if (targetpage) {
        targetpage.classList.remove("hidden");
    }

    switch (pageId) {

        case "home": renderCategories();
            document.getElementById("home-page").classList.remove('hidden');
            break;

        case "cart": renderCart();
            break;

        case "orders": renderOrders();
            break;

        case "account": renderAccountPage();
            break;
    }
}

function toggleSidebar() {
    document.querySelector('.mobile-menu-btn').addEventListener('click', () => {
        document.querySelector('.sidebar').style.left = 0;
    })
    document.querySelector('.close-sidebar').addEventListener('click', () => {
        document.querySelector('.sidebar').style.left = "-320%";
    })
}

function searchProducts() {
    const searchTerm = document.getElementById("search-input").value.toLowerCase();
    if (searchTerm.trim() === '') return;

    filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
    );

    document.getElementById("categoryTitle").textContent = `Search results for "${searchTerm}"`;
    populateFilters();
    renderProducts();
    showPage("category");
}

function renderCategories() {
    const categoryGrid = document.getElementById('category-grid');
    categoryGrid.innerHTML = "";

    categories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.onclick = () => showCategory(category.id);

        let cardContent = `<img src="${category.image}" alt = "${category.name}">
        <div class = "category-card-content">
        <h3> ${category.name}</h3>
        <p> ${category.description} </p>`

        if (category.isrecentlyViewed) {
            if (recentlyViewed === 0) {
                cardContent += `<p> No Recently viewed</p>`
            } else {
                cardContent += `<p> you have ${recentlyViewed.length} recently viewed</p>`
            }
        }
        cardContent += `<a href = "#" class="category-btn">View Product</a>
        </div>`
        categoryCard.innerHTML = cardContent;
        categoryGrid.appendChild(categoryCard);
    })
}

function showCategory(categoryId) {
    if (categoryId === "recently-viewed") {
        filteredProducts = products.filter(product => recentlyViewed.includes(product.id))
        document.getElementById("categoryTitle").textContent = "Recently Viewd"
    }
    else {
        filteredProducts = products.filter(product => product.category === categoryId)
        const category = categories.find(cat => cat.id === categoryId);
        document.getElementById("categoryTitle").textContent = category.name;
    }

    populateFilters()
    renderProducts()
    showPage("category")

}

function populateFilters() {
    const brandFilter = document.getElementById("brandFilter");
    const brands = [...new Set(filteredProducts.map(products => products.brand))]

    brandFilter.innerHTML = `<option value="">All Brands</option> `;

    brands.forEach(brand => {
        const option = document.createElement("option");
        option.value = brand;
        option.textContent = brand;
        brandFilter.appendChild(option);
    });
}

function applyFilteres() {
    const sortBy = document.getElementById('sortBy').value;
    const maxPrice = parseInt(document.getElementById('priceRange').value);
    const selectedBrand = document.getElementById("brandFilter").value;

    document.getElementById("priceValue").textContent = "$" + maxPrice;

    let filtered = filteredProducts.filter(products => {
        if (products.price > maxPrice) return false;
        if (selectedBrand && products.brand !== selectedBrand) return false;

        return true;
    })

    switch (sortBy) {
        case "price-low": filtered.sort((a, b) => a.price - b.price);
            break;

        case "price-high": filtered.sort((a, b) => b.price - a.price);
            break;

        case "rating": filtered.sort((a, b) => b.rating - a.rating);
            break;

        default:
            break;
    }

    renderProducts(filtered);
}

function renderProducts(products = filteredProducts) {
    const productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = "";

    if (products.length === 0) {
        productGrid.innerHTML = `<p> No Products Found matching your criteria</p>`;
        return;
    }
    products.forEach(product => {
        const productCard = document.createElement("div");
        productCard.className = "product-card";

        productCard.onclick = () => showProducts(product.id);

        productCard.innerHTML = `<img src ="${product.image}" alt="${product.name}">
        <div class="product-card-content">
         <div class ="product-brand"> ${product.brand}</div>
         <h3>${product.name}</h3>
         <div class ="product-rating">
         ${`<img src="img/rating.svg" class="rate-svg">`.repeat(Math.floor(product.rating))}${`<img src="img/rating.svg" class="rate-svg">`.repeat(5 - Math.floor(product.rating))}
         ${product.rating}
         </div>
         
         <div class="product-price">
         <span class="current-price"><img src ="img/rup.svg" class="rup-svg">${product.price}</span>
         <span class="original-price"><img src ="img/rup.svg" class="rup-svg">${product.originalPrice}</span>
         <span class="discount">${product.discount}% OFF</span>

         </div>
         </div> `

        productGrid.appendChild(productCard)
    });
}

function showProducts(productId) {
    const product = products.find(p => p.id === productId)

    if (!product) return;

    if (!recentlyViewed.includes(productId)) {
        recentlyViewed.unshift(productId);
        if (recentlyViewed.length > 10) {
            recentlyViewed.pop();
        }
        saveRecentlyViewed()
    }
    const productDetails = document.getElementById('product-detail');
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);

    productDetails.innerHTML = `
    <div> 
          <img src="${product.image}" alt="${product.name}" class = "product-image">
    
    </div>
        <div class="product-info">
             <h1>${product.name}</h1>
            <div class="brand">${product.brand}</div>
            <div class ="product-rating">
                 ${`<img src="img/rating.svg" class="rate-svg">`.repeat(Math.floor(product.rating))}${`<img src="img/rating.svg" class="rate-svg">`.repeat(5 - Math.floor(product.rating))}
                 ${product.rating} / 5;
            </div>

            <div class="product-price">
                <span class="current-price"><img src ="img/rup.svg" class="rup-svg">${product.price}</span>
                <span class="original-price"><img src ="img/rup.svg" class="rup-svg">${product.originalPrice}</span>
                <span class="discount">${product.discount}% OFF</span>
            </div>
            <div class="discription">${product.description}</div>

           <div class="product-option">
                 ${product.colors.length > 0 ? `
                   <div class="option-group">
                     <label> Color : </label>
                         <select id="selectedColor">
                            ${product.colors.map(color =>
        `<option value="${color}">${color}</option>`
    ).join("")}
                         </select>
                   </div>`
            : " "}
     
              ${product.sizes.length > 0 ?
            `<div class="option-group">
                    <label> Size : </label>
                     <select id="selectedSize">
                        ${product.sizes.map(size =>
                `<option value="${size}">${size}</option>`
            ).join("")}
                     </select>
                </div> `
            : " "}
        

             <div class="address-section">
                <h3> Delivery Address</h3>
                 ${currentUser.address ? `
                <p>${currentUser.address}</p>
                <button class="btn-secondary" onclick="showPage("account")">Change Address</button>
                ` : `
                <p>No Address added</p>
                <button class="btn-secondary" onclick="showPage("account")">Add Address</button>
                 `}
            </div> 
            
            <div class="delivery-info">
               <h4>Delivery Information</h4>
               <p>Delivery By ${deliveryDate.toLocaleDateString()}</p>
               <p>10 days return policy</p>
               <p>Cash on Delivery available</p>
            </div>

            <div class="product-actions">
                 <button class="btn-primary" onclick="addToCart(${product.id})">Add to Cart</button>
                 <button class="btn-secondary" onclick="buyNow(${product.id})">Buy Now </button>
            </div> 
        </div>    
                `
    showPage("product");

}

function buyNow(productId) {
    addToCart(productId)
    showPage("cart");
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId)
    if (!product) return;

    const selectedColor = document.getElementById("selectedColor")?.value || " ";
    const selectedSize = document.getElementById("selectedSize")?.value || " ";

    const existingItem = cart.find(item =>
        item.id === productId &&
        item.color === selectedColor &&
        item.size === selectedSize
    )
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            brand: product.brand,
            price: product.price,
            originalPrice: product.originalPrice,
            discount: product.discount,
            image: product.image,
            color: selectedColor,
            size: selectedSize,
            quantity: 1,
        })
    }
    updateCartCount()
    saveCartData()
    alert("Product Added To Cart")
}

function renderCart() {
    const cartItems = document.getElementById("cartItems");
    const cartSummary = document.getElementById("cartSummary");

    if (cart.length === 0) {
        cartItems.innerHTML = `<p> Your Cart Is Empty <a hret="#" onclick="showPage(\'home\')"> Continue Shopping</a></p>`
        cartSummary.innerHTML = '';
        return;
    }

    cartItems.innerHTML = "";
    let totalOriginal = 0;
    let totalDiscounted = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        const itemOriginalTotal = item.originalPrice * item.quantity;
        totalOriginal = itemOriginalTotal;
        totalDiscounted = itemTotal;

        const cartItem = document.createElement("div");
        cart.className = "cart-item";
        cartItem.innerHTML = `

    <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div class = "cart-item-details">
               <h3> ${item.name}</h3>
               <div class="product-brand">${item.brand}</div>
                ${item.color ? `<p> Color : ${item.color}</p>` : ""}
                ${item.size ? `<p> Size : ${item.size}</p>` : ""}
           <div class="product-price">
             <span class="current-price">${item.price}</span>
             <span class="original-price">${item.originalPrice}</span>
             <span class="discount">${item.discount}% OFF</span>
           </div>

           <div class ="quantity-controls">
              <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
             <input type="number" class="quantity-input" value="${item.quantity}" min="1" onchange="updateQuantity(${index}, 0, this.value)">
             <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
           </div>

          <p> Total :${itemTotal}</p>
        </div>

        <button class="btn-secondary" onclick="removeFromCart(${index})">Remove</button>
    </div>    
        `
        cartItems.appendChild(cartItem);
    })

    const deliveryCharges = totalDiscounted > 500 ? 0 : 50;
    const finalTotal = totalDiscounted + deliveryCharges;

    cartSummary.innerHTML = `
    <h3> Price Details : </h3>
    <div class = "summary-row">
      <span>Total MRP : </span>
      <span>${totalOriginal - totalDiscounted}</span>
    </div>
    <div class="summary-row">
       <span>Discount : </span>
       <span${deliveryCharges === 0 ? "FREE" : `<img src="img/rup.svg">` + deliveryCharges}</span>
    </div>
    <div class="summary-divider"></div>
    <div class="summary-row summary-total">
       <span>Total Amount : </span>
       <span>${finalTotal}</span>
    </div>
      
    <button class="btn-primary" onclick="proceedToCheackout();renderOrderSteps()"
    style="width:100%; margin-top="20px;">
    Place Order</button>
    `
}

function updateQuantity(index, change, newValue = null) {
    if (newValue !== null) {
        cart[index].quantity = Math.max(1, parent(newValue) || 1)
    } else {
        cart[index].quantity = Math.max(1, cart[index].quantity + change)
    }

    updateCartCount();
    saveCartData();
    renderCart()
}

function renderOrderSteps() {
    const orderSteps = document.getElementById("orderSteps");

    if (currentOrdersSteps === 1) {
        if (!currentUser.name || !currentUser.phone || !currentUser.address) {
            orderSteps.innerHTML = `
            <div class= "order-form">
                    <h2>Step 1 : Enter Your Details</h2>
                    <div class="form-group">
                        <label for="orderName">Name : </label>
                        <input type="text" id="orderName" value="${currentUser.name}" placeholder="Enter Your Name">
                    </div>    
                    <div class="form-group">
                        <label for="orderPhone">Phone Number : </label>
                        <input type="tel" id="orderPhone" value="${currentUser.phone}" placeholder="Enter Your Phone Number">
                    </div>    
                    <div class="form-group">
                        <label for="orderAddress">Address : </label>
                        <textarea id="orderAddress" placeholder="Enter Your Complete Address">${currentUser.address}</textarea>
                    </div>  
                    
                    <button class="btn-primary" onclick="saveOrderDetails()">Continue To Summary</button>
            </div>        `;
        }
        else {
            currentOrdersSteps = 2;
            renderOrderSteps();
        }
    } else if (currentOrdersSteps === 2) {
        const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0)
        const deliveryCharges = cartTotal > 500 ? 0 : 50;
        const finalTotal = cartTotal + deliveryCharges;

        let cartItemHtml = "";
        cart.forEach(item => {
            cartItemHtml += `
            <div class="cart-item">
                <img src="${item.image}">
                <div class= "cart-item-details">
                    <h3> ${item.name}</h3>
                    <div class="product-brand"> ${item.brand}</div>
                    ${item.color ? `<p>Color : ${item.color}</p>` : ""}
                    ${item.size ? `<p>Size :${item.size}</p>` : ""}
                    <p>Quantity : ${item.quantity}</p>
                    <p>Price : ${item.price * item.quantity}</p>
                </div>
            </div>        `
        })

        orderSteps.innerHTML = `
        <div class="order-form">
            <h2>Step 2 : Order Summary</h2>
            <div class="address-section">
                <h3>Delivery Address</h3>
                <p><strong>${currentUser.name}</strong></p>
                <p>${currentUser.phone}</p>
                <p>${currentUser.address}</p>
            </div>
            
            <h3> Order Items</h3>
            ${cartItemHtml}
            
            <div class="cart-summary">
                <div class="summary-row">
                    <span> Item Total : </span>
                    <span> ${cartTotal}</span>
                </div>  
                <div class="summary-row">
                    <span> Delivery Charges : </span>
                    <span> ${deliveryCharges === 0 ? "FREE" : deliveryCharges}</span>
                </div>  
                <div class="summary-divider"></div>
                <div class="summary-row summary-total">
                    <span> Total Amount : </span>
                    <span> ${finalTotal}</span>
                </div>   
            </div> 
            
            <button class="btn-primary"
            onclick="proceedToPayment()">Proceed to Payment</button>
        </div>    `;
    } else if (currentOrdersSteps === 3) {
        orderSteps.innerHTML = `
        <div class="order-form">
            <h2>Step 3 : Payment</h2>
            <div class="payment-options">
                <div class="payment-option">
                   <input type="radio" id="upi" name="payment" value="upi">
                   <label for="upi" >UPI Payment</label>
                </div>
                <div class="payment-option">
                   <input type="radio" id="card" name="payment" value="card">
                   <label for="upi" >Credit / Debit Card</label>
                </div>
                <div class="payment-option">
                    <input type="radio" id="cod" name="payment" value="cod" cheaked>
                    <label for="upi" >Cash On Delivery</label>
                </div>
            </div>

             <button class="btn-primary" onclick="placeOrders()"> Place Order</button>
        </div>
                `
    }
}

function saveOrderDetails() {
    const name = document.getElementById("orderName").value.trim();
    const phone = document.getElementById("orderPhone").value.trim();
    const address = document.getElementById("orderAddress").value.trim();

    if (!name || !phone || !address) {
        alert("Please Enter Your Address")
        return;
    }
    currentUser.name = name;
    currentUser.phone = phone;
    currentUser.address = address;

    saveUserData();

    currentOrdersSteps = 2;
    renderOrderSteps();
}

function proceedToPayment() {
    currentOrdersSteps = 3;
    renderOrderSteps();
}

function placeOrders() {
    const paymentMethod = document.querySelector('input[name="payment"]')?.value

    if (!paymentMethod) {
        alert("Please Selecet Payment Method");
        return;
    }
    const orderId = "ORD" + Date.now();
    const orderDate = new Date();
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);

    const order = {
        id: orderId,
        items: [...cart],
        total: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
        deliveryCharges: cart.reduce((total, item) => total + (item.price + item.quantity), 0) > 500 ? 0 : 50,
        paymentMethod: paymentMethod,
        orderDate: orderDate,
        deliveryDate: deliveryDate,
        status: "confirmed",
        address: currentUser.address,
        phone: currentUser.phone,
        name: currentUser.name
    };

    orders.push(order)
    saveOrdersData();

    cart = [];
    updateCartCount();
    saveCartData();

    document.getElementById("orderSteps").innerHTML = `
    <div class = "order-success">
       <h1> Order Placed Successfully</h2>
       <p>Your Order ID is : <strong>${orderId}</strong></p>
       <p>Expected Delivery : ${deliveryDate.toLocaleDateString()}</p>
       <button class="btn-primary" onclick="showPage("orders")">View My Orders</button>
       <button class="btn-secondary" onclick="showPage("home")">Continue Shopping</button>
    </div>   `
}

function renderOrders() {
    const orderList = document.getElementById("ordersList");

    if (orders.length === 0) {
        orderList.innerHTML = `<p> No orders found<a href="#" onclick="showPage(\"home\")">Start shopping</a></p>`
    }

    orderList.innerHTML = "";

    const sortedOrders = [...orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))

    sortedOrders.forEach(order => {
        const currentDate = new Date();
        const isDeliverd = currentDate > order.deliveryDate;

        const orderDiv = document.createElement("div");
        orderDiv.className = "order-card";

        let orderItemsHtml = "";
        order.items.forEach(item => {
            orderItemsHtml += `
            <div class="cart-item">
                <img src="${item.image}">
                <div class="cart-item-details">
                <h3> ${item.name}</h3>
                <div class="product-brand"> ${item.brand}</div>
                ${item.color ? `<p>Color : ${item.color}</p>` : ""}
                    ${item.size ? `<p>Size :${item.size}</p>` : ""}
                    <p>Quantity : ${item.quantity}</p>
                    <p>Price : ${item.price * item.quantity}</p>
                </div>
            </div>        
                `
        })

        orderDiv.innerHTML = `
        <div class="order-header" onclick="toggleOrderDetails("${order.id}")">
            <div class="order-summary">
                <h3>Order ID: ${order.id}</h3>
                <span class="status-badge ${isDeliverd ? "delivered" : "on-way"}"></span>
            </div>
            <div class="order-meta">
                <p><strong>Order Date : </strong>${order.orderDate.toLocaleDateString()}</p>    
                <p><strong>Total : </strong>${order.total + order.deliveryCharges}</p>    
                <p><strong>Items : </strong>${order.items.length} item${order.items.length > 1 ? "s" : ""}</p>
            </div>
            
            <div class="dropdown-arrow">
                <span class="arrow-icon">^</span>
            </div>
        </div>
        
        <div class="order-details" id="details-${order.id}" style="display:none;">
            <div class="order-info">
               
                <p><strong>Delivery Date : </strong>${order.deliveryDate.toLocaleDateString()}</p>
                <p><strong>Payment Method : </strong>${order.paymentMethod.toUpperCase()}</p>
                
                <div class="address-section">
                    <h4>Delivery Address :</h4>
                    <p>${order.name}</p>
                    <p>${order.phone}</p>
                    <p>${order.address}</p>
                    
                </div>
                
                <h4>Order Items : </h4>
                ${orderItemsHtml}
                
                <div class="cart-summary">
                    <div class="summary-row">
                        <span>Items Total : </span>
                        <span>${order.total}</span>
                    </div>
                    <div class="summary-row">
                        <span>Delivery Charges : </span>
                        <span>${order.deliveryCharges === 0 ? "FREE" : order.deliveryCharges}</span>
                    </div>
                    <div class="summary-divider"></div>
                    <div class="summary-row summary-total">
                        <span>Total Paid: </span>
                        <span>${order.total + order.deliveryCharges}</span>
                    </div>
                </div>
            </div>
        </div>            
                        `
        orderList.appendChild(orderDiv);
    });
}

function toggleOrderDetails(orderId) {
    const detailsDiv = document.getElementById(`details-${orderId}`);
    const arrowIcon = detailsDiv.previousElementSibling.querySelector(".arrow-icon");

    if (detailsDiv.style.display === 'none') {
        detailsDiv.style.display = "block";
        arrowIcon.style.transform = "rotate(180deg)";
    } else {
        detailsDiv.style.display = "none";
        arrowIcon.style.transform = "rotate(0deg)";
    }
}

function saveOrdersData() {
    try {
        window.ordersData = orders
    } catch (e) {
        console.log("Storage is'nt available");
    }
}
// function saveOrderData() {
//     try {
//         window.userData = currentUser
//     } catch (e) {
//         console.log("Storage is'nt available");
//     }
// }

function saveUserData() {
    try {
        window.userData = currentUser;
    } catch (e) {
        console.log("Storage Not Available");
    }
}

function loadUserAccountPage() {
    document.getElementById("userName").value = currentUser.name || '';
    document.getElementById("userEmail").value = currentUser.email || '';
    document.getElementById("userPhone").value = currentUser.phone || '';
    document.getElementById("userAddress").value = currentUser.address || '';
}

function saveUserInfo() {
    currentUser.name = document.getElementById("userName").value.trim();
    currentUser.email = document.getElementById("userEmail").value.trim();
    currentUser.phone = document.getElementById("userPhone").value.trim();
    currentUser.address = document.getElementById("userAddress").value.trim();

    saveUserData();
    alert("information saved successfully");
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    saveCartData();
    renderCart();
}

function proceedToCheackout() {
    currentOrdersSteps = 1;
    showPage("order");
}

function updateCartCount() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
    document.getElementById("cartCount").textContent = cartCount;
}

function saveCartData() {
    try {
        window.cartData = cart;
    } catch (e) {
        console.log("No save data");
    }
}

function saveRecentlyViewed() {
    try {
        window.recentlyViewedData = recentlyViewed;
    } catch (e) {
        console.log("strore");
    }
}

function loadUserData() {
    try {
        if (window.userData) {
            currentUser = window.userData
        }
    } catch (e) {
        console.log("Storage not available");
    }
}

function loadCartData() {
    try {
        if (window.cartData) {
            cart = window.cartData
        }
    } catch (e) {
        console.log("storage is not available")
    }
}
function loadOrdersData() {
    try {
        if (window.ordersData) {
            orders = window.ordersData
        }
    } catch (e) {
        console.log("storage is not available")
    }
}
function loadRecentlyViewed() {
    try {
        if (window.recentlyViewedData) {
            recentlyViewed = window.recentlyViewedData
        }
    } catch (e) {
        console.log("storage is not available")
    }
}