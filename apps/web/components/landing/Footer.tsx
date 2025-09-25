import { SocialIcon } from "react-social-icons";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-8 sm:gap-12 mb-8 sm:mb-12">
          <div className="text-center sm:text-left">
            <div className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
              RAGI
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-sm text-sm sm:text-base">
              Turn your documents into intelligent, searchable knowledge using
              powerful AI.
            </p>
            <div className="flex gap-3 sm:gap-4 justify-center sm:justify-start">
              <SocialIcon
                url="https://twitter.com"
                className="h-5 w-5 sm:h-6 sm:w-6"
                bgColor="transparent"
                fgColor="currentColor"
              />
              <SocialIcon
                url="https://linkedin.com"
                className="h-5 w-5 sm:h-6 sm:w-6"
                bgColor="transparent"
                fgColor="currentColor"
              />
              <SocialIcon
                url="https://github.com"
                className="h-5 w-5 sm:h-6 sm:w-6"
                bgColor="transparent"
                fgColor="currentColor"
              />
            </div>
          </div>

          <div className="text-center sm:text-left">
            <h4 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg">
              Legal
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 sm:pt-8 text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm sm:text-base">
            &copy; 2025 RAGI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
