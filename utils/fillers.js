function fillRawMaterialSchema(schema, filler) {
    const updatedSchema = JSON.parse(JSON.stringify(schema));
    
    for (const section of updatedSchema.sections) {

        // 🟦 HEADER
        if (section.type === "header" && typeof section.data === "object") {
            section.data.title = filler?.title || "Untitled";
        }

        // 🟦 DATA-GROUP
        if (section.type === "data-group") {
            for (const group of section.data) {
                const groupFiller = filler[group.title];
                if (!groupFiller) continue;

                if (Array.isArray(groupFiller) && group.details) {
                    group.details.forEach((item, i) => {
                        item.label ||= groupFiller[i]?.label || "";
                        item.value ||= groupFiller[i]?.value || "";
                    });

                    if (group.fileName && filler.fileName) {
                        group.fileName = filler.fileName;
                    }
                }
                // if (typeof groupFiller === "object") {
                //     if (group.detailsA && groupFiller.detailsA) {
                //         group.detailsA.forEach((item, i) => {
                //             item.label ||= groupFiller.detailsA[i]?.label || "";
                //             item.value ||= groupFiller.detailsA[i]?.value || "";
                //         });
                //     }
                //     if (group.detailsB && groupFiller.detailsB) {
                //         group.detailsB.forEach((item, i) => {
                //             item.label ||= groupFiller.detailsB[i]?.label || "";
                //             item.value ||= groupFiller.detailsB[i]?.value || "";
                //         });
                //     }
                // }
            }
        }
    }

    return updatedSchema;
}

function fillRawMaterialAddSchema(schema, filler) {
    const updatedSchema = JSON.parse(JSON.stringify(schema));

    for (const section of updatedSchema.sections) {

        // 🟦 HEADER
        if (section.type === "header" && typeof section.data === "object") {
            section.data.title = filler?.title || "Untitled";
        }

        // 🟦 PRODUCT CARD
        if (section.type === "productCard" && Array.isArray(filler?.productCard)) {
            section.data = filler.productCard.map(item => ({
                name: item?.name || '',
                image: item?.image || '',
                description: item?.description || '',
            }));
        }

    }

    return updatedSchema;
}

function fillProductAddSchema(schema, filler) {
    const updatedSchema = JSON.parse(JSON.stringify(schema));

    for (const section of updatedSchema.sections) {

        // 🟦 HEADER
        if (section.type === "header" && typeof section.data === "object") {
            section.data.title = filler?.title || "Untitled";
        }

        // console.log(filler.optionList);

        // 🟦 OptionList
        if (section.type === "optionList" && Array.isArray(filler?.optionList)) {
            section.data.options = filler.optionList;
        }
    }

    return updatedSchema;
}

function fillWorkerMultipleSchema(schema, filler) {
    const updatedSchema = JSON.parse(JSON.stringify(schema));

    for (const section of updatedSchema.sections) {
        // 🟦 HEADER
        if (section.type === "header" && typeof section.data === "object") {
            section.data.title = filler?.title || "Untitled";

            if (Array.isArray(section.data.headerDetails) && Array.isArray(filler.headerDetails)) {
                section.data.headerDetails.forEach((detail, index) => {
                    const fillerDetail = filler.headerDetails[index];
                    if (fillerDetail) {
                        detail.label = fillerDetail.label || "";
                        detail.value = fillerDetail.value || "";
                    }
                });
            }
        }

        // 🟦 TABLE GROUP
        if (section.type === "table" && Array.isArray(section.data)) {
            const tableFiller = filler["table"];
            if (Array.isArray(tableFiller)) {
                section.data = tableFiller.map(item => ({
                    label: item.label,
                    tableHeader: item.tableHeader || [],
                    tableBody: item.tableBody || []
                }));
            }
        }
    }

    return updatedSchema;
}

function fillWorkerSingleSchema(schema, filler) {
    const updatedSchema = JSON.parse(JSON.stringify(schema));

    for (const section of updatedSchema.sections) {
        // 🟦 HEADER
        if (section.type === "header" && typeof section.data === "object") {
            section.data.title = filler?.title || "Untitled";
        }

        // 🟦 DATA (Vendor detail rows)
        if (section.type === "data" && Array.isArray(section.data)) {
            for (const dataGroup of section.data) {
                const fillerDetails = filler["Vendor detail"];
                if (!Array.isArray(fillerDetails)) continue;

                if (Array.isArray(dataGroup.details)) {
                    dataGroup.details.forEach((rowObj, i) => {
                        const fillerRow = fillerDetails[i];
                        for (const rowKey in rowObj) {
                            const rowItems = rowObj[rowKey];
                            const fillerItems = fillerRow?.[rowKey];
                            if (Array.isArray(rowItems) && Array.isArray(fillerItems)) {
                                rowItems.forEach((item, idx) => {
                                    item.label = fillerItems[idx]?.label || "";
                                    item.value = fillerItems[idx]?.value || "";
                                    item.icon = fillerItems[idx]?.icon || item.icon || "";
                                });
                            }
                        }
                    });
                }
            }
        }

        // 🟦 TABLE
        if (section.type === "table" && Array.isArray(section.data)) {
            section.data[0].tableHeader = filler?.table?.tableHeader || [];
            section.data[0].tableBody = filler?.table?.tableBody || [];
        }
    }

    return updatedSchema;
}

function fillPackageComesToEndSchema(schema, filler) {
    const updatedSchema = JSON.parse(JSON.stringify(schema));

    for (const section of updatedSchema.sections) {
        // 🟦 HEADER
        if (section.type === "header" && typeof section.data === "object") {
            section.data.title = filler?.title || "Untitled";
            section.data.description = filler?.description || "Untitled";
        }
    }

    return updatedSchema;
}

function fillOrderReadySchema(schema, filler) {
    const updatedSchema = JSON.parse(JSON.stringify(schema));

    for (const section of updatedSchema.sections) {
        // 🟦 HEADER
        if (section.type === "header" && typeof section.data === "object") {
            if (!section.data.title) {
                section.data.title = filler?.title || "Untitled";
            }
            if (!section.data.description) {
                section.data.description = filler?.description || "";
            }
        }

        // 🟦 DATA (Product Details)
        if (section.type === "data" && Array.isArray(section.data)) {
            for (const dataGroup of section.data) {
                const fillerDetails = filler["Product Details"];
                if (!Array.isArray(fillerDetails)) continue;

                if (Array.isArray(dataGroup.details)) {
                    dataGroup.details.forEach((rowObj, i) => {
                        const fillerRow = fillerDetails[i];
                        for (const rowKey in rowObj) {
                            const rowItems = rowObj[rowKey];
                            const fillerItems = fillerRow?.[rowKey];

                            if (Array.isArray(rowItems) && Array.isArray(fillerItems)) {
                                rowItems.forEach((item, idx) => {
                                    const fillerItem = fillerItems[idx] || {};

                                    if (!item.label) {
                                        item.label = fillerItem.label || "";
                                    }
                                    if (!item.value) {
                                        item.value = fillerItem.value || "";
                                    }
                                    if (!item.icon) {
                                        item.icon = fillerItem.icon || "";
                                    }
                                });
                            }
                        }
                    });
                }
            }
        }

        // 🟦 PRODUCTS LIST — deeply merge only if field is still empty
        if (section.type === "product-list" && section.data && Array.isArray(section.data.products)) {
            const fillerProducts = filler["Products"];
            if (Array.isArray(fillerProducts)) {
                section.data.products = section.data.products.map((product, i) => {
                    const fillerProduct = fillerProducts[i] || {};

                    return {
                        ...product,
                        title: product.title || fillerProduct.title || "",
                        image: product.image || fillerProduct.image || "",
                        description: product.description || fillerProduct.description || "",
                        packagesSentence: product.packagesSentence || fillerProduct.packagesSentence || "",
                        weight: product.weight || fillerProduct.weight || "",
                        price: product.price || fillerProduct.price || "",
                        packages: fillerProduct.packages || [],
                        chambers: fillerProduct.chambers || [],
                    };
                });
            }
        }
    }

    return updatedSchema;
}

function fillProductionStartedSchema(schema, filler) {
    const updatedSchema = JSON.parse(JSON.stringify(schema));

    const fillerKeysMap = Object.fromEntries(
        Object.entries(filler).map(([k, v]) => [k.trim().toLowerCase(), v])
    );

    for (const section of updatedSchema.sections) {

        // 🟦 HEADER
        if (section.type === "header" && typeof section.data === "object") {
            section.data.title = filler?.title || "Untitled";
        }

        // 🟦 IMAGE-FULL-WIDTH
        if (section.type === "image-full-width" && typeof section.data === "object") {
            section.data.imageUrl = filler?.["image-full-width"] || "";
        }
        // 🟦 RATING
        if (section.type === "rating" && typeof section.data === "object") {
            section.data.selected = filler?.["rating"] || 0;
        }

        // 🟦 DATA-ACCORDIAN
        if (section.type === "data-accordian") {
            for (const group of section.data) {
                const groupTitle = group.title.trim().toLowerCase();
                const groupFiller = fillerKeysMap[groupTitle];
                if (!groupFiller) continue;

                if (Array.isArray(groupFiller) && group.details) {
                    group.details.forEach((item, i) => {
                        item.label ||= groupFiller[i]?.label || "";
                        item.value ||= groupFiller[i]?.value || "";
                    });
                }

                if (typeof groupFiller === "object") {
                    if (group.detailsA && groupFiller.detailsA) {
                        group.detailsA.forEach((item, i) => {
                            item.label ||= groupFiller.detailsA[i]?.label || "";
                            item.value ||= groupFiller.detailsA[i]?.value || "";
                        });
                    }
                    if (group.detailsB && groupFiller.detailsB) {
                        group.detailsB.forEach((item, i) => {
                            item.label ||= groupFiller.detailsB[i]?.label || "";
                            item.value ||= groupFiller.detailsB[i]?.value || "";
                        });
                    }
                }

                if (group.fileName !== undefined && filler.fileName) {
                    group.fileName = filler.fileName;
                }
            }
        }
    }

    return updatedSchema;
}

function fillVendorSchema(schema, filler) {
    const updatedSchema = JSON.parse(JSON.stringify(schema));

    for (const section of updatedSchema.sections) {
        // 🟦 HEADER
        if (section.type === "header" && typeof section.data === "object") {
            section.data.title = filler?.title || "Untitled Vendor Form";
        }

        // 🟦 VENDOR CARD GROUP
        if (section.type === "vendor-card" && Array.isArray(filler?.vendorCard)) {
            section.data = filler.vendorCard.map(item => ({
                name: item?.name || '',
                address: item?.address || '',
                isChecked: item?.isChecked || false,
                materials: item?.materials,
            }));
        }
    }

    return updatedSchema;
}

function fillChamberListSchema(schema, filler) {
    const updatedSchema = JSON.parse(JSON.stringify(schema));

    for (const section of updatedSchema.sections) {
        // 🟦 OptionList
        if (section.type === "optionList" && Array.isArray(filler?.optionList)) {
            section.data.options = filler.optionList;
        }
    }

    return updatedSchema;
}

function fillMultipleChamberListSchema(schema, filler) {
    const updatedSchema = JSON.parse(JSON.stringify(schema));

    for (const section of updatedSchema.sections) {

        // 🟦 HEADER
        if (section.type === "header" && typeof section.data === "object") {
            section.data.title = filler?.title || "Untitled";
        }

        // 🟦 PRODUCT CARD
        if (section.type === "productCard" && Array.isArray(filler?.productCard)) {
            section.data = filler.productCard.map(item => ({
                name: item?.name || '',
                image: item?.image || '',
                description: item?.description || '',
            }));
        }

    }

    return updatedSchema;
}

function fillCountrySchema(schema, filler) {
    const updatedSchema = JSON.parse(JSON.stringify(schema));

    for (const section of updatedSchema.sections) {

        // 🟦 HEADER
        if (section.type === "header" && typeof section.data === "object") {
            section.data.title = filler?.title || "Untitled";
        }

        if (section.type === "icon-title-with-heading" && Array.isArray(section.data)) {
            section.data = filler['icon-title-with-heading'];
        }
    }

    return updatedSchema;
}

function fillStateSchema(schema, filler) {
    const updatedSchema = JSON.parse(JSON.stringify(schema));

    for (const section of updatedSchema.sections) {

        // 🟦 HEADER
        if (section.type === "header" && typeof section.data === "object") {
            section.data.title = filler?.title || "Untitled";
        }
        
        // 🟦 OptionList
        if (section.type === "optionList" && Array.isArray(filler?.optionList)) {
            section.data.options = filler.optionList;
        }
    }
    
    return updatedSchema;
}

function fillCitySchema(schema, filler) {
    const updatedSchema = JSON.parse(JSON.stringify(schema));

    for (const section of updatedSchema.sections) {

        // 🟦 HEADER
        if (section.type === "header" && typeof section.data === "object") {
            section.data.title = filler?.title || "Untitled";
        }

        // 🟦 OptionList
        if (section.type === "optionList" && Array.isArray(filler?.optionList)) {
            section.data.options = filler.optionList;
        }
    }

    return updatedSchema;
}

function fillLaneOccupiedSchema(schema, filler) {
    const updatedSchema = JSON.parse(JSON.stringify(schema));

    for (const section of updatedSchema.sections) {
        // 🟦 HEADER
        if (section.type === "header" && typeof section.data === "object") {
            section.data.title = filler?.title || "Untitled";
        }

        // 🟦 DATA (Vendor detail rows)
        if (section.type === "data" && Array.isArray(section.data)) {
            for (const dataGroup of section.data) {
                const fillerDetails = filler['data']['Production detail'];


                if (!Array.isArray(fillerDetails)) continue;

                if (Array.isArray(dataGroup.details)) {
                    dataGroup.details.forEach((rowObj, i) => {
                        const fillerRow = fillerDetails[i];
                        for (const rowKey in rowObj) {
                            const rowItems = rowObj[rowKey];
                            const fillerItems = fillerRow?.[rowKey];
                            if (Array.isArray(rowItems) && Array.isArray(fillerItems)) {
                                rowItems.forEach((item, idx) => {
                                    item.label = fillerItems[idx]?.label || "";
                                    item.value = fillerItems[idx]?.value || "";
                                    item.icon = fillerItems[idx]?.icon || item.icon || "";
                                });
                            }
                        }
                    });
                }
            }
        }

        if (section.type === 'image-full-width') {
            section.data.imageUrl = filler['image-full-width']
        }
    }

    return updatedSchema;
}

function fillOrderShippedSchema(schema, filler) {
    const updatedSchema = JSON.parse(JSON.stringify(schema));
    let { buttons } = updatedSchema

    for (const section of updatedSchema.sections) {
        // 🟦 HEADER
        if (section.type === "header" && typeof section.data === "object") {
            if (!section.data.title) {
                section.data.title = filler?.title || "Untitled";
            }
            if (!section.data.description) {
                section.data.description = filler?.description || "";
            }
        }


        if (section.type === "truck-full-details" && typeof section.data === "object") {
            const truckData = filler['Truck Detail']
            section.data.title ='Truck Detail'
            section.data.driverName = truckData?.driverName
            section.data.driverImage = truckData?.driverImage
            section.data.number = truckData?.number
            section.data.type = truckData?.type
            section.data.arrival_date = truckData?.arrival_date
            section.data.agency = truckData?.agency
        }

        // 🟦 DATA (Product Details)
        if (section.type === "product-details" && Array.isArray(section.data)) {
            for (const dataGroup of section.data) {
                const fillerDetails = filler["Product Details"];
                if (!Array.isArray(fillerDetails)) continue;

                if (Array.isArray(dataGroup.details)) {
                    dataGroup.details.forEach((rowObj, i) => {
                        const fillerRow = fillerDetails[i];
                        for (const rowKey in rowObj) {
                            const rowItems = rowObj[rowKey];
                            const fillerItems = fillerRow?.[rowKey];

                            if (Array.isArray(rowItems) && Array.isArray(fillerItems)) {
                                rowItems.forEach((item, idx) => {
                                    const fillerItem = fillerItems[idx] || {};

                                    if (!item.label) {
                                        item.label = fillerItem.label || "";
                                    }
                                    if (!item.value) {
                                        item.value = fillerItem.value || "";
                                    }
                                    if (!item.icon) {
                                        item.icon = fillerItem.icon || "";
                                    }
                                });
                            }
                        }
                    });
                }
                if (dataGroup.fileName !== undefined && filler.fileName) {
                    dataGroup.fileName = filler.fileName;
                }
            }
        }

        // 🟦 PRODUCTS LIST — deeply merge only if field is still empty
        if (section.type === "product-list-accordian" && section.data && Array.isArray(section.data.products)) {
            const fillerProducts = filler["Products"];
            if (Array.isArray(fillerProducts)) {
                section.data.products = section.data.products.map((product, i) => {
                    const fillerProduct = fillerProducts[i] || {};

                    return {
                        ...product,
                        title: product.title || fillerProduct.title || "",
                        image: product.image || fillerProduct.image || "",
                        description: product.description || fillerProduct.description || "",
                        packagesSentence: product.packagesSentence || fillerProduct.packagesSentence || "",
                        weight: product.weight || fillerProduct.weight || "",
                        price: product.price || fillerProduct.price || "",
                        packages: fillerProduct.packages || [],
                        chambers: fillerProduct.chambers || [],
                    };
                });
            }
        }

    }
    
    // 🟦 BUTTONS — deeply merge only if field is still empty
    if (buttons && Array.isArray(buttons)) {
        const fillerButtons = filler["buttons"];
        if (Array.isArray(fillerButtons)) {
            updatedSchema.buttons = fillerButtons
        }
    }

    return updatedSchema;
}

function fillOrderReachedSchema(schema, filler) {
    const updatedSchema = JSON.parse(JSON.stringify(schema));
    let { buttons } = updatedSchema

    for (const section of updatedSchema.sections) {
        // 🟦 HEADER
        if (section.type === "header" && typeof section.data === "object") {
            if (!section.data.title) {
                section.data.title = filler?.title || "Untitled";
            }
            if (!section.data.description) {
                section.data.description = filler?.description || "";
            }
        }


        if (section.type === "truck-full-details" && typeof section.data === "object") {
            const truckData = filler['Truck Detail']
            section.data.title ='Truck Detail'
            section.data.driverName = truckData?.driverName
            section.data.driverImage = truckData?.driverImage
            section.data.number = truckData?.number
            section.data.type = truckData?.type
            section.data.arrival_date = truckData?.arrival_date
            section.data.agency = truckData?.agency
        }

        // 🟦 DATA (Product Details)
        if (section.type === "product-details" && Array.isArray(section.data)) {
            for (const dataGroup of section.data) {
                const fillerDetails = filler["Product Details"];
                if (!Array.isArray(fillerDetails)) continue;

                if (Array.isArray(dataGroup.details)) {
                    dataGroup.details.forEach((rowObj, i) => {
                        const fillerRow = fillerDetails[i];
                        for (const rowKey in rowObj) {
                            const rowItems = rowObj[rowKey];
                            const fillerItems = fillerRow?.[rowKey];

                            if (Array.isArray(rowItems) && Array.isArray(fillerItems)) {
                                rowItems.forEach((item, idx) => {
                                    const fillerItem = fillerItems[idx] || {};

                                    if (!item.label) {
                                        item.label = fillerItem.label || "";
                                    }
                                    if (!item.value) {
                                        item.value = fillerItem.value || "";
                                    }
                                    if (!item.icon) {
                                        item.icon = fillerItem.icon || "";
                                    }
                                });
                            }
                        }
                    });
                }
                if (dataGroup.fileName !== undefined && filler.fileName) {
                    dataGroup.fileName = filler.fileName;
                }
            }
        }

        // 🟦 PRODUCTS LIST — deeply merge only if field is still empty
        if (section.type === "product-list-accordian" && section.data && Array.isArray(section.data.products)) {
            const fillerProducts = filler["Products"];
            if (Array.isArray(fillerProducts)) {
                section.data.products = section.data.products.map((product, i) => {
                    const fillerProduct = fillerProducts[i] || {};

                    return {
                        ...product,
                        title: product.title || fillerProduct.title || "",
                        image: product.image || fillerProduct.image || "",
                        description: product.description || fillerProduct.description || "",
                        packagesSentence: product.packagesSentence || fillerProduct.packagesSentence || "",
                        weight: product.weight || fillerProduct.weight || "",
                        price: product.price || fillerProduct.price || "",
                        packages: fillerProduct.packages || [],
                        chambers: fillerProduct.chambers || [],
                    };
                });
            }
        }

    }

    return updatedSchema;
}

function fillProductionCompletedSchema(schema, filler) {
    const updatedSchema = JSON.parse(JSON.stringify(schema));

    for (const section of updatedSchema.sections) {
        // 🟦 HEADER
        if (section.type === "header" && typeof section.data === "object") {
            section.data.title = filler?.title || "Untitled";
        }

        // 🟦 DATA (Vendor detail rows)
        if (section.type === "data" && Array.isArray(section.data)) {
            for (const dataGroup of section.data) {
                const fillerDetails = filler['data']['Production detail'];

                if (!Array.isArray(fillerDetails)) continue;

                if (Array.isArray(dataGroup.details)) {
                    dataGroup.details.forEach((rowObj, i) => {
                        const fillerRow = fillerDetails[i];
                        for (const rowKey in rowObj) {
                            const rowItems = rowObj[rowKey];
                            const fillerItems = fillerRow?.[rowKey];
                            if (Array.isArray(rowItems) && Array.isArray(fillerItems)) {
                                rowItems.forEach((item, idx) => {
                                    item.label = fillerItems[idx]?.label || "";
                                    item.value = fillerItems[idx]?.value || "";
                                    item.icon = fillerItems[idx]?.icon || item.icon || "";
                                });
                            }
                        }
                    });
                }
            }
        }

        if (section.type === 'image-gallery') {
            section.data = filler['image-gallery']
        }
    }

    return updatedSchema;
}


module.exports = {
    fillRawMaterialSchema,
    fillLaneOccupiedSchema,
    fillRawMaterialAddSchema,
    fillWorkerMultipleSchema,
    fillWorkerSingleSchema,
    fillPackageComesToEndSchema,
    fillOrderReadySchema,
    fillProductionStartedSchema,
    fillVendorSchema,
    fillChamberListSchema,
    fillMultipleChamberListSchema,
    fillCountrySchema,
    fillProductAddSchema,
    fillOrderShippedSchema,
    fillStateSchema,
    fillCitySchema,
    fillProductionCompletedSchema,
    fillOrderReachedSchema,
}