import { Link } from "react-router-dom";
import { SiteContent } from "../../lib/content";

interface GlobalFooterProps {
  siteContent?: SiteContent;
}

export function GlobalFooter({ siteContent }: GlobalFooterProps) {
  const content = siteContent || {
    brand: { name: "InterviewPro", tagline: "Interview platform" },
    footer: { columns: [], social: [] }
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img
                src="/logo.svg"
                alt={`${content.brand.name} Logo`}
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-xl font-display font-semibold text-gray-900">
                {content.brand.name}
              </span>
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              {content.brand.tagline}
            </p>
          </div>

          {/* Footer columns */}
          {content.footer.columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} {content.brand.name}. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-900">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-900">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
