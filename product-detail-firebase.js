// Product Detail Page with Firebase Integration
class InvitationEditorFirebase {
  constructor() {
    this.currentData = {
      title: "¡Estás Invitado!",
      eventName: "Cumpleaños de María",
      date: "15 de Diciembre, 2024",
      time: "6:00 PM",
      location: "Salón de Eventos Paradise",
      address: "Av. Principal 123, Ciudad",
      additionalInfo: "Confirma tu asistencia al WhatsApp +1234567890",
      primaryColor: "#FFD1DC",
      textColor: "#333333",
      font: "elegant",
      decoration: "flowers",
    }

    this.price = 9.99
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.updatePreview()
    this.loadProductInfo()
    this.checkAuthState()
  }

  checkAuthState() {
    // Wait for Firebase auth to initialize
    firebase.auth().onAuthStateChanged((user) => {
      const addToCartBtn = document.getElementById("addToCartBtn")
      if (addToCartBtn) {
        if (user) {
          addToCartBtn.disabled = false
          addToCartBtn.innerHTML = `Añadir al Carrito - $${this.price}`
        } else {
          addToCartBtn.innerHTML = "Inicia Sesión para Comprar"
          addToCartBtn.onclick = () => showAuthModal()
        }
      }
    })
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.switchTab(e.target.dataset.tab)
      })
    })

    // Text inputs
    document.querySelectorAll("#text-tab input, #text-tab textarea").forEach((input) => {
      input.addEventListener("input", (e) => {
        this.currentData[e.target.id.replace("event", "").toLowerCase()] = e.target.value
        this.updatePreview()
      })
    })

    // Color selection
    document.querySelectorAll(".color-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        if (e.target.dataset.color) {
          this.selectColor(e.target.dataset.color, "primary")
        } else if (e.target.dataset.textColor) {
          this.selectColor(e.target.dataset.textColor, "text")
        }
      })
    })

    // Font selection
    document.querySelectorAll(".font-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        this.selectFont(e.target.dataset.font)
      })
    })

    // Decoration selection
    document.querySelectorAll(".decoration-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        this.selectDecoration(e.target.dataset.decoration)
      })
    })

    // Preview and download buttons
    document.getElementById("previewBtn").addEventListener("click", () => {
      this.showPreviewModal()
    })

    document.getElementById("downloadPNG").addEventListener("click", () => {
      this.downloadImage("png")
    })

    document.getElementById("downloadPDF").addEventListener("click", () => {
      this.downloadImage("pdf")
    })

    // Modal buttons
    document.getElementById("closeModal").addEventListener("click", () => {
      this.closePreviewModal()
    })

    document.getElementById("modalDownloadPNG").addEventListener("click", () => {
      this.downloadImage("png", true)
    })

    document.getElementById("modalDownloadPDF").addEventListener("click", () => {
      this.downloadImage("pdf", true)
    })

    // Add to cart with Firebase
    document.getElementById("addToCartBtn").addEventListener("click", () => {
      this.addToCartFirebase()
    })
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove("active")
    })
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active")

    // Update tab content
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.remove("active")
    })
    document.getElementById(`${tabName}-tab`).classList.add("active")
  }

  selectColor(color, type) {
    if (type === "primary") {
      this.currentData.primaryColor = color
      document.querySelectorAll("[data-color]").forEach((option) => {
        option.classList.remove("active")
      })
      document.querySelector(`[data-color="${color}"]`).classList.add("active")
    } else {
      this.currentData.textColor = color
      document.querySelectorAll("[data-text-color]").forEach((option) => {
        option.classList.remove("active")
      })
      document.querySelector(`[data-text-color="${color}"]`).classList.add("active")
    }
    this.updatePreview()
  }

  selectFont(font) {
    this.currentData.font = font
    document.querySelectorAll(".font-option").forEach((option) => {
      option.classList.remove("active")
    })
    document.querySelector(`[data-font="${font}"]`).classList.add("active")
    this.updatePreview()
  }

  selectDecoration(decoration) {
    this.currentData.decoration = decoration
    document.querySelectorAll(".decoration-option").forEach((option) => {
      option.classList.remove("active")
    })
    document.querySelector(`[data-decoration="${decoration}"]`).classList.add("active")
    this.updatePreview()
  }

  updatePreview() {
    const card = document.getElementById("invitationCard")

    // Update text content
    document.getElementById("previewTitle").textContent =
      this.currentData.title || document.getElementById("eventTitle").value
    document.getElementById("previewEventName").textContent =
      this.currentData.eventName || document.getElementById("eventName").value
    document.getElementById("previewDate").textContent =
      this.currentData.date || document.getElementById("eventDate").value
    document.getElementById("previewTime").textContent =
      this.currentData.time || document.getElementById("eventTime").value
    document.getElementById("previewLocation").textContent =
      this.currentData.location || document.getElementById("eventLocation").value
    document.getElementById("previewAddress").textContent =
      this.currentData.address || document.getElementById("eventAddress").value
    document.getElementById("previewAdditionalInfo").textContent =
      this.currentData.additionalInfo || document.getElementById("additionalInfo").value

    // Update colors
    card.style.backgroundColor = this.currentData.primaryColor
    card.style.color = this.currentData.textColor

    // Update font class
    card.className = `invitation-card font-${this.currentData.font} decoration-${this.currentData.decoration}`
  }

  showPreviewModal() {
    const modal = document.getElementById("previewModal")
    const largePreview = document.getElementById("invitationPreviewLarge")

    // Copy current preview to modal
    largePreview.innerHTML = document.getElementById("invitationPreview").innerHTML

    modal.style.display = "flex"
    document.body.style.overflow = "hidden"
  }

  closePreviewModal() {
    const modal = document.getElementById("previewModal")
    modal.style.display = "none"
    document.body.style.overflow = ""
  }

  async downloadImage(format, fromModal = false) {
    const element = fromModal
      ? document.querySelector("#invitationPreviewLarge .invitation-card")
      : document.getElementById("invitationCard")

    const options = {
      margin: 0.5,
      filename: `invitacion-${Date.now()}.${format}`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      },
      jsPDF: {
        unit: "in",
        format: "letter",
        orientation: "portrait",
      },
    }

    try {
      if (format === "pdf") {
        await window.html2pdf().set(options).from(element).save()
      } else {
        const canvas = await window.html2canvas(element, options.html2canvas)
        const link = document.createElement("a")
        link.download = options.filename.replace(".pdf", ".png")
        link.href = canvas.toDataURL()
        link.click()
      }

      showNotification("¡Descarga iniciada exitosamente!")
    } catch (error) {
      console.error("Error downloading:", error)
      showNotification("Error al descargar. Inténtalo de nuevo.", "error")
    }
  }

  async addToCartFirebase() {
    const user = firebase.auth().currentUser
    if (!user) {
      showAuthModal()
      return
    }

    const cartItem = {
      type: "invitation",
      name: this.currentData.eventName || "Invitación Personalizada",
      category: this.getCategory(),
      price: this.price,
      data: { ...this.currentData },
      thumbnail: this.generateThumbnail(),
    }

    const success = await saveInvitationToCart(cartItem)
    if (success) {
      showNotification("¡Invitación añadida al carrito!")
      setTimeout(() => {
        window.location.href = "cart.html"
      }, 1500)
    }
  }

  generateThumbnail() {
    return {
      title: this.currentData.title,
      eventName: this.currentData.eventName,
      primaryColor: this.currentData.primaryColor,
      font: this.currentData.font,
    }
  }

  getCategory() {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get("category") || "general"
  }

  loadProductInfo() {
    const urlParams = new URLSearchParams(window.location.search)
    const productId = urlParams.get("id")
    const category = urlParams.get("category")

    if (category) {
      document.getElementById("currentCategory").textContent = this.getCategoryName(category)
    }

    if (productId) {
      this.loadProductById(productId)
    }
  }

  getCategoryName(category) {
    const categories = {
      cumpleanos: "Cumpleaños",
      bodas: "Bodas",
      "baby-shower": "Baby Shower",
      graduaciones: "Graduaciones",
      empresariales: "Empresariales",
      quinceaneras: "Quinceañeras",
    }
    return categories[category] || "Invitaciones"
  }

  loadProductById(productId) {
    const products = {
      1: {
        name: "Invitación Elegante Rosa",
        category: "cumpleanos",
        price: 9.99,
        primaryColor: "#FFD1DC",
      },
      2: {
        name: "Boda Clásica Azul",
        category: "bodas",
        price: 12.99,
        primaryColor: "#E6F3FF",
      },
      3: {
        name: "Baby Shower Dulce",
        category: "baby-shower",
        price: 8.99,
        primaryColor: "#F0E6FF",
      },
      4: {
        name: "Graduación Dorada",
        category: "graduaciones",
        price: 11.99,
        primaryColor: "#FFF0E6",
      },
    }

    const product = products[productId]
    if (product) {
      this.price = product.price
      this.currentData.primaryColor = product.primaryColor
      document.getElementById("addToCartBtn").innerHTML = `Añadir al Carrito - $${product.price}`
      this.updatePreview()
    }
  }
}

// Initialize the editor when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new InvitationEditorFirebase()
})
