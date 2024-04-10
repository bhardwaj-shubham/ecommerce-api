import { sequelize } from "./index";
import { DataTypes } from "sequelize";

const OrderDetails = sequelize.define("OrderDetails", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Order",
      key: "id",
    },
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Product",
      key: "id",
    },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  unitPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  subTotal: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
});

export { OrderDetails };
