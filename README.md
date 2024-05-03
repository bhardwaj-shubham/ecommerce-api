# Ecommerce Backend API

This is a simple ecommerce backend API build with Node.js, Express, and MySQL.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository.
    ```shell
    git clone https://github.com/bhardwaj-shubham/ecommerce-api.git
    ```

2. Install the dependencies.
    ```shell
    npm install
    ```

3. Configure the project.
    - Create a `.env` file in the root directory. Add the environment variables from the `.env.sample` file.

4. Create a MySQL database.
    - Create a MySQL database with the name given in `.env.sample`.

5. Start the application.
    ```shell
    npm run dev
    ```

6. The API will be running on `http://localhost:4000`.


## Usage

The API has the following routes:
1. For products:
    - GET `/api/v1/products/all-products`: Get all products.
    - GET `/api/v1/products/:productId`: Get a product by ID.
    - POST `/api/v1/products/add-product`: Create a new product.
    - PUT `/api/v1/products/:productId`: Update a product by ID.
    - POST `/api/v1/products/:productId/reviews`: Create a Review of product.
    - POST `/api/v1/products/buy/`: Buy a product.
    - DELETE `/api/v1/products/:productId`: Delete a product by ID.

2. For users:
    - POST `/api/v1/users/signup`: Create a new User.
    - POST `/api/v1/users/login`: Login a user.
    - POST `/api/v1/users/logout`: Logout a user.
    - GET `/api/v1/users/current-user`: Get current a user.
    - POST `/api/v1/users/refresh-token`: Refresh a user token.
    - POST `/api/v1/users/change-password`: Change password of a user.
    - POST `/api/v1/users/update-account`: Update account of a user.
    - GET `/api/v1/users/purchase-history`: Get purchase history of a user.

3. For sellers:
    - POST `/api/v1/sellers/signup`: Create a new Seller.
    - POST `/api/v1/sellers/login`: Login a seller.
    - POST `/api/v1/sellers/logout`: Logout a seller.
    - GET `/api/v1/sellers/current-seller`: Get current a seller.
    - POST `/api/v1/sellers/refresh-token`: Refresh a seller token.
    - POST `/api/v1/sellers/change-password`: Change password of a seller.
    - PATCH `/api/v1/seller/update-account`: Update account of a seller.
    - GET `/api/v1/sellers/products`: Get all products of a seller.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch.
3. Make your changes.
4. Commit your changes.
5. Push to the branch.
6. Submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).