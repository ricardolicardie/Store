# Configuración de Firebase para InviteHaven

## 1. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear un proyecto"
3. Nombra tu proyecto: `invitehaven-[tu-nombre]`
4. Habilita Google Analytics (opcional)
5. Crea el proyecto

## 2. Configurar Authentication

1. En el panel izquierdo, ve a **Authentication**
2. Haz clic en **Comenzar**
3. Ve a la pestaña **Sign-in method**
4. Habilita los siguientes proveedores:
   - **Correo electrónico/contraseña**: Habilitar
   - **Google**: Habilitar (configura el email de soporte)

## 3. Configurar Firestore Database

1. En el panel izquierdo, ve a **Firestore Database**
2. Haz clic en **Crear base de datos**
3. Selecciona **Comenzar en modo de prueba**
4. Elige una ubicación (preferiblemente cerca de tus usuarios)

### Reglas de Seguridad de Firestore

Reemplaza las reglas por defecto con estas:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Cart subcollection
      match /cart/{cartId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Orders - users can only read their own orders
    match /orders/{orderId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Promo codes - read only for authenticated users
    match /promoCodes/{promoId} {
      allow read: if request.auth != null;
    }
  }
}
\`\`\`

## 4. Configurar Storage (Opcional)

1. En el panel izquierdo, ve a **Storage**
2. Haz clic en **Comenzar**
3. Acepta las reglas por defecto

## 5. Obtener Configuración del Proyecto

1. Ve a **Configuración del proyecto** (ícono de engranaje)
2. Baja hasta **Tus apps**
3. Haz clic en **</> Web**
4. Registra tu app con el nombre: `InviteHaven Web`
5. Copia la configuración que aparece

## 6. Actualizar firebase-config.js

Reemplaza la configuración en `firebase-config.js`:

\`\`\`javascript
const firebaseConfig = {
  apiKey: "tu-api-key-real",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
\`\`\`

## 7. Inicializar Códigos de Promoción

Ejecuta esta función una vez en la consola del navegador para crear los códigos de promoción:

\`\`\`javascript
// Ejecutar en la consola del navegador después de cargar la página
initializePromoCodes();
\`\`\`

## 8. Configurar Stripe (Opcional)

1. Crea una cuenta en [Stripe](https://stripe.com)
2. Obtén tu clave pública de prueba
3. Reemplaza en `checkout-firebase.js`:

\`\`\`javascript
this.stripe = Stripe('pk_test_tu_clave_publica_real');
\`\`\`

## 9. Estructura de Datos en Firestore

### Colección: users
\`\`\`javascript
{
  displayName: "Juan Pérez",
  email: "juan@email.com",
  phone: "+1234567890",
  createdAt: timestamp,
  preferences: {
    emailNotifications: true,
    promotionalEmails: true,
    newDesignAlerts: false
  }
}
\`\`\`

### Subcolección: users/{userId}/cart
\`\`\`javascript
{
  type: "invitation",
  name: "Cumpleaños de María",
  category: "cumpleanos",
  price: 9.99,
  data: {
    title: "¡Estás Invitado!",
    eventName: "Cumpleaños de María",
    date: "15 de Diciembre, 2024",
    // ... más datos de personalización
  },
  createdAt: timestamp
}
\`\`\`

### Colección: orders
\`\`\`javascript
{
  orderNumber: "INV-2024-123456",
  userId: "user-id",
  userEmail: "juan@email.com",
  userName: "Juan Pérez",
  items: [...],
  customer: {
    firstName: "Juan",
    lastName: "Pérez",
    email: "juan@email.com",
    phone: "+1234567890"
  },
  subtotal: 19.98,
  discount: 10,
  total: 17.98,
  status: "completed",
  createdAt: timestamp
}
\`\`\`

### Colección: promoCodes
\`\`\`javascript
{
  code: "WELCOME10",
  discount: 10,
  type: "percentage",
  active: true,
  maxUses: 1000,
  usedCount: 0,
  expiresAt: timestamp
}
\`\`\`

## 10. Testing

1. Abre `index.html` en tu navegador
2. Prueba el registro de usuario
3. Prueba añadir items al carrito
4. Prueba el proceso de checkout
5. Verifica que los datos se guarden en Firestore

## 11. Despliegue

Para producción:
1. Cambia las reglas de Firestore a modo producción
2. Configura dominios autorizados en Authentication
3. Usa claves de Stripe de producción
4. Configura variables de entorno

## Notas Importantes

- Las reglas de Firestore están configuradas para modo de desarrollo
- Los códigos de promoción se crean automáticamente
- El sistema de pagos está simulado (usar Stripe real en producción)
- Todos los datos se almacenan en Firestore en tiempo real
- La autenticación incluye Google Sign-In y email/password
