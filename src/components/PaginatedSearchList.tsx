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
      <div className="flex gap-2">
        <div
          className={cn(
            "relative flex flex-1 items-center rounded-lg border border-gray-300 bg-white px-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500",
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
                className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-blue-800"
              >
                <FiTag className="h-3 w-3" />
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-800 focus:bg-blue-500 focus:text-white focus:outline-hidden"
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
                "min-w-[100px] grow border-0 bg-transparent p-0 py-2 focus:ring-0!",
              )}
              disabled={isLoading}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleSearchClick}
          disabled={isLoading}
        >
          Search
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleClearClick}
          disabled={isLoading || (!textInputValue && tags.length === 0)}
          aria-label="Clear search"
        >
          <FiX className="h-4 w-4" />
        </Button>
      </div>

      {/* Sorting and Pagination Controls */}
      <div className="flex items-center justify-between px-4">
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
            >
              <FiChevronLeft className="h-4 w-4" />
            </Button>

            <form
              onSubmit={handlePageInputSubmit}
              className="flex items-center space-x-1"
            >
              <Input
                className="h-8 w-16 text-center"
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
          "overflow-y-hidden",
        )}
      >
        {children}
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex items-center justify-between px-4">
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
        </div>

        <div className="flex items-center space-x-4">
          {/* Sort dropdown (bottom) */}
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
            >
              <FiChevronLeft className="h-4 w-4" />
            </Button>

            <form
              onSubmit={handlePageInputSubmit}
              className="flex items-center space-x-1"
            >
              <Input
                className="h-8 w-16 text-center"
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
            >
              <FiChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
