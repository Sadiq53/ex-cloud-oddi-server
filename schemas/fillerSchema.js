const { isValid } = require("date-fns/isValid");
const { formatWeight, formatPrice } = require("../utils/bottomsheetUtils");
const { format } = require("date-fns/format");
const { parseISO } = require("date-fns/parseISO");
const { formatAmount } = require('../utils/common')

const customDateFormatter = (rawDate) => {
    const parsedDate = typeof rawDate === 'string' ? parseISO(rawDate) : new Date(rawDate);

    return isValid(parsedDate)
        ? format(parsedDate, 'd MMM yyyy')
        : 'N/A';
}

const customTimeFormatter = (rawDate) => {
    const parsedDate = typeof rawDate === 'string' ? parseISO(rawDate) : new Date(rawDate);

    return isValid(parsedDate)
        ? format(parsedDate, 'hh:mmaaa')
        : 'N/A';
}

function formatPackagesSentence(packages = []) {
    if (!packages.length) return '';

    const totalPackagesQuantity = packages.reduce(
        (sum, pkg) => sum + Number(pkg.quantity || 0),
        0
    );

    const packagesSize = packages.map(pkg => `${pkg.size}${pkg.unit}`).filter(Boolean);

    if (packagesSize.length === 1) return `${totalPackagesQuantity} packages of ${packagesSize[0]}`;
    if (packagesSize.length === 2) return `${totalPackagesQuantity} packages of ${packagesSize.join(" & ")}`;
    if (packagesSize.length > 2) {
        const last = packagesSize.pop();
        return `${totalPackagesQuantity} packages of ${packagesSize.join(", ")} & ${last}`;
    }

    return '';
}

function mapProduct(product, DispatchOrder) {
    const raw_weight = product.chambers?.reduce((sum, chamber) => sum + Number(chamber.quantity), 0) || 0;
    const product_weight = formatWeight(raw_weight);
    const packagesSentence = formatPackagesSentence(DispatchOrder.packages || []);

    return {
        title: product.name,
        image: product.image,
        weight: product_weight,
        price: formatPrice(DispatchOrder.amount),
        description: `${product_weight} in ${product.chambers?.length ?? 0} ${product.chambers?.length === 1 ? "chamber" : "chambers"}`,
        chambers: product.chambers,
        packages: DispatchOrder.packages?.map(val => ({
            size: val.size,
            unit: val.unit,
            quantity: val.quantity
        })) || [],
        packagesSentence,
    };
}

function getProductDetailsSection(DispatchOrder, product_details, totalQuantity) {
    return [
        {
            row_1: [
                { label: "Amount", value: formatPrice(DispatchOrder.amount) },
                { label: "Product", value: product_details },
            ],
        },
        {
            row_2: [
                { label: "Quantity", value: formatWeight(totalQuantity) },
                { label: "Dis Date", value: DispatchOrder?.dispatch_date === null ? "--" : customDateFormatter(DispatchOrder?.dispatch_date) },
            ],
        },
    ];
}



const getFillerSchema = ({ RawMaterials = [], Vendors = [], Chambers = [], RawMaterialOrderById = {}, countries = [], states = [], cities = [], DispatchOrder = {}, Products = [], LaneById = {}, ProductionById = {}, Contractors = [], VendorById = {} }) => {
    
    const listSections = ["Recent", "Countries"]

    const totalQuantity = DispatchOrder?.products?.reduce((productTotal, product) => {
        const chamberTotal = product.chambers?.reduce((sum, chamber) => sum + Number(chamber.quantity), 0);
        return productTotal + chamberTotal;
    }, 0);

    const product_details = `${DispatchOrder?.products?.length} ${DispatchOrder?.products?.length === 1 ? "product" : "products"}`

    return ({
        "order-ready": {
            title: DispatchOrder?.customer_name,
            description: DispatchOrder?.address,
            "Product Details": getProductDetailsSection(DispatchOrder, product_details, totalQuantity),
            Products: DispatchOrder?.products?.map(product => mapProduct(product, DispatchOrder)) || [],
        },
        "order-shipped": {
            title: DispatchOrder?.customer_name,
            description: DispatchOrder?.address,
            "Product Details": getProductDetailsSection(DispatchOrder, product_details, totalQuantity),

            fileName: DispatchOrder?.truck_details?.sample_images || 'no-challan.pdf',

            "Truck Detail": {
                driverName: DispatchOrder?.truck_details?.driver_name,
                driverImage: 'https://59c5755e2c6f.ngrok-free.app/driver-image/driver-1.png',
                number: DispatchOrder?.truck_details?.number,
                type: DispatchOrder?.truck_details?.type,
                arrival_date: customDateFormatter(DispatchOrder?.est_delivered_date),
                agency: DispatchOrder?.truck_details?.agency_name,
            },

            Products: DispatchOrder?.products?.map(product => mapProduct(product, DispatchOrder)) || [],

            "buttons": [
                { text: 'Order reached', variant: 'fill', color: 'green', alignment: "full", disabled: DispatchOrder?.status === 'completed', actionKey: 'order-reached' },
                { text: 'Cancel order', variant: 'ghost', color: 'green', alignment: "half", disabled: true, actionKey: 'cancel-order' },
                { text: 'Change truck', variant: 'ghost', color: 'green', alignment: "half", disabled: true },
            ]
        },
        "order-reached": {
            title: DispatchOrder?.customer_name,
            description: DispatchOrder?.address,
            "Product Details": getProductDetailsSection(DispatchOrder, product_details, totalQuantity),

            fileName: DispatchOrder?.truck_details?.sample_images || 'no-challan.pdf',

            "Truck Detail": {
                driverName: DispatchOrder?.truck_details?.driver_name,
                driverImage: 'https://8972f79d2ba4.ngrok-free.app/driver-image/driver-1.png',
                number: DispatchOrder?.truck_details?.number,
                type: DispatchOrder?.truck_details?.type,
                arrival_date: customDateFormatter(DispatchOrder?.est_delivered_date),
                agency: DispatchOrder?.truck_details?.agency_name,
            },

            Products: DispatchOrder?.products?.map(product => mapProduct(product, DispatchOrder)) || [],
        },
        "package-comes-to-end": {
            title: "250gm package",
            description: 'India | 200 left',
        },
        "production-start": {
            title: ProductionById?.product_name,
            "rating": Number(ProductionById?.rating),
            "image-full-width": RawMaterialOrderById?.sample_image?.url || 'N/A',
            "Product detail": [
                { label: "Order", value: `${Number(RawMaterialOrderById?.quantity_ordered) / 1000} Tons` },
                { label: "Recieved", value: `${Number(RawMaterialOrderById?.quantity_received) / 1000} Tons` }
            ],
            fileName: RawMaterialOrderById?.truck_details?.challan?.url || 'View Challan',
            // "Vendor detail": [
            //     { label: "Name", value: VendorById?.name },
            //     { label: "Address", value: VendorById?.address },
            //     { label: "Arrival date", value: customDateFormatter(RawMaterialOrderById?.arrival_date) }
            // ],
            // "Truck detail": {
            //     detailsA: [
            //         { label: "Truck Weight", value: RawMaterialOrderById?.truck_details?.truck_weight },
            //         { label: "Tare Weight", value: RawMaterialOrderById?.truck_details?.tare_weight }
            //     ],
            //     detailsB: [
            //         { label: "Product Weight", value: (Number(RawMaterialOrderById?.truck_details?.truck_weight) - Number(RawMaterialOrderById?.truck_details?.tare_weight)).toFixed(2) }
            //     ]
            // },
        },
        "production-completed": {
            // image-gallery
            title: ProductionById?.product_name,
            'data': {
                "Production detail": [
                    {
                        row_1: [
                            {
                                label: "Supervisor",
                                value: ProductionById?.supervisor || "N/A",
                                icon: "user",
                            },
                            {
                                label: "Lane",
                                value: LaneById?.name,
                                icon: "lane",
                            },
                        ]
                    },
                    {
                        row_2: [
                            {
                                label: "Quantity",
                                value: String(ProductionById?.recovery),
                                icon: "database",
                            },
                            {
                                label: "Sample",
                                value: String(ProductionById?.wastage_quantity) ?? "--",
                                icon: "trash",
                            },
                        ]
                    },
                    {
                        row_3: [
                            {
                                label: "Recovery",
                                value: String((Number(ProductionById?.recovery) / Number(ProductionById?.quantity) * 100)?.toFixed(2),'%') ?? "--",
                                icon: "lane",
                            },
                            {
                                label: "Completed",
                                value: customTimeFormatter(ProductionById?.end_time),
                                icon: "calendar-year",
                            },
                        ]
                    },
                ],
            },
            "image-gallery": ProductionById?.sample_images?.map(img => img.url)?.filter(Boolean),
        },
        "raw-material-ordered": {
            title: RawMaterialOrderById.raw_material_name,
            "Product Details": [
                { label: "Order", value: `${RawMaterialOrderById.quantity_ordered} kg` },
                { label: "Amount", value: `${formatAmount(RawMaterialOrderById.price)} ` },
            ],
            "Vendor detail": [
                { label: "Name", value: RawMaterialOrderById.vendor },
                { label: "Address", value: Vendors?.find(val => val.name === RawMaterialOrderById.vendor)?.address },
                { label: "Est. Arrival date", value: RawMaterialOrderById.est_arrival_date ? format(RawMaterialOrderById.est_arrival_date, 'd MMM yyyy') : "--" }
            ],
        },
        "raw-material-reached": {
            title: RawMaterialOrderById.raw_material_name,
            "Product Details": [
                { label: "Order", value: `${RawMaterialOrderById.quantity_ordered} kg` },
                { label: "Recieved", value: `${RawMaterialOrderById.quantity_received} kg` },
                { label: "Amount", value: `${formatAmount(RawMaterialOrderById.price)}` }
            ],
            "Vendor detail": [
                { label: "Name", value: RawMaterialOrderById.vendor },
                { label: "Address", value: Vendors?.find(val => val.name === RawMaterialOrderById.vendor)?.address },
                { label: "Arrival date", value: customDateFormatter(RawMaterialOrderById.arrival_date) }
            ],
            "Truck detail": [
                { label: "Truck number", value: RawMaterialOrderById?.truck_details?.truck_number },
                { label: "Driver name", value: RawMaterialOrderById?.truck_details?.driver_name },
                { label: "Truck Weight", value: RawMaterialOrderById?.truck_details?.truck_weight },
            ],
            fileName: RawMaterialOrderById?.truck_details?.challan?.url || 'https://oddiville-bucket.s3.us-west-2.amazonaws.com/raw-materials/08392beb-8040-4cc2-9bce-d87ace1011a6-5362bd4e-9bc4-4630-9ec7-5763753707cd.jpeg',
        },
        "add-raw-material": {
            title: "Add raw materials",
            productCard: RawMaterials.map(rawMaterial => ({
                name: rawMaterial.name ?? "Unnamed",
                image: rawMaterial?.sample_image.url,
                description: ""
            })),
        },
        "add-product": {
            title: "Add Products",
            "optionList": Products,
        },
        "choose-product": {
            title: "Select products",
            productCard: RawMaterials.map(rawMaterial => ({
                name: rawMaterial.name ?? "Unnamed",
                description: "22 Kg"
            })),
        },
        "worker-multiple": {
            title: `${Contractors?.reduce((acc, val) => acc + (val.male_count || 0) + (val.female_count || 0), 0)} worker`,
            headerDetails: [
                { label: 'Male', value: Contractors?.reduce((acc, val) => acc + val.male_count, 0) },
                { label: 'Female', value: Contractors?.reduce((acc, val) => acc + val.female_count, 0) }
            ],
            "table": Contractors?.map((contractor) => {
                return {
                    label: contractor?.name,
                    tableHeader: [
                        { label: "Locations", key: "location" },
                        { label: "Count", key: "count" },
                    ],

                    tableBody: contractor?.work_location?.map(location => {
                        if (!location.notNeeded) {
                            return {
                                location: location?.name,
                                count: location.count
                            }
                        }
                    })?.filter(Boolean)
                }
            })
        },
        "worker-single": {
            title: "32 worker",
            "Vendor detail": [
                {
                    row_1: [
                        {
                            label: "Contractor",
                            value: "Vikram Patel",
                        }
                    ]
                },
                {
                    row_2: [
                        {
                            label: "Male",
                            value: "20",
                        },
                        {
                            label: "Female",
                            value: "10",
                        }
                    ]
                },
            ],
            "table": {
                tableHeader: [
                    { label: "Locations", key: "location" },
                    { label: "Count", key: "count" },
                ],

                tableBody: [
                    { location: "Location 1", count: "2" },
                    { location: "Location 2", count: "5" },
                    { location: "Location 3", count: "5" },
                    { location: "Location 4", count: "5" },
                ]
            },
        },
        "add-vendor": {
            title: "Add vendor",
            vendorCard: Vendors.map((vendor) => ({ name: vendor.name, address: vendor.address, isChecked: false, materials: vendor.materials }))
        },
        "chamber-list": {
            optionList: Chambers
                .slice()
                .sort((a, b) => a.chamber_name.localeCompare(b.chamber_name))
                .map(ch => ch.chamber_name)
        },
        "multiple-chamber-list": {
            title: "Select Chambers",
            productCard: Chambers.slice()
                .sort((a, b) => a.chamber_name.localeCompare(b.chamber_name)).map(chamber => ({
                    name: chamber.chamber_name ?? "Unnamed",
                    image: "https://oddiapi.sbcws.com/warehouses/warehouse.png",
                })),
        },
        "country": {
            title: "Country",
            "icon-title-with-heading":
                listSections?.map((title) => (
                    title === "Recent" ?
                        { title: title, iconTitle: [] } : {
                            title: title, iconTitle:
                                countries?.map((country) => (
                                    {
                                        label: country.name,
                                        icon: "https://placehold.co/600x400/000000/FFFFFF/png",
                                        isoCode: country.isoCode,
                                    }
                                ))
                        }
                ))
        },
        "state": {
            title: "State",
            "optionList": states,
        },
        "city": {
            title: "City",
            "optionList": cities,
        },
        "lane-occupied": {
            title: LaneById?.name,
            'data': {
                "Production detail": [
                    {
                        row_1: [
                            {
                                label: "Supervisor",
                                value: ProductionById?.supervisor || "N/A",
                                icon: "user",
                            },
                            {
                                label: "Rating",
                                value: ProductionById?.rating,
                                icon: "star",
                            }
                        ]
                    },
                    {
                        row_2: [
                            {
                                label: "Quantity",
                                value: String(ProductionById?.quantity),
                                icon: "database",
                            },
                            {
                                label: "Sample",
                                value: String(RawMaterialOrderById?.sample_quantity) ?? "--",
                                icon: "color-swatch",
                            },
                        ]
                    }
                ],
            },
            "image-full-width": RawMaterialOrderById?.sample_image?.url || 'https://oddiville-bucket.s3.us-west-2.amazonaws.com/raw-materials/08392beb-8040-4cc2-9bce-d87ace1011a6-5362bd4e-9bc4-4630-9ec7-5763753707cd.jpeg',
        }

    })
};

module.exports = { getFillerSchema };