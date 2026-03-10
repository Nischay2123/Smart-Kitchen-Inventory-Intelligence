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
   OUTLETS & API KEYS
========================= */
const outlets = [
  { outletId: "696a2158448eaa44cbb20e3e", outletName: "NSP" },
  { outletId: "697750a866bf3e3f6b5c2df6", outletName: "CP" },
  { outletId: "6977bc4ece1177f4a76c4cbb", outletName: "Saket" },
  { outletId: "6977bc78ce1177f4a76c4cbf", outletName: "Gurgaon" },
  { outletId: "6977bc8bce1177f4a76c4cc1", outletName: "Noida" }
];

/* =========================
   POS API KEYS
   Generate these via: POST /api/v1/pos-api-keys/generate
   Replace with your actual API keys before running
========================= */
const API_KEYS = {
    "696a2158448eaa44cbb20e3e": "pos_696a2158448eaa44cbb20e3e_8e7437ee5a230a615901ac825d135b3556e5e139226a1385",
    "697750a866bf3e3f6b5c2df6": "pos_697750a866bf3e3f6b5c2df6_606bbe39076d27858d3f059c42fc51dfbff0cfed66f5d0ea",
    "6977bc4ece1177f4a76c4cbb": "pos_6977bc4ece1177f4a76c4cbb_50e66556b6d4d950c40a12a221f406d27db00b40566a23ef",
    "6977bc78ce1177f4a76c4cbf": "pos_6977bc78ce1177f4a76c4cbf_45ee9fd059fe0a5afe0cf906d21e845ebbb045a6d0bb1e1a",
    "6977bc8bce1177f4a76c4cc1": "pos_6977bc8bce1177f4a76c4cc1_2094896161413b8733c280f059af28a4547c95493c6f2436"
};

/* =========================
   ITEMS
========================= */
const items = [
  { itemId: "696a2181448eaa44cbb20e56", itemName: "Large Cold Coffee" },
  { itemId: "6977bf41ce1177f4a76c4cda", itemName: "Butter Chicken" },
  { itemId: "6977bf41ce1177f4a76c4cdb", itemName: "Paneer Butter Masala" },
  { itemId: "6977bf41ce1177f4a76c4cde", itemName: "Chicken Burger" },
  { itemId: "6977bf41ce1177f4a76c4cdf", itemName: "Garlic Naan" },
  { itemId: "6977bf41ce1177f4a76c4ce3", itemName: "Cheese Omelette" },
  { itemId: "697b88912241fd3a9b4cbcb9", itemName: "pizza" },
  { itemId: "697b88ad2241fd3a9b4cbcca", itemName: "Hakka Noddles" },
  { itemId: "697b88c52241fd3a9b4cbcdb", itemName: "Pasta" },
  { itemId: "6969d0fb0bb5db2d4a3932a8", itemName: "Latte" },
  { itemId: "696a42eaf3dc0ee373dd3f92", itemName: "Dal Makhni" },
  { itemId: "6977bf41ce1177f4a76c4cdd", itemName: "Veg Burger" },
  { itemId: "6977bf41ce1177f4a76c4ce0", itemName: "Plain Rice" },
  { itemId: "6977bf41ce1177f4a76c4ce2", itemName: "Cold Coffee" }
];

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* items per order: 1–2 */
const buildOrderItems = () => {
  const shuffled = [...items].sort(() => 0.5 - Math.random());
  const count = randomInt(1, 2);

  return shuffled.slice(0, count).map(item => ({
    itemId: item.itemId,
    itemName: item.itemName,
    qty: randomInt(1, 3)
  }));
};

const getDateDaysAgo = daysAgo => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(randomInt(9, 22));
  d.setMinutes(randomInt(0, 59));
  d.setSeconds(randomInt(0, 59));
  return d;
};

const getTodayDate = () => {
  const d = new Date();
  d.setHours(randomInt(9, 22));
  d.setMinutes(randomInt(0, 59));
  d.setSeconds(randomInt(0, 59));
  return d;
};

const sendOrder = async (outlet, createdAt) => {
  try {
    const apiKey = API_KEYS[outlet.outletId];
    
    if (!apiKey || apiKey.startsWith("YOUR_API_KEY")) {
      console.error(`❌ No valid API key configured for outlet ${outlet.outletName}`);
      console.error(`   Generate a key via: POST /api/v1/pos-api-keys/generate`);
      return;
    }

    const res = await axios.post(
      API_URL,
      {
        outlet,
        tenant,
        items: buildOrderItems(),
        createdAt
      },
      {
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json"
        }
      }
    );
    console.log(`✅ ${outlet.outletName}:`, res.data);
    
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    console.error(`❌ ${outlet.outletName}: [${status}] ${message}`);
  }
};

/* ---------- historical simulation ---------- */
const simulateOutlet = async outlet => {
  const DAYS = 7;
  const ORDERS_PER_DAY = 10;
  const START_OFFSET = 8;

  console.log(`🏬 Outlet start: ${outlet.outletName}`);

  for (let day = START_OFFSET + DAYS - 1; day >= START_OFFSET; day--) {
    console.log(`📅 Day-${day}`);

    for (let i = 0; i < ORDERS_PER_DAY; i++) {
      sendOrder(outlet);
      await sleep(randomInt(300, 1200));
    }
  }

  console.log(`✅ Outlet done: ${outlet.outletName}`);
};

/* ---------- TODAY orders simulation ---------- */
const simulateTodayForOutlet = async outlet => {
  const ORDERS_TODAY = 5;

  console.log(`📍 Sending today's orders: ${outlet.outletName}`);

  for (let i = 0; i < ORDERS_TODAY; i++) {
    sendOrder(outlet, new Date());
    await sleep(1200);
  }

  console.log(`✅ Today's orders done: ${outlet.outletName}`);
};

/* ---------- start ---------- */
(async () => {
  console.log("🚀 Stress test starting\n");

  /* Historical data */
  // await Promise.all(outlets.map(simulateOutlet));

  /* TODAY orders — uncomment when needed */
  await Promise.all(outlets.map(simulateTodayForOutlet));

  console.log("\n🎉 Stress test complete");
})();
