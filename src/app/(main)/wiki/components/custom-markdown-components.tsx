import React, { useState, useEffect } from "react";
import Image from "next/image";
import { transformWikiImageUrl } from "~/lib/image-utils";

// Custom H1 component that handles wiki box syntax
export const CustomH1: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const rawContent = React.Children.toArray(children)
    .map((child) => (typeof child === "string" ? child : ""))
    .join("")
    .trim();

  // Parse wiki box syntax: # [Title | ImageUrl | Optional content]
  let content = rawContent;
  if (content.startsWith("[") && content.endsWith("]")) {
    content = content.slice(1, -1).trim();
  }

  const parts = content.split("|").map((s) => s.trim());
  const isWikiBox = parts.length >= 2 && parts.length <= 3;

  // Use empty strings as defaults to avoid undefined
  const [title = "", imageUrl = "", description = ""] = isWikiBox
    ? parts
    : ["", "", ""];
  const [currentSrc, setCurrentSrc] = useState("");
  const [imageUrls, setImageUrls] = useState<{
    primary: string;
    fallback: string | null;
  } | null>(null);

  useEffect(() => {
    if (isWikiBox && imageUrl) {
      // Handle promise properly with .catch
      transformWikiImageUrl(imageUrl)
        .then((urls) => {
          setImageUrls(urls);
          setCurrentSrc(urls.primary);
        })
        .catch((error) => {
          console.error("Error transforming image URL:", error);
        });
    }
  }, [isWikiBox, imageUrl]);

  const handleImageError = () => {
    if (imageUrls?.fallback) {
      setCurrentSrc(imageUrls.fallback);
    }
  };

  if (isWikiBox) {
    return (
      <figure className="not-prose float-right clear-right mb-6 ml-4 max-w-[250px] overflow-hidden rounded-lg border border-[#d4bc8b] bg-[#f9f5eb]">
        {currentSrc && (
          <div className="relative w-full">
            <Image
              src={currentSrc}
              alt={title}
              width={500}
              height={500}
              className="object-cover"
              onError={handleImageError}
            />
          </div>
        )}
        <figcaption className="border-t border-[#d4bc8b] bg-[#e8dcc3]/50 p-3 text-sm">
          {title && <strong className="text-[#3a2a14]">{title}</strong>}
          <div className="text-[#5c3c10]">{description}</div>
        </figcaption>
      </figure>
    );
  }

  return (
    <h1 className="mt-6 mb-4 font-serif text-4xl font-bold text-[#3a2a14]">
      {rawContent}
    </h1>
  );
};

// Export all custom components to use with ReactMarkdown
export const markdownComponents = {
  h1: CustomH1,
  // Add other custom components as needed
};
