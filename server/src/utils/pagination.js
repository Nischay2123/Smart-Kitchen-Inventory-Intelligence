export const paginate = async (model, filter, options) => {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const sort = options.sort || { createdAt: -1 };
    const skip = (page - 1) * limit;

    const totalDocs = await model.countDocuments(filter);
    const totalPages = Math.ceil(totalDocs / limit);

    const data = await model.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);

    return {
        data,
        meta: {
            totalDocs,
            totalPages,
            currentPage: page,
            limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    };
};
