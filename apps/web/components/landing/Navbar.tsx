"use client";

import { Button } from "@/components/ui/button";
import Logo from "../Logo";
import Link from "next/link";
import { NavbarThemeSwitcher } from "@/components/NavbarThemeSwitcher";
const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 md:grid md:grid-cols-3">
          <div className="flex items-center justify-self-start">
            <Logo />
          </div>

          <div className="hidden md:flex items-center justify-center space-x-8 justify-self-center">
            <Link
              href="/#features"
              className="text-lg text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              className="text-lg text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/#faq"
              className="text-lg text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
            >
              FAQ
            </Link>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 justify-self-end">
            <NavbarThemeSwitcher />
            <Button
              variant="outlinePrimary"
              asChild
              className="text-sm sm:text-base"
            >
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button
              asChild
              className="hidden sm:inline-flex bg-primary hover:bg-primary-600 text-white text-sm sm:text-base"
            >
              <Link href="/auth/sign-up">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
