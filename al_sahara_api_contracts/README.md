## Estructura Back-End
```
.
├── src
│   ├── controllers
│   │   ├── authController.js
│   │   ├── cartController.js
│   │   ├── categoriesController.js
│   │   ├── ordersController.js
│   │   ├── paymentsController.js
│   │   ├── productsController.js
│   │   ├── uploadsController.js
│   │   ├── usersController.js
│   │   └── webpayController.js
│   ├── data
│   │   └── usersStorage.js
│   ├── db
│   │   └── mongo.js
│   ├── middleware
│   │   ├── auth.js
│   │   └── error.js
│   ├── models
│   │   ├── Cart.js
│   │   ├── Category.js
│   │   ├── Order.js
│   │   ├── Product.js
│   │   └── User.js
│   ├── routes
│   │   ├── auth.js
│   │   ├── cart.js
│   │   ├── categories.js
│   │   ├── health.js
│   │   ├── orders.js
│   │   ├── payments.js
│   │   ├── products.js
│   │   ├── uploads.js
│   │   ├── users.js
│   │   └── webpay.js
│   ├── utils
│   │   ├── ApiError.js
│   │   └── zodSchemas.js
│   ├── server.js
│   └──  transbank.js
├── Uploads
│   └──Imagenes
├── .env
├── openapi.yaml
├── package-lock.json
├── package.json
├── README.md
```
