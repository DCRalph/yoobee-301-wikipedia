"use client";

import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiTag,
  FiArrowDown,
  FiArrowUp,
  FiRefreshCw,
} from "react-icons/fi";
import { cn } from "~/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { tableWrapperStyles } from "./table-config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedSearchListRef {
  addTag: (tag: string) => void;
}

export type SortDirection = "asc" | "desc";

export interface SortOption {
  field: string;
  direction: SortDirection;
  label: string;
}

interface PaginatedSearchListProps {
  onSearch: (search: string) => void;
  onPageChange: (page: number) => void;
  onSortChange?: (sort: SortOption) => void;
  pagination: Pagination;
  searchPlaceholder?: string;
  isLoading?: boolean;
  children: React.ReactNode;
  initialSearchValue?: string;
  sortOptions?: SortOption[];
  initialSort?: SortOption;
  searchTimeMs?: number;
}

// This helper reconstructs the search string from confirmed tags
// and the free text. It adds a space between the two parts if both exist.
const reconstructSearchString = (tags: string[], text: string): string => {
  const tagPart = tags.map((tag) => `[${tag}]`).join("");
  if (tagPart && text) {
    return tagPart + " " + text;
  }
  return tagPart || text;
};

// Helper function to format search time
const formatSearchTime = (timeMs: number): string => {
  if (timeMs >= 1000) {
    return `${(timeMs / 1000).toFixed(1)} s`;
  }
  return `${timeMs} ms`;
};

export const PaginatedSearchList = forwardRef<
  PaginatedSearchListRef,
  PaginatedSearchListProps
>(function PaginatedSearchList(
  {
    onSearch,
    onPageChange,
    onSortChange,
    pagination,
    searchPlaceholder = "Search...",
    isLoading = false,
    children,
    initialSearchValue = "",
    sortOptions = [],
    initialSort,
    searchTimeMs,
  },
  ref,
) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State for confirmed tags and the remaining free text.
  const [tags, setTags] = useState<string[]>([]);
  const [textInputValue, setTextInputValue] = useState<string>("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [pageInputValue, setPageInputValue] = useState<string>("");
  const [currentSort, setCurrentSort] = useState<SortOption | undefined>(
    initialSort,
  );

  // Update URL search params
  const updateUrlParams = (
    searchString: string,
    page: number,
    sort?: SortOption,
  ) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");

    if (searchString) {
      params.set("q", searchString);
    } else {
      params.delete("q");
    }

    if (page > 1) {
      params.set("page", page.toString());
    } else {
      params.delete("page");
    }

    if (sort) {
      params.set("sortField", sort.field);
      params.set("sortDir", sort.direction);
    } else {
      params.delete("sortField");
      params.delete("sortDir");
    }

    const newUrl =
      window.location.pathname +
      (params.toString() ? `?${params.toString()}` : "");
    router.push(newUrl, { scroll: false });
  };

  // Initialize from URL params or initialSearchValue
  useEffect(() => {
    const urlSearchQuery = searchParams?.get("q") ?? initialSearchValue;
    const urlPage = parseInt(searchParams?.get("page") ?? "1", 10);
    const urlSortField = searchParams?.get("sortField");
    const urlSortDir = searchParams?.get("sortDir") as SortDirection;

    // Find matching sort option if exists
    let urlSort: SortOption | undefined;
    if (urlSortField && urlSortDir && sortOptions.length > 0) {
      urlSort = sortOptions.find(
        (opt) => opt.field === urlSortField && opt.direction === urlSortDir,
      );
    }

    const tagRegex = /\[([^\]]+)\]/g;
    const newTags: string[] = [];
    let match;
    while ((match = tagRegex.exec(urlSearchQuery)) !== null) {
      const tagContent = match[1];
      if (tagContent && !newTags.includes(tagContent)) {
        newTags.push(tagContent);
      }
    }

    // Remove complete tags from the text but preserve spacing.
    const initialText = urlSearchQuery.replace(/\[[^\]]+\]/g, "");

    setTags(newTags);
    setTextInputValue(initialText);
    setPageInputValue(urlPage.toString());
    setCurrentSort(urlSort ?? initialSort);

    // Trigger search with the URL parameters
    if (isInitialLoad) {
      onSearch(urlSearchQuery);
      if (urlPage > 1) {
        onPageChange(urlPage);
      }
      if (urlSort && onSortChange) {
        onSortChange(urlSort);
      }
      setIsInitialLoad(false);
    }
  }, [
    searchParams,
    initialSearchValue,
    onSearch,
    onPageChange,
    onSortChange,
    isInitialLoad,
    sortOptions,
    initialSort,
  ]);

  // When a complete tag (e.g. [tag]) is typed, extract it into state.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    // Look for complete tags with a closing bracket.
    const tagRegex = /\[([^\]]+)\]/g;
    const newCompleteTags: string[] = [];
    let match;
    while ((match = tagRegex.exec(inputVal)) !== null) {
      const tagContent = match[1];
      if (tagContent) {
        newCompleteTags.push(tagContent);
      }
    }
    // Remove complete tags from the value so the free-text remains.
    const newTextOnly = inputVal.replace(/\[[^\]]+\]/g, "");
    // Append any new tags (avoiding duplicates).
    setTags((prevTags) => {
      const updatedTags = [...prevTags];
      newCompleteTags.forEach((tag) => {
        if (!updatedTags.includes(tag)) {
          updatedTags.push(tag);
        }
      });
      return updatedTags;
    });
    setTextInputValue(newTextOnly);
  };

  // When the X on a tag is clicked, remove that tag.
  const removeTag = (tagIndexToRemove: number) => {
    const newTags = tags.filter((_, index) => index !== tagIndexToRemove);
    setTags(newTags);
    const searchString = reconstructSearchString(newTags, textInputValue);
    onSearch(searchString);
    updateUrlParams(searchString, pagination.page, currentSort);
  };

  // The search is triggered only when the user presses Enter or clicks the Search button.
  const handleSearchClick = () => {
    const currentSearchString = reconstructSearchString(tags, textInputValue);
    onSearch(currentSearchString);
    updateUrlParams(currentSearchString, 1, currentSort); // Reset to page 1 on new search
  };

  // Handle refresh - re-run current search without changing page
  const handleRefresh = () => {
    const currentSearchString = reconstructSearchString(tags, textInputValue);
    onSearch(currentSearchString);
    updateUrlParams(currentSearchString, pagination.page, currentSort);
  };

  // Clear all states when the Clear button is pressed.
  const handleClearClick = () => {
    setTags([]);
    setTextInputValue("");
    onSearch("");
    updateUrlParams("", 1, currentSort); // Reset to page 1 and clear search
  };

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    onPageChange(newPage);
    setPageInputValue(newPage.toString());
    updateUrlParams(
      reconstructSearchString(tags, textInputValue),
      newPage,
      currentSort,
    );
  };

  // Handle manual page input
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers
    const value = e.target.value.replace(/[^0-9]/g, "");
    setPageInputValue(value);
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(pageInputValue, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pagination.totalPages) {
      handlePageChange(pageNum);
    } else {
      // Reset to current page if invalid
      setPageInputValue(pagination.page.toString());
    }
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    const [field, direction] = value.split(":");
    const newSort = sortOptions.find(
      (opt) =>
        opt.field === field && opt.direction === (direction as SortDirection),
    );

    if (newSort && onSortChange) {
      setCurrentSort(newSort);
      onSortChange(newSort);
      updateUrlParams(
        reconstructSearchString(tags, textInputValue),
        pagination.page,
        newSort,
      );
    }
  };

  // Expose an addTag method so a parent can programmatically add a tag.
  useImperativeHandle(ref, () => ({
    addTag: (tag: string) => {
      setTags((prevTags) => {
        if (prevTags.includes(tag)) return prevTags;
        return [...prevTags, tag];
      });
      // Optionally, trigger an immediate search update:
      const searchString = reconstructSearchString(
        [...tags, tag],
        textInputValue,
      );
      onSearch(searchString);
      updateUrlParams(searchString, pagination.page, currentSort);
    },
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Search Input Area */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div
          className={cn(
            "relative flex flex-1 items-center rounded-lg border border-gray-300 bg-white px-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 hover:bg-accent/30 transition-all",
          )}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          {/* Container for pills and input */}
          <div className="flex w-full items-center gap-x-1 pl-7">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium whitespace-nowrap text-blue-800"
              >
                <FiTag className="h-3 w-3" />
                <span className="max-w-[100px] truncate sm:max-w-none">
                  {tag}
                </span>
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-0.5 inline-flex h-4 w-4 touch-manipulation items-center justify-center rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-800 focus:bg-blue-500 focus:text-white focus:outline-hidden"
                  aria-label={`Remove tag ${tag}`}
                  disabled={isLoading}
                >
                  <FiX className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            <Input
              placeholder={tags.length === 0 ? searchPlaceholder : ""}
              value={textInputValue}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchClick();
                }
                // Allow Backspace to remove the last tag if input is empty.
                if (
                  e.key === "Backspace" &&
                  textInputValue === "" &&
                  tags.length > 0
                ) {
                  removeTag(tags.length - 1);
                }
              }}
              className={cn(
                "min-w-[100px] grow border-0 bg-transparent p-0 py-2 text-base focus:ring-0!", // Increased text size for mobile
              )}
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleSearchClick}
            disabled={isLoading}
            className="min-h-[44px] touch-manipulation" // Minimum touch target size
          >
            <span className="hidden sm:inline">Search</span>
            <FiSearch className="h-4 w-4 sm:hidden" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            aria-label="Refresh search"
            className="min-h-[44px] touch-manipulation"
          >
            <FiRefreshCw className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClearClick}
            disabled={isLoading || (!textInputValue && tags.length === 0)}
            aria-label="Clear search"
            className="min-h-[44px] touch-manipulation"
          >
            <FiX className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Top Controls - Hidden on mobile to avoid duplication */}
      <div className="hidden items-center justify-between px-2 sm:px-4 md:flex">
        <div className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-medium">
            {pagination.total === 0
              ? 0
              : (pagination.page - 1) * pagination.limit + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {Math.min(pagination.page * pagination.limit, pagination.total)}
          </span>{" "}
          of <span className="font-medium">{pagination.total}</span> results
          {searchTimeMs !== undefined && (
            <span>
              {" "}
              in{" "}
              <span className="font-medium">
                {formatSearchTime(searchTimeMs)}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Sort dropdown */}
          {sortOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <Select
                value={
                  currentSort
                    ? `${currentSort.field}:${currentSort.direction}`
                    : undefined
                }
                onValueChange={handleSortChange}
                disabled={isLoading}
              >
                <SelectTrigger className="h-8 w-[180px]">
                  <SelectValue placeholder="Select sort" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem
                      key={`${option.field}:${option.direction}`}
                      value={`${option.field}:${option.direction}`}
                    >
                      <div className="flex items-center">
                        {option.label}
                        {option.direction === "asc" ? (
                          <FiArrowUp className="ml-2 h-3 w-3" />
                        ) : (
                          <FiArrowDown className="ml-2 h-3 w-3" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Page navigation */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="touch-manipulation"
            >
              <FiChevronLeft className="h-4 w-4" />
            </Button>

            <form
              onSubmit={handlePageInputSubmit}
              className="flex items-center space-x-1"
            >
              <Input
                className="h-8 w-16 touch-manipulation text-center"
                value={pageInputValue}
                onChange={handlePageInputChange}
                onBlur={handlePageInputSubmit}
                disabled={isLoading}
                aria-label="Page number"
              />
              <span className="text-sm text-gray-500">
                of {pagination.totalPages}
              </span>
            </form>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="touch-manipulation"
            >
              <FiChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table or List Content */}
      <div
        className={cn(
          tableWrapperStyles.base,
          tableWrapperStyles.elevated,
          "overflow-x-auto overflow-y-hidden", // Enable horizontal scrolling on mobile
        )}
      >
        {children}
      </div>

      {/* Bottom Pagination Controls - Responsive layout */}
      <div className="flex flex-col gap-4 px-2 sm:px-4 md:flex-row md:items-center md:justify-between">
        {/* Results info */}
        <div className="text-center text-sm text-gray-500 md:text-left">
          Showing{" "}
          <span className="font-medium">
            {pagination.total === 0
              ? 0
              : (pagination.page - 1) * pagination.limit + 1}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {Math.min(pagination.page * pagination.limit, pagination.total)}
          </span>{" "}
          of <span className="font-medium">{pagination.total}</span> results
          {searchTimeMs !== undefined && (
            <span>
              {" "}
              in{" "}
              <span className="font-medium">
                {formatSearchTime(searchTimeMs)}
              </span>
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-4">
          {/* Sort dropdown - Full width on mobile */}
          {sortOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm whitespace-nowrap text-gray-500">
                Sort by:
              </span>
              <Select
                value={
                  currentSort
                    ? `${currentSort.field}:${currentSort.direction}`
                    : undefined
                }
                onValueChange={handleSortChange}
                disabled={isLoading}
              >
                <SelectTrigger className="h-10 w-full touch-manipulation sm:w-[180px]">
                  <SelectValue placeholder="Select sort" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem
                      key={`${option.field}:${option.direction}`}
                      value={`${option.field}:${option.direction}`}
                    >
                      <div className="flex items-center">
                        {option.label}
                        {option.direction === "asc" ? (
                          <FiArrowUp className="ml-2 h-3 w-3" />
                        ) : (
                          <FiArrowDown className="ml-2 h-3 w-3" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Page navigation - Centered on mobile */}
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="min-h-[44px] min-w-[44px] touch-manipulation"
            >
              <FiChevronLeft className="h-4 w-4" />
            </Button>

            <form
              onSubmit={handlePageInputSubmit}
              className="flex items-center space-x-1"
            >
              <Input
                className="h-10 w-16 touch-manipulation text-center text-base"
                value={pageInputValue}
                onChange={handlePageInputChange}
                onBlur={handlePageInputSubmit}
                disabled={isLoading}
                aria-label="Page number"
              />
              <span className="text-sm whitespace-nowrap text-gray-500">
                of {pagination.totalPages}
              </span>
            </form>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="min-h-[44px] min-w-[44px] touch-manipulation"
            >
              <FiChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
