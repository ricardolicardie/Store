// Import the Firebase SDK
import firebase from "firebase/app"
import "firebase/auth"
import "firebase/firestore"
import "firebase/storage"

// Firebase Configuration
const firebaseConfig = {
  // Reemplaza estos valores con tu configuración de Firebase
  apiKey: "tu-api-key-aqui",
  authDomain: "invitehaven-demo.firebaseapp.com",
  projectId: "invitehaven-demo",
  storageBucket: "invitehaven-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

// Initialize Firebase services
const auth = firebase.auth()
const db = firebase.firestore()
const storage = firebase.storage()

// Auth state observer
let currentUser = null

auth.onAuthStateChanged((user) => {
  currentUser = user
  updateUIForAuthState(user)
})

function updateUIForAuthState(user) {
  const signinBtn = document.querySelector(".signin-btn")
  const cartCount = document.getElementById("cartCount")

  if (user) {
    // User is signed in
    if (signinBtn) {
      signinBtn.textContent = user.displayName || "Mi Cuenta"
      signinBtn.onclick = () => (window.location.href = "dashboard.html")
    }

    // Load cart count from Firestore
    loadCartCount()
  } else {
    // User is signed out
    if (signinBtn) {
      signinBtn.textContent = "Iniciar Sesión"
      signinBtn.onclick = () => showAuthModal()
    }

    if (cartCount) {
      cartCount.textContent = "0"
    }
  }
}

// Authentication functions
async function signInWithEmail(email, password) {
  try {
    const result = await auth.signInWithEmailAndPassword(email, password)
    showNotification("¡Bienvenido de vuelta!")
    return result.user
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code))
  }
}

async function signUpWithEmail(email, password, displayName) {
  try {
    const result = await auth.createUserWithEmailAndPassword(email, password)

    // Update profile
    await result.user.updateProfile({
      displayName: displayName,
    })

    // Create user document in Firestore
    await db
      .collection("users")
      .doc(result.user.uid)
      .set({
        displayName: displayName,
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        preferences: {
          emailNotifications: true,
          promotionalEmails: true,
          newDesignAlerts: false,
        },
      })

    showNotification("¡Cuenta creada exitosamente!")
    return result.user
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code))
  }
}

async function signInWithGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider()
    const result = await auth.signInWithPopup(provider)

    // Check if user document exists, create if not
    const userDoc = await db.collection("users").doc(result.user.uid).get()
    if (!userDoc.exists) {
      await db
        .collection("users")
        .doc(result.user.uid)
        .set({
          displayName: result.user.displayName,
          email: result.user.email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          preferences: {
            emailNotifications: true,
            promotionalEmails: true,
            newDesignAlerts: false,
          },
        })
    }

    showNotification("¡Bienvenido!")
    return result.user
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code))
  }
}

async function signOut() {
  try {
    await auth.signOut()
    showNotification("Sesión cerrada")
    window.location.href = "index.html"
  } catch (error) {
    showNotification("Error al cerrar sesión", "error")
  }
}

async function resetPassword(email) {
  try {
    await auth.sendPasswordResetEmail(email)
    showNotification("Email de recuperación enviado")
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code))
  }
}

function getAuthErrorMessage(errorCode) {
  const errorMessages = {
    "auth/user-not-found": "No existe una cuenta con este email",
    "auth/wrong-password": "Contraseña incorrecta",
    "auth/email-already-in-use": "Ya existe una cuenta con este email",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres",
    "auth/invalid-email": "Email inválido",
    "auth/too-many-requests": "Demasiados intentos. Intenta más tarde",
    "auth/popup-closed-by-user": "Ventana cerrada por el usuario",
  }

  return errorMessages[errorCode] || "Error de autenticación"
}

// Database functions
async function saveInvitationToCart(invitationData) {
  if (!currentUser) {
    showNotification("Debes iniciar sesión para añadir al carrito", "error")
    return false
  }

  try {
    const cartRef = db.collection("users").doc(currentUser.uid).collection("cart")
    await cartRef.add({
      ...invitationData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })

    await loadCartCount()
    return true
  } catch (error) {
    console.error("Error saving to cart:", error)
    showNotification("Error al añadir al carrito", "error")
    return false
  }
}

async function loadCartItems() {
  if (!currentUser) return []

  try {
    const cartRef = db.collection("users").doc(currentUser.uid).collection("cart")
    const snapshot = await cartRef.orderBy("createdAt", "desc").get()

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error loading cart:", error)
    return []
  }
}

async function removeFromCart(itemId) {
  if (!currentUser) return false

  try {
    await db.collection("users").doc(currentUser.uid).collection("cart").doc(itemId).delete()
    await loadCartCount()
    return true
  } catch (error) {
    console.error("Error removing from cart:", error)
    return false
  }
}

async function clearCart() {
  if (!currentUser) return false

  try {
    const cartRef = db.collection("users").doc(currentUser.uid).collection("cart")
    const snapshot = await cartRef.get()

    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    await batch.commit()
    await loadCartCount()
    return true
  } catch (error) {
    console.error("Error clearing cart:", error)
    return false
  }
}

async function loadCartCount() {
  if (!currentUser) return

  try {
    const cartRef = db.collection("users").doc(currentUser.uid).collection("cart")
    const snapshot = await cartRef.get()

    const cartCount = document.getElementById("cartCount")
    if (cartCount) {
      cartCount.textContent = snapshot.size
    }
  } catch (error) {
    console.error("Error loading cart count:", error)
  }
}

async function saveOrder(orderData) {
  if (!currentUser) return null

  try {
    // Generate order number
    const orderNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

    const order = {
      orderNumber,
      userId: currentUser.uid,
      userEmail: currentUser.email,
      userName: currentUser.displayName,
      ...orderData,
      status: "completed",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    }

    // Save order
    const orderRef = await db.collection("orders").add(order)

    // Clear cart
    await clearCart()

    return { id: orderRef.id, ...order }
  } catch (error) {
    console.error("Error saving order:", error)
    throw error
  }
}

async function loadUserOrders() {
  if (!currentUser) return []

  try {
    const ordersRef = db.collection("orders").where("userId", "==", currentUser.uid).orderBy("createdAt", "desc")

    const snapshot = await ordersRef.get()

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    }))
  } catch (error) {
    console.error("Error loading orders:", error)
    return []
  }
}

async function updateUserProfile(profileData) {
  if (!currentUser) return false

  try {
    // Update Firebase Auth profile
    await currentUser.updateProfile({
      displayName: profileData.displayName,
    })

    // Update Firestore user document
    await db.collection("users").doc(currentUser.uid).update({
      displayName: profileData.displayName,
      phone: profileData.phone,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error updating profile:", error)
    return false
  }
}

async function updateUserPreferences(preferences) {
  if (!currentUser) return false

  try {
    await db.collection("users").doc(currentUser.uid).update({
      preferences: preferences,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error updating preferences:", error)
    return false
  }
}

async function getUserData() {
  if (!currentUser) return null

  try {
    const userDoc = await db.collection("users").doc(currentUser.uid).get()
    if (userDoc.exists) {
      return userDoc.data()
    }
    return null
  } catch (error) {
    console.error("Error getting user data:", error)
    return null
  }
}

// Promo codes management
async function validatePromoCode(code) {
  try {
    const promoDoc = await db.collection("promoCodes").doc(code.toUpperCase()).get()

    if (!promoDoc.exists) {
      return { valid: false, message: "Código de descuento inválido" }
    }

    const promoData = promoDoc.data()
    const now = new Date()

    // Check if promo is active
    if (!promoData.active) {
      return { valid: false, message: "Código de descuento expirado" }
    }

    // Check expiration date
    if (promoData.expiresAt && promoData.expiresAt.toDate() < now) {
      return { valid: false, message: "Código de descuento expirado" }
    }

    // Check usage limit
    if (promoData.maxUses && promoData.usedCount >= promoData.maxUses) {
      return { valid: false, message: "Código de descuento agotado" }
    }

    return {
      valid: true,
      discount: promoData.discount,
      type: promoData.type || "percentage",
    }
  } catch (error) {
    console.error("Error validating promo code:", error)
    return { valid: false, message: "Error al validar código" }
  }
}

// Initialize promo codes (run once)
async function initializePromoCodes() {
  const promoCodes = [
    {
      code: "WELCOME10",
      discount: 10,
      type: "percentage",
      active: true,
      maxUses: 1000,
      usedCount: 0,
      expiresAt: new Date("2024-12-31"),
    },
    {
      code: "SAVE20",
      discount: 20,
      type: "percentage",
      active: true,
      maxUses: 500,
      usedCount: 0,
      expiresAt: new Date("2024-12-31"),
    },
    {
      code: "FIRST15",
      discount: 15,
      type: "percentage",
      active: true,
      maxUses: 200,
      usedCount: 0,
      expiresAt: new Date("2024-12-31"),
    },
    {
      code: "HOLIDAY25",
      discount: 25,
      type: "percentage",
      active: true,
      maxUses: 100,
      usedCount: 0,
      expiresAt: new Date("2024-12-31"),
    },
  ]

  for (const promo of promoCodes) {
    try {
      await db.collection("promoCodes").doc(promo.code).set(promo)
    } catch (error) {
      console.error("Error creating promo code:", error)
    }
  }
}

// Utility functions
function showNotification(message, type = "success") {
  const existingNotification = document.querySelector(".notification")
  if (existingNotification) {
    existingNotification.remove()
  }

  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.textContent = message

  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    background: type === "success" ? "linear-gradient(to right, #ec4899, #a855f7)" : "#ef4444",
    color: "white",
    padding: "12px 20px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    zIndex: "1000",
    fontSize: "14px",
    fontWeight: "500",
    transform: "translateX(100%)",
    transition: "transform 0.3s ease",
    maxWidth: "300px",
    wordWrap: "break-word",
  })

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.transform = "translateX(0)"
  }, 100)

  setTimeout(() => {
    notification.style.transform = "translateX(100%)"
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 300)
  }, 3000)
}

// Auth Modal
function showAuthModal() {
  const modal = createAuthModal()
  document.body.appendChild(modal)
  modal.style.display = "flex"
  document.body.style.overflow = "hidden"
}

function createAuthModal() {
  const modal = document.createElement("div")
  modal.className = "auth-modal"
  modal.innerHTML = `
    <div class="auth-modal-content">
      <div class="auth-modal-header">
        <h3 id="authModalTitle">Iniciar Sesión</h3>
        <button class="close-auth-modal">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" x2="6" y1="6" y2="18"/>
            <line x1="6" x2="18" y1="6" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="auth-modal-body">
        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="signin">Iniciar Sesión</button>
          <button class="auth-tab" data-tab="signup">Registrarse</button>
        </div>
        
        <!-- Sign In Form -->
        <form class="auth-form active" id="signinForm">
          <div class="form-group">
            <label for="signinEmail">Email</label>
            <input type="email" id="signinEmail" required>
          </div>
          <div class="form-group">
            <label for="signinPassword">Contraseña</label>
            <input type="password" id="signinPassword" required>
          </div>
          <button type="submit" class="btn btn-primary btn-full">Iniciar Sesión</button>
          <button type="button" class="btn btn-outline btn-full" id="forgotPasswordBtn">¿Olvidaste tu contraseña?</button>
        </form>
        
        <!-- Sign Up Form -->
        <form class="auth-form" id="signupForm">
          <div class="form-group">
            <label for="signupName">Nombre Completo</label>
            <input type="text" id="signupName" required>
          </div>
          <div class="form-group">
            <label for="signupEmail">Email</label>
            <input type="email" id="signupEmail" required>
          </div>
          <div class="form-group">
            <label for="signupPassword">Contraseña</label>
            <input type="password" id="signupPassword" required minlength="6">
          </div>
          <div class="form-group">
            <label for="signupConfirmPassword">Confirmar Contraseña</label>
            <input type="password" id="signupConfirmPassword" required minlength="6">
          </div>
          <button type="submit" class="btn btn-primary btn-full">Crear Cuenta</button>
        </form>
        
        <div class="auth-divider">
          <span>o</span>
        </div>
        
        <button class="btn btn-outline btn-full google-signin-btn">
          <svg class="icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>
      </div>
    </div>
  `

  // Add event listeners
  modal.querySelector(".close-auth-modal").addEventListener("click", () => {
    closeAuthModal(modal)
  })

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeAuthModal(modal)
    }
  })

  // Tab switching
  modal.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabName = tab.dataset.tab
      switchAuthTab(modal, tabName)
    })
  })

  // Form submissions
  modal.querySelector("#signinForm").addEventListener("submit", async (e) => {
    e.preventDefault()
    const email = modal.querySelector("#signinEmail").value
    const password = modal.querySelector("#signinPassword").value

    try {
      await signInWithEmail(email, password)
      closeAuthModal(modal)
    } catch (error) {
      showNotification(error.message, "error")
    }
  })

  modal.querySelector("#signupForm").addEventListener("submit", async (e) => {
    e.preventDefault()
    const name = modal.querySelector("#signupName").value
    const email = modal.querySelector("#signupEmail").value
    const password = modal.querySelector("#signupPassword").value
    const confirmPassword = modal.querySelector("#signupConfirmPassword").value

    if (password !== confirmPassword) {
      showNotification("Las contraseñas no coinciden", "error")
      return
    }

    try {
      await signUpWithEmail(email, password, name)
      closeAuthModal(modal)
    } catch (error) {
      showNotification(error.message, "error")
    }
  })

  // Google sign in
  modal.querySelector(".google-signin-btn").addEventListener("click", async () => {
    try {
      await signInWithGoogle()
      closeAuthModal(modal)
    } catch (error) {
      showNotification(error.message, "error")
    }
  })

  // Forgot password
  modal.querySelector("#forgotPasswordBtn").addEventListener("click", async () => {
    const email = modal.querySelector("#signinEmail").value
    if (!email) {
      showNotification("Ingresa tu email primero", "error")
      return
    }

    try {
      await resetPassword(email)
      closeAuthModal(modal)
    } catch (error) {
      showNotification(error.message, "error")
    }
  })

  return modal
}

function switchAuthTab(modal, tabName) {
  // Update tabs
  modal.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.classList.remove("active")
  })
  modal.querySelector(`[data-tab="${tabName}"]`).classList.add("active")

  // Update forms
  modal.querySelectorAll(".auth-form").forEach((form) => {
    form.classList.remove("active")
  })
  modal.querySelector(`#${tabName}Form`).classList.add("active")

  // Update title
  const title = tabName === "signin" ? "Iniciar Sesión" : "Crear Cuenta"
  modal.querySelector("#authModalTitle").textContent = title
}

function closeAuthModal(modal) {
  modal.style.display = "none"
  document.body.style.overflow = ""
  modal.remove()
}

// Export functions for global use
window.firebase = firebase
window.auth = auth
window.db = db
window.storage = storage
window.signInWithEmail = signInWithEmail
window.signUpWithEmail = signUpWithEmail
window.signInWithGoogle = signInWithGoogle
window.signOut = signOut
window.showAuthModal = showAuthModal
window.saveInvitationToCart = saveInvitationToCart
window.loadCartItems = loadCartItems
window.removeFromCart = removeFromCart
window.saveOrder = saveOrder
window.loadUserOrders = loadUserOrders
window.updateUserProfile = updateUserProfile
window.updateUserPreferences = updateUserPreferences
window.getUserData = getUserData
window.validatePromoCode = validatePromoCode
