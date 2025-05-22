"use client"

import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { ChevronLeft, ChevronRight, Globe, Search } from "lucide-react"
import CategorySelector from "../components/CategorySelector"

export default function Home() {
  const { data: session } = useSession()

  return (
    <div className="flex min-h-screen flex-col ">

      {/* Hero Section */}
      <section className="relative h-[300px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/home/banner.png"
            alt="Library"
            width={1200}
            height={300}
            className="h-full w-full object-cover brightness-75"
          />
        </div>
        <div className="absolute inset-0 flex flex-col items-end justify-center px-12 text-white">
          <h1 className="text-4xl md:text-5xl font-serif mb-2">Welcome to Wikipedia</h1>
          <p className="text-xl md:text-2xl font-serif">the free encyclopedia</p>
        </div>
      </section>

      {/* Divider */}
      <div className="container mx-auto my-8 flex items-center justify-center">
        <div className="h-px w-full max-w-3xl bg-[#c0a080]"></div>
        <div className="mx-4 h-2 w-2 rotate-45 bg-[#c0a080]"></div>
        <div className="h-px w-full max-w-3xl bg-[#c0a080]"></div>
      </div>

      {/* Categories Section */}
      <section className="container mx-auto mb-12 px-4">
        <h2 className="mb-2 text-center text-3xl font-serif">Articles</h2>
        <p className="mb-6 text-center">Find an article under the categories</p>
        <CategorySelector />
      </section>

      {/* News and Trending Section */}
      <section className="container mx-auto mb-12 px-4">
        <div className="relative mx-auto max-w-5xl">
          <div className="absolute -left-4 top-4 bg-white px-4 py-2 shadow-md z-10">
            <h3 className="text-lg font-medium">News</h3>
          </div>

          <div className="absolute -right-4 top-4 bg-white px-4 py-2 shadow-md z-10">
            <h3 className="text-lg font-medium">Trending</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="overflow-hidden">
              <Image
                src="/home/1.png"
                alt="News"
                width={300}
                height={200}
                className="h-[200px] w-full object-cover"
              />
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-[#6b4c35] p-4 text-white">
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              </div>

              <div className="bg-white p-4 border border-[#d0c0a0]">
                <p>Nunc non justo eu metus bibendum dignissim. Etiam consequat.</p>
                <div className="mt-4 text-right">
                  <Link href="#" className="text-[#6b4c35] hover:underline">
                    Read more
                  </Link>
                </div>
              </div>

              <div className="bg-[#6b4c35] p-4 text-white">
                <p>Fusce vel sapien nec ipsum tincidunt imperdiet.</p>
                <div className="mt-4 text-right">
                  <Link href="#" className="text-white hover:underline">
                    Read more
                  </Link>
                </div>
              </div>

              <div className="overflow-hidden">
                <Image
                  src="/home/2.png"
                  alt="Trending"
                  width={300}
                  height={200}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Article and On This Day Section */}
      <section className="container mx-auto mb-12 px-4">
        <div className="relative mx-auto max-w-5xl">
          <div className="absolute -left-4 top-4 bg-white px-4 py-2 shadow-md z-10">
            <h3 className="text-lg font-medium">{"Today's Article"}</h3>
          </div>

          <div className="absolute -right-4 top-4 bg-white px-4 py-2 shadow-md z-10">
            <h3 className="text-lg font-medium">On this day</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="overflow-hidden">
              <Image
                src="/home/3.png"
                alt="Today's Article"
                width={300}
                height={200}
                className="h-[200px] w-full object-cover"
              />
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-white p-4 border border-[#d0c0a0]">
                <p>Duis vitae sapien nec magna efficitur lacinia. Integer fermentum orci ac diam volutpat.</p>
              </div>

              <div className="bg-[#6b4c35] p-4 text-white">
                <p>Aliquam erat volutpat. Vestibulum ante ipsum primis in faucibus orci luctus.</p>
              </div>

              <div className="bg-[#6b4c35] p-4 text-white">
                <p>Pellentesque habitant morbi tristique.</p>
                <div className="mt-4 text-right">
                  <Link href="#" className="text-white hover:underline">
                    Read more
                  </Link>
                </div>
              </div>

              <div className="bg-white p-4 border border-[#d0c0a0]">
                <p>Mauris at ligula vel nulla finibus vehicula.</p>
                <div className="mt-4 text-right">
                  <Link href="#" className="text-[#6b4c35] hover:underline">
                    Read more
                  </Link>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 overflow-hidden">
                <Image
                  src="/home/4.png"
                  alt="On this day"
                  width={600}
                  height={200}
                  className="h-[200px] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>


    </div>
  )
}
