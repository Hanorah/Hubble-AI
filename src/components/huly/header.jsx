"use client";

/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

import React from "react";
import { useState, useRef } from "react"; 
import Link from "next/link";
const Header = () => {
  const [openMenu, setOpenMenu] = useState(null);
  const [openMenuForMobile, setopenMenuForMobile] = useState(null);
  const [Hamburger, setHamburger] = useState(false);
  const hideTimeout = useRef(null);

  const handleMouseEnter = (menu) => {
    clearTimeout(hideTimeout.current); // cancel previous hide if fast hover again
    setOpenMenu(menu);
  };
  const handleClickForMobileMenu = (menu) => {
    clearTimeout(hideTimeout.current); // cancel previous hide if fast hover again
    if (menu == openMenuForMobile) {
      setopenMenuForMobile(null);
      return;
    }
    setopenMenuForMobile(menu);
  };

  const handleMouseLeave = () => {
    hideTimeout.current = setTimeout(() => {
      setOpenMenu(null);
    }, 200); // ← Delay before hiding
  };

  return (
    <div className="w-full px-8 py-5 flex justify-between items-center bg-transparent text-white absolute top-0 z-50">
      {/* Left Section: Logo & Nav */}
      <div className="flex items-center gap-25">
        {/* Logo */}
        <Link href="/" className="flex items-center text-xl gap-2 font-bold">
          <img src="icons/icon.png" alt="Hubble Logo" className="w-7 h-7" />
          <span className="text-white">Hubble</span>
        </Link>

        {/* Nav Links */}
        <nav className="min-[800px]:flex hidden  items-center gap-6 text-sm font-medium">
          <Link href="/scope/new" className="hover:text-[#5683da] cursor-pointer">
            New Blueprint
          </Link>
          <div
            onMouseEnter={() => handleMouseEnter("product")}
            onMouseLeave={handleMouseLeave}
            className="relative"
          >
            <button className="cursor-pointer flex justify-center items-center gap-1">
              Product{" "}
              <img
                src="icons/downArrow.svg"
                alt="down arrow"
                className="h-3 w-3 pt-1"
              />
            </button>
            {openMenu === "product" && (
              <ul className="absolute mt-2 bg-[var(--bl1)] rounded-lg w-64 p-2 shadow-lg z-50 border border-[var(--bl2)] ">
                <li className="flex justify-between items-center hover:bg-[var(--bl2)] rounded-xl px-2 py-2">
                  <a href="/#features" className="block">
                    Features
                    <p className="text-[var(--tl2)] font-normal">
                      Explore everything Hubble can do
                    </p>
                  </a>
                  <img
                    src="icons/downArrow.svg"
                    className="h-3 w-3 pt-1 rotate-270"
                  />
                </li>
                <li className="flex justify-between items-center hover:bg-[var(--bl2)] rounded-xl px-2 py-2">
                  <a href="/#how-it-works" className="block">
                    How it works
                    <p className="text-[var(--tl2)] font-normal">
                      See the flow from idea to scope
                    </p>
                  </a>
                  <img
                    src="icons/downArrow.svg"
                    className="h-3 w-3 pt-1 rotate-270"
                  />
                </li>
                <li className="flex justify-between items-center hover:bg-[var(--bl2)] rounded-xl px-2 py-2">
                  <a href="/#pricing" className="block">
                    Pricing
                    <p className="text-[var(--tl2)] font-normal">
                      Pick the plan for your team
                    </p>
                  </a>
                  <img
                    src="icons/downArrow.svg"
                    className="h-3 w-3 pt-1 rotate-270"
                  />
                </li>
              </ul>
            )}
            {/* Dropdown can be added here */}
          </div>
          <div
            onMouseEnter={() => handleMouseEnter("community")}
            onMouseLeave={handleMouseLeave}
            className="relative"
          >
            <button className="cursor-pointer flex justify-center items-center gap-1">
              Community{" "}
              <img
                src="icons/downArrow.svg"
                alt="down arrow"
                className="h-3 w-3 pt-1"
              />
            </button>
            {openMenu === "community" && (
              <ul className="absolute mt-2 bg-[var(--bl1)] rounded-lg w-64 p-2 shadow-lg z-50 border border-[var(--bl2)] ">
                <li className="flex gap-2 items-center hover:bg-[var(--bl2)] rounded-xl px-2 py-2">
                  <div className="w-10 h-10 border border-[#242527] flex justify-center items-center bg-[var(--bl2)] rounded-lg">
                    <img src="icons/X.svg" className="w-1/2 h-1/2 " />
                  </div>
                  <a href="https://x.com" target="_blank" rel="noreferrer" className="block">
                    X.com
                    <p className="text-[var(--tl2)] font-normal">
                      Follow our latest news
                    </p>
                  </a>
                  <img
                    src="icons/downArrow.svg"
                    className="h-3 w-3 pt-1 rotate-270 ml-auto"
                  />
                </li>
                <li className="flex gap-2 items-center hover:bg-[var(--bl2)] rounded-xl px-2 py-2">
                  <div className="w-10 h-10 border border-[#242527] flex justify-center items-center bg-[var(--bl2)] rounded-lg">
                    <img src="icons/linkden.svg" className="w-1/2 h-1/2 " />
                  </div>
                  <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="block">
                    LinkedIn
                    <p className="text-[var(--tl2)] font-normal">Get updates</p>
                  </a>
                  <img
                    src="icons/downArrow.svg"
                    className="h-3 w-3 pt-1 rotate-270 ml-auto"
                  />
                </li>
                <li className="flex gap-2 items-center hover:bg-[var(--bl2)] rounded-xl px-2 py-2">
                  <div className="w-10 h-10 border border-[#242527] flex justify-center items-center bg-[var(--bl2)] rounded-lg">
                    <img src="icons/youtube.svg" className="w-1/2 h-1/2 " />
                  </div>
                  <a href="https://www.youtube.com" target="_blank" rel="noreferrer" className="block">
                    YouTube
                    <p className="text-[var(--tl2)] font-normal">
                      Subcribe to the channel
                    </p>
                  </a>
                  <img
                    src="icons/downArrow.svg"
                    className="h-3 w-3 pt-1 rotate-270 ml-auto"
                  />
                </li>
                <li className="flex gap-2 items-center hover:bg-[var(--bl2)] rounded-xl px-2 py-2">
                  <div className="w-10 h-10 border border-[#242527] flex justify-center items-center bg-[var(--bl2)] rounded-lg">
                    <img src="icons/github.svg" className="w-1/2 h-1/2 " />
                  </div>
                  <a href="https://github.com" target="_blank" rel="noreferrer" className="block">
                    GitHub
                    <p className="text-[var(--tl2)] font-normal">Star us</p>
                  </a>
                  <img
                    src="icons/downArrow.svg"
                    className="h-3 w-3 pt-1 rotate-270 ml-auto"
                  />
                </li>
              </ul>
            )}
          </div>
          <Link href="/dashboard" className="hover:text-[#5683da] cursor-pointer">
            Chatbot
          </Link>
        </nav>
      </div>

      {/* Right Section: Star + Auth Buttons */}
      <div className="min-[800px]:flex hidden items-center gap-4 ">
        <button className="flex items-center gap-1 text-sm hover:text-[#c9cbcf]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 36 36"
            className="mr-1.5 aspect-square h-4 fill-white sm:mr-0 sm:h-6"
          >
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M18 .45c-9.9 0-18 8.1-18 18 0 7.988 5.175 14.738 12.263 17.1.9.113 1.237-.337 1.237-.9v-3.037c-5.062 1.125-6.075-2.363-6.075-2.363-.787-2.025-2.025-2.587-2.025-2.587-1.688-1.125.112-1.125.112-1.125 1.8.112 2.813 1.8 2.813 1.8 1.575 2.7 4.163 1.912 5.288 1.462a3.9 3.9 0 0 1 1.125-2.362c-4.05-.45-8.213-2.025-8.213-8.888 0-1.912.675-3.6 1.8-4.837-.225-.45-.787-2.25.225-4.725 0 0 1.462-.45 4.95 1.8 1.463-.45 2.925-.563 4.5-.563s3.038.225 4.5.563c3.488-2.363 4.95-1.913 4.95-1.913 1.012 2.475.338 4.275.225 4.725 1.125 1.238 1.8 2.813 1.8 4.838 0 6.862-4.163 8.437-8.213 8.887.675.563 1.238 1.688 1.238 3.375v4.95c0 .45.337 1.013 1.238.9C30.825 33.188 36 26.438 36 18.45c0-9.9-8.1-18-18-18"
              clipRule="evenodd"
            ></path>
          </svg>
          Star Us
        </button>

        <Link href="/dashboard" className="px-3 py-2 border-[0.5px] border-gray-500 bg-[var(--bl1)] rounded-full text-xs font-bold hover:bg-[#191919] transition">
          OPEN CHATBOT
        </Link>
      </div>

      {/* right section for mobile (ie : hamburger menu) */}
      <div className="min-[800px]:hidden flex items-center">
        <img
          src="icons/ham.svg"
          alt="hamburger menu"
          className="w-6 h-6 invert cursor-pointer"
          onClick={() => setHamburger(!Hamburger)}
        />
      </div>

      {/* Hamburger menu  */}
      {Hamburger && (
        <>
          <div className="Sidebar absolute top-0 left-0 w-full min-h-screen bg-[var(--bl1)] z-50 flex flex-col p-8 gap-10 ">
            {/* closing button */}
            <button
              className="w-6 h-6 text-white rounded-md bg-neutral-700 absolute top-3 right-3 cursor-pointer"
              onClick={() => setHamburger(!Hamburger)}
            >
              ✕
            </button>

            <nav className="flex items-center flex-col gap-2 text-xl font-medium">
              <Link
                href="/scope/new"
                className=" hover:bg-[#18191b] w-full px-2 py-4 mt-2  rounded-md cursor-pointer"
              >
                New Blueprint
              </Link>
              <div className="w-full">
                <button
                  className="hover:bg-[#18191b] w-full px-2 py-4 mt-2 text-center rounded-md cursor-pointer flex justify-between items-center gap-1"
                  onClick={() => handleClickForMobileMenu("product")}
                >
                  Product{" "}
                  <img
                    src="icons/downArrow.svg"
                    alt="down arrow"
                    className="h-3 w-3 pt-1"
                  />
                </button>
                {openMenuForMobile === "product" && (
                  <ul className=" mt-2 bg-[var(--bl1)] rounded-lg w-full p-2 shadow-lg z-50 border border-[var(--bl2)] ">
                    <li className="flex justify-between items-center hover:bg-[var(--bl2)] rounded-xl px-2 py-2">
                      <a href="/#features" className="block">
                        Features
                        <p className="text-[var(--tl2)] font-normal">
                          Explore everything Hubble can do
                        </p>
                      </a>
                      <img
                        src="icons/downArrow.svg"
                        className="h-3 w-3 pt-1 rotate-270"
                      />
                    </li>
                    <li className="flex justify-between items-center hover:bg-[var(--bl2)] rounded-xl px-2 py-2">
                      <a href="/#how-it-works" className="block">
                        How it works
                        <p className="text-[var(--tl2)] font-normal">
                          See the flow from idea to scope
                        </p>
                      </a>
                      <img
                        src="icons/downArrow.svg"
                        className="h-3 w-3 pt-1 rotate-270"
                      />
                    </li>
                    <li className="flex justify-between items-center hover:bg-[var(--bl2)] rounded-xl px-2 py-2">
                      <a href="/#pricing" className="block">
                        Pricing
                        <p className="text-[var(--tl2)] font-normal">
                          Pick the plan for your team
                        </p>
                      </a>
                      <img
                        src="icons/downArrow.svg"
                        className="h-3 w-3 pt-1 rotate-270"
                      />
                    </li>
                  </ul>
                )}
                {/* Dropdown can be added here */}
              </div>
              <div className="w-full">
                <button
                  className="hover:bg-[#18191b] w-full px-2 py-4 mt-2 text-center rounded-md cursor-pointer flex justify-between items-center gap-1"
                  onClick={() => handleClickForMobileMenu("community")}
                >
                  Community{" "}
                  <img
                    src="icons/downArrow.svg"
                    alt="down arrow"
                    className="h-3 w-3 pt-1"
                  />
                </button>
                {openMenuForMobile === "community" && (
                  <ul className="mt-2 bg-[var(--bl1)] rounded-lg w-full p-2 shadow-lg z-50 border border-[var(--bl2)] ">
                    <li className="flex gap-2 items-center hover:bg-[var(--bl2)] rounded-xl px-2 py-2">
                      <div className="w-10 h-10 border border-[#242527] flex justify-center items-center bg-[var(--bl2)] rounded-lg">
                        <img src="icons/X.svg" className="w-1/2 h-1/2 " />
                      </div>
                      <a href="https://x.com" target="_blank" rel="noreferrer" className="block">
                        X.com
                        <p className="text-[var(--tl2)] font-normal">
                          Follow our latest news
                        </p>
                      </a>
                      <img
                        src="icons/downArrow.svg"
                        className="h-3 w-3 pt-1 rotate-270 ml-auto"
                      />
                    </li>
                    <li className="flex gap-2 items-center hover:bg-[var(--bl2)] rounded-xl px-2 py-2">
                      <div className="w-10 h-10 border border-[#242527] flex justify-center items-center bg-[var(--bl2)] rounded-lg">
                        <img src="icons/linkden.svg" className="w-1/2 h-1/2 " />
                      </div>
                      <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="block">
                        LinkedIn
                        <p className="text-[var(--tl2)] font-normal">
                          Get updates
                        </p>
                      </a>
                      <img
                        src="icons/downArrow.svg"
                        className="h-3 w-3 pt-1 rotate-270 ml-auto"
                      />
                    </li>
                    <li className="flex gap-2 items-center hover:bg-[var(--bl2)] rounded-xl px-2 py-2">
                      <div className="w-10 h-10 border border-[#242527] flex justify-center items-center bg-[var(--bl2)] rounded-lg">
                        <img src="icons/youtube.svg" className="w-1/2 h-1/2 " />
                      </div>
                      <a href="https://www.youtube.com" target="_blank" rel="noreferrer" className="block">
                        YouTube
                        <p className="text-[var(--tl2)] font-normal">
                          Subcribe to the channel
                        </p>
                      </a>
                      <img
                        src="icons/downArrow.svg"
                        className="h-3 w-3 pt-1 rotate-270 ml-auto"
                      />
                    </li>
                    <li className="flex gap-2 items-center hover:bg-[var(--bl2)] rounded-xl px-2 py-2">
                      <div className="w-10 h-10 border border-[#242527] flex justify-center items-center bg-[var(--bl2)] rounded-lg">
                        <img src="icons/github.svg" className="w-1/2 h-1/2 " />
                      </div>
                      <a href="https://github.com" target="_blank" rel="noreferrer" className="block">
                        GitHub
                        <p className="text-[var(--tl2)] font-normal">Star us</p>
                      </a>
                      <img
                        src="icons/downArrow.svg"
                        className="h-3 w-3 pt-1 rotate-270 ml-auto"
                      />
                    </li>
                  </ul>
                )}
              </div>
              <Link
                href="/dashboard"
                className=" hover:bg-[#18191b] w-full px-2 py-4 mt-2  rounded-md cursor-pointer"
              >
                Chatbot
              </Link>
            </nav>
            {/* sign buttons */}
            <div className="flex justify-evenly items-center gap-4 ">
              <button className="flex items-center gap-1 text-sm hover:text-[#c9cbcf]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 36 36"
                  className="mr-1.5 aspect-square h-4 fill-white sm:mr-0 sm:h-6"
                >
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="M18 .45c-9.9 0-18 8.1-18 18 0 7.988 5.175 14.738 12.263 17.1.9.113 1.237-.337 1.237-.9v-3.037c-5.062 1.125-6.075-2.363-6.075-2.363-.787-2.025-2.025-2.587-2.025-2.587-1.688-1.125.112-1.125.112-1.125 1.8.112 2.813 1.8 2.813 1.8 1.575 2.7 4.163 1.912 5.288 1.462a3.9 3.9 0 0 1 1.125-2.362c-4.05-.45-8.213-2.025-8.213-8.888 0-1.912.675-3.6 1.8-4.837-.225-.45-.787-2.25.225-4.725 0 0 1.462-.45 4.95 1.8 1.463-.45 2.925-.563 4.5-.563s3.038.225 4.5.563c3.488-2.363 4.95-1.913 4.95-1.913 1.012 2.475.338 4.275.225 4.725 1.125 1.238 1.8 2.813 1.8 4.838 0 6.862-4.163 8.437-8.213 8.887.675.563 1.238 1.688 1.238 3.375v4.95c0 .45.337 1.013 1.238.9C30.825 33.188 36 26.438 36 18.45c0-9.9-8.1-18-18-18"
                    clipRule="evenodd"
                  ></path>
                </svg>
                Star Us
              </button>

              <Link href="/dashboard" className="px-3 py-2 border-[0.5px] border-gray-500 bg-[var(--bl1)] rounded-full text-xs font-bold hover:bg-[#191919] transition">
                OPEN CHATBOT
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Header;



