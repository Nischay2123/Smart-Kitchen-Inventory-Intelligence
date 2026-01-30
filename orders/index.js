import axios from "axios";
const API_URL = "http://localhost:8000/api/v1/sales";

/* =========================
   TENANT
========================= */
const tenant = {
  tenantId: "69688d4ebfbbfb917da85ef4",
  tenantName: "IndusFlavour"
};

/* =========================
   OUTLETS
========================= */
const outlets = [
  { outletId: "696a2158448eaa44cbb20e3e", outletName: "IndusFlavour NSP" },
  { outletId: "697750a866bf3e3f6b5c2df6", outletName: "IndusFlavour CP" },
  { outletId: "6977bc4ece1177f4a76c4cbb", outletName: "IndusFlavour Saket" },
  { outletId: "6977bc78ce1177f4a76c4cbf", outletName: "IndusFlavour Gurgaon" },
  { outletId: "6977bc8bce1177f4a76c4cc1", outletName: "IndusFlavour Noida" }
];

/* =========================
   ALL ITEMS (FULL DB LIST)
========================= */
const items = [
  { itemId: "6969d0fb0bb5db2d4a3932a8", itemName: "Latte" },
  { itemId: "696a2181448eaa44cbb20e56", itemName: "Large Cold Coffee" },
  { itemId: "696a42eaf3dc0ee373dd3f92", itemName: "Dal Makhni" },
  { itemId: "6977bf41ce1177f4a76c4cdd", itemName: "Veg Burger" },
  { itemId: "6977bf41ce1177f4a76c4ce0", itemName: "Plain Rice" },
  { itemId: "6977bf41ce1177f4a76c4ce2", itemName: "Cold Coffee" },
  { itemId: "6977bf41ce1177f4a76c4cde", itemName: "Chicken Burger" },
  { itemId: "6977bf41ce1177f4a76c4cda", itemName: "Butter Chicken" },
  { itemId: "6977bf41ce1177f4a76c4cdf", itemName: "Garlic Naan" },
  { itemId: "6977bf41ce1177f4a76c4cdb", itemName: "Paneer Butter Masala" },
  { itemId: "6977bf41ce1177f4a76c4ce3", itemName: "Cheese Omelette" },
  { itemId: "697b88912241fd3a9b4cbcb9", itemName: "pizza" },
  { itemId: "697b88ad2241fd3a9b4cbcca", itemName: "Hakka Noddles" },
  { itemId: "697b88c52241fd3a9b4cbcdb", itemName: "Pasta" }
];

/* =========================
   HELPERS
========================= */
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/* =========================
   PICK FROM FULL LIST
========================= */
const buildRandomOrderItems = () => {
  const shuffled = [...items].sort(() => 0.5 - Math.random());
  const count = randomInt(1, items.length);

  return shuffled.slice(0, count).map(item => ({
    itemId: item.itemId,
    itemName: item.itemName,
    qty: randomInt(1, 5)
  }));
};

/* =========================
   SEND ORDER
========================= */
const sendOrder = (outlet) => {
  const payload = {
    outlet: {
      outletId: outlet.outletId,
      outletName: outlet.outletName
    },
    tenant,
    items: buildRandomOrderItems()
  };

  return axios.post(API_URL, payload);
};

/* =========================
   PARALLEL EXECUTION
========================= */
const sendParallelOrders = async () => {
  console.log("🚀 Sending orders to all outlets (full item pool)...");

  try {
    await Promise.all(outlets.map(sendOrder));
    console.log("✅ Batch completed");
  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }
};

/* =========================
   MULTIPLE BATCHES
========================= */
const BATCHES = 5;

(async () => {
  for (let i = 1; i <= BATCHES; i++) {
    console.log(`\n🔥 Batch ${i}`);
    await sendParallelOrders();
  }
})();
