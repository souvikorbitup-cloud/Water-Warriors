"use client";

interface ShopPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: ShopPaginationProps) {
  if (totalPages <= 1) return null;

  const getPages = (): (number | "...")[] => {
    // Show all pages when there are 5 or fewer
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Beginning
    if (currentPage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }

    // End
    if (currentPage >= totalPages - 2) {
      return [
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    // Middle
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const pages = getPages();

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:mt-10">
      {/* Previous */}
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="cursor-pointer rounded-lg border border-card-border px-2.5 py-1 sm:px-4 sm:py-2 text-sm font-medium text-heading disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>

      {/* Pages */}
      {pages.map((page, index) => {
        if (page === "...") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="flex size-9 items-center justify-center text-sm font-medium text-heading"
            >
              ...
            </span>
          );
        }

        return (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`flex size-7 sm:size-9 cursor-pointer items-center justify-center rounded-lg text-sm font-medium ${
              page === currentPage
                ? "bg-primary text-white"
                : "border border-card-border text-heading hover:bg-muted"
            }`}
          >
            {page}
          </button>
        );
      })}

      {/* Next */}
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="cursor-pointer rounded-lg border border-card-border px-2.5 py-1 sm:px-4 sm:py-2 text-sm font-medium text-heading disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
