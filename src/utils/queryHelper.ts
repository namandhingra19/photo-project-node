interface PaginationResult {
    skip: number;
    take: number;
    orderBy: string | null;
    orderDirection: "asc" | "desc";
    search: string | null;
    filter: Record<string, any>;
}

export function parseQueryParams(query: any): PaginationResult {
    const pageSize = Number(query.pageSize) || 10;
    const pageNumber = Number(query.pageNumber) || 1;

    const skip = (pageNumber - 1) * pageSize;
    const take = pageSize;
    const orderBy = query.orderBy ? String(query.orderBy) : null;
    const orderDirection = query.orderDirection === "desc" ? "desc" : "asc";

    const search = query.search ? String(query.search) : null;

    let filter: Record<string, any> = {};

    if (query.filter) {
        try {
            filter = JSON.parse(query.filter);
        } catch {
            const keyValue = String(query.filter).split("=");
            if (keyValue.length === 2) {
                filter[keyValue[0]] = keyValue[1];
            }
        }
    }

    return { skip, take, search, filter, orderBy, orderDirection };
}
