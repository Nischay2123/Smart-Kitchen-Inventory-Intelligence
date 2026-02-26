
export const mergeItemAnalytics = (snapshot = [], live = []) => {
    const map = new Map();

    const insert = (row) => {
        const key = `${row.outletId}|${row.itemId}`;

        if (!map.has(key)) {
            map.set(key, {
                outletId: row.outletId,
                outletName: row.outletName,
                itemId: row.itemId,
                itemName: row.itemName,
                totalQty: 0,
                totalRevenue: 0,
                totalMakingCost: 0,
            });
        }

        const prev = map.get(key);
        prev.totalQty += row.totalQty || 0;
        prev.totalRevenue += row.totalRevenue || 0;
        prev.totalMakingCost += row.totalMakingCost || 0;
    };

    snapshot.forEach(insert);
    live.forEach(insert);

    return Array.from(map.values());
};
