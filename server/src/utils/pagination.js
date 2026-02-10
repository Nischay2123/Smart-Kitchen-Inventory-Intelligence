export const paginate = async (model, filter = {}, options = {}) => {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const sort = options.sort || { createdAt: -1 };
  const search = options.search || "";

  const skip = (page - 1) * limit;

  let finalFilter = { ...filter };

  if (search && search.trim() !== "") {
    finalFilter.name = {
      $regex: search.trim(),
      $options: "i",
    };
  }

  const totalDocs = await model.countDocuments(finalFilter);
  const totalPages = Math.ceil(totalDocs / limit) || 1;

  const data = await model
    .find(finalFilter)
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
      hasPrevPage: page > 1,
    },
  };
};
