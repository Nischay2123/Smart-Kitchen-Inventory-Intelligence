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
  { itemId: "696a2181448eaa44cbb20e56", itemName: "Large Cold Coffee" },
  { itemId: "6977bf41ce1177f4a76c4cda", itemName: "Butter Chicken" },
  { itemId: "6977bf41ce1177f4a76c4cdb", itemName: "Paneer Butter Masala" },
  { itemId: "6977bf41ce1177f4a76c4cde", itemName: "Chicken Burger" },
  { itemId: "6977bf41ce1177f4a76c4cdf", itemName: "Garlic Naan" },
  { itemId: "6977bf41ce1177f4a76c4ce3", itemName: "Cheese Omelette" },
  { itemId: "697b88912241fd3a9b4cbcb9", itemName: "Pizza" },
  { itemId: "697b88ad2241fd3a9b4cbcca", itemName: "Hakka Noodles" },
  { itemId: "697b88c52241fd3a9b4cbcdb", itemName: "Pasta" }
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
    await axios.post(API_URL, {
      outlet,
      tenant,
      items: buildOrderItems(),
      createdAt
    });
  } catch {
    console.log("Order failed, continuing...");
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
      sendOrder(outlet, getDateDaysAgo(day));
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
    sendOrder(outlet, getTodayDate());
    await sleep(randomInt(300, 1200));
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
