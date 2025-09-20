module.exports = (sequelize, Sequelize) => {
  const Production = sequelize.define("Productions", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    product_name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    supervisor: {
      type: Sequelize.STRING,
      allowNull: true
      // allowNull: false
    },
    lane: {
      type: Sequelize.STRING,
      allowNull: true
    },
    rating: {
      type: Sequelize.STRING,
      allowNull: true
    },
    wastage_quantity: {
      type: Sequelize.STRING,
      allowNull: true
    },
    quantity: {
      type: Sequelize.FLOAT,
      allowNull: false
    },
    recovery: {
      type: Sequelize.FLOAT,
      allowNull: true
    },
    unit: {
      type: Sequelize.STRING,
      allowNull: false
    },
    raw_material_order_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
          model: 'raw_material_orders',
          key: 'id'
      }
    },
    start_time: {
      type: Sequelize.DATE,
      allowNull: true
    },
    end_time: {
      type: Sequelize.DATE,
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM("pending", "in-queue", "in-progress", "completed", "cancelled"),
      defaultValue: "pending"
    },
    batch_code: {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    sample_images: {
      type: Sequelize.JSON, 
      allowNull: true
  },
  }, {
    timestamps: true,
  });

  // define associations here
  Production.associate = (models) => {
    Production.belongsTo(models.RawMaterial, {
      foreignKey: 'raw_material_id',
      as: 'rawMaterial'
    });
    // Production.hasOne(models.Warehouse, {
    //   foreignKey: 'production_id',
    //   as: 'warehouse'
    // });
  };

  return Production;
};
