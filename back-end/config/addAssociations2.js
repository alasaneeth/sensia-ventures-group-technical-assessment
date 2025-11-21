async function addAssociations2() {
    const { default: ProductCategory } = await import(
        "../modules/products/models/prouctCategory.js"
    );
    const { default: Category } = await import(
        "../modules/products/models/category.js"
    );
    const { default: Product } = await import(
        "../modules/products/models/product.js"
    );

    const { default: Brand } = await import(
        "../modules/companies/models/brand.js"
    );

    const { default: ProductVariation } = await import(
        "../modules/products/models/productVariation.js"
    );
    const { default: Sku } = await import("../modules/products/models/sku.js");
    const { default: BundleSku } = await import(
        "../modules/products/models/bundleSku.js"
    );
    const { default: SkuBundleSku } = await import(
        "../modules/products/models/skuBundleSku.js"
    );
    const { default: Offer } = await import(
        "../modules/offers/models/offer.js"
    );
    const { default: SkuOffer } = await import(
        "../modules/offers/models/skuOffer.js"
    );
    const { default: SkuOrder } = await import(
        "../modules/orders/models/skuOrder.js"
    );
    const { default: Order } = await import(
        "../modules/orders/models/order.js"
    );

    // Relation between products and categories
    Product.belongsToMany(Category, {
        through: ProductCategory,
        as: "categories",
        foreignKey: "productId",
        otherKey: "categoryId",
    });

    Category.belongsToMany(Product, {
        through: ProductCategory,
        as: "products",
        foreignKey: "categoryId",
        otherKey: "productId",
    });

    // The brand relation between the models and the brands
    Product.belongsTo(Brand, {
        foreignKey: "brandId",
        as: "brand",
    });
    Category.belongsTo(Brand, {
        foreignKey: "brandId",
        as: "brand",
    });

    // Relation between products and variations
    Product.hasMany(ProductVariation, {
        foreignKey: "productId",
        as: "variations",
    });
    ProductVariation.belongsTo(Product, {
        foreignKey: "productId",
        as: "product",
    });

    // Between product variation and the brands
    ProductVariation.belongsTo(Brand, {
        foreignKey: "brandId",
        as: "brand",
    });

    // Brand relations for SKU and bundle SKU
    Brand.hasMany(Sku, {
        foreignKey: "brandId",
        as: "skus",
    });
    Sku.belongsTo(Brand, {
        foreignKey: "brandId",
        as: "brand",
    });

    Brand.hasMany(BundleSku, {
        foreignKey: "brandId",
        as: "bundleSkus",
    });
    BundleSku.belongsTo(Brand, {
        foreignKey: "brandId",
        as: "brand",
    });

    // Product variation to SKU relation
    ProductVariation.hasMany(Sku, {
        foreignKey: "productVariationId",
        as: "skus",
    });
    Sku.belongsTo(ProductVariation, {
        foreignKey: "productVariationId",
        as: "productVariation",
    });

    // SKU and bundle SKU many-to-many relation
    Sku.belongsToMany(BundleSku, {
        through: SkuBundleSku,
        foreignKey: "skuId",
        otherKey: "bundleSkuId",
        as: "bundleSkus",
    });
    BundleSku.belongsToMany(Sku, {
        through: SkuBundleSku,
        foreignKey: "bundleSkuId",
        otherKey: "skuId",
        as: "skus",
    });

    // Many-to-many relationship between Offer and Sku through SkuOffer
    Offer.belongsToMany(BundleSku, {
        through: SkuOffer,
        foreignKey: "offerId",
        as: "skus",
    });
    BundleSku.belongsToMany(Offer, {
        through: SkuOffer,
        foreignKey: "bundleSkuId",
        as: "offers",
    });

    // The relation between bundle sku and the orders
    // Sku to Order relationship
    Order.belongsToMany(BundleSku, {
        through: SkuOrder,
        foreignKey: "orderId",
        otherKey: "bundleSkuId",
        as: "skus",
    });
    BundleSku.belongsToMany(Order, {
        through: SkuOrder,
        foreignKey: "bundleSkuId",
        otherKey: "orderId",
        as: "orders",
    });
}

export default addAssociations2;
