export function paginationMeta({ total, page, pageSize }) {
  return {
    total,
    page,
    pageSize,
    pageCount: total === 0 ? 0 : Math.ceil(total / pageSize)
  };
}
