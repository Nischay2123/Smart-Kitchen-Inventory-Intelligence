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
  { outletId: "696a2158448eaa44cbb20e3e", outletName: "NSP" },
  { outletId: "697750a866bf3e3f6b5c2df6", outletName: "CP" },
  { outletId: "6977bc4ece1177f4a76c4cbb", outletName: "Saket" },
  { outletId: "6977bc78ce1177f4a76c4cbf", outletName: "Gurgaon" },
  { outletId: "6977bc8bce1177f4a76c4cc1", outletName: "Noida" }
];

/* =========================
   ITEMS
========================= */
const items = [
  { itemId: "6969d0fb0bb5db2d4a3932a8", itemName: "Latte" },
  { itemId: "696a2181448eaa44cbb20e56", itemName: "Cold Coffee" },
  { itemId: "696a42eaf3dc0ee373dd3f92", itemName: "Dal Makhni" },
  { itemId: "6977bf41ce1177f4a76c4cdd", itemName: "Veg Burger" },
  { itemId: "6977bf41ce1177f4a76c4ce0", itemName: "Rice" }
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

const sendOrder = async (outlet, createdAt) => {
  await axios.post(API_URL, {
    outlet,
    tenant,
    items: buildOrderItems(),
    createdAt
  });
};

/* ---------- outlet simulation ---------- */

const simulateOutlet = async outlet => {
  const DAYS = 7;
  const ORDERS_PER_DAY = 20;
  const START_OFFSET = 15;

  console.log(`🏬 Outlet start: ${outlet.outletName}`);

  for (let day = START_OFFSET + DAYS - 1; day >= START_OFFSET; day--) {
    console.log(`📅 Day-${day}`);

    for (let i = 0; i < ORDERS_PER_DAY; i++) {
      sendOrder(outlet, getDateDaysAgo(day)); // fire

      // spacing between orders (realistic)
      await sleep(randomInt(300, 1200));
    }
  }

  console.log(`✅ Outlet done: ${outlet.outletName}`);
};

/* ---------- start stress test ---------- */

(async () => {
  console.log("🚀 Stress test starting\n");

  await Promise.all(outlets.map(simulateOutlet));

  console.log("\n🎉 Stress test complete");
})();
